const fs = require('fs');
let modal = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

// T1 SAP RC Block
modal = modal.replace(
`                      {/* RC Block */}
                      <div className="mb-2"><SlaBadge startDate={formData.data_recebimento} endDate={formData.data_rc_sap} slaDias={1} /></div>
                      <div className="space-y-3 pb-3 border-b border-purple-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Número RC</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.nexa_data_envio} endDate={formData.nexa_rc_data || formData.data_rc_sap} slaDias={1} /></span></label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.rc_sap || ""} onChange={handleInputChange('rc_sap')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Criação RC</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_rc_sap || "").substring(0, 10)} onChange={handleInputChange('data_rc_sap')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Responsável RC</label>
                          <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.responsavel_t1 || '')} readOnly />
                        </div>
                      </div>`,
`                      {/* RC Block */}
                      <div className="space-y-3 pb-3 border-b border-purple-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (RC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.rc_data_inicio || "").substring(0, 16)} onChange={handleInputChange('rc_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Número RC</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.rc_data_inicio} endDate={formData.rc_data_fim} slaDias={1} /></span></label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.rc_sap || ""} onChange={handleInputChange('rc_sap')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (RC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.rc_data_fim || "").substring(0, 16)} onChange={handleInputChange('rc_data_fim')} />
                        </div>
                      </div>`
);

// T1 SAP Aprovação Block
modal = modal.replace(
`                      {/* Aprovação Block */}
                      <div className="mb-2"><SlaBadge startDate={formData.data_rc_sap} endDate={formData.data_aprovacao} slaDias={1} /></div>
                      <div className="space-y-3 pb-3 border-b border-purple-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data da Aprovação</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_aprovacao || "").substring(0, 10)} onChange={handleInputChange('data_aprovacao')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Aprovadores</label>
                          <MultiSelectResponsavel value={formData.responsavel_t2 || ""} onChange={(val) => setFormData(prev => ({...prev, responsavel_t2: val}))} options={RESPONSAVEIS_LIST} />
                        </div>
                      </div>`,
`                      {/* Aprovação Block */}
                      <div className="space-y-3 pb-3 border-b border-purple-100 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Aprovação)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.aprovacao_data_inicio || "").substring(0, 16)} onChange={handleInputChange('aprovacao_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Aprovadores</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.aprovacao_data_inicio} endDate={formData.aprovacao_data_fim} slaDias={1} /></span></label>
                          <MultiSelectResponsavel value={formData.responsavel_t2 || ""} onChange={(val) => setFormData(prev => ({...prev, responsavel_t2: val}))} options={RESPONSAVEIS_LIST} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Aprovação)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.aprovacao_data_fim || "").substring(0, 16)} onChange={handleInputChange('aprovacao_data_fim')} />
                        </div>
                      </div>`
);

// T1 SAP PC Block
modal = modal.replace(
`                      {/* PC Block */}
                      <div className="mb-2"><SlaBadge startDate={formData.data_aprovacao} endDate={formData.data_pedido_sap} slaDias={1} /></div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nº do Pedido (PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.pedido_sap || ""} onChange={handleInputChange('pedido_sap')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data do Pedido</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pedido_sap || "").substring(0, 10)} onChange={handleInputChange('data_pedido_sap')} />
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
                      </div>`,
`                      {/* PC Block */}
                      <div className="space-y-3 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pc_data_inicio || "").substring(0, 16)} onChange={handleInputChange('pc_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Nº do Pedido (PC)</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.pc_data_inicio} endDate={formData.pc_data_fim} slaDias={1} /></span></label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.pedido_sap || ""} onChange={handleInputChange('pedido_sap')} placeholder="Pendente" />
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
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pc_data_fim || "").substring(0, 16)} onChange={handleInputChange('pc_data_fim')} />
                        </div>
                      </div>`
);

// T2 Nexa Block
modal = modal.replace(
`                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chamado / Ticket</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Abertura Nexa</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_envio || "").substring(0, 10)} onChange={handleInputChange('nexa_data_envio')} />
                        </div>
                        {/* Pendencies handling generic inputs below */}
                      </div>
                      <SlaBadge startDate={formData.data_pedido_sap} endDate={formData.nexa_data_envio} slaDias={1} />`,
`                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Nexa)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.nexa_data_inicio || "").substring(0, 16)} onChange={handleInputChange('nexa_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Chamado / Ticket</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.nexa_data_inicio} endDate={formData.nexa_data_fim} slaDias={1} /></span></label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Nexa)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('nexa_data_fim')} />
                        </div>
                      </div>`
);

