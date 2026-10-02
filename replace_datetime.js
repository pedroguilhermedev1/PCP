const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace type="datetime-local" with type="date"
content = content.replace(/type="datetime-local"/g, 'type="date"');

// Replace .substring(0, 16) with .substring(0, 10)
content = content.replace(/\.substring\(0, 16\)/g, '.substring(0, 10)');

// Note: SlaBadge also formats dates, but it natively handles standard date formats, and if it has a time, it cuts it off, or we can check SlaBadge implementation in FaturaSAPModal.tsx
// wait, let's see how SlaBadge is implemented
fs.writeFileSync(path, content, 'utf8');
console.log('Replaced all datetime-local with date in FaturaSAPModal.tsx');
