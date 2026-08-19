const xlsx = require('xlsx');
const { createClient } = require('./node_modules/@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = 'C:\\Users\\conta\\Downloads\\INSUMOS CD JUNDIAI.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

async function main() {
  const itemsToInsert = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[3]) continue; // Skip if no Item OP

    const item_op = String(row[3]).trim();
    const estoque_real = Number(row[4]) || 0;
    const item_adm = row[6] ? String(row[6]).trim() : '';
    const codigo = row[7] ? String(row[7]).trim() : '';

    // We insert two rows per item (Principal and Complementar)
    const baseItem = {
      cd: 'jundiai',
      item: item_op,
      item_adm: item_adm,
      codigo: codigo,
      estoque_real: estoque_real,
      estoque_minimo: 0,
      lead_time: '-',
      unidade: '-',
      categoria: '-',
      status: 'OK', // Initial status
      cmd: 10
    };

    itemsToInsert.push({ ...baseItem, tipo_envio: 'Principal' });
    itemsToInsert.push({ ...baseItem, tipo_envio: 'Complementar' });
  }

  console.log(`Prepared ${itemsToInsert.length} records to insert...`);

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
