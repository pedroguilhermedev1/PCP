const fs = require("fs");

const newFluxo = `                              {/* Fluxo */}
                              <div className="space-y-5 col-span-1 md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-zinc-200">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Fluxo de Trabalho ({fatura.fluxo_iniciado_por || 'SAP'})</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {fatura.fluxo_iniciado_por !== 'Nexa' ? (
                                    <>
                                      {/* T1 - SAP */}
                                      <div className="relative p-4 bg-white rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                                          <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1 mt-1">SAP (RC, Aprovação, PC)</span>
                                          
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="pb-2 border-b border-purple-100 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">RC</span> <span className="font-medium text-zinc-900">{fatura.rc_sap || '-'}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.rc_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.rc_data_fim)}</span></div>
                                            </div>
                                            <div className="pb-2 border-b border-purple-100 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Aprovação</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.aprovacao_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.aprovacao_data_fim)}</span></div>
                                            </div>
                                            <div className="pb-2 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">PC</span> <span className="font-medium text-zinc-900">{fatura.pedido_sap || '-'}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.pc_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.pc_data_fim)}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T1' || oc.t_origem === 'T1').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T1' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T1' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T1' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T1' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T1' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T1' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* T2 - Nexa */}
                                      <div className={cn("relative p-4 bg-white rounded-xl border shadow-sm flex flex-col justify-between", fatura.doc_subsequente_criado ? "border-cyan-200" : "border-zinc-200 opacity-60")}>
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T2</div>
                                          <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa</span>
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Chamado</span> <span className="font-medium text-zinc-900">{fatura.nexa_chamado || '-'}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.nexa_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.nexa_data_fim)}</span></div>
                                              <div className="flex justify-between mt-2 pt-2 border-t border-cyan-100"><span className="text-zinc-500">Doc Emitido?</span> <span>{fatura.nexa_emitiu_nf ? 'Sim' : 'Não'}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Doc Anexado?</span> <span>{fatura.nexa_anexada ? 'Sim' : 'Não'}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T2' || oc.t_origem === 'T2').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T2' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T2' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T2' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T2' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T2' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T2' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* T3 - Fiscal */}
                                      <div className={cn("relative p-4 bg-white rounded-xl border shadow-sm flex flex-col justify-between", fatura.nexa_anexada ? "border-slate-300" : "border-zinc-200 opacity-60")}>
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                                          <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1 mt-1">Fiscal</span>
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="space-y-1">
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.fiscal_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.fiscal_data_fim)}</span></div>
                                              <div className="flex justify-between mt-2 pt-2 border-t border-slate-100"><span className="text-zinc-500">Concluído?</span> <span>{fatura.nexa_lancamento_concluido ? 'Sim' : 'Não'}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T3' || oc.t_origem === 'T3').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T3' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T3' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T3' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T3' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T3' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T3' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* T4 - Pagamento */}
                                      <div className={cn("relative p-4 bg-white rounded-xl border shadow-sm flex flex-col justify-between", fatura.nexa_lancamento_concluido ? "border-green-300" : "border-zinc-200 opacity-60")}>
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                          <span className="text-[11px] font-bold text-green-800 uppercase block mb-1 mt-1">Pagamento (Prog + Real)</span>
                                          
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="pb-2 border-b border-green-100 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Programação</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.prog_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Prevista:</span> <span>{formatDateDisplay(fatura.nexa_data_prevista_pagamento)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.prog_data_fim)}</span></div>
                                            </div>
                                            <div className="pt-1 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Pagamento</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.pagamento_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Data Real:</span> <span className="font-medium text-green-700">{formatDateDisplay(fatura.data_pagamento_real)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.pagamento_data_fim)}</span></div>
                                              <div className="flex justify-between mt-1"><span className="text-zinc-500">Pago?</span> <span>{fatura.nexa_pagamento_realizado ? 'Sim' : 'Não'}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T4' || oc.t_origem === 'T4').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T4' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T4' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T4' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T4' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T4' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T4' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* T1 - Nexa */}
                                      <div className="relative p-4 bg-white rounded-xl border border-cyan-200 shadow-sm flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                                          <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa / Solicitação</span>
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Chamado</span> <span className="font-medium text-zinc-900">{fatura.nexa_chamado || '-'}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.nexa_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.nexa_data_fim)}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T1' || oc.t_origem === 'T1').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T1' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T1' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T1' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T1' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T1' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T1' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* T2 - Requisição / Pedido */}
                                      <div className="relative p-4 bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T2</div>
                                          <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1 mt-1">Requisição / Pedido (Nexa)</span>
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="space-y-1">
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.req_nexa_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">RC Nexa</span> <span className="font-medium text-zinc-900">{fatura.nexa_rc_numero || '-'}</span></div>
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">PC Nexa</span> <span className="font-medium text-zinc-900">{fatura.numero_pc_nexa || '-'}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.req_nexa_data_fim)}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T2' || oc.t_origem === 'T2').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T2' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T2' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T2' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T2' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T2' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T2' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* T3 - Fiscal */}
                                      <div className="relative p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                                          <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1 mt-1">Fiscal</span>
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="space-y-1">
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.fiscal_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.fiscal_data_fim)}</span></div>
                                              <div className="flex justify-between mt-2 pt-2 border-t border-slate-100"><span className="text-zinc-500">Concluído?</span> <span>{fatura.nexa_lancamento_concluido ? 'Sim' : 'Não'}</span></div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T3' || oc.t_origem === 'T3').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T3' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T3' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T3' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T3' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T3' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T3' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* T4 - Pagamento */}
                                      <div className={cn("relative p-4 bg-white rounded-xl border shadow-sm flex flex-col justify-between", fatura.nexa_lancamento_concluido ? "border-green-300" : "border-zinc-200 opacity-60")}>
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                          <span className="text-[11px] font-bold text-green-800 uppercase block mb-1 mt-1">Pagamento (Prog + Real)</span>
                                          
                                          <div className="space-y-3 mt-2 text-xs">
                                            <div className="pb-2 border-b border-green-100 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Programação</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.prog_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Prevista:</span> <span>{formatDateDisplay(fatura.nexa_data_prevista_pagamento)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.prog_data_fim)}</span></div>
                                            </div>
                                            <div className="pt-1 space-y-1">
                                              <div className="flex justify-between"><span className="font-semibold text-zinc-500 uppercase">Pagamento</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(fatura.pagamento_data_inicio)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Data Real:</span> <span className="font-medium text-green-700">{formatDateDisplay(fatura.data_pagamento_real)}</span></div>
                                              <div className="flex justify-between"><span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(fatura.pagamento_data_fim)}</span></div>
                                              <div className="flex justify-between mt-1"><span className="text-zinc-500">Pago?</span> <span>{fatura.nexa_pagamento_realizado ? 'Sim' : 'Não'}</span></div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {fatura.ocorrencias?.filter(oc => oc.t_destino === 'T4' || oc.t_origem === 'T4').map(oc => (
                                            <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T4' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                              <div className="flex justify-between">
                                                <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T4' ? 'text-red-700' : 'text-orange-700')}>
                                                  {oc.t_destino === 'T4' ? \`\${oc.t_destino_codigo} - Ocorrência\` : \`\${oc.t_origem_retorno_codigo} - Retorno\`}
                                                </h5>
                                              </div>
                                              <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T4' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                              <div className="flex justify-between text-[9px] pt-1">
                                                <span className="text-zinc-500">Início:</span> <span>{formatDateDisplay(oc.t_destino === 'T4' ? oc.destino_data_inicio : oc.origem_data_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between text-[9px]">
                                                <span className="text-zinc-500">Fim:</span> <span>{formatDateDisplay(oc.t_destino === 'T4' ? oc.destino_data_fim : oc.origem_data_fim)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>\`;

const content = fs.readFileSync("c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaDetailsModal.tsx", "utf-8");
const startMarker = \`                              {/* Fluxo */}\`;
const endMarker = \`                                </div>\\n                              </div>\`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if(startIndex === -1 || endIndex === -1) {
  console.log("Marcapassos não encontrados");
} else {
  const newContent = content.substring(0, startIndex) + newFluxo + content.substring(endIndex);
  fs.writeFileSync("c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaDetailsModal.tsx", newContent);
  console.log("Substituído com sucesso!");
}