// T3 Fiscal Block
modal = modal.replace(
`                      <div className="space-y-3">
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
                                nexa_data_conclusao_lancamento: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.nexa_data_conclusao_lancamento,
                                usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento Concluído?</span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Conclusão</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_conclusao_lancamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_conclusao_lancamento')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Usuário</label>
                          <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.usuario_nexa_lancamento || '')} readOnly />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <SlaBadge startDate={formData.nexa_data_envio} endDate={formData.nexa_data_conclusao_lancamento} slaDias={3} />
                    </div>`,
`                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Fiscal)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_inicio || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_inicio')} />
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group pb-1 pt-1 border-b border-zinc-100">
                          <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento Concluído?</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-slate-600 focus:ring-slate-500"
                            checked={!!formData.nexa_lancamento_concluido}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                nexa_lancamento_concluido: checked,
                                fiscal_data_fim: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.fiscal_data_fim,
                                usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                              }));
                            }}
                          />
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Fiscal)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_fim || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_fim')} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <SlaBadge startDate={formData.fiscal_data_inicio} endDate={formData.fiscal_data_fim} slaDias={3} />
                    </div>`
);

// T4 Pagamento Block
modal = modal.replace(
`                      {/* Programação Block */}
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
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_prevista_pagamento')} />
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
                                data_pagamento_real: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pagamento_real,
                                usuario_nexa_pagamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_pagamento
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-green-700 uppercase group-hover:text-green-900 transition-colors">Pago?</span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Pagamento</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pagamento_real || "").substring(0, 10)} onChange={handleInputChange('data_pagamento_real')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>`,
`                      {/* Programação Block */}
                      <div className="space-y-3 pb-3 border-b border-green-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Prog)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.prog_data_inicio || "").substring(0, 16)} onChange={handleInputChange('prog_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Data Prevista</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.prog_data_inicio} endDate={formData.prog_data_fim} slaDias={3} /></span></label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_prevista_pagamento')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Prog)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.prog_data_fim || "").substring(0, 16)} onChange={handleInputChange('prog_data_fim')} />
                        </div>
                      </div>

                      {/* Pagamento Block */}
                      <div className="space-y-3 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Pagto)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pagamento_data_inicio || "").substring(0, 16)} onChange={handleInputChange('pagamento_data_inicio')} />
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-[10px] font-bold text-green-700 uppercase group-hover:text-green-900 transition-colors">Pago?</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                            checked={!!formData.nexa_pagamento_realizado}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                nexa_pagamento_realizado: checked,
                                data_pagamento_real: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pagamento_real,
                                pagamento_data_fim: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.pagamento_data_fim,
                                usuario_nexa_pagamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_pagamento
                              }));
                            }}
                          />
                        </label>
                        {formData.nexa_pagamento_realizado && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Real Pgto</label>
                            <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pagamento_real || "").substring(0, 10)} onChange={handleInputChange('data_pagamento_real')} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Pagto)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pagamento_data_fim || "").substring(0, 16)} onChange={handleInputChange('pagamento_data_fim')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>`
);


// Nexa-only Flow Blocks
modal = modal.replace(
`                      {/* T1 - Nexa */}
                  <div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                      <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa / Solicitação</span>
                      <div className="mb-3"><SlaBadge startDate={formData.data_recebimento} endDate={formData.nexa_data_envio} slaDias={1} /></div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chamado / Ticket</label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Abertura</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_envio || "").substring(0, 10)} onChange={handleInputChange('nexa_data_envio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Responsável Nexa</label>
                          <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.responsavel_t1 || '')} readOnly />
                        </div>
                      </div>
                    </div>
                  </div>`,
`                      {/* T1 - Nexa */}
                  <div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                      <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa / Solicitação</span>
                      <div className="mb-3"><SlaBadge startDate={formData.nexa_data_inicio} endDate={formData.nexa_data_fim} slaDias={1} /></div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Nexa)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.nexa_data_inicio || "").substring(0, 16)} onChange={handleInputChange('nexa_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Chamado / Ticket</span></label>
                          <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_chamado || ""} onChange={handleInputChange('nexa_chamado')} placeholder="Pendente" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Nexa)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('nexa_data_fim')} />
                        </div>
                      </div>
                    </div>
                  </div>`
);

