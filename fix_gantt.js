const fs = require('fs');

let gantt = fs.readFileSync('components/faturas/FaturasGantt.tsx', 'utf8');
gantt = gantt.replace(/Cadastro da NF/g, 'Cadastro do Documento');
gantt = gantt.replace(/Aguardando emissão de NF/g, 'Aguardando emissão de Documento');
fs.writeFileSync('components/faturas/FaturasGantt.tsx', gantt);

console.log("Fixed FaturasGantt.tsx types.");
