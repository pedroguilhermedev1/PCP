import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  { nf: '13185', cd: 'Fortaleza' },
  { nf: '237-2', cd: 'NSE' },
  { nf: '9484', cd: 'Fortaleza' },
  { nf: '13263', cd: 'Fortaleza' },
  { nf: '193462', cd: 'Fortaleza' },
  { nf: '9379', cd: 'Fortaleza' },
  { nf: '21842', cd: 'Fortaleza' },
  { nf: '9480', cd: 'Fortaleza' },
  { nf: '38964', cd: 'Jundiaí' }
];

async function run() {
  for (const update of updates) {
    console.log(`Processing NF: ${update.nf} -> CD: ${update.cd}`);
    
    const { data: faturas, error } = await supabase
      .from('faturas')
      .select('id, numero_documento, marca, insumos')
      .eq('numero_documento', update.nf);
      
    if (error || !faturas || faturas.length === 0) continue;
    
    for (const f of faturas) {
      let needsUpdate = false;
      let newMarca = f.marca;
      let newInsumos = f.insumos;
      
      if (update.cd === 'NSE' && newMarca !== '') {
        newMarca = '';
        needsUpdate = true;
      } else if (update.cd !== 'NSE' && (newMarca === '' || newMarca === '-')) {
        newMarca = 'SAS';
        needsUpdate = true;
      }
      
      if (f.insumos && Array.isArray(f.insumos) && f.insumos.length > 0) {
        let changed = false;
        let hasMeta = false;
        for (let i = 0; i < f.insumos.length; i++) {
          if (f.insumos[i]._meta) {
            hasMeta = true;
          }
          if (f.insumos[i].cd !== update.cd) {
            f.insumos[i].cd = update.cd;
            changed = true;
          }
        }
        if (!hasMeta) {
            f.insumos.push({ _meta: true, cd: update.cd });
            changed = true;
        }
        if (changed) {
          newInsumos = f.insumos;
          needsUpdate = true;
        }
      } else {
        newInsumos = [ { _meta: true, cd: update.cd } ];
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('faturas')
          .update({ marca: newMarca, insumos: newInsumos })
          .eq('id', f.id);
        console.log(`Updated fatura ${f.id} (NF: ${update.nf}) - Marca: ${newMarca}, CD: ${update.cd}`);
      } else {
        console.log(`Fatura ${f.id} (NF: ${update.nf}) already up to date.`);
      }
    }
  }
  console.log('Update complete!');
}

run();
