import xlsx from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  // sometimes xlsx returns numeric value even with cellDates if formatted differently
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    return d.toISOString().split('T')[0];
  }
  return String(val);
}

function parseCurrency(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/R\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
  return parseFloat(cleaned) || 0;
}

async function run() {
  const buf = fs.readFileSync('faturas.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
  if (data.length === 0) {
    console.log("Nenhum dado encontrado.");
    return;
  }

  const inserts = [];

  for (const row of data) {
    const tipoRaw = row['TIPO'] || row['*Tipo'] || row['Tipo*'] || row['Tipo'];
    let tipo = 'Serviço';
    if (String(tipoRaw).toUpperCase().includes('MATERIAL')) {
      tipo = 'Material';
    }

    // Ensure we skip empty essential rows
    if (!row['FORNECEDOR*'] && !row['*FORNECEDOR']) continue;

    const id = crypto.randomUUID() + '__CAT__' + tipo;

    const fatura = {
      id,
      marca: String(row['MARCA*'] || ''),
      fornecedor: String(row['FORNECEDOR*'] || ''),
      cnpj: String(row['CNPJ*'] || ''),
      data_emissao: parseDate(row['DATA DE EMISSÃO*']),
      data_recebimento: parseDate(row['DATA DE RECEBIMENTO*']),
      data_vencimento: parseDate(row['DATA DE VENCIMENTO'] || row['DATA DE VENCIMENTO*']),
      numero_documento: String(row['Nº DO DOCUMENTO*'] || ''),
      valor: parseCurrency(row['VALOR'] || row['VALOR*']),
      centro_custo: String(row['CENTRO DE CUSTO*'] || ''),
      filial: String(row['FILIAL*'] || ''),
      tipo_documento: String(row['TIPO DE DOCUMENTO*'] || ''),
      tipo_servico: String(row['TIPO DE SERVIÇO*'] || ''),
      codigo_servico: String(row['CÓDIGO DO SERVIÇO*'] || ''),
      heflo: String(row['HEFLO*'] || ''),
      data_abertura_heflo: parseDate(row['DATA ABERTURA HEFLO*']),
      erp: String(row['ERP*'] || ''),
      data_aprovacao: parseDate(row['DATA APROVAÇÃO*']),
      v360: String(row['V360*'] || ''),
      data_abertura_v360: parseDate(row['DATA EDIÇÃO V360*'] || row['DATA ABERTURA V360*']),
      status_pagamento: String(row['STATUS*'] || 'Em andamento'),
      responsavel: String(row['RESPONSÁVEL'] || row['RESPONSÁVEL*'] || ''),
      forma_pagamento: String(row['FORMA DE PAGAMENTO'] || 'Boleto'),
      observacoes: String(row['OBSERVAÇÕES*'] || ''),
      data_pagamento_real: parseDate(row['DATA DE PAGAMENTO REAL*']),
      possui_encargo: false,
      valor_encargo: 0
    };

    inserts.push(fatura);
  }

  console.log(`Inserindo ${inserts.length} registros no banco de dados...`);
  
  const { error } = await supabase.from('faturas').upsert(inserts);

  if (error) {
    console.error("Erro ao inserir dados no supabase:", error);
  } else {
    console.log("Faturas inseridas com sucesso!");
  }
}

run();
