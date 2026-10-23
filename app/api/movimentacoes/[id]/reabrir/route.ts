import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extrairMetaDeObservacoes, serializarObservacoesComMeta, HistoricoReabertura } from '@/lib/previsaoRecebimento';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const usuario = body?.usuario || 'Recebedor';

    // Obter a movimentação
    const { data: mov, error: getError } = await supabase
      .from('estoque_movimentacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !mov) {
      return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 });
    }

    if (mov.status !== 'REPROVADO') {
      return NextResponse.json({ error: `Apenas solicitações reprovadas podem ser reabertas (status atual: ${mov.status})` }, { status: 400 });
    }

    const { textoLegivel, meta } = extrairMetaDeObservacoes(mov.observacoes);
    const ultimaReprovacao = meta.reprovacoes && meta.reprovacoes.length > 0 
      ? meta.reprovacoes[meta.reprovacoes.length - 1]?.motivo 
      : undefined;

    const novaReabertura: HistoricoReabertura = {
      usuario,
      data_hora: new Date().toISOString(),
      motivo_anterior: ultimaReprovacao,
    };
    meta.reaberturas = [...(meta.reaberturas || []), novaReabertura];

    // Se já tinha recebido algo parcialmente, volta para PARCIAL, senão PENDENTE
    const qtdRecebida = meta.quantidade_recebida || 0;
    const novoStatus = qtdRecebida > 0 ? 'PARCIAL' : 'PENDENTE';

    const finalObservacoes = serializarObservacoesComMeta(textoLegivel, meta);

    const { error: updateError } = await supabase
      .from('estoque_movimentacoes')
      .update({
        status: novoStatus,
        observacoes: finalObservacoes
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Solicitação reaberta com sucesso e retornada para Aprovações Pendentes.',
      novo_status: novoStatus
    });

  } catch (error: any) {
    console.error('Erro ao reabrir movimentacao:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
