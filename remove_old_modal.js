const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /\{selectedViewFatura && \(\s*<FaturaDetailsModal fatura=\{selectedViewFatura\} onClose=\{\(\) => setSelectedViewFatura\(null\)\} \/>\s*\)\}/g,
  ''
);

fs.writeFileSync(path, content, 'utf8');
console.log('Removed selectedViewFatura modal block');
