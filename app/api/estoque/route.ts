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
  const empresa = searchParams.get('empresa');
  const tipo_envio = searchParams.get('tipo_envio') || 'Principal';
  console.log('CD RECEBIDO:', cd, 'EMPRESA:', empresa, 'TIPO_ENVIO:', tipo_envio);

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  let query = supabase.from('estoque_insumos').select('*').eq('tipo_envio', tipo_envio).order('item', { ascending: true });

  if (cd && cd !== 'todas') {
    query = query.ilike('cd', cd);
  }
  if (empresa) {
    // Some might be null or missing, we can filter using ILIKE or EQ depending on data. Let's use EQ (case insensitive might be needed if they type 'sas' vs 'SAS')
    query = query.ilike('empresa', empresa);
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

  let { cd, empresa, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria, cmd, conta_contabil, descricao_contabil, tipo_envio } = body;

  estoque_minimo = parseInt(estoque_minimo) || 0;
  estoque_real = parseInt(estoque_real) || 0;
  cmd = parseFloat(cmd) || 10;
  const lt = parseFloat(lead_time) || 0;
  const t_envio = tipo_envio || 'Principal';
  
  if (!status) {
    const cobertura = cmd > 0 ? (estoque_real / cmd) : Infinity;

    if (cobertura <= lt) status = 'CRÍTICO';
    else if (cobertura > lt && cobertura <= (lt + 3)) status = 'ALERTA';
    else status = 'CONFORTÁVEL';
  }

  const { data: existing } = await supabase.from('estoque_insumos').select('id').eq('codigo', codigo).eq('cd', cd).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: `O código ${codigo} já existe no CD ${cd}.` }, { status: 400 });
  }

  const result = await supabase.from('estoque_insumos').insert([
    { cd, empresa, codigo, item, unidade, lead_time: lead_time || '-', estoque_minimo, estoque_real, status, categoria, cmd, conta_contabil, descricao_contabil, tipo_envio: 'Principal' },
    { cd, empresa, codigo, item, unidade, lead_time: lead_time || '-', estoque_minimo, estoque_real, status, categoria, cmd, conta_contabil, descricao_contabil, tipo_envio: 'Complementar' }
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

  const { cd, empresa, item, codigo, tipo, quantidade } = body;
  
  if (!cd || !item || !tipo || !quantidade) {
    return NextResponse.json({ error: 'Faltam dados para atualizar o estoque' }, { status: 400 });
  }

  // 1. Busca o item atual para ver quanto tem no estoque_real
  let query = supabase.from('estoque_insumos').select('*').eq('item', item).eq('cd', cd);
  if (codigo) {
    query = query.eq('codigo', codigo);
  }
  if (empresa) {
    query = query.ilike('empresa', empresa);
  }
  
  const { data: currentItems, error: searchError } = await query;
  
  if (searchError || !currentItems || currentItems.length === 0) {
    return NextResponse.json({ error: 'Item não encontrado no estoque' }, { status: 404 });
  }

  // Pegamos o estoque atual de qualquer um (devem ser iguais, mas pegamos do primeiro)
  const oldReal = currentItems[0].estoque_real || 0;
  const quant = parseInt(quantidade) || 0;
  
  // 2. Calcula novo valor de estoque físico unificado
  let newReal = oldReal;
  if (tipo === 'Entrada') {
    newReal += quant;
  } else if (tipo === 'Saída') {
    newReal -= quant;
  }

  // 3. Atualiza TODAS as linhas do mesmo insumo e CD recalculando status separadamente
  let finalStatusToReturn = 'OK';

  for (const row of currentItems) {
    const currentCmd = parseFloat(row.cmd) || 10;
    const currentLt = parseFloat(row.lead_time) || 0;

    const cobertura = currentCmd > 0 ? (newReal / currentCmd) : Infinity;

    let novoStatus = 'CONFORTÁVEL';
    if (cobertura <= currentLt) novoStatus = 'CRÍTICO';
    else if (cobertura > currentLt && cobertura <= (currentLt + 3)) novoStatus = 'ALERTA';

    // Salva o status calculado da primeira linha só pra retornar no log, mas cada linha terá o seu salvo correto no DB
    if (row.id === currentItems[0].id) {
      finalStatusToReturn = novoStatus;
    }

    await supabase
      .from('estoque_insumos')
      .update({ estoque_real: newReal, status: novoStatus })
      .eq('id', row.id);
  }

  return NextResponse.json({ success: true, new_real: newReal, new_status: finalStatusToReturn });
}
