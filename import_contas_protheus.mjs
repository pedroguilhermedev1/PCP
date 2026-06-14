import xlsx from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Iniciando importação de Contas Protheus...");

  const filePath = path.join('C:', 'Users', 'conta', 'Downloads', 'base_extracao_lancamentos.xlsx');
  console.log(`Lendo arquivo ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.error("Arquivo não encontrado!");
    return;
  }

  const buf = fs.readFileSync(filePath);
  const workbook = xlsx.read(buf, { type: 'buffer' });
  
  // A aba se chama "Base (antes dispendio)"
  const sheetName = "Base (antes dispendio)";
  if (!workbook.Sheets[sheetName]) {
    console.error(`Aba ${sheetName} não encontrada!`);
    return;
  }
  
  const sheet = workbook.Sheets[sheetName];
  // Utilizando header: 'A' garante que as colunas virão com os nomes A, B, C, etc.
  const data = xlsx.utils.sheet_to_json(sheet, { header: "A", defval: "" }); 
  
  let inserts = [];
  let contasSet = new Set();

  // A primeira linha pode ser o cabeçalho, então começamos da linha 2 se usar header "A" (index 1)
  // J = conta_protheus (index J -> J é a 10ª coluna, mas no json vai vir na chave 'J')
  // K = desc_conta_protheus (chave 'K')
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const conta = String(row['J'] || '').trim();
    const desc = String(row['K'] || '').trim();

    if (conta && desc && conta !== 'Conta Contábil' && conta !== 'Conta' && !contasSet.has(conta)) {
      contasSet.add(conta);
      inserts.push({
        conta_protheus: conta,
        desc_conta_protheus: desc
      });
    }
  }

  console.log(`Encontradas ${inserts.length} contas únicas.`);

  if (inserts.length > 0) {
    const { error } = await supabase.from('contas_protheus').upsert(inserts, { onConflict: 'conta_protheus' });
    if (error) {
      console.error("Erro na inserção de novos registros:", error.message);
    } else {
      console.log(`Inserções concluídas: ${inserts.length} registros.`);
    }
  }

  console.log("Importação finalizada!");
}

run();
