const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// The issue is:
// {!autoStatus.includes('Pago') && (
//   {/* Botoes Ocorrencia T1 */}
//   <div ...

// We will swap them:
content = content.replace(/\{\!autoStatus\.includes\('Pago'\) && \(\n\s*\{\/\* Botoes Ocorrencia T1 \*\/\}/g, "{/* Botoes Ocorrencia T1 */}\n  {!autoStatus.includes('Pago') && (");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed comment inside JSX expression');
