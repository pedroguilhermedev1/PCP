import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylbylgqswkse.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  // Busca insumos deletados
  const { data: insumos } = await supabase
    .from('estoque_insumos')
    .select('id, item, cd, excluido_em')
    .eq('excluido', true)
    .order('excluido_em', { ascending: false });

  // Busca faturas deletadas
  const { data: faturas } = await supabase
    .from('faturas')
    .select('id, numero_documento, fornecedor, excluido_em')
    .eq('excluido', true)
    .order('excluido_em', { ascending: false });

  return NextResponse.json({
    insumos: insumos || [],
    faturas: faturas || []
  });
}

export async function PUT(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  const { type, id } = await request.json();
  if (!type || !id) return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });

  let table = type === 'insumo' ? 'estoque_insumos' : type === 'fatura' ? 'faturas' : null;
  if (!table) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  const { error } = await supabase
    .from(table)
    .update({ excluido: false, excluido_em: null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  if (!type || !id) return NextResponse.json({ error: 'Faltam parâmetros' }, { status: 400 });

  let table = type === 'insumo' ? 'estoque_insumos' : type === 'fatura' ? 'faturas' : null;
  if (!table) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
