import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });

  try {
    const { items, cd } = await request.json();

    if (!items || !Array.isArray(items) || !cd) {
      return NextResponse.json({ error: 'Dados inválidos para importação' }, { status: 400 });
    }

    let sucessos = 0;
    let erros = 0;

    for (const itemData of items) {
      let { codigo, item, unidade, categoria, estoque_real, estoque_minimo } = itemData;

      estoque_real = parseInt(estoque_real) || 0;
      estoque_minimo = parseInt(estoque_minimo) || 0;
      
      const cmd = 10;
      const lt = 0;
      const cobertura = cmd > 0 ? (estoque_real / cmd) : Infinity;

      let status = 'CONFORTÁVEL';
      if (cobertura <= lt) status = 'CRÍTICO';
      else if (cobertura > lt && cobertura <= (lt + 3)) status = 'ALERTA';

      // Verifica se o item já existe neste CD
      const { data: existing, error: errExist } = await supabase
        .from('estoque_insumos')
        .select('id, tipo_envio')
        .eq('item', item)
        .ilike('cd', cd);

      if (errExist) {
        erros++;
        continue;
      }

      if (existing && existing.length > 0) {
        // Atualiza Principal e Complementar
        for (const ex of existing) {
          await supabase
            .from('estoque_insumos')
            .update({
              codigo,
              unidade,
              categoria,
              estoque_real,
              estoque_minimo,
              status,
              cmd,
              lead_time: '-'
            })
            .eq('id', ex.id);
        }
        sucessos++;
      } else {
        // Insere novos
        const insertData = [
          { cd, codigo, item, unidade, categoria, estoque_real, estoque_minimo, status, cmd, lead_time: '-', tipo_envio: 'Principal' },
          { cd, codigo, item, unidade, categoria, estoque_real, estoque_minimo, status, cmd, lead_time: '-', tipo_envio: 'Complementar' }
        ];
        
        const { error: errInsert } = await supabase
          .from('estoque_insumos')
          .insert(insertData);
          
        if (errInsert) {
          erros++;
        } else {
          sucessos++;
        }
      }
    }

    return NextResponse.json({ success: true, sucessos, erros }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
