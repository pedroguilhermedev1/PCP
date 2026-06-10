import xlsx from 'xlsx';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Iniciando processamento para Jundiaí...");

  // Fetch all existing data for SAS and SAE in Jundiaí
  let existingRecords = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log("Buscando registros existentes no banco...");
  while (hasMore) {
    const { data, error } = await supabase
      .from('estoque_insumos')
      .select('*')
      .eq('cd', 'jundiai')
      .in('empresa', ['SAS', 'SAE'])
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Erro ao buscar registros:", error);
      return;
    }

    if (data.length > 0) {
      existingRecords.push(...data);
      page++;
    } else {
      hasMore = false;
    }
  }
  console.log(`Encontrados ${existingRecords.length} registros para Jundiaí (SAS/SAE).`);

  // Lendo a planilha (já ignorando o cabeçalho, os dados vêm como objetos usando a linha 1 como keys)
  console.log("Lendo arquivo relatorio-jdi.xlsx...");
  const buf = fs.readFileSync('relatorio-jdi.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" }); // reads from line 2 automatically because line 1 is headers

  let updates = [];
  let inserts = [];

  for (const row of data) {
    const excCodigo = String(row['Código'] || '').trim();
    const excNome = String(row['Insumo / Nome'] || '').trim();
    const excUnidade = String(row['Unidade'] || '').trim();
    const excEstoqueAtual = row['Estoque Atual'] !== "" ? Number(row['Estoque Atual']) : null;
    const excEstoqueMin = row['Estoque Mínimo'] !== "" ? Number(row['Estoque Mínimo']) : null;

    if (!excNome && !excCodigo) continue; // Pula linhas vazias

    let empresasAlvo = [];
    const nomeUp = excNome.toUpperCase();
    if (nomeUp.includes('SAS')) {
      empresasAlvo = ['SAS'];
    } else if (nomeUp.includes('SAE')) {
      empresasAlvo = ['SAE'];
    } else {
      empresasAlvo = ['SAS', 'SAE'];
    }

    for (const empresa of empresasAlvo) {
      // Find existing record
      // 1. By Code and Empresa
      let existing = existingRecords.find(r => r.empresa === empresa && r.codigo && excCodigo && r.codigo.toUpperCase() === excCodigo.toUpperCase());
      
      // 2. Fallback to Name and Empresa
      if (!existing && excNome) {
        existing = existingRecords.find(r => r.empresa === empresa && r.item && r.item.toUpperCase() === nomeUp);
      }

      if (existing) {
        // Update logic
        const updatePayload = {
          id: existing.id,
          // Atualiza quantidade sempre
          estoque_real: excEstoqueAtual !== null ? excEstoqueAtual : existing.estoque_real,
          estoque_minimo: excEstoqueMin !== null ? excEstoqueMin : existing.estoque_minimo,
        };

        // Regra de não sobrescrever valores preenchidos no DB por vazios no Excel
        if (excCodigo !== "") updatePayload.codigo = excCodigo;
        if (excUnidade !== "") updatePayload.unidade = excUnidade;
        
        // Atualizamos o nome se ele for provido no Excel
        if (excNome !== "") updatePayload.item = excNome;

        updates.push(updatePayload);
      } else {
        // Insert logic
        inserts.push({
          empresa: empresa,
          codigo: excCodigo || '-',
          item: excNome || '-',
          unidade: excUnidade || '-',
          estoque_real: excEstoqueAtual !== null ? excEstoqueAtual : 0,
          estoque_minimo: excEstoqueMin !== null ? excEstoqueMin : 0,
          cd: 'jundiai',
          categoria: 'Geral', // Required defaults for new entries
          status: 'OK',
          lead_time: '7'
        });
      }
    }
  }

  console.log(`Preparo concluído: ${updates.length} registros para ATUALIZAR, ${inserts.length} registros para CRIAR.`);

  // Executing Updates
  let successUpdates = 0;
  for (const up of updates) {
    const { id, ...payload } = up;
    const { error } = await supabase.from('estoque_insumos').update(payload).eq('id', id);
    if (error) {
      console.error(`Erro ao atualizar ID ${id}:`, error.message);
    } else {
      successUpdates++;
    }
  }
  console.log(`Atualizações concluídas: ${successUpdates}/${updates.length}.`);

  // Executing Inserts
  if (inserts.length > 0) {
    const chunkSize = 500;
    let successInserts = 0;
    for (let i = 0; i < inserts.length; i += chunkSize) {
      const chunk = inserts.slice(i, i + chunkSize);
      const { error } = await supabase.from('estoque_insumos').insert(chunk);
      if (error) {
        console.error("Erro na inserção de novos registros:", error.message);
      } else {
        successInserts += chunk.length;
      }
    }
    console.log(`Inserções concluídas: ${successInserts}/${inserts.length}.`);
  }

  console.log("Importação de Jundiaí finalizada!");
}

run();
