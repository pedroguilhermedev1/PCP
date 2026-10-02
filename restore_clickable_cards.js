const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaDetailsModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// T1 - SAP
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between">/g,
  '<div className="relative p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-purple-50/30" onClick={() => setSelectedStage({fatura, stage: "T1"})}>'
);

// T1 - Nexa
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-cyan-200 shadow-sm flex flex-col justify-between">/g,
  '<div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-cyan-50/30" onClick={() => setSelectedStage({fatura, stage: "T1"})}>'
);

// T2 - Fiscal
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">/g,
  '<div className="relative p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-blue-50/30" onClick={() => setSelectedStage({fatura, stage: "T2"})}>'
);

// T3/T4 - Pagamento
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">/g,
  '<div className="relative p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-slate-50/30" onClick={() => setSelectedStage({fatura, stage: "T3"})}>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Restored clickable cards in FaturaDetailsModal');
