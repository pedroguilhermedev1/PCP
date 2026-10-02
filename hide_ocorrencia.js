const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const genericPattern = /\{\/\* Botoes Ocorrencia T\d \*\/\}\s*<div className="mt-4 pt-3 border-t[^>]+>\s*<Button[^>]+Nova Ocorr[^>]+>.*Nova Ocorr.*<\/Button>\s*<\/div>/g;
content = content.replace(genericPattern, match => `{!autoStatus.includes('Pago') && (\n  ${match.replace(/\n/g, '\n  ')}\n)}`);

const devolverPattern = /<Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick=\{\(\) => \{\s*const newOc = \[\.\.\.\(formData\.ocorrencias \|\| \[\]\)\];\s*const idx = newOc\.findIndex\(x => x\.id === oc\.id\);\s*newOc\[idx\]\.status = 'Pendente Origem';\s*setFormData\(\{\.\.\.formData, ocorrencias: newOc\}\);\s*\}\}>Devolver para \{oc\.t_origem\}<\/Button>/g;
content = content.replace(devolverPattern, match => `{!autoStatus.includes('Pago') && (\n  ${match}\n)}`);

fs.writeFileSync(path, content, 'utf8');
console.log('Blocked ocorrencia buttons if paid');
