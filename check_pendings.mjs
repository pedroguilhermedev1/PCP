import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // get pending
    const { data: pendings } = await supabase.from('estoque_movimentacoes').select('*').eq('status', 'PENDENTE');
    console.log("PENDENTES:", JSON.stringify(pendings, null, 2));

    if (pendings && pendings.length > 0) {
        for (const mov of pendings) {
            console.log("\nSearching for insumo with codigo:", mov.codigo, "cd:", mov.cd, "empresa:", mov.empresa);
            let q = supabase.from('estoque_insumos').select('*').eq('codigo', mov.codigo);
            const { data: ins } = await q;
            console.log("Found globally:", JSON.stringify(ins, null, 2));

            let q2 = supabase.from('estoque_insumos').select('*').eq('codigo', String(mov.codigo)).ilike('cd', mov.cd);
            const { data: ins2 } = await q2;
            console.log("Found with ilike cd:", JSON.stringify(ins2, null, 2));

            // test the exact query from route.ts
            let q3 = supabase.from('estoque_insumos').select('*').eq('codigo', mov.codigo).ilike('cd', mov.cd);
            if (mov.empresa) {
              q3 = q3.ilike('empresa', mov.empresa);
            }
            const { data: ins3 } = await q3.limit(1);
            console.log("Found with exact route.ts query:", JSON.stringify(ins3, null, 2));
        }
    }
}
main();
