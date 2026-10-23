import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extrairMetaDeObservacoes, serializarObservacoesComMeta, EntregaParcial, EncerramentoSaldo } from '@/lib/previsaoRecebimento';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {}

  const usuario = body.usuario || 'Responsável pelo Recebimento';
  const observacao = body.observacao || '';
  const encerrarSaldo = !!body.encerrarSaldo;
  const justificativaEncerramento = body.justificativaEncerramento;

  // Obter a movimentacao
  const { data: mov, error: movError } = await supabase
    .from('estoque_movimentacoes')
    .select('*')
    .eq('id', id)
    .single();

  if (movError || !mov) {
    return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 });
  }

  const validPendingStatuses = ['PENDENTE', 'PARCIAL', 'AGUARDANDO_CONFERENCIA'];
  if (!validPendingStatuses.includes(mov.status)) {
    return NextResponse.json({ error: `Movimentação já processada (status atual: ${mov.status})` }, { status: 400 });
  }

  const { textoLegivel, meta } = extrairMetaDeObservacoes(mov.observacoes);
  const qtdPrevista = meta.quantidade_prevista ?? Number(mov.quantidade);
  const qtdRecebidaAnterior = meta.quantidade_recebida ?? 0;
  const saldoPendenteAnterior = meta.saldo_pendente ?? (qtdPrevista - qtdRecebidaAnterior);

  // CASO 1: Encerramento formal do saldo não recebido
  if (encerrarSaldo) {
    if (!justificativaEncerramento || !justificativaEncerramento.trim()) {
      return NextResponse.json({ error: 'A justificativa é obrigatória para encerrar formalmente o saldo não recebido.' }, { status: 400 });
    }

    const encerramento: EncerramentoSaldo = {
      quantidade_encerrada: saldoPendenteAnterior,
      justificativa: justificativaEncerramento.trim(),
      usuario,
      data_hora: new Date().toISOString()
    };

    meta.encerramento = encerramento;
    meta.saldo_pendente = 0;
    meta.quantidade_recebida = qtdRecebidaAnterior;
    meta.quantidade_prevista = qtdPrevista;

    const finalObservacoes = serializarObservacoesComMeta(textoLegivel, meta);

    const { error: updateMovError } = await supabase
      .from('estoque_movimentacoes')
      .update({
        status: 'ENCERRADO',
        observacoes: finalObservacoes
      })
      .eq('id', id);

    if (updateMovError) {
      return NextResponse.json({ error: updateMovError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: 'ENCERRADO',
      saldo_encerrado: saldoPendenteAnterior,
      total_recebido: qtdRecebidaAnterior,
      quantidade_prevista: qtdPrevista,
      mensagem: `Saldo de ${saldoPendenteAnterior} unidades encerrado formalmente sem recebimento. Quantidade efetivamente recebida: ${qtdRecebidaAnterior} de ${qtdPrevista} unidades.`
    });
  }

  // CASO 2: Recebimento normal ou parcial
  let qtdNestaEntrega: number;
  if (body.quantidadeRecebidaAgora !== undefined) {
    qtdNestaEntrega = Number(body.quantidadeRecebidaAgora);
  } else if (body.novaQuantidade !== undefined) {
    qtdNestaEntrega = Number(body.novaQuantidade);
  } else {
    qtdNestaEntrega = saldoPendenteAnterior;
  }

  if (isNaN(qtdNestaEntrega) || qtdNestaEntrega <= 0) {
    return NextResponse.json({ error: 'A quantidade recebida nesta entrega deve ser um número positivo maior que zero.' }, { status: 400 });
  }

  if (qtdNestaEntrega > saldoPendenteAnterior) {
    return NextResponse.json({
      error: `A quantidade recebida nesta entrega (${qtdNestaEntrega}) não pode ultrapassar o saldo pendente (${saldoPendenteAnterior} unidades).`
    }, { status: 400 });
  }

  const novaQuantidadeAcumulada = qtdRecebidaAnterior + qtdNestaEntrega;
  const novoSaldoPendente = qtdPrevista - novaQuantidadeAcumulada;
  const isConcluido = novoSaldoPendente <= 0;
  const novoStatus = isConcluido ? 'Aprovada' : 'PARCIAL';

  // Obter insumo do estoque para atualizar estoque_real
  let insumoQuery = supabase
    .from('estoque_insumos')
    .select('*')
    .eq('codigo', mov.codigo)
    .ilike('cd', mov.cd)
    .eq('tipo_envio', mov.tipo_envio || 'Principal');

  if (mov.empresa) {
    insumoQuery = insumoQuery.or(`empresa.ilike.${mov.empresa},empresa.is.null`);
  }

  const { data: insumoList, error: insumoError } = await insumoQuery.limit(1);
  const insumo = insumoList ? insumoList[0] : null;

  if (insumoError || !insumo) {
    return NextResponse.json({ error: 'Insumo não encontrado no estoque do CD correspondente.' }, { status: 404 });
  }

  const isSaida = mov.tipo === 'Saída';
  const delta = isSaida ? -qtdNestaEntrega : qtdNestaEntrega;
  const newReal = (insumo.estoque_real || 0) + delta;

  if (newReal < 0) {
    return NextResponse.json({ error: 'Estoque ficaria negativo após confirmação.' }, { status: 400 });
  }

  const currentCmd = parseFloat(insumo.cmd) || 10;
  const currentLt = parseFloat(insumo.lead_time) || 0;
  const cobertura = currentCmd > 0 ? (newReal / currentCmd) : Infinity;

  let novoStatusInsumo = 'OK';
  if (cobertura <= currentLt) novoStatusInsumo = 'CRÍTICO';
  else if (cobertura > currentLt && cobertura <= (currentLt + 3)) novoStatusInsumo = 'ALERTA';
  else novoStatusInsumo = 'CONFORTÁVEL';

  // Atualizar histórico de entregas
  const entregas: EntregaParcial[] = meta.entregas ? [...meta.entregas] : [];
  entregas.push({
    entrega_numero: entregas.length + 1,
    quantidade: qtdNestaEntrega,
    data_hora: new Date().toISOString(),
    usuario,
    quantidade_acumulada: novaQuantidadeAcumulada,
    saldo_restante: novoSaldoPendente,
    observacao: observacao || undefined,
  });

  meta.quantidade_prevista = qtdPrevista;
  meta.quantidade_recebida = novaQuantidadeAcumulada;
  meta.saldo_pendente = novoSaldoPendente;
  meta.entregas = entregas;

  let textoAtualizado = textoLegivel;
  if (body.justificativa) {
    const divergenciaText = `[Aprovação c/ Divergência] Previsto: ${qtdPrevista} -> Entregue: ${qtdNestaEntrega}. Motivo: ${body.justificativa}`;
    textoAtualizado = textoAtualizado ? `${textoAtualizado} | ${divergenciaText}` : divergenciaText;
  }

  const finalObservacoes = serializarObservacoesComMeta(textoAtualizado, meta);

  let updateInsQuery = supabase
    .from('estoque_insumos')
    .update({ estoque_real: newReal, status: novoStatusInsumo })
    .eq('codigo', insumo.codigo)
    .ilike('cd', insumo.cd);

  if (insumo.empresa) {
    updateInsQuery = updateInsQuery.ilike('empresa', insumo.empresa);
  }

  const [updateMov, updateIns] = await Promise.all([
    supabase.from('estoque_movimentacoes').update({ 
      status: novoStatus,
      observacoes: finalObservacoes 
    }).eq('id', id),
    updateInsQuery
  ]);

  if (updateMov.error) return NextResponse.json({ error: updateMov.error.message }, { status: 500 });
  if (updateIns.error) return NextResponse.json({ error: updateIns.error.message }, { status: 500 });

  const mensagem = isConcluido
    ? `Recebimento concluído com sucesso. Quantidade recebida nesta entrega: ${qtdNestaEntrega} unidades. Total recebido: ${novaQuantidadeAcumulada} de ${qtdPrevista} unidades. Saldo pendente: 0 unidades.`
    : `Recebimento parcial confirmado. Quantidade recebida nesta entrega: ${qtdNestaEntrega} unidades. Total recebido: ${novaQuantidadeAcumulada} de ${qtdPrevista} unidades. Saldo pendente: ${novoSaldoPendente} unidades.`;

  return NextResponse.json({
    success: true,
    novo_estoque: newReal,
    is_concluido: isConcluido,
    status: novoStatus,
    qtd_nesta_entrega: qtdNestaEntrega,
    total_recebido: novaQuantidadeAcumulada,
    quantidade_prevista: qtdPrevista,
    saldo_pendente: novoSaldoPendente,
    mensagem
  });
}
