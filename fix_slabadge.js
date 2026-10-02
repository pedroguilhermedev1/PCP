const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = "endDate.includes('T') ? (endDate.split('T')[1].startsWith('00:00:00') ? endDate.split('T')[0].split('-').reverse().join('/') : endDate.split('T')[0].split('-').reverse().join('/') + ' ' + endDate.split('T')[1].substring(0, 5)) : endDate.split('-').reverse().join('/')";
const replacementStr = "endDate.split('T')[0].split('-').reverse().join('/')";

content = content.replace(targetStr, replacementStr);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed SlaBadge date formatting');
