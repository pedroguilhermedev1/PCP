import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: Request) {
  const body = await request.json();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { codigo, cd, quantidade_movimento, tipo } = body;

  if (!codigo || !cd || !quantidade_movimento || !tipo) {
    return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
  }

  // Find the item first
  const { data: insumo, error: fetchError } = await supabase
    .from('estoque_insumos')
    .select('id, estoque_real, estoque_minimo')
    .eq('codigo', codigo)
    .eq('cd', cd)
    .single();

  if (fetchError || !insumo) {
    return NextResponse.json({ error: 'Insumo não encontrado no estoque do CD especificado.' }, { status: 404 });
  }

  const delta = tipo === 'Entrada' ? quantidade_movimento : -quantidade_movimento;
  const novo_estoque_real = (insumo.estoque_real || 0) + delta;
  
  if (novo_estoque_real < 0) {
    return NextResponse.json({ error: 'Estoque insuficiente para esta saída.' }, { status: 400 });
  }

  const novo_status = novo_estoque_real <= (insumo.estoque_minimo || 0) ? 'CRÍTICO' : 'OK';

  const { error: updateError } = await supabase
    .from('estoque_insumos')
    .update({ 
      estoque_real: novo_estoque_real,
      status: novo_status
    })
    .eq('id', insumo.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, novo_estoque: novo_estoque_real, novo_status });
}
