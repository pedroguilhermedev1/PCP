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
  const { searchParams } = new URL(request.url);
  const fatura_id = searchParams.get('fatura_id');
  
  if (!fatura_id) {
    return NextResponse.json({ error: 'Fatura ID é obrigatório' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase missing' }, { status: 500 });

  const { data, error } = await supabase
    .from('fatura_periodos')
    .select('*')
    .eq('fatura_id', fatura_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase missing' }, { status: 500 });

  try {
    const body = await request.json();
    const { fatura_id, etapa_nome, time_responsavel, responsavel_individual, data_inicio, data_termino, motivo_devolucao, descricao, sla_dias } = body;

    if (!fatura_id || !etapa_nome || !time_responsavel || !data_inicio) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('fatura_periodos')
      .insert([{
        fatura_id,
        etapa_nome,
        time_responsavel,
        responsavel_individual,
        data_inicio,
        data_termino,
        motivo_devolucao,
        descricao,
        sla_dias: sla_dias || 3
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase missing' }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('fatura_periodos')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
