import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cd = searchParams.get('cd');
  const tipo_envio = searchParams.get('tipo_envio') || 'Principal';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase.from('estoque_movimentacoes').select('*').eq('tipo_envio', tipo_envio).order('data_hora', { ascending: false });
  if (cd && cd !== 'todas') {
    query = query.ilike('cd', cd);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { tipo, codigo, item, cd, empresa, quantidade, usuario, observacoes, setor, tipo_envio, identificador } = body;
  const t_envio = tipo_envio || 'Principal';

  if (!tipo || !codigo || !cd || !quantidade) {
    return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
  }

  // Verificar se existe o insumo no CD
  let query = supabase
    .from('estoque_insumos')
    .select('id, estoque_real')
    .eq('codigo', codigo)
    .ilike('cd', cd);
    
  if (empresa) {
    query = query.ilike('empresa', empresa);
  }

  const { data: insumoList, error: fetchError } = await query.limit(1);
  const insumo = insumoList ? insumoList[0] : null;

  if (fetchError || !insumo) {
    return NextResponse.json({ error: 'Insumo não encontrado no CD especificado.' }, { status: 404 });
  }

  // Verifica se é uma saída e tem estoque suficiente ANTES de aprovar, mas a rigor como é PENDENTE podemos deixar registrar e bloquear só na confirmação. Vamos bloquear logo na criação por segurança.
  if (tipo === 'Saída' && (insumo.estoque_real || 0) < quantidade) {
    return NextResponse.json({ error: 'Estoque insuficiente para esta saída.' }, { status: 400 });
  }

  const { error } = await supabase.from('estoque_movimentacoes').insert([{
    tipo,
    codigo,
    item,
    cd,
    empresa,
    identificador,
    quantidade,
    usuario,
    observacoes,
    setor,
    status: 'PENDENTE',
    tipo_envio: t_envio
  }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
