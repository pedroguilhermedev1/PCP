const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: items, error } = await supabase
    .from('estoque_insumos')
    .select('*')
    .or('excluido.is.null,excluido.eq.false');
    
  if (error) {
    console.error('Error fetching', error);
    return;
  }
  
  const map = {};
  items.forEach(i => {
    // Unique key: cd + item name + codigo
    const key = `${i.cd.toLowerCase()}_${i.codigo}_${i.item.trim().toLowerCase()}`;
    if (!map[key]) map[key] = { principal: null, complementar: null, proto: i };
    
    if (i.tipo_envio === 'Principal') map[key].principal = i;
    else if (i.tipo_envio === 'Complementar') map[key].complementar = i;
    else if (!i.tipo_envio) map[key].principal = i; // default is Principal
  });
  
  let inserted = 0;
  
  for (const [key, obj] of Object.entries(map)) {
    const toInsert = [];
    
    if (!obj.principal) {
      const p = { ...obj.proto };
      delete p.id;
      delete p.created_at;
      p.tipo_envio = 'Principal';
      toInsert.push(p);
      console.log(`Creating Principal for ${p.item} in ${p.cd}`);
    }
    
    if (!obj.complementar) {
      const c = { ...obj.proto };
      delete c.id;
      delete c.created_at;
      c.tipo_envio = 'Complementar';
      toInsert.push(c);
      console.log(`Creating Complementar for ${c.item} in ${c.cd}`);
    }
    
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from('estoque_insumos').insert(toInsert);
      if (insErr) {
        console.error('Error inserting', insErr);
      } else {
        inserted += toInsert.length;
      }
    }
  }
  
  console.log(`\nInserted ${inserted} missing twin records.`);
}

main();
