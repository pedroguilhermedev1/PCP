import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cd = searchParams.get('cd');
  console.log('CD RECEBIDO:', cd);

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  let query = supabase.from('estoque_insumos').select('*').order('item', { ascending: true });

  if (cd) {
    query = query.eq('cd', cd);
  }

  const { data, error } = await query;
  console.log('DADOS ENCONTRADOS:', data?.length);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  let { cd, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria, cmd } = body;

  estoque_minimo = parseInt(estoque_minimo) || 0;
  estoque_real = parseInt(estoque_real) || 0;
  cmd = parseFloat(cmd) || 10;
  const lt = parseFloat(lead_time) || 0;
  
  if (!status) {
    const cobertura = cmd > 0 ? (estoque_real / cmd) : Infinity;

    if (cobertura <= lt) status = 'CRÍTICO';
    else if (cobertura > lt && cobertura <= (lt + 3)) status = 'ALERTA';
    else status = 'CONFORTÁVEL';
  }

  const { data: existing } = await supabase.from('estoque_insumos').select('id').eq('codigo', codigo).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: `O código ${codigo} já existe no sistema.` }, { status: 400 });
  }

  const result = await supabase.from('estoque_insumos').insert([
    { cd, codigo, item, unidade, lead_time: lead_time || '-', estoque_minimo, estoque_real, status, categoria, cmd }
  ]);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  const { cd, item, codigo, tipo, quantidade } = body;
  
  if (!cd || !item || !tipo || !quantidade) {
    return NextResponse.json({ error: 'Faltam dados para atualizar o estoque' }, { status: 400 });
  }

  // 1. Busca o item atual para ver quanto tem no estoque_real
  let query = supabase.from('estoque_insumos').select('*').eq('item', item).eq('cd', cd);
  if (codigo) {
    query = query.eq('codigo', codigo);
  }
  
  const { data: currentItems, error: searchError } = await query.limit(1);
  
  if (searchError || !currentItems || currentItems.length === 0) {
    return NextResponse.json({ error: 'Item não encontrado no estoque' }, { status: 404 });
  }

  const currentItem = currentItems[0];
  const oldReal = currentItem.estoque_real || 0;
  const quant = parseInt(quantidade) || 0;
  
  // 2. Calcula novo valor
  let newReal = oldReal;
  if (tipo === 'Entrada') {
    newReal += quant;
  } else if (tipo === 'Saída') {
    newReal -= quant;
  }

  // Se a saída deixar negativo, a gente permite ou não? Vamos permitir e mudar status
  const currentCmd = parseFloat(currentItem.cmd) || 10;
  const currentLt = parseFloat(currentItem.lead_time) || 0;

  const cobertura = currentCmd > 0 ? (newReal / currentCmd) : Infinity;

  let novoStatus = 'OK';
  if (cobertura <= currentLt) novoStatus = 'CRÍTICO';
  else if (cobertura > currentLt && cobertura <= (currentLt + 3)) novoStatus = 'ALERTA';
  else novoStatus = 'CONFORTÁVEL';

  // 3. Atualiza
  const { error: updateError } = await supabase
    .from('estoque_insumos')
    .update({ estoque_real: newReal, status: novoStatus })
    .eq('id', currentItem.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, new_real: newReal, new_status: novoStatus });
}
