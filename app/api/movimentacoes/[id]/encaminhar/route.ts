import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extrairMetaDeObservacoes, serializarObservacoesComMeta, ObservacaoCriador } from '@/lib/previsaoRecebimento';

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

    const texto = body?.texto?.trim();
    const usuario = body?.usuario || 'Criador';

    if (!texto) {
      return NextResponse.json({ error: 'A observação do criador é obrigatória para encaminhamento.' }, { status: 400 });
    }

    const { data: mov, error: getError } = await supabase
      .from('estoque_movimentacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !mov) {
      return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 });
    }

    const { textoLegivel, meta } = extrairMetaDeObservacoes(mov.observacoes);
    const novaObs: ObservacaoCriador = {
      usuario,
      data_hora: new Date().toISOString(),
      texto,
    };
    meta.observacoes_criador = [...(meta.observacoes_criador || []), novaObs];

    // O status é ajustado para AGUARDANDO_CONFERENCIA para sinalizar ao recebedor
    const novoStatus = 'AGUARDANDO_CONFERENCIA';
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
      message: 'Pendência encaminhada ao responsável pelo recebimento com sucesso.',
      novo_status: novoStatus
    });

  } catch (error: any) {
    console.error('Erro ao encaminhar pendencia:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
