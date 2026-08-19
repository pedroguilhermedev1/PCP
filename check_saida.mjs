import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: movs, error: movsError } = await supabase
        .from('estoque_movimentacoes')
        .select('*')
        .eq('tipo', 'Saída')
        .order('data_hora', { ascending: false })
        .limit(1);
        
    console.log("Última Saída:", movs);
    
    if (movs && movs.length > 0) {
        const { data: insumo, error: insError } = await supabase
            .from('estoque_insumos')
            .select('*')
            .eq('codigo', movs[0].codigo)
            .ilike('cd', movs[0].cd)
            .limit(1);
            
        console.log("Insumo correspondente:", insumo);
    }
}
main();
