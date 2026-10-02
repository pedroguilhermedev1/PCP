const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexNovaOcorrencia = /\{\/\* Botoes Ocorrencia T1 \*\/\}\s*<div className="mt-4 pt-3 border-t border-[a-z]+-100 flex justify-end">\s*<Button type="button" variant="ghost" size="sm" className="text-\[10px\] h-7 text-red-500 hover:bg-red-50" onClick=\{\(\) => setOcorrenciaModal\(\{isOpen: true, t_origem: '(T[1-4])'\}\)\}>[^<]+<\/Button>\s*<\/div>/g;

content = content.replace(regexNovaOcorrencia, (match) => {
  return `{!autoStatus.includes('Pago') && (\n  ${match.replace(/\n/g, '\n  ')}\n)}`;
});

const regexDevolver = /<Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick=\{\(\) => \{\s*const newOc = \[\.\.\.\(formData\.ocorrencias \|\| \[\]\)\];\s*const idx = newOc\.findIndex\(x => x\.id === oc\.id\);\s*newOc\[idx\]\.status = 'Pendente Origem';\s*setFormData\(\{\.\.\.formData, ocorrencias: newOc\}\);\s*\}\}>Devolver para \{oc\.t_origem\}<\/Button>/g;

content = content.replace(regexDevolver, (match) => {
  return `{!autoStatus.includes('Pago') && (\n  ${match.replace(/\n/g, '\n  ')}\n)}`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Finished hiding occurrence buttons');
