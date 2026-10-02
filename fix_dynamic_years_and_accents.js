const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Dynamic 'anos'
const dynamicAnosLogic = `const anos = Array.from(new Set(faturas.map(f => {
    const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || f.data_abertura || (f as any).created_at || (f as any).nexa_data_inicio || new Date().toISOString();
    let d = new Date(dataStr);
    if (isNaN(d.getTime()) && typeof dataStr === 'string' && dataStr.includes('/')) {
      const parts = dataStr.split('/');
      if (parts.length === 3) d = new Date(parts[2], parseInt(parts[1])-1, parts[0]);
    }
    if (isNaN(d.getTime())) d = new Date();
    return d.getFullYear().toString();
  }))).sort();`;

content = content.replace(/const anos = \["2023".*?\];/, dynamicAnosLogic);

// 2. Add normalize text function and apply to filters
const normalizeLogic = `const normalizeString = (str: string) => typeof str === 'string' ? str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toUpperCase().trim() : '';`;

if (!content.includes('normalizeString = (str: string)')) {
  content = content.replace(/const meses = \[/, `${normalizeLogic}\n  const meses = [`);
}

// 3. Update the filterLogic block (we have 2 places where it filters: one for count, one for list)
// We already injected `filterLogic` before, so we just replace the filter block
const oldFilterRegex = /const cdRaw = f\.cd[\s\S]*?if \(listFiltroAno !== 'todos' && y !== listFiltroAno\) return false;\s*return true;/g;

const newFilterLogic = `
                                  const cdRaw = f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '';
                                  const cd = normalizeString(cdRaw as string);
                                  const filterCd = normalizeString(listFiltroCD);
                                  if (listFiltroCD !== 'todos' && cd !== filterCd) return false;
                                  
                                  const respRaw = f.responsavel || '';
                                  const resp = normalizeString(respRaw);
                                  const filterResp = normalizeString(listFiltroResp);
                                  if (listFiltroResp !== 'todos' && resp !== filterResp) return false;
                                  
                                  const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || f.data_abertura || (f as any).created_at || (f as any).nexa_data_inicio || new Date().toISOString();
                                  let d = new Date(dataStr);
                                  if (isNaN(d.getTime()) && typeof dataStr === 'string' && dataStr.includes('/')) {
                                    const parts = dataStr.split('/');
                                    if (parts.length === 3) d = new Date(parts[2], parseInt(parts[1])-1, parts[0]);
                                  }
                                  if (isNaN(d.getTime())) d = new Date();
                                  const m = (d.getMonth() + 1).toString().padStart(2, '0');
                                  const y = d.getFullYear().toString();
                                  
                                  if (listFiltroMes !== 'todos' && m !== listFiltroMes) return false;
                                  if (listFiltroAno !== 'todos' && y !== listFiltroAno) return false;
                                  
                                  return true;`;

content = content.replace(oldFilterRegex, newFilterLogic);

// 4. In `SelectFilter` options for Ano, it was hardcoded:
// options={[{value: 'todos', label: 'Todos'}, {value: '2024', label: '2024'}, {value: '2025', label: '2025'}, {value: '2026', label: '2026'}]}
// Let's replace with the dynamic `anos` variable!
content = content.replace(
  /options=\{\[\{value: 'todos', label: 'Todos'\}, \{value: '2024', label: '2024'\}, \{value: '2025', label: '2025'\}, \{value: '2026', label: '2026'\}\]\}/g,
  "options={[{value: 'todos', label: 'Todos'}, ...anos.map(a => ({value: a, label: a}))]}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed dynamic years and normalized accents in filters');
