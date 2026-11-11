import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serializarObservacoesComMeta } from '@/lib/previsaoRecebimento';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cd = searchParams.get('cd');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const supabase = getSupabaseClient();

  // Buscar exclusivamente os recebimentos físicos realizados pelo novo fluxo
  let query = supabase
    .from('estoque_movimentacoes')
    .select('*')
    .eq('tipo', 'Entrada')
    .ilike('observacoes', '%Recebimento Físico%')
    .order('data_hora', { ascending: false })
    .limit(limit);

  if (cd && cd !== 'todas' && cd !== 'TODOS') {
    query = query.ilike('cd', cd);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    const {
      cd,
      codigo,
      item,
      quantidade,
      data_recebimento,
      documento,
      pessoa_recebeu,
      fornecedor,
      usuario
    } = body;

    // 1. Validações de campos obrigatórios
    if (!cd) {
      return NextResponse.json({ error: 'Centro de Distribuição (CD) é obrigatório.' }, { status: 400 });
    }

    if (!codigo && !item) {
      return NextResponse.json({ error: 'Insumo deve ser informado (código ou descrição).' }, { status: 400 });
    }

    const qtdNum = Number(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      return NextResponse.json({ error: 'A quantidade recebida deve ser um número maior que zero.' }, { status: 400 });
    }

    if (!data_recebimento) {
      return NextResponse.json({ error: 'A data de recebimento é obrigatória.' }, { status: 400 });
    }

    if (!pessoa_recebeu || !pessoa_recebeu.trim()) {
      return NextResponse.json({ error: 'A pessoa que recebeu fisicamente o material deve ser informada.' }, { status: 400 });
    }

    if (!fornecedor || !fornecedor.trim()) {
      return NextResponse.json({ error: 'O fornecedor deve ser informado.' }, { status: 400 });
    }

    // 2. Localizar o insumo na tabela estoque_insumos do CD correspondente
    let insumoQuery = supabase
      .from('estoque_insumos')
      .select('*')
      .ilike('cd', cd);

    if (codigo && codigo !== '-') {
      insumoQuery = insumoQuery.eq('codigo', codigo);
    } else {
      insumoQuery = insumoQuery.eq('item', item);
    }

    const { data: insumoList, error: insumoError } = await insumoQuery.limit(1);

    if (insumoError || !insumoList || insumoList.length === 0) {
      return NextResponse.json({ 
        error: `Insumo "${codigo || item}" não encontrado no estoque do CD ${cd.toUpperCase()}. Verifique se o item está cadastrado para este CD.` 
      }, { status: 404 });
    }

    const insumo = insumoList[0];

    // 3. Calcular novo saldo de estoque e status de cobertura
    const estoqueAnterior = Number(insumo.estoque_real) || 0;
    const novoEstoque = estoqueAnterior + qtdNum;

    const currentCmd = parseFloat(insumo.cmd) || 10;
    const currentLt = parseFloat(insumo.lead_time) || 0;
    const cobertura = currentCmd > 0 ? (novoEstoque / currentCmd) : Infinity;

    let novoStatus = 'OK';
    if (cobertura <= currentLt) novoStatus = 'CRÍTICO';
    else if (cobertura > currentLt && cobertura <= (currentLt + 3)) novoStatus = 'ALERTA';
    else novoStatus = 'CONFORTÁVEL';

    // 4. Preparar observações estruturadas e metadados
    const docLimpo = (documento || 'Sem Documento').trim();
    const pessoaLimpa = pessoa_recebeu.trim();
    const fornecedorLimpo = fornecedor.trim();
    const usuarioLancamento = (usuario || 'Usuário Recebimento').trim();

    const obsTexto = `Recebimento Físico | Doc: ${docLimpo} | Recebido por: ${pessoaLimpa} | Fornecedor: ${fornecedorLimpo} | Data Recebimento: ${data_recebimento}`.trim();

    const meta = {
      origem: 'recebimento_direto',
      documento: docLimpo,
      pessoa_recebeu: pessoaLimpa,
      fornecedor: fornecedorLimpo,
      data_recebimento: data_recebimento,
      usuario_lancamento: usuarioLancamento,
      data_hora_lancamento: new Date().toISOString(),
      quantidade_recebida: qtdNum,
      estoque_anterior: estoqueAnterior,
      novo_estoque: novoEstoque
    };

    const finalObservacoes = serializarObservacoesComMeta(obsTexto, meta);

    // 5. Atualizar estoque_insumos
    let updateInsQuery = supabase
      .from('estoque_insumos')
      .update({ 
        estoque_real: novoEstoque, 
        status: novoStatus 
      })
      .eq('id', insumo.id);

    // 6. Inserir histórico em estoque_movimentacoes (status Aprovada = efetivado)
    const insertMovQuery = supabase
      .from('estoque_movimentacoes')
      .insert([{
        tipo: 'Entrada',
        codigo: insumo.codigo,
        item: insumo.item || item,
        cd: insumo.cd || cd,
        empresa: insumo.empresa || 'PCP',
        quantidade: qtdNum,
        usuario: usuarioLancamento,
        observacoes: finalObservacoes,
        setor: 'Recebimento',
        status: 'Aprovada',
        tipo_envio: insumo.tipo_envio || 'Principal',
        data_hora: new Date().toISOString()
      }])
      .select()
      .single();

    const [updateResult, insertResult] = await Promise.all([
      updateInsQuery,
      insertMovQuery
    ]);

    if (updateResult.error) {
      console.error('Erro ao atualizar estoque_insumos:', updateResult.error);
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    if (insertResult.error) {
      console.error('Erro ao registrar histórico de movimentação:', insertResult.error);
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensagem: `Recebimento de ${qtdNum} unidades de "${insumo.item || item}" registrado com sucesso no estoque do CD ${cd.toUpperCase()}.`,
      estoque_anterior: estoqueAnterior,
      novo_estoque: novoEstoque,
      movimentacao: insertResult.data
    });

  } catch (err: any) {
    console.error('Erro no processamento do recebimento:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao processar recebimento.' }, { status: 500 });
  }
}

