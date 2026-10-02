const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<PendenciasNotification \/>/g, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Removed PendenciasNotification from layout');
