import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const filePath = 'C:\\Users\\conta\\Downloads\\insumos_01.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(sheet);
  
  if (data.length === 0) {
    console.log("Nenhum dado encontrado no arquivo excel.");
    return;
  }

  console.log(`Lidas ${data.length} linhas do excel. Preparando inserção...`);

  const inserts = [];

  for (const row of data) {
    let empresa = row['Empresa'] ? String(row['Empresa']).trim() : null;
    let codigo = row['Cód. Item'] || null;
    let item = row['Descrição do Item'] || null;

    if (!codigo || !item) continue;

    let cdsToInsert = [];

    if (empresa) {
      const empUpper = empresa.toUpperCase();
      if (empUpper === 'SAS' || empUpper === 'SAE' || empUpper === 'IS') {
        cdsToInsert = ['fortaleza', 'jundiai'];
      } else if (['EI', 'PLENO', 'MM', 'GF'].includes(empUpper)) {
        cdsToInsert = ['nse'];
      } else if (empUpper === 'PSD' || empUpper === 'POSITIVO') {
        cdsToInsert = ['curitiba'];
      } else if (empUpper === 'COC') {
        cdsToInsert = ['ribeirao-preto'];
      } else if (empUpper === 'GEEKIE' || empUpper === 'NAVE') {
        cdsToInsert = ['raizes'];
      } else {
        // Fallback default
        cdsToInsert = ['jundiai'];
      }
    } else {
      cdsToInsert = ['jundiai'];
    }

    for (const cdStr of cdsToInsert) {
      inserts.push({
        empresa: empresa,
        codigo: codigo,
        item: item,
        categoria: row['Categoria II'] || 'Geral',
        conta_contabil: row['Conta Contábil'] ? String(row['Conta Contábil']) : null,
        descricao_contabil: row['Descrição Contábil'] || null,
        cd: cdStr,
        unidade: '',
        lead_time: '7',
        estoque_minimo: 0,
        estoque_real: 0,
        status: 'OK'
      });
    }
  }

  console.log(`Inserindo ${inserts.length} registros válidos (contando duplicatas por CD)...`);

  const chunkSize = 500;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { data: result, error } = await supabase.from('estoque_insumos').insert(chunk);

    if (error) {
      console.error("Erro na inserção do chunk", i, error);
    } else {
      console.log(`Chunk ${i} a ${i + chunk.length} inserido com sucesso!`);
    }
  }

  console.log("Finalizado!");
}

run();
