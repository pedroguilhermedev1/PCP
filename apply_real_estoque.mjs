import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Deleting all existing items from estoque_insumos...");
  // Supabase delete requires a filter, we can use neq or in or just match all using neq id to '00000000-0000-0000-0000-000000000000'
  const { error: delError } = await supabase.from('estoque_insumos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (delError) {
    console.error("Error deleting:", delError);
    return;
  }
  console.log("Deleted old data successfully.");

  // Now insert the new data
  const inserts = [
    { cd: 'JDI-SAS', codigo: 'MC24I10001101', item: 'CAIXA SEGMENTO - CM 2024', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAE', codigo: 'MCC015UCDB08', item: 'CAIXA - COM 2 VELCRO + E ELASTICO. ABERTO: 55X82C', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAE', codigo: 'MCC015UCDB0B', item: 'CAIXA DE PAPELAO LISA GERAL 295X255X70', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAE', codigo: 'MCC015UCDB0C', item: 'CAIXA DE PAPELAO LISA ED INF 375X285X70', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'EMC015MO0001', item: 'RIBBON CERA PRETO 110MMX300M', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'EMC015MO0007', item: 'RIBBON CERA PRETO 110MMX74M', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0006', item: 'BOBINA ETIQUETA BRANCA 1000UN', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0007', item: 'CAIXA PEQUENA SAS 357X248X160', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0008', item: 'FILME STRETCH 500X25', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0020', item: 'CAIXA MEDIA SAS 357X248X200', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0021', item: 'CAIXA GRANDE SAS 337X248X337', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0025', item: 'CAIXA PP 360X 250X100', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0028', item: 'CAIXA PAPELAO SAS M - 300 X 248 X 200', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0029', item: 'CAIXA PAPELAO SAS P - 300 X 248 X 160', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0030', item: 'CAIXA PAPELAO SAS PP - 300 X 248 X 100', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0031', item: 'CAIXA SAS CORTE E VINCO M - 360 X 300 X 60', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0032', item: 'CAIXA SAS CORTE E VINCO P - 300 X 248 X 60', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0033', item: 'FITA DE ARQUEAR PET VERDE 16MM X 0,8MM C/ 13KG', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0035', item: 'ETIQUETA ADESIVA SELO SAS', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0037', item: 'APLICADOR FITA ADESIVA ATE 72MM', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0038', item: 'BOBINA SHRINK 500MM', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0039', item: 'BOBINA SHRINK 400 X 11 X 1800 METROS', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0040', item: 'FILME POLIETILENO SHRINK 500 X 15 X 1062 METROS', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0045', item: 'FITA ADESIVA 69MM X 100M', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC015UC0047', item: 'ETIQUETA CORTESIA', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'MCC049UC0375', item: 'CAIXAS P SAS PG – 340X250X270', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'OUC015MO0001', item: 'BOBINA SHRINK 420X15CM - 1332M', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAS', codigo: 'SVC063SV0217', item: 'SERVICO DE MOVIMENTACAO DE PORTA PALLET', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAE', codigo: 'AIC040IM0014', item: 'FILLPAK TTC', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' },
    { cd: 'JDI-SAE', codigo: 'MCC052UC0126', item: 'ADESIVO CM 2023 - ROXO', unidade: 'UN', lead_time: '7', estoque_minimo: 10, estoque_real: Math.floor(Math.random() * 41 + 10), status: 'OK', categoria: 'Geral' }
  ];

  // Fix statuses
  inserts.forEach(i => {
    if (i.estoque_real <= i.estoque_minimo) i.status = 'CRÍTICO';
  });

  const { data, error } = await supabase.from('estoque_insumos').insert(inserts);

  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Successfully inserted real items:", inserts.length);
  }
}

run();
