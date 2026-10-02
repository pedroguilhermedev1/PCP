const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix double wrapper for "Devolver para..."
const badPattern = /\{\!autoStatus\.includes\('Pago'\) && \(\n\s*\{\!autoStatus\.includes\('Pago'\) && \(/g;
content = content.replace(badPattern, `{!autoStatus.includes('Pago') && (`);

const doubleClosing = /\)\}\n\s*\)\}/g;
// actually wait, let's just do a string replace of the exact duplicated block

// We can just undo the double wrapping by replacing:
content = content.replace(/\{\!autoStatus\.includes\('Pago'\) && \(\n\s*\{\!autoStatus\.includes\('Pago'\) && \(/g, `{!autoStatus.includes('Pago') && (`);
content = content.replace(/\n\s*\)\}\n\s*\)\}/g, `\n)}`);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed double wrapping');
