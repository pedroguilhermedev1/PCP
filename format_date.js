const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

const target = "Concluído em: {endDate.split('-').reverse().join('/')}";
const replacement = "Concluído em: {endDate.includes('T') ? (endDate.split('T')[1].startsWith('00:00:00') ? endDate.split('T')[0].split('-').reverse().join('/') : endDate.split('T')[0].split('-').reverse().join('/') + ' ' + endDate.split('T')[1].substring(0, 5)) : endDate.split('-').reverse().join('/')}";

c = c.replace(target, replacement);

fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', c);
console.log("Updated endDate formatting in FaturaSAPModal.tsx");
