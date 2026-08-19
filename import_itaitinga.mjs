import xlsx from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Deletando insumos do CD Fortaleza...");
  const { error: delError } = await supabase.from('estoque_insumos').delete().eq('cd', 'fortaleza');
  if (delError) {
    console.error("Erro ao deletar", delError);
    return;
  }
  
  const buf = fs.readFileSync('C:/Users/conta/Downloads/Contagem CD Itaitinga.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer' });
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const inserts = [];
  for (const row of data) {
    let codigo = String(row['CÓDIGO:'] || '').trim();
    let item = String(row['DESCRIÇÃO:'] || '').trim();
    let quantidade = Number(row['QUANTIDADE:']) || 0;

    if (!codigo || !item) continue;

    inserts.push({
      cd: 'fortaleza',
      codigo: codigo,
      item: item,
      estoque_real: quantidade,
      empresa: 'SAS', // Usando SAS como empresa padrão para Fortaleza com base em scripts antigos
      categoria: 'Geral',
      status: 'OK',
      estoque_minimo: 0,
      lead_time: '7',
      unidade: ''
    });
  }

  console.log(`Inserindo ${inserts.length} insumos novos para CD Fortaleza...`);

  const chunkSize = 500;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { error } = await supabase.from('estoque_insumos').insert(chunk);

    if (error) {
      console.error("Erro na inserção do chunk", i, error);
    } else {
      console.log(`Chunk ${i} a ${i + chunk.length} inserido com sucesso!`);
    }
  }

  console.log("Concluído!");
}

run();
