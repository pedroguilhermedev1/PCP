import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanComplementar() {
  console.log('Deletando itens Complementares de estoque_insumos...');
  const { data: insumos, error: err1 } = await supabase
    .from('estoque_insumos')
    .delete()
    .eq('tipo_envio', 'Complementar');
    
  if (err1) console.error('Erro em estoque_insumos:', err1);
  else console.log('Sucesso insumos');

  console.log('Deletando itens Complementares de estoque_movimentacoes...');
  const { data: movs, error: err2 } = await supabase
    .from('estoque_movimentacoes')
    .delete()
    .eq('tipo_envio', 'Complementar');
    
  if (err2) console.error('Erro em estoque_movimentacoes:', err2);
  else console.log('Sucesso movs');
  
  // also for movimentacoes_insumos
  console.log('Deletando itens Complementares de movimentacoes_insumos...');
  const { data: m_ins, error: err3 } = await supabase
    .from('movimentacoes_insumos')
    .delete()
    .eq('tipo_envio', 'Complementar');
    
  if (err3) console.error('Erro em movimentacoes_insumos:', err3);
  else console.log('Sucesso movimentacoes_insumos');
  
  console.log('Concluído!');
}

cleanComplementar();
