const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaDetailsModal.tsx', 'utf8');

// We want to replace `split('-').reverse().join('/')`
// with `split('T')[0].split('-').reverse().join('/')` in FaturaDetailsModal to strip the time part,
// or we can show the time part if it exists!
// Let's create a small helper at the top:
if (!c.includes('formatDateDisplay')) {
    const helper = `\nconst formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'S/ Data';
  const parts = dateStr.split('T');
  const d = parts[0].split('-').reverse().join('/');
  if (parts[1] && !parts[1].startsWith('00:00:00')) {
    return d + ' ' + parts[1].substring(0, 5);
  }
  return d;
};\n\n`;
    c = c.replace('export default function FaturaDetailsModal', helper + 'export default function FaturaDetailsModal');
}

// Now replace all occurrences of `?.split('-').reverse().join('/') || 'S/ Data'` with ` ? formatDateDisplay(...) : 'S/ Data'`
// It's easier to just use a regex
// e.g. `{fatura.data_emissao?.split('-').reverse().join('/')}` -> `{formatDateDisplay(fatura.data_emissao)}`
// `{(fatura.data_pagamento_real || fatura.nexa_data_prevista_pagamento)?.split('-').reverse().join('/') || 'S/ Data'}` -> `{formatDateDisplay(fatura.data_pagamento_real || fatura.nexa_data_prevista_pagamento)}`

c = c.replace(/\{([a-zA-Z0-9_.|() ]+)\?\.split\('-\'\)\.reverse\(\)\.join\('\/'\)( \|\| 'S\/ Data')?\}/g, "{formatDateDisplay($1)}");
c = c.replace(/\{([a-zA-Z0-9_.|() ]+)\?.split\('-\'\).reverse\(\).join\('\/'\)\}/g, "{formatDateDisplay($1)}");

fs.writeFileSync('components/faturas/FaturaDetailsModal.tsx', c);
console.log("Updated FaturaDetailsModal formatting");
