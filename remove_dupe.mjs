const fs = require('fs');
const file = 'components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `<section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Fornecedor</label>`;

const endStr = `<section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações Gerais</label>`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx > -1 && endIdx > -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
  fs.writeFileSync(file, content);
  console.log("Successfully removed duplicate section!");
} else {
  console.log("Could not find markers", startIdx, endIdx);
}
