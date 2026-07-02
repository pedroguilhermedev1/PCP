import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateFaturas() {
  console.log("Fetching faturas...");
  const { data: faturas, error } = await supabase.from('faturas').select('*').order('data_emissao', { ascending: true });

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Found ${faturas.length} faturas. Re-assigning codes...`);

  let counter = 1;
  for (const f of faturas) {
    const code = `FAT-${String(counter).padStart(6, '0')}`;
    console.log(`Updating ${f.id} -> ${code}`);
    
    const { error: updateError } = await supabase
      .from('faturas')
      .update({ codigo_fatura: code })
      .eq('id', f.id);

    if (updateError) {
      console.error(`Error updating ${f.id}:`, updateError);
    } else {
      counter++;
    }
  }

  console.log("Migration finished.");
}

migrateFaturas();
