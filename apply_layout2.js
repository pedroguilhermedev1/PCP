const fs = require('fs');
let modal = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

// Nexa-Only T1 Block
modal = modal.replace(
`                  {/* T1 - Nexa */}
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
                      </div>
                      <div className="space-y-1 mt-3 border-t border-zinc-100 pt-3">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Responsável</label>
                        <Input className="h-7 text-xs border-zinc-200 bg-zinc-50" value={formatUserName(formData.responsavel_t1 || '')} readOnly />
                      </div>
                    </div>
                  </div>`,
`                  {/* T1 - Nexa */}
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
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Chamado / Ticket</label>
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

// Nexa-Only T2 Block
modal = modal.replace(
`                  {/* T2 - Requisicao / Pedido */}
                  <div className="relative p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T2</div>
                    <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1 mt-1">Requisição / Pedido (Nexa)</span>
                    <div className="mb-3"><SlaBadge startDate={formData.nexa_data_envio} endDate={formData.data_pc_nexa} slaDias={2} /></div>
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
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_rc_data || formData.data_rc_sap || "").substring(0, 10)} onChange={handleInputChange('nexa_rc_data')} />
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
                                data_pc_nexa: checked && !prev.data_pc_nexa ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pc_nexa,
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
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pc_nexa || "").substring(0, 10)} onChange={handleInputChange('data_pc_nexa')} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>`,
`                  {/* T2 - Requisicao / Pedido */}
                  <div className="relative p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T2</div>
                    <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1 mt-1">Requisição / Pedido (Nexa)</span>
                    <div className="mb-3"><SlaBadge startDate={formData.req_nexa_data_inicio} endDate={formData.req_nexa_data_fim} slaDias={2} /></div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Req/PC)</label>
                        <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.req_nexa_data_inicio || "").substring(0, 16)} onChange={handleInputChange('req_nexa_data_inicio')} />
                      </div>
                      
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
                            <div className="space-y-1 hidden">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data RC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_rc_data || formData.data_rc_sap || "").substring(0, 10)} onChange={handleInputChange('nexa_rc_data')} />
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
                                data_pc_nexa: checked && !prev.data_pc_nexa ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.data_pc_nexa,
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
                            <div className="space-y-1 hidden">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data PC</label>
                              <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.data_pc_nexa || "").substring(0, 10)} onChange={handleInputChange('data_pc_nexa')} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Req/PC)</label>
                        <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.req_nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('req_nexa_data_fim')} />
                      </div>
                    </div>
                  </div>`
);


// Nexa-Only T3 Block
modal = modal.replace(
`                  {/* T3 - Fiscal */}
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
                              nexa_data_conclusao_lancamento: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.nexa_data_conclusao_lancamento,
                              usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                            }));
                          }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Concluído?</span>
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
                    <div className="mt-4">
                      <SlaBadge startDate={formData.nexa_data_envio} endDate={formData.nexa_data_conclusao_lancamento} slaDias={1} />
                    </div>
                  </div>`,
`                  {/* T3 - Fiscal */}
                  <div className="relative p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                    <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                    <span className="text-[11px] font-bold text-slate-800 uppercase block mb-3 mt-1 flex justify-between w-full"><span>Lançamento Fiscal</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.fiscal_data_inicio} endDate={formData.fiscal_data_fim} slaDias={1} /></span></span>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Fiscal)</label>
                        <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_inicio || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_inicio')} />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer group pb-1 pt-1 border-b border-zinc-100">
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
                        <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Concluído?</span>
                      </label>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Fiscal)</label>
                        <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_fim || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_fim')} />
                      </div>
                    </div>
                  </div>`
);

// Nexa-Only T4 Block
modal = modal.replace(
`                  {/* T4 - Pagamento */}
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
                          <Input className="h-7 text-xs border-zinc-200" type="date" value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} onChange={handleInputChange('nexa_data_prevista_pagamento')} />
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
`                  {/* T4 - Pagamento */}
                  <div className={cn("relative p-4 bg-white rounded-xl border transition-all shadow-sm flex flex-col justify-between", formData.nexa_lancamento_concluido ? "border-green-300 hover:border-green-400" : "border-zinc-200 opacity-60 pointer-events-none")}>
                    <div>
                      <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                      <span className="text-[11px] font-bold text-green-800 uppercase block mb-3 mt-1">Pagamento (Prog + Real)</span>
                      
                      {/* Programação */}
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

                      {/* Pagamento */}
                      <div className="space-y-3 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Início (Pagto)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pagamento_data_inicio || "").substring(0, 16)} onChange={handleInputChange('pagamento_data_inicio')} />
                        </div>
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
                                pagamento_data_fim: checked ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) : prev.pagamento_data_fim,
                                usuario_nexa_pagamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_pagamento
                              }));
                            }}
                          />
                          <span className="text-[10px] font-bold text-green-700 uppercase group-hover:text-green-900 transition-colors">Pago?</span>
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
console.log('Layout replaced successfully for Nexa-Only flow');