modal = modal.replace(
`                  {/* T2 - PC (Nexa-Only) */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_chamado ? "border-purple-200 hover:border-purple-300" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T2</div>
                      <span className="text-[11px] font-bold text-purple-800 uppercase block mb-3 mt-1">Requisição / PC</span>
                      <div className="space-y-3">
                        
                        <label className="flex items-center gap-2 cursor-pointer group pb-1 border-b border-zinc-100">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                            checked={!!formData.nexa_possui_rc}
                            onChange={(e) => handleChange('nexa_possui_rc', e.target.checked)}
                          />
                          <span className="text-[10px] font-bold text-purple-700 uppercase group-hover:text-purple-900 transition-colors">Possui RC?</span>
                        </label>
                        {formData.nexa_possui_rc && (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nº RC</label>
                              <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_rc_numero || ""} onChange={handleInputChange('nexa_rc_numero')} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data RC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_rc_data || "").substring(0, 10)} onChange={handleInputChange('nexa_rc_data')} />
                            </div>
                          </>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer group pb-1 border-b border-zinc-100 mt-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                            checked={!!formData.pc_nexa_concluido}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                pc_nexa_concluido: checked,
                                data_pc_nexa: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pc_nexa,
                                usuario_pc_nexa: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_pc_nexa
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-purple-700 uppercase group-hover:text-purple-900 transition-colors">Possui PC? (Concluído)</span>
                        </label>
                        {formData.pc_nexa_concluido && (
                          <>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nº PC</label>
                              <Input className="h-7 text-xs border-zinc-200" value={formData.numero_pc_nexa || ""} onChange={handleInputChange('numero_pc_nexa')} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data PC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pc_nexa || "").substring(0, 10)} onChange={handleInputChange('data_pc_nexa')} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <SlaBadge startDate={formData.nexa_data_envio} endDate={formData.data_pc_nexa} slaDias={3} />
                    </div>
                  </div>`,
`                  {/* T2 - PC (Nexa-Only) */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_chamado ? "border-purple-200 hover:border-purple-300" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T2</div>
                      <span className="text-[11px] font-bold text-purple-800 uppercase block mb-3 mt-1 flex justify-between w-full"><span>Requisição / PC</span><span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.req_nexa_data_inicio} endDate={formData.req_nexa_data_fim} slaDias={3} /></span></span>
                      <div className="space-y-3">
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Req/PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.req_nexa_data_inicio || "").substring(0, 16)} onChange={handleInputChange('req_nexa_data_inicio')} />
                        </div>

                        <label className="flex items-center justify-between cursor-pointer group pb-1 border-b border-zinc-100">
                          <span className="text-[10px] font-bold text-purple-700 uppercase group-hover:text-purple-900 transition-colors">Possui RC?</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                            checked={!!formData.nexa_possui_rc}
                            onChange={(e) => handleChange('nexa_possui_rc', e.target.checked)}
                          />
                        </label>
                        {formData.nexa_possui_rc && (
                          <div className="space-y-1 flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nº RC</label>
                              <Input className="h-7 text-xs border-zinc-200" value={formData.nexa_rc_numero || ""} onChange={handleInputChange('nexa_rc_numero')} />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data RC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_rc_data || "").substring(0, 10)} onChange={handleInputChange('nexa_rc_data')} />
                            </div>
                          </div>
                        )}

                        <label className="flex items-center justify-between cursor-pointer group pb-1 border-b border-zinc-100 mt-2">
                          <span className="text-[10px] font-bold text-purple-700 uppercase group-hover:text-purple-900 transition-colors">Possui PC?</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                            checked={!!formData.pc_nexa_concluido}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                pc_nexa_concluido: checked,
                                data_pc_nexa: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pc_nexa,
                                usuario_pc_nexa: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_pc_nexa
                              }));
                            }}
                          />
                        </label>
                        {formData.pc_nexa_concluido && (
                          <div className="space-y-1 flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Nº PC</label>
                              <Input className="h-7 text-xs border-zinc-200" value={formData.numero_pc_nexa || ""} onChange={handleInputChange('numero_pc_nexa')} />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data PC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pc_nexa || "").substring(0, 10)} onChange={handleInputChange('data_pc_nexa')} />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Req/PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.req_nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('req_nexa_data_fim')} />
                        </div>
                      </div>
                    </div>
                  </div>`
);


