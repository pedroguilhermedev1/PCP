const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaDetailsModal.tsx', 'utf8');
const helper = `\nconst formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'S/ Data';
  const parts = dateStr.split('T');
  const d = parts[0].split('-').reverse().join('/');
  if (parts[1] && !parts[1].startsWith('00:00:00')) {
    return d + ' ' + parts[1].substring(0, 5);
  }
  return d;
};\n`;
const lastImport = c.lastIndexOf('import ');
const endOfLastImport = c.indexOf('\n', lastImport);
c = c.substring(0, endOfLastImport + 1) + helper + c.substring(endOfLastImport + 1);
fs.writeFileSync('components/faturas/FaturaDetailsModal.tsx', c);
