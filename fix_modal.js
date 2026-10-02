const fs = require('fs');

let modal = fs.readFileSync('components/faturas/FaturaModal.tsx', 'utf8');
modal = modal.replace(/Cadastro da NF/g, 'Cadastro do Documento');
modal = modal.replace(/Aguardando emissão de NF/g, 'Aguardando emissão de Documento');
fs.writeFileSync('components/faturas/FaturaModal.tsx', modal);

console.log("Fixed FaturaModal.tsx types.");
