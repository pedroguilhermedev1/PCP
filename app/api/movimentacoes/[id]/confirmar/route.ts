import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the movimentacao
  const { data: mov, error: movError } = await supabase
    .from('estoque_movimentacoes')
    .select('*')
    .eq('id', id)
    .single();

  if (movError || !mov) {
    return NextResponse.json({ error: 'Movimentação não encontrada' }, { status: 404 });
  }

  if (mov.status !== 'PENDENTE') {
    return NextResponse.json({ error: 'Movimentação já processada' }, { status: 400 });
  }

  // Get insumo
  const { data: insumo, error: insumoError } = await supabase
    .from('estoque_insumos')
    .select('*')
    .eq('codigo', mov.codigo)
    .eq('cd', mov.cd)
    .single();

  if (insumoError || !insumo) {
    return NextResponse.json({ error: 'Insumo não encontrado no estoque.' }, { status: 404 });
  }

  const isSaida = mov.tipo === 'Saída';
  const delta = isSaida ? -Number(mov.quantidade) : Number(mov.quantidade);
  const newReal = (insumo.estoque_real || 0) + delta;

  if (newReal < 0) {
    return NextResponse.json({ error: 'Estoque ficaria negativo após confirmação.' }, { status: 400 });
  }

  const currentCmd = parseFloat(insumo.cmd) || 10;
  const currentLt = parseFloat(insumo.lead_time) || 0;

  const cobertura = currentCmd > 0 ? (newReal / currentCmd) : Infinity;

  let novoStatus = 'OK';
  if (cobertura <= currentLt) novoStatus = 'CRÍTICO';
  else if (cobertura > currentLt && cobertura <= (currentLt + 3)) novoStatus = 'ALERTA';
  else novoStatus = 'CONFORTÁVEL';

  const [updateMov, updateIns] = await Promise.all([
    supabase.from('estoque_movimentacoes').update({ status: 'Aprovada' }).eq('id', id),
    supabase.from('estoque_insumos').update({ estoque_real: newReal, status: novoStatus }).eq('id', insumo.id)
  ]);

  if (updateMov.error) return NextResponse.json({ error: updateMov.error.message }, { status: 500 });
  if (updateIns.error) return NextResponse.json({ error: updateIns.error.message }, { status: 500 });

  return NextResponse.json({ success: true, novo_estoque: newReal });
}
