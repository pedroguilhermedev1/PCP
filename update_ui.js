const fs = require('fs');

const file = 'components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const newUI_SAP = `            {formData.fluxo_iniciado_por === 'SAP' && (
              <div className="space-y-4 pt-4 border-t border-zinc-200">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Fluxo de Trabalho (SAP)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {/* T1 - SAP */}
                  <div className="relative p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 transition-all shadow-sm">
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                    <span className="text-[11px] font-bold text-purple-800 uppercase block mb-3 mt-1">SAP (RC, Aprovação, PC)</span>
                    <div className="space-y-4">
                      {/* RC Block */}
                      <div className="space-y-3 pb-3 border-b border-purple-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número RC</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.rc_sap || ""} onChange={handleInputChange('rc_sap')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Criação RC</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.data_rc_sap || ""} onChange={handleInputChange('data_rc_sap')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Responsável RC</label>
                          <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.responsavel_t1 || '')} readOnly />
                        </div>
                      </div>
                      
                      {/* Aprovação Block */}
                      <div className="space-y-3 pb-3 border-b border-purple-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data da Aprovação</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.data_aprovacao || ""} onChange={handleInputChange('data_aprovacao')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Aprovadores</label>
                          <MultiSelectResponsavel value={formData.responsavel_t2 || ""} onChange={(val) => setFormData(prev => ({...prev, responsavel_t2: val}))} options={RESPONSAVEIS_LIST} />
                        </div>
                      </div>

                      {/* PC Block */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nº do Pedido (PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.pedido_sap || ""} onChange={handleInputChange('pedido_sap')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data do Pedido</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.data_pedido_sap || ""} onChange={handleInputChange('data_pedido_sap')} />
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group mt-2">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-emerald-600 transition-colors">Doc Subsequente?</span>
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                            checked={!!formData.doc_subsequente_criado}
                            onChange={(e) => handleChange('doc_subsequente_criado', e.target.checked)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* T2 - Nexa */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.doc_subsequente_criado ? "border-cyan-200 hover:border-cyan-300" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T2</div>
                      <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-3 mt-1">Nexa</span>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chamado / Ticket</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Abertura Nexa</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.nexa_data_envio || ""} onChange={handleInputChange('nexa_data_envio')} />
                        </div>
                        {/* Pendencies handling generic inputs below */}
                      </div>
                      <SlaBadge startDate={formData.data_pedido_sap} endDate={formData.nexa_data_envio} slaDias={1} />
                    </div>
                    {/* T2 Checks */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-cyan-600 transition-colors">NF Emitida?</span>
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                          checked={!!formData.nexa_emitiu_nf}
                          onChange={(e) => handleChange('nexa_emitiu_nf', e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-cyan-600 transition-colors">NF Anexada?</span>
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                          checked={!!formData.nexa_anexada}
                          onChange={(e) => handleChange('nexa_anexada', e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* T3 - Fiscal */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_anexada ? "border-slate-300 hover:border-slate-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                      <span className="text-[11px] font-bold text-slate-800 uppercase block mb-3 mt-1">Fiscal</span>
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
                          <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento Concluído?</span>
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
                    <div className="mt-4">
                      <SlaBadge startDate={formData.nexa_data_envio} endDate={formData.nexa_data_conclusao_lancamento} slaDias={3} />
                    </div>
                  </div>

                  {/* T4 - Pagamento */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_lancamento_concluido ? "border-green-300 hover:border-green-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                      <span className="text-[11px] font-bold text-green-800 uppercase block mb-3 mt-1">Pagamento (Prog + Real)</span>
                      
                      {/* Programação Block */}
                      <div className="space-y-3 pb-3 border-b border-green-100">
                        <label className="flex items-center gap-2 cursor-pointer group">
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
                      </div>

                      {/* Pagamento Block */}
                      <div className="space-y-3 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
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
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

const newUI_NEXA = `            {formData.fluxo_iniciado_por === 'Nexa' && (
              <div className="space-y-4 pt-4 border-t border-zinc-200 mb-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Fluxo de Trabalho (Nexa Direto)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
                  {/* T1 - Nexa */}
                  <div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                      <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-3 mt-1">Nexa / Solicitação</span>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chamado / Ticket</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Abertura</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.nexa_data_envio || ""} onChange={handleInputChange('nexa_data_envio')} />
                        </div>
                      </div>
                      <div className="space-y-1 mt-3 border-t border-zinc-100 pt-3">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Responsável</label>
                        <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.responsavel_t1 || '')} readOnly />
                      </div>
                    </div>
                  </div>

                  {/* T2 - Requisicao / Pedido */}
                  <div className="relative p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T2</div>
                    <span className="text-[11px] font-bold text-blue-800 uppercase block mb-3 mt-1">Requisição / Pedido (Nexa)</span>
                    <div className="space-y-4">
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            checked={!!formData.nexa_possui_rc}
                            onChange={(e) => handleChange('nexa_possui_rc', e.target.checked)}
                          />
                          <span className="text-[10px] font-bold text-blue-700 uppercase">Possui RC?</span>
                        </label>
                        {formData.nexa_possui_rc && (
                          <div className="pl-6 space-y-2 border-l-2 border-blue-100 ml-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número RC</label>
                              <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_rc_numero || formData.rc_sap || ""} onChange={handleInputChange('nexa_rc_numero')} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data RC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.nexa_rc_data || formData.data_rc_sap || ""} onChange={handleInputChange('nexa_rc_data')} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-zinc-100">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                            checked={!!formData.pc_nexa_concluido}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                pc_nexa_concluido: checked,
                                data_pc_nexa: checked && !prev.data_pc_nexa ? new Date().toISOString().split('T')[0] : prev.data_pc_nexa,
                                usuario_pc_nexa: checked && !prev.usuario_pc_nexa ? (localStorage.getItem('pcp_user') || '') : prev.usuario_pc_nexa
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Possui PC?</span>
                        </label>
                        {formData.pc_nexa_concluido && (
                          <div className="pl-6 space-y-2 border-l-2 border-emerald-100 ml-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número PC</label>
                              <Input className="h-7 text-xs border-zinc-200" value={formData.numero_pc_nexa || ""} onChange={handleInputChange('numero_pc_nexa')} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data PC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={formData.data_pc_nexa || ""} onChange={handleInputChange('data_pc_nexa')} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* T3 - Fiscal */}
                  <div className="relative p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
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
                    <div className="mt-4">
                      <SlaBadge startDate={formData.nexa_data_envio} endDate={formData.nexa_data_conclusao_lancamento} slaDias={1} />
                    </div>
                  </div>

                  {/* T4 - Pagamento */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_lancamento_concluido ? "border-green-300 hover:border-green-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                      <span className="text-[11px] font-bold text-green-800 uppercase block mb-3 mt-1">Pagamento (Prog + Real)</span>
                      
                      {/* Programação */}
                      <div className="space-y-3 pb-3 border-b border-green-100">
                        <label className="flex items-center gap-2 cursor-pointer group">
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
                      </div>

                      {/* Pagamento */}
                      <div className="space-y-3 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
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
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

// Replacements

const startIdx_SAP = content.indexOf("{formData.fluxo_iniciado_por === 'SAP' && (");
const endIdx_SAP = content.indexOf("{formData.fluxo_iniciado_por === 'Nexa' && (");

if (startIdx_SAP > -1 && endIdx_SAP > -1) {
  content = content.substring(0, startIdx_SAP) + newUI_SAP + "\n\n            " + content.substring(endIdx_SAP);
} else {
  console.log("Could not find SAP block boundaries.");
}

const startIdx_Nexa = content.indexOf("{formData.fluxo_iniciado_por === 'Nexa' && (");
const endIdx_Nexa = content.indexOf("<section className=\"space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm\">", startIdx_Nexa);

if (startIdx_Nexa > -1 && endIdx_Nexa > -1) {
  content = content.substring(0, startIdx_Nexa) + newUI_NEXA + "\n\n            " + content.substring(endIdx_Nexa);
} else {
  console.log("Could not find Nexa block boundaries.");
}

fs.writeFileSync(file, content);
console.log("Successfully replaced both blocks!");
