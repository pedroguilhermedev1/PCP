import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching faturas...');
  const { data: faturas } = await supabase.from('faturas').select('id, marca, insumos');
  
  if (faturas) {
    for (const f of faturas) {
      let needsUpdate = false;
      let newMarca = f.marca;
      let newInsumos = f.insumos;
      
      if (['EI', 'Pleno', 'MM', 'GF', 'NSE'].includes(f.marca)) {
        newMarca = '';
        needsUpdate = true;
      }
      
      if (f.insumos && Array.isArray(f.insumos)) {
         let changed = false;
         for (let i = 0; i < f.insumos.length; i++) {
            if (f.insumos[i]._meta) {
               if (f.insumos[i].cd === 'NCC') { f.insumos[i].cd = 'NSE'; changed = true; }
               if (newMarca === '' && f.insumos[i].cd !== 'NSE') {
                   f.insumos[i].cd = 'NSE'; changed = true;
               }
            } else {
               if (f.insumos[i].cd === 'NCC') { f.insumos[i].cd = 'NSE'; changed = true; }
               if (newMarca === '' && f.insumos[i].cd !== 'NSE') {
                   f.insumos[i].cd = 'NSE'; changed = true;
               }
            }
         }
         if (changed) { newInsumos = f.insumos; needsUpdate = true; }
      }

      if (needsUpdate) {
        await supabase.from('faturas').update({ marca: newMarca, insumos: newInsumos }).eq('id', f.id);
        console.log(`Updated fatura ${f.id}`);
      }
    }
  }

  console.log('Fetching estoque_insumos...');
  const { data: insumos } = await supabase.from('estoque_insumos').select('codigo, cd, empresa');
  if (insumos) {
      for (const i of insumos) {
          let nEmpresa = i.empresa;
          let nCd = i.cd;
          let changed = false;

          if (['EI', 'Pleno', 'MM', 'GF', 'NSE'].includes(i.empresa) || i.cd?.toUpperCase() === 'NSE' || i.cd?.toUpperCase() === 'NCC') {
             if (i.empresa !== '') { nEmpresa = ''; changed = true; }
             if (i.cd !== 'NSE') { nCd = 'NSE'; changed = true; }
          }

          if (changed) {
              await supabase.from('estoque_insumos').update({ empresa: nEmpresa, cd: nCd }).eq('codigo', i.codigo);
              console.log(`Updated insumo ${i.codigo}`);
          }
      }
  }

  console.log('Done!');
}

run();