// T3 Nexa-Only
modal = modal.replace(
`                  {/* T3 - Fiscal (Nexa-Only) */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.pc_nexa_concluido || formData.nexa_chamado ? "border-slate-300 hover:border-slate-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
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
                                nexa_data_conclusao_lancamento: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.nexa_data_conclusao_lancamento,
                                usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento Concluído?</span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Conclusão</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_conclusao_lancamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_conclusao_lancamento')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Usuário</label>
                          <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.usuario_nexa_lancamento || '')} readOnly />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <SlaBadge startDate={formData.data_pc_nexa || formData.nexa_data_envio} endDate={formData.nexa_data_conclusao_lancamento} slaDias={3} />
                    </div>
                  </div>`,
`                  {/* T3 - Fiscal (Nexa-Only) */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.pc_nexa_concluido || formData.nexa_chamado ? "border-slate-300 hover:border-slate-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                      <span className="text-[11px] font-bold text-slate-800 uppercase block mb-3 mt-1 flex justify-between w-full"><span>Fiscal</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.fiscal_data_inicio} endDate={formData.fiscal_data_fim} slaDias={3} /></span></span>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Fiscal)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_inicio || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_inicio')} />
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group pb-1 pt-1 border-b border-zinc-100">
                          <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento Concluído?</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-slate-600 focus:ring-slate-500"
                            checked={!!formData.nexa_lancamento_concluido}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                nexa_lancamento_concluido: checked,
                                fiscal_data_fim: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.fiscal_data_fim,
                                usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                              }));
                            }}
                          />
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Fiscal)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_fim || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_fim')} />
                        </div>
                      </div>
                    </div>
                  </div>`
);

// T4 Pagamento Nexa-Only
modal = modal.replace(
`                  {/* T4 - Pagamento (Nexa-Only) */}
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
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_prevista_pagamento')} />
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
                                data_pagamento_real: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pagamento_real,
                                usuario_nexa_pagamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_pagamento
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-green-700 uppercase group-hover:text-green-900 transition-colors">Pago?</span>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Pagamento</label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pagamento_real || "").substring(0, 10)} onChange={handleInputChange('data_pagamento_real')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
                  </div>`,
`                  {/* T4 - Pagamento (Nexa-Only) */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_lancamento_concluido ? "border-green-300 hover:border-green-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                      <span className="text-[11px] font-bold text-green-800 uppercase block mb-3 mt-1">Pagamento (Prog + Real)</span>
                      
                      {/* Programação Block */}
                      <div className="space-y-3 pb-3 border-b border-green-100">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Prog)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.prog_data_inicio || "").substring(0, 16)} onChange={handleInputChange('prog_data_inicio')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Data Prevista</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.prog_data_inicio} endDate={formData.prog_data_fim} slaDias={3} /></span></label>
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_prevista_pagamento')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Prog)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.prog_data_fim || "").substring(0, 16)} onChange={handleInputChange('prog_data_fim')} />
                        </div>
                      </div>

                      {/* Pagamento Block */}
                      <div className="space-y-3 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Pagto)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pagamento_data_inicio || "").substring(0, 16)} onChange={handleInputChange('pagamento_data_inicio')} />
                        </div>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-[10px] font-bold text-green-700 uppercase group-hover:text-green-900 transition-colors">Pago?</span>
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                            checked={!!formData.nexa_pagamento_realizado}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                nexa_pagamento_realizado: checked,
                                data_pagamento_real: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pagamento_real,
                                pagamento_data_fim: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.pagamento_data_fim,
                                usuario_nexa_pagamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_pagamento
                              }));
                            }}
                          />
                        </label>
                        {formData.nexa_pagamento_realizado && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data Real Pgto</label>
                            <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pagamento_real || "").substring(0, 10)} onChange={handleInputChange('data_pagamento_real')} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Pagto)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pagamento_data_fim || "").substring(0, 16)} onChange={handleInputChange('pagamento_data_fim')} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
                  </div>`
);


fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', modal);
console.log('Layout replaced successfully in FaturaSAPModal.tsx');
