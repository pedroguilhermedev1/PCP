const fs = require('fs');
const file = 'components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const newUI = `            {formData.fluxo_iniciado_por === 'Nexa' && (
              <div className="space-y-4 pt-4 border-t border-zinc-200 mb-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Fluxo de Trabalho (Nexa Direto)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {/* T1 */}
                  <div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                      <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-3 mt-1">Solicitação Nexa</span>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chamado / Ticket</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Envio</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.nexa_data_envio || ""} onChange={handleInputChange('nexa_data_envio')} />
                        </div>
                      </div>
                    </div>
                    {/* PC Nexa Info */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-cyan-600 transition-colors">PC Nexa Concluído?</span>
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                          checked={!!formData.pc_nexa_concluido}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              pc_nexa_concluido: checked,
                              data_pc_nexa: checked ? new Date().toISOString().split('T')[0] : prev.data_pc_nexa,
                              usuario_pc_nexa: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_pc_nexa
                            }));
                          }}
                        />
                      </label>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número PC</label>
                        <Input className="h-7 text-xs border-zinc-200" value={formData.numero_pc_nexa || ""} onChange={handleInputChange('numero_pc_nexa')} placeholder="Pendente" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data PC</label>
                        <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.data_pc_nexa || ""} onChange={handleInputChange('data_pc_nexa')} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Usuário PC</label>
                        <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.usuario_pc_nexa || '')} readOnly />
                      </div>
                    </div>
                  </div>

                  {/* T2 */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm", formData.pc_nexa_concluido ? "border-slate-200 hover:border-slate-300" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T2</div>
                    <span className="text-[11px] font-bold text-slate-800 uppercase block mb-3 mt-1">Lançamento Fiscal</span>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer group pb-1 border-b border-zinc-100">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-zinc-300 text-slate-600 focus:ring-slate-500"
                          checked={!!formData.nexa_lancamento_concluido}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              nexa_lancamento_concluido: checked,
                              nexa_data_conclusao_lancamento: checked ? new Date().toISOString().split('T')[0] : prev.nexa_data_conclusao_lancamento,
                              usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                            }));
                          }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Concluído?</span>
                      </label>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Conclusão</label>
                        <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.nexa_data_conclusao_lancamento || ""} onChange={handleInputChange('nexa_data_conclusao_lancamento')} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Usuário</label>
                        <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.usuario_nexa_lancamento || '')} readOnly />
                      </div>
                    </div>
                  </div>

                  {/* T3 */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm", formData.nexa_lancamento_concluido ? "border-amber-200 hover:border-amber-300" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-amber-50 rounded-full border border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-700">T3</div>
                    <span className="text-[11px] font-bold text-amber-800 uppercase block mb-3 mt-1">Prog. Pagamento</span>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer group pb-1 border-b border-zinc-100">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                          checked={!!formData.nexa_pagamento_programado}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              nexa_pagamento_programado: checked,
                              usuario_nexa_programacao: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_programacao
                            }));
                          }}
                        />
                        <span className="text-[10px] font-bold text-amber-700 uppercase group-hover:text-amber-900 transition-colors">Programado?</span>
                      </label>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Prevista</label>
                        <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.nexa_data_prevista_pagamento || ""} onChange={handleInputChange('nexa_data_prevista_pagamento')} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Usuário</label>
                        <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.usuario_nexa_programacao || '')} readOnly />
                      </div>
                    </div>
                  </div>

                  {/* T4 */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_pagamento_programado ? "border-green-300 hover:border-green-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                      <span className="text-[11px] font-bold text-green-800 uppercase block mb-3 mt-1">Pagamento Realizado</span>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer group pb-1 border-b border-zinc-100">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                            checked={!!formData.nexa_pagamento_realizado}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                nexa_pagamento_realizado: checked,
                                data_pagamento_real: checked ? new Date().toISOString().split('T')[0] : prev.data_pagamento_real,
                                usuario_nexa_pagamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_pagamento
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-green-700 uppercase group-hover:text-green-900 transition-colors">Pago?</span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Pagamento</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.data_pagamento_real || ""} onChange={handleInputChange('data_pagamento_real')} />
                        </div>
                      </div>
                    </div>
                    {/* Final */}
                    <div className="mt-4 pt-3 border-t border-zinc-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                        <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

const startIdx = content.indexOf("{formData.fluxo_iniciado_por === 'Nexa' && (");
const endIdx = content.indexOf('<section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">');

if (startIdx > -1 && endIdx > -1) {
  content = content.substring(0, startIdx) + newUI + "\n\n            " + content.substring(endIdx);
  fs.writeFileSync(file, content);
  console.log("Successfully replaced Nexa block!");
} else {
  console.log("Could not find Nexa block boundaries.");
}
