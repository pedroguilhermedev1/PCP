import xlsx from 'xlsx';
import * as fs from 'fs';

const filePath = 'C:\\Users\\conta\\Downloads\\insumos do metabase.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const items = [];
const codigos = new Set();

// Skip header (index 0)
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  let marca = row[0]; // Empresa
  const itemDesc = row[1]; // Descrição do Item
  const codigo = row[2]; // Cód. Item

  if (marca && itemDesc && codigo && !codigos.has(codigo)) {
    // If the Empresa is something like Mogi or something else, we can fallback or keep it.
    // The user wants all items from the spreadsheet, maybe keeping the Empresa.
    // CD logic: JDI-SAS or just the name if not SAS/SAE
    codigos.add(codigo);
    items.push({ marca, itemDesc, codigo });
  }
}

let sql = `-- Script para inserir dados de teste na tabela de estoque_insumos\n`;
sql += `-- Permite acesso da API (bypassa RLS)\n`;
sql += `ALTER TABLE public.estoque_insumos ENABLE ROW LEVEL SECURITY;\n`;
sql += `DROP POLICY IF EXISTS "Permitir acesso total" ON public.estoque_insumos;\n`;
sql += `CREATE POLICY "Permitir acesso total" ON public.estoque_insumos FOR ALL USING (true) WITH CHECK (true);\n\n`;
sql += `DELETE FROM public.estoque_insumos;\n\n`;

sql += `INSERT INTO public.estoque_insumos (cd, codigo, item, unidade, lead_time, estoque_minimo, estoque_real, status, categoria)\n`;
sql += `VALUES\n`;

const values = items.map((obj, index) => {
  const cd = String(obj.marca) === 'SAS' || String(obj.marca) === 'SAE' ? `JDI-${obj.marca}` : String(obj.marca);
  const itemStr = String(obj.itemDesc).replace(/'/g, "''");
  const codigoStr = String(obj.codigo).replace(/'/g, "''");
  return `  ('${cd}', '${codigoStr}', '${itemStr}', 'UN', '7', 10, floor(random() * 41 + 10)::int, 'OK', 'Geral')`;
});

sql += values.join(',\n') + ';\n\n';

sql += `-- Atualiza o status caso o valor aleatório gerado tenha sido 10 (igual ao mínimo)\n`;
sql += `UPDATE public.estoque_insumos \n`;
sql += `SET status = 'CRÍTICO' \n`;
sql += `WHERE estoque_real <= estoque_minimo;\n`;

fs.writeFileSync('popula_estoque_teste.sql', sql, 'utf8');
console.log(`Generated SQL for ${items.length} items from Excel.`);
