const fs = require('fs');
const file = 'components/faturas/FaturaDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const newFlowBlock = `                                  {fatura.fluxo_iniciado_por !== 'Nexa' ? (
                                    <>
                                      {/* T1 - SAP */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T1'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                                        <span className="text-[11px] font-bold text-purple-800 uppercase block mb-2 mt-1">SAP (RC, Aprovação, PC)</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.pedido_sap || fatura.rc_sap || 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{(fatura.data_pedido_sap || fatura.data_rc_sap)?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T2 - Nexa */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T2'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T2</div>
                                        <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-2 mt-1">Nexa</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_chamado || (fatura.nexa_anexada ? 'Anexada' : 'Pendente')}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_envio?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T3 - Fiscal */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T3'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 mt-1">Fiscal</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T4 - Pagamento */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T4'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-2 mt-1">Pagamento (Prog + Real)</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_pagamento_realizado ? 'Pago' : (fatura.nexa_pagamento_programado ? 'Programado' : 'Pendente')}</span>
                                          <span className="text-[10px] text-zinc-500">{(fatura.data_pagamento_real || fatura.nexa_data_prevista_pagamento)?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* T1 - Nexa */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T1'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                                          <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-2 mt-1">Nexa / Solicitação</span>
                                          <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-zinc-900">{fatura.nexa_chamado || 'Pendente'}</span>
                                            <span className="text-[10px] text-zinc-500">{fatura.nexa_data_envio?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* T2 - Requisição */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T2'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T2</div>
                                        <span className="text-[11px] font-bold text-blue-700 uppercase block mb-2 mt-1">Requisição / Pedido (Nexa)</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.numero_pc_nexa || fatura.nexa_rc_numero || 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{(fatura.data_pc_nexa || fatura.nexa_rc_data)?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T3 - Fiscal */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T3'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 mt-1">Fiscal</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T4 - Pagamento */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T4'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-2 mt-1">Pagamento (Prog + Real)</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_pagamento_realizado ? 'Pago' : (fatura.nexa_pagamento_programado ? 'Programado' : 'Pendente')}</span>
                                          <span className="text-[10px] text-zinc-500">{(fatura.data_pagamento_real || fatura.nexa_data_prevista_pagamento)?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>
                                    </>
                                  )}`;

const startStr = "{fatura.fluxo_iniciado_por !== 'Nexa' ? (";
const endStr = ")}";

const idx1 = content.indexOf(startStr);
// We need to find the correct ending ")}".
// The safest way is to replace up to the div closure before "</div>"
// The block is inside <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
const gridStart = content.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">');
if (gridStart > -1) {
    const afterGrid = content.indexOf('</div>', gridStart + 80);
    // Find the ending ')}' right before afterGrid
    const blockEnd = content.lastIndexOf(')}', afterGrid);
    if (blockEnd > -1) {
        content = content.substring(0, idx1) + newFlowBlock + content.substring(blockEnd + 2);
    }
}

fs.writeFileSync(file, content);
console.log("Details UI replaced!");
