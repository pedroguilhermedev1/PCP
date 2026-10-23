import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extrairMetaDeObservacoes, serializarObservacoesComMeta, HistoricoReprovacao } from '@/lib/previsaoRecebimento';

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

    const motivo = body?.motivo || 'Reprovado no recebimento';
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

    const validStatuses = ['PENDENTE', 'PARCIAL', 'AGUARDANDO_CONFERENCIA'];
    if (!validStatuses.includes(mov.status)) {
      return NextResponse.json({ error: `Apenas solicitações pendentes/parciais podem ser reprovadas (status atual: ${mov.status})` }, { status: 400 });
    }

    const { textoLegivel, meta } = extrairMetaDeObservacoes(mov.observacoes);
    const novaReprovacao: HistoricoReprovacao = {
      usuario,
      data_hora: new Date().toISOString(),
      motivo,
    };
    meta.reprovacoes = [...(meta.reprovacoes || []), novaReprovacao];

    const finalObservacoes = serializarObservacoesComMeta(textoLegivel, meta);

    // Alterar o status para REPROVADO
    const { error: updateError } = await supabase
      .from('estoque_movimentacoes')
      .update({
        status: 'REPROVADO',
        observacoes: finalObservacoes
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Solicitação reprovada e registrada no histórico.' });

  } catch (error: any) {
    console.error('Erro ao reprovar movimentacao:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
