const xlsx = require('xlsx');
const { createClient } = require('./node_modules/@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = 'C:\\Users\\conta\\Downloads\\CONTROLE DE INSUMOS.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = 'PAINEL';
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

async function main() {
  console.log("Deleting existing items for PSD...");
  const { error: deleteError } = await supabase
    .from('estoque_insumos')
    .delete()
    .eq('cd', 'psd');
  
  if (deleteError) {
    console.error('Error deleting:', deleteError);
    return;
  }
  console.log("Successfully deleted existing PSD items.");

  const itemsToInsert = [];

  // Start from row 16 (index 15)
  for (let i = 15; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[3] || String(row[3]).trim() === '') {
      break; // Stop at the first empty row to avoid reading secondary tables
    }

    const descricao = String(row[3]).trim();
    if (descricao === 'DESCRIÇÃO') break;

    const categoria = row[4] ? String(row[4]).trim() : '-';
    const estoque_real = Number(row[9]) || 0;
    const lead_time = row[11] ? String(row[11]).trim() : '-';

    // We insert two rows per item (Principal and Complementar)
    const baseItem = {
      cd: 'psd',
      item: descricao,       // Item OP
      item_adm: descricao,   // Item ADM
      codigo: '',
      estoque_real: estoque_real,
      estoque_minimo: 0,
      lead_time: lead_time,
      unidade: '-',          // Not provided in audio
      categoria: categoria,
      status: 'OK',          // Initial status
      cmd: 10
    };

    itemsToInsert.push({ ...baseItem, tipo_envio: 'Principal' });
    itemsToInsert.push({ ...baseItem, tipo_envio: 'Complementar' });
  }

  console.log(`Prepared ${itemsToInsert.length} records to insert (should be ${itemsToInsert.length / 2} items)...`);

  // Insert in batches of 50
  for (let i = 0; i < itemsToInsert.length; i += 50) {
    const batch = itemsToInsert.slice(i, i + 50);
    const { error } = await supabase.from('estoque_insumos').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      console.log(`Successfully inserted batch ${i / 50 + 1}`);
    }
  }

  console.log('Import completed!');
}

main();
