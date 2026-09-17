import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'cds' or 'categorias'

  try {
    if (type === 'cds') {
      const { data, error } = await supabase.from('centros_distribuicao').select('*').order('nome');
      if (error) throw error;
      return NextResponse.json(data);
    } else if (type === 'categorias') {
      const { data, error } = await supabase.from('categorias_insumos').select('*').order('nome');
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data: cds } = await supabase.from('centros_distribuicao').select('*').order('nome');
      const { data: categorias } = await supabase.from('categorias_insumos').select('*').order('nome');
      return NextResponse.json({ cds, categorias });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'cds') {
      const { error } = await supabase.from('centros_distribuicao').insert([{ slug: data.slug, nome: data.nome }]);
      if (error) throw error;
    } else if (type === 'categorias') {
      const { error } = await supabase.from('categorias_insumos').insert([{ nome: data.nome }]);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  try {
    const body = await request.json();
    const { type, id, data } = body;

    if (type === 'cds') {
      const { error } = await supabase.from('centros_distribuicao').update(data).eq('id', id);
      if (error) throw error;
    } else if (type === 'categorias') {
      const { error } = await supabase.from('categorias_insumos').update(data).eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  try {
    if (type === 'cds') {
      // Soft delete
      const { error } = await supabase.from('centros_distribuicao').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    } else if (type === 'categorias') {
      const { error } = await supabase.from('categorias_insumos').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
