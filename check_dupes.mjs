import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const itemsToCheck = [
    'Etiqueta couchê azul 105x140',
    'Etiqueta couchê lilás 105x140',
    'Filme stretch manual 500x0.025 vermelho'
  ];

  for (const itemDesc of itemsToCheck) {
    console.log(`\n--- Checking: ${itemDesc} ---`);
    const { data: items, error } = await supabase
      .from('estoque')
      .select('id, item, codigo, cd')
      .ilike('item', `%${itemDesc}%`);
      
    if (error) {
      console.error('Error fetching', error);
      continue;
    }
    
    console.log(`Found ${items.length} records:`);
    console.table(items);
    
    if (items.length > 1) {
      for (const item of items) {
        const { count, error: countErr } = await supabase
          .from('estoque_movimentacoes')
          .select('*', { count: 'exact', head: true })
          .eq('insumo_id', item.id);
          
        console.log(`Item ID ${item.id} has ${count} movimentacoes.`);
      }
    }
  }
}

main();
