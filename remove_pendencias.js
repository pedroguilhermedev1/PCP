const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Regex to find and remove the Pendencias section completely
// It starts with {/* Secao de Pendencias */} and ends before {/* Modal de Ocorrencia */}
const regexPendencias = /\{\/\* Secao de Pendencias \*\/\}\s*<section[\s\S]*?<\/section>/g;
content = content.replace(regexPendencias, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Removed legacy pendencias section');
