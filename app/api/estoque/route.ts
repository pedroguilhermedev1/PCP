import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cd = searchParams.get('cd');
  console.log('CD RECEBIDO:', cd);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
  return NextResponse.json(
    { error: 'Supabase credentials missing' },
    { status: 500 }
  );
}

  const supabase = createClient(supabaseUrl, supabaseKey);

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let { cd, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria } = body;

  estoque_minimo = parseInt(estoque_minimo) || 0;
  estoque_real = parseInt(estoque_real) || 0;
  
  if (!status) {
    status = estoque_real <= estoque_minimo ? 'CRÍTICO' : 'OK';
  }

  const { data: existing } = await supabase.from('estoque_insumos').select('id').eq('codigo', codigo).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: `O código ${codigo} já existe no sistema.` }, { status: 400 });
  }

  const result = await supabase.from('estoque_insumos').insert([
    { cd, codigo, item, unidade, lead_time: lead_time || '-', estoque_minimo, estoque_real, status, categoria }
  ]);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
