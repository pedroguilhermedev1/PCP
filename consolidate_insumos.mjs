import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching all insumos...");
  const { data: insumos, error } = await supabase.from('estoque_insumos').select('*');
  
  if (error) {
    console.error("Error fetching insumos:", error);
    return;
  }
  
  const grouped = {};
  for (const i of insumos) {
    const key = `${i.cd}_${i.item}_${i.tipo_envio || 'Principal'}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  }
  
  const idsToDelete = [];
  const idsToUpdate = [];
  
  for (const [key, group] of Object.entries(grouped)) {
    if (group.length > 1) {
      // Find SAS or first item
      let keptIndex = group.findIndex(i => i.empresa === 'SAS');
      if (keptIndex === -1) keptIndex = 0;
      
      const keptItem = group[keptIndex];
      idsToUpdate.push(keptItem.id);
      
      for (let i = 0; i < group.length; i++) {
        if (i !== keptIndex) {
          idsToDelete.push(group[i].id);
        }
      }
    } else {
      // Just update it to clear empresa
      idsToUpdate.push(group[0].id);
    }
  }
  
  console.log(`Found ${idsToDelete.length} duplicates to delete.`);
  console.log(`Found ${idsToUpdate.length} unique items to clear 'empresa'.`);
  
  // Clear empresa for unique items
  console.log("Clearing 'empresa' for unique items...");
  const updatePromises = idsToUpdate.map(id => 
    supabase.from('estoque_insumos').update({ empresa: '' }).eq('id', id)
  );
  
  // We can batch these, but Promise.all with chunking is safer
  for (let i = 0; i < updatePromises.length; i += 50) {
    await Promise.all(updatePromises.slice(i, i + 50));
    console.log(`Updated ${Math.min(i + 50, updatePromises.length)} / ${updatePromises.length}`);
  }
  
  // Delete duplicates
  if (idsToDelete.length > 0) {
    console.log("Deleting duplicates...");
    // Supabase allows deleting with .in()
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const chunk = idsToDelete.slice(i, i + 50);
      await supabase.from('estoque_insumos').delete().in('id', chunk);
      console.log(`Deleted ${Math.min(i + 50, idsToDelete.length)} / ${idsToDelete.length}`);
    }
  }
  
  console.log("Database consolidation complete.");
}

run();
