const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/new Date\(parts\[2\], parseInt\(parts\[1\]\)-1, parts\[0\]\)/g, 'new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]))');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed parseInt TS errors for dates');
