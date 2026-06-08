import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cd = searchParams.get('cd');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase.from('estoque_movimentacoes').select('*').order('data_hora', { ascending: false });
  if (cd) {
    query = query.eq('cd', cd);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { tipo, codigo, item, cd, quantidade, usuario, observacoes, setor } = body;

  if (!tipo || !codigo || !cd || !quantidade) {
    return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
  }

  // Verificar se existe o insumo no CD
  const { data: insumo, error: fetchError } = await supabase
    .from('estoque_insumos')
    .select('id, estoque_real')
    .eq('codigo', codigo)
    .eq('cd', cd)
    .single();

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
    quantidade,
    usuario,
    observacoes,
    setor,
    status: 'PENDENTE'
  }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
