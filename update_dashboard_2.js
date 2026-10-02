const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename 'faturas viáveis', 'faturas em risco', 'faturas perdidas'
content = content.replace(/faturas viáveis/g, 'faturas no prazo');
content = content.replace(/faturas em risco/g, 'faturas em alerta');
content = content.replace(/faturas perdidas/g, 'faturas atrasadas');

// 2. Add Filters above the Fatura List table
const listFiltersJSX = `
                      <div className="p-4 border-b border-zinc-100 flex flex-wrap gap-4 items-end bg-white">
                        <SelectFilter label="CD" value={listFiltroCD} onChange={setListFiltroCD} options={[{value: 'todos', label: 'Todos'}, ...uniqueCDs.map(cd => ({value: cd, label: cd}))]} />
                        <SelectFilter label="Responsável" value={listFiltroResp} onChange={setListFiltroResp} options={[{value: 'todos', label: 'Todos'}, ...Array.from(new Set(faturas.map(f => f.responsavel).filter(Boolean))).map(r => ({value: r, label: formatUserName(r)}))]} />
                        <SelectFilter label="Mês" value={listFiltroMes} onChange={setListFiltroMes} options={[{value: 'todos', label: 'Todos'}, {value: '01', label: 'Janeiro'}, {value: '02', label: 'Fevereiro'}, {value: '03', label: 'Março'}, {value: '04', label: 'Abril'}, {value: '05', label: 'Maio'}, {value: '06', label: 'Junho'}, {value: '07', label: 'Julho'}, {value: '08', label: 'Agosto'}, {value: '09', label: 'Setembro'}, {value: '10', label: 'Outubro'}, {value: '11', label: 'Novembro'}, {value: '12', label: 'Dezembro'}]} />
                        <SelectFilter label="Ano" value={listFiltroAno} onChange={setListFiltroAno} options={[{value: 'todos', label: 'Todos'}, {value: '2024', label: '2024'}, {value: '2025', label: '2025'}, {value: '2026', label: '2026'}]} />
                      </div>
`;

// Insert the filters inside the `<div className="mt-8 mb-8 bg-white ...">` just before `<div className="overflow-x-auto">`
// Wait, I need to filter the `filteredFaturas` using these list filters.
// I'll create a `filteredListFaturas` variable right before returning the JSX, or I can just filter inline.
// Inline filter:
const listFilterFunction = `filteredFaturas.filter(f => {
                              if (listFiltroCD !== 'todos' && f.cd !== listFiltroCD) return false;
                              if (listFiltroResp !== 'todos' && f.responsavel !== listFiltroResp) return false;
                              if (listFiltroMes !== 'todos' && f.mes !== listFiltroMes) return false;
                              if (listFiltroAno !== 'todos' && f.ano !== listFiltroAno) return false;
                              return true;
                            })`;

content = content.replace(
  /\{filteredFaturas\.map\(f => \{/g,
  `{${listFilterFunction}.map(f => {`
);

content = content.replace(
  /<span className="text-xs font-medium text-zinc-500">\{filteredFaturas\.length\} faturas encontradas<\/span>\s*<\/div>\s*<div className="overflow-x-auto">/g,
  `<span className="text-xs font-medium text-zinc-500">{${listFilterFunction}.length} faturas encontradas</span>\n                      </div>\n${listFiltersJSX}\n                      <div className="overflow-x-auto">`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Processed dashboard part 2');
