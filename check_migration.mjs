import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("Verificando tabela contas_protheus...");
  const { data: contas, error: errContas } = await supabase.from('contas_protheus').select('*');
  if (errContas) {
    console.error("Erro ao acessar contas_protheus:", errContas.message);
  } else {
    console.log(`Sucesso: tabela contas_protheus possui ${contas.length} registros.`);
  }

  console.log("Verificando colunas na tabela faturas...");
  const { data: faturas, error: errFaturas } = await supabase.from('faturas').select('id, conta_protheus, desc_conta_protheus').limit(1);
  if (errFaturas) {
    console.error("Erro ao acessar colunas em faturas:", errFaturas.message);
  } else {
    console.log(`Sucesso: colunas conta_protheus e desc_conta_protheus existem na tabela faturas.`);
  }
}

verify();
