const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaDetailsModal.tsx', 'utf8');
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
    c = c.replace('export function FaturaDetailsModal', helper + 'export function FaturaDetailsModal');
    fs.writeFileSync('components/faturas/FaturaDetailsModal.tsx', c);
    console.log('Fixed FaturaDetailsModal');
}
