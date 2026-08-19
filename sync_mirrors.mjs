import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncMirrors() {
    console.log("Fetching all insumos...");
    const { data: insumos } = await supabase.from('estoque_insumos').select('*');
    if (!insumos) return;

    // Group by codigo + cd + empresa
    const groups = {};
    for (const insumo of insumos) {
        const key = `${insumo.codigo}_${insumo.cd}_${insumo.empresa || ''}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(insumo);
    }

    console.log(`Found ${Object.keys(groups).length} unique insumo groups.`);
    let syncCount = 0;

    for (const key in groups) {
        const items = groups[key];
        if (items.length > 1) {
            // Find the Principal one
            const principal = items.find(i => i.tipo_envio === 'Principal') || items[0];
            
            for (const item of items) {
                if (item.id !== principal.id) {
                    if (item.estoque_real !== principal.estoque_real || item.lead_time !== principal.lead_time || item.estoque_minimo !== principal.estoque_minimo) {
                        console.log(`Syncing Complementar ${item.item} (${item.codigo}) in ${item.cd} to match Principal...`);
                        await supabase.from('estoque_insumos').update({
                            estoque_real: principal.estoque_real,
                            status: principal.status,
                            lead_time: principal.lead_time,
                            estoque_minimo: principal.estoque_minimo,
                            cmd: principal.cmd,
                            unidade: principal.unidade,
                            categoria: principal.categoria,
                            item_adm: principal.item_adm
                        }).eq('id', item.id);
                        syncCount++;
                    }
                }
            }
        }
    }

    console.log(`Synchronization complete. Synced ${syncCount} items.`);
}

syncMirrors();
