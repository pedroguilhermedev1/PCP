const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Eye import
content = content.replace(
  /BarChart2, Moon, Sun \} from "lucide-react";/,
  'BarChart2, Moon, Sun, Eye } from "lucide-react";'
);

// Add FaturaDetailsModal import if not exists
if (!content.includes('FaturaDetailsModal')) {
  content = content.replace(
    /import \{ FaturasGantt \} from "@\/components\/faturas\/FaturasGantt";/,
    'import { FaturasGantt } from "@/components/faturas/FaturasGantt";\nimport { FaturaDetailsModal } from "@/components/faturas/FaturaDetailsModal";'
  );
}

// Add state for selectedViewFatura
if (!content.includes('selectedViewFatura')) {
  content = content.replace(
    /const \[activeTab, setActiveTab\] = useState\('operacional'\);/,
    "const [activeTab, setActiveTab] = useState('operacional');\n  const [selectedViewFatura, setSelectedViewFatura] = useState<Fatura | null>(null);"
  );
}

// Add the table after Gantt
const listJSX = `
                    {/* Lista de Faturas em vez do Gantt */}
                    <div className="mt-8 mb-8 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-800 uppercase">Lista de Faturas</h3>
                        <span className="text-xs font-medium text-zinc-500">{filteredFaturas.length} faturas encontradas</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase border-b border-zinc-200">
                            <tr>
                              <th className="px-4 py-3">Documento</th>
                              <th className="px-4 py-3">Fornecedor</th>
                              <th className="px-4 py-3">Responsável</th>
                              <th className="px-4 py-3">Etapa Atual</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {filteredFaturas.map(f => {
                              const s = calcularStatus(f);
                              return (
                              <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-zinc-900">{f.numero_documento || f.codigo_fatura}</td>
                                <td className="px-4 py-3 text-zinc-600">{f.fornecedor}</td>
                                <td className="px-4 py-3 text-zinc-600">{f.responsavel}</td>
                                <td className="px-4 py-3"><span className="px-2 py-1 bg-zinc-100 rounded text-xs text-zinc-700 font-medium">{f.etapa || 'Pendente'}</span></td>
                                <td className="px-4 py-3">
                                  <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                                    s.includes('Pago') ? "bg-emerald-100 text-emerald-800" :
                                    s === 'Vencido' ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                  )}>
                                    {s}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button 
                                    onClick={() => setSelectedViewFatura(f)} 
                                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                    title="Visualizar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
`;

content = content.replace(
  /\{\/\* 4\. Gantt Operacional \*\/\}\s*<div className="mt-8 mb-8">\s*<div className="hidden">\s*<FaturasGantt faturas=\{filteredFaturas\} flowType="2\.0" \/>\s*<\/div>\s*<\/div>/,
  `{/* 4. Gantt Operacional */}\n                    <div className="mt-8 mb-8">\n                      <div className="hidden">\n                        <FaturasGantt faturas={filteredFaturas} flowType="2.0" />\n                      </div>\n                    </div>\n${listJSX}`
);

// Add the modal at the very end before closing the main div
if (!content.includes('<FaturaDetailsModal')) {
  content = content.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*$/g,
    `\n        {selectedViewFatura && (\n          <FaturaDetailsModal fatura={selectedViewFatura} onClose={() => setSelectedViewFatura(null)} />\n        )}\n      </div>\n    </div>\n  </div>\n`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Added fatura list to dashboard');
