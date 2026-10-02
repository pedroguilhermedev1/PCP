const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/f\.data_abertura/g, '(f as any).data_abertura');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed f.data_abertura TS error');
