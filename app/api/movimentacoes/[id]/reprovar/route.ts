import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    // Obter a movimentação
    const { data: mov, error: getError } = await supabase
      .from('movimentacoes_insumos')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !mov) {
      return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 });
    }

    if (mov.status !== 'PENDENTE') {
      return NextResponse.json({ error: 'Apenas movimentações pendentes podem ser reprovadas' }, { status: 400 });
    }

    // Alterar o status para REPROVADO
    const { error: updateError } = await supabase
      .from('movimentacoes_insumos')
      .update({ status: 'REPROVADO' })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Movimentação reprovada para correção.' });

  } catch (error: any) {
    console.error('Erro ao reprovar movimentacao:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
