const fs = require('fs');
const file = 'app/compras/faturas-sap/client.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { TimeDetailsModal }')) {
  content = content.replace('import { TransferModal } from "@/components/faturas/TransferModal";', 
    'import { TransferModal } from "@/components/faturas/TransferModal";\nimport { TimeDetailsModal } from "@/components/faturas/TimeDetailsModal";');
}

if (!content.includes('selectedStage')) {
  content = content.replace('const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);',
    'const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);\n  const [selectedStage, setSelectedStage] = useState<{fatura: any, stage: string} | null>(null);');
}

// Now replace onClick in cards
// They currently have: onClick={(e) => ...} ? No, they don't have onClick! They have `cursor-pointer group` or similar.
// Wait, they look like this: `<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">`
// Let's replace the opening divs of each card to include onClick={() => setSelectedStage({ fatura: f, stage: 'T1' })}

content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T1<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T1\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">$1>T1</div>'
);

content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T2<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T2\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">$1>T2</div>'
);

content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">([\s\S]*?)>T3<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T3\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">$1>T3</div>'
);

// T4 SAP (cyan)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T4<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T4\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group">$1>T4</div>'
);

// T5 SAP (slate)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T5<\/div>/g,
  function(match, p1) { return '<div onClick={() => setSelectedStage({fatura: f, stage: \'T5\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">' + p1 + '>T5</div>'; }
);

// wait, T5 SAP is matched, what about T2 Nexa which is also slate but it's T2?
// T2 Nexa (slate)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T2<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T2\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">$1>T2</div>'
);

// T6 SAP (amber)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T6<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T6\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">$1>T6</div>'
);

// T3 Nexa (amber)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T3<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T3\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">$1>T3</div>'
);


// T7 SAP (green)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T7<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T7\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">$1>T7</div>'
);

// T4 Nexa (green)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">([\s\S]*?)>T4<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T4\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">$1>T4</div>'
);

// T1 Nexa (cyan)
content = content.replace(
  /<div className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">([\s\S]*?)>T1<\/div>/,
  '<div onClick={() => setSelectedStage({fatura: f, stage: \'T1\'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">$1>T1</div>'
);

// Now append the modal
if (!content.includes('<TimeDetailsModal')) {
  content = content.replace('</main>',
    `  <TimeDetailsModal 
        isOpen={!!selectedStage} 
        onClose={() => setSelectedStage(null)} 
        fatura={selectedStage?.fatura || null} 
        stage={selectedStage?.stage || null} 
      />\n    </main>`);
}

fs.writeFileSync(file, content);
console.log('Done replacing');
