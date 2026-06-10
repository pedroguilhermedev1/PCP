import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Iniciando backup...");
  const { data, error } = await supabase.from('estoque_insumos').select('*');
  if (error) {
    console.error("Erro ao buscar dados:", error);
    return;
  }
  
  fs.writeFileSync('backup_insumos_antigos.json', JSON.stringify(data, null, 2));
  console.log(`Backup salvo com sucesso. Total de registros: ${data.length}`);
  
  if (data.length > 0) {
    console.log("Deletando registros antigos...");
    
    // Supabase JS allows delete with IN or just deleting all by a condition that is always true
    // Since we can't easily delete all without a filter, we delete by id in chunks
    const ids = data.map(d => d.id);
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunkIds = ids.slice(i, i + chunkSize);
      const { error: delError } = await supabase.from('estoque_insumos').delete().in('id', chunkIds);
      if (delError) {
        console.error("Erro ao deletar chunk:", delError);
      } else {
        console.log(`Deletados ${chunkIds.length} registros...`);
      }
    }
  }
  console.log("Processo concluído.");
}

run();
