import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

const defaultCds = [
  { slug: 'fortaleza', nome: 'Fortaleza', ativo: true },
  { slug: 'jundiai', nome: 'Jundiaí', ativo: true },
  { slug: 'nse', nome: 'NSE', ativo: true },
  { slug: 'coc', nome: 'COC', ativo: true },
  { slug: 'psd', nome: 'PSD', ativo: true },
  { slug: 'curitiba', nome: 'Curitiba', ativo: true }
];

async function run() {
  const { data, error } = await supabase.from('centros_distribuicao').insert(defaultCds);
  console.log('Inserted CDs:', error || data);
}

run();
