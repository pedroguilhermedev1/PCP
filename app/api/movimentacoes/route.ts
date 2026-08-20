import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cd = searchParams.get('cd');
  const tipo_envio = searchParams.get('tipo_envio') || 'Principal';
  const status = searchParams.get('status');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase.from('estoque_movimentacoes').select('*').eq('tipo_envio', tipo_envio).order('data_hora', { ascending: false });
  if (cd && cd !== 'todas') {
    query = query.ilike('cd', cd);
  }
  if (status) {
    query = query.eq('status', status);
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
    .select('*')
    .ilike('cd', cd)
    .eq('tipo_envio', t_envio);
    
  if (codigo !== '-') {
    query = query.eq('codigo', codigo);
  } else {
    query = query.eq('item', item);
  }

  if (empresa) {
    query = query.ilike('empresa', empresa);
  }

  const { data: insumoList, error: fetchError } = await query.limit(1);
  const insumo = insumoList ? insumoList[0] : null;

  if (fetchError || !insumo) {
    return NextResponse.json({ error: 'Insumo não encontrado no CD especificado.' }, { status: 404 });
  }


  if (tipo === 'Saída' || tipo === 'Ajuste de Saída' || tipo === 'Ajuste de Entrada' || tipo === 'Atualização Externa de Entrada' || tipo === 'Atualização Externa de Saída' || tipo === 'Atualização Externa Neutra') {
    let newReal = insumo.estoque_real || 0;
    if (tipo === 'Ajuste de Entrada' || tipo === 'Atualização Externa de Entrada') {
      newReal += quantidade;
    } else if (tipo === 'Ajuste de Saída' || tipo === 'Atualização Externa de Saída' || tipo === 'Saída') {
      newReal -= quantidade;
    }

    if (newReal < 0 && tipo === 'Saída') {
      return NextResponse.json({ error: 'Estoque insuficiente para esta saída.' }, { status: 400 });
    }

    const currentCmd = parseFloat(insumo.cmd) || 10;
    const currentLt = parseFloat(insumo.lead_time) || 0;
    const cobertura = currentCmd > 0 ? (newReal / currentCmd) : Infinity;

    let novoStatus = 'OK';
    if (cobertura <= currentLt) novoStatus = 'CRÍTICO';
    else if (cobertura > currentLt && cobertura <= (currentLt + 3)) novoStatus = 'ALERTA';
    else novoStatus = 'CONFORTÁVEL';

    let updateInsQuery = supabase.from('estoque_insumos').update({ estoque_real: newReal, status: novoStatus }).eq('codigo', insumo.codigo).ilike('cd', insumo.cd);
    if (insumo.empresa) {
      updateInsQuery = updateInsQuery.ilike('empresa', insumo.empresa);
    }

    const [insertMov, updateIns] = await Promise.all([
      supabase.from('estoque_movimentacoes').insert([{
        tipo,
        codigo,
        item,
        cd,
        empresa,
        quantidade,
        usuario,
        observacoes,
        setor,
        status: 'Aprovada',
        tipo_envio: t_envio
      }]),
      updateInsQuery
    ]);

    if (insertMov.error) return NextResponse.json({ error: insertMov.error.message }, { status: 500 });
    if (updateIns.error) return NextResponse.json({ error: updateIns.error.message }, { status: 500 });

    return NextResponse.json({ success: true, novo_estoque: newReal });

  } else {
    // Entrada manual -> vai para aprovação
    const { error } = await supabase.from('estoque_movimentacoes').insert([{
      tipo,
      codigo,
      item,
      cd,
      empresa,
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
}
