import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Buscando todos os insumos...');
  const { data: insumos, error: fetchError } = await supabase.from('estoque_insumos').select('*');
  
  if (fetchError) {
    console.error('Erro ao buscar:', fetchError);
    return;
  }

  console.log(`Encontrados ${insumos.length} insumos.`);

  for (const item of insumos) {
    let categoria = 'Geral';
    const nome = item.item.toUpperCase();
    
    if (nome.includes('ETIQUETA')) categoria = 'Etiqueta';
    else if (nome.includes('CAIXA')) categoria = 'Caixa';
    else if (nome.includes('FITA')) categoria = 'Fita';
    else if (nome.includes('RIBBON')) categoria = 'Ribbon';
    else if (nome.includes('BOBINA')) categoria = 'Bobina';

    const estoqueRealReset = 50;
    const novoStatus = estoqueRealReset <= item.estoque_minimo ? 'CRÍTICO' : 'OK';

    const { error: updateError } = await supabase
      .from('estoque_insumos')
      .update({
        categoria: categoria,
        estoque_real: estoqueRealReset,
        status: novoStatus
      })
      .eq('id', item.id);

    if (updateError) {
      console.error(`Erro ao atualizar ${item.item}:`, updateError);
    } else {
      console.log(`Atualizado ${item.item}: Categoria=${categoria}, Estoque=50`);
    }
  }

  console.log('Concluído!');
}

run();
