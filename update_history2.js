const fs = require('fs');

const replacement = `                            {/* Histórico e Auditoria (Fase 4) */}
                            <div className="mt-8 pt-8 border-t border-zinc-200">
                              <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-amber-600" />
                                <h3 className="text-lg font-bold text-zinc-900">Histórico de Ciclos e SLAs</h3>
                              </div>
                              
                              {(() => {
                                // Build unified history
                                let history = [];
                                const addEvent = (cycle, code, name, startDate, endDate, slaDias, responsavel) => {
                                  if (startDate) {
                                    history.push({
                                      cycle: cycle,
                                      codigo: code,
                                      nome: name,
                                      data_inicio: startDate,
                                      data_fim: endDate,
                                      sla_dias: slaDias,
                                      responsavel: responsavel || 'Sistema',
                                      is_ocorrencia: code.includes('.')
                                    });
                                  }
                                };

                                if (fatura.is_sap) {
                                  if (fatura.fluxo_iniciado_por !== 'Nexa') {
                                    addEvent(0, 'T1', 'SAP (RC, Aprovação, PC)', fatura.rc_data_inicio || fatura.data_recebimento, fatura.pc_data_fim || fatura.data_pedido_sap, 3, fatura.responsavel_t1);
                                    addEvent(0, 'T2', 'Nexa (Chamado)', fatura.nexa_data_inicio || fatura.data_pedido_sap, fatura.nexa_data_fim || fatura.nexa_data_envio, 1, 'Nexa');
                                    addEvent(0, 'T3', 'Fiscal', fatura.fiscal_data_inicio || fatura.nexa_data_envio, fatura.fiscal_data_fim || fatura.nexa_data_conclusao_lancamento, 3, fatura.usuario_nexa_lancamento);
                                    addEvent(0, 'T4', 'Pagamento', fatura.prog_data_inicio || fatura.nexa_data_prevista_pagamento, fatura.pagamento_data_fim || fatura.data_pagamento_real, 3, 'Financeiro');
                                  } else {
                                    addEvent(0, 'T1', 'Nexa / Solicitação', fatura.nexa_data_inicio || fatura.nexa_data_envio, fatura.nexa_data_fim, 1, fatura.responsavel_t1);
                                    addEvent(0, 'T2', 'Requisição / Pedido (Nexa)', fatura.req_nexa_data_inicio || fatura.nexa_rc_data, fatura.req_nexa_data_fim || fatura.data_pc_nexa, 2, 'Suprimentos');
                                    addEvent(0, 'T3', 'Lançamento Fiscal', fatura.fiscal_data_inicio || fatura.nexa_data_envio, fatura.fiscal_data_fim || fatura.nexa_data_conclusao_lancamento, 1, fatura.usuario_nexa_lancamento);
                                    addEvent(0, 'T4', 'Pagamento', fatura.prog_data_inicio || fatura.nexa_data_prevista_pagamento, fatura.pagamento_data_fim || fatura.data_pagamento_real, 3, 'Financeiro');
                                  }
                                }

                                if (fatura.ocorrencias && fatura.ocorrencias.length > 0) {
                                  const sortedOcs = [...fatura.ocorrencias].sort((a, b) => new Date(a.data_envio || 0).getTime() - new Date(b.data_envio || 0).getTime());
                                  sortedOcs.forEach((oc, index) => {
                                    const cycle = index + 1;
                                    addEvent(cycle, oc.t_destino_codigo, \`Ocorrência (\${oc.t_destino}) - \${oc.motivo}\`, oc.destino_data_inicio || oc.data_envio, oc.destino_data_fim, 1, oc.destino_responsavel);
                                    addEvent(cycle, oc.t_origem_retorno_codigo, \`Retorno (\${oc.t_origem})\`, oc.origem_data_inicio, oc.origem_data_fim, 1, oc.origem_responsavel);
                                  });
                                }

                                history.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

                                // Add the old manual periodos for legacy compatibility
                                if (faturaPeriodos && faturaPeriodos.length > 0) {
                                  faturaPeriodos.forEach((p, idx) => {
                                    history.push({
                                      cycle: 0,
                                      codigo: 'Man',
                                      nome: \`Manual: \${p.etapa_nome} (\${p.time_responsavel})\`,
                                      data_inicio: p.data_inicio,
                                      data_fim: p.data_termino,
                                      sla_dias: p.sla_dias,
                                      responsavel: p.usuario_transferencia || 'Sistema',
                                      is_ocorrencia: false,
                                      motivo: p.motivo_transferencia,
                                      observacao: p.observacao_transferencia
                                    });
                                  });
                                  history.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
                                }

                                if (history.length === 0) {
                                  return (
                                    <div className="p-6 bg-zinc-50 rounded-lg text-center text-zinc-500 text-sm border border-dashed border-zinc-300">
                                      Nenhum histórico registrado ainda. O sistema gravará as etapas automaticamente conforme o andamento do fluxo.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {history.map((ev, idx) => {
                                      const dInicio = new Date(ev.data_inicio);
                                      const dTermino = ev.data_fim ? new Date(ev.data_fim) : new Date();
                                      
                                      // Get business days difference
                                      let diasAdicionados = 0;
                                      let curr = new Date(dInicio.getTime());
                                      curr.setHours(0,0,0,0);
                                      const end = new Date(dTermino.getTime());
                                      end.setHours(0,0,0,0);
                                      
                                      while (curr < end) {
                                        curr.setDate(curr.getDate() + 1);
                                        if (curr.getDay() !== 0 && curr.getDay() !== 6) diasAdicionados++;
                                      }
                                      
                                      const estourouSLA = diasAdicionados > ev.sla_dias;
                                      const pendente = !ev.data_fim;

                                      return (
                                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                          <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10", pendente ? "bg-amber-400" : (estourouSLA ? "bg-red-500" : (ev.is_ocorrencia ? "bg-purple-500" : "bg-emerald-500")))}>
                                            <span className="text-[10px] font-bold text-white">{ev.codigo}</span>
                                          </div>
                                          
                                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                              <div>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1", ev.is_ocorrencia ? "text-purple-600" : "text-zinc-500")}>
                                                  Ciclo {ev.cycle} {ev.is_ocorrencia && '(Retorno)'}
                                                </span>
                                                <h4 className="text-sm font-bold text-zinc-800">{ev.nome}</h4>
                                              </div>
                                              <div className="text-right">
                                                <span className={cn("px-2 py-1 rounded text-[9px] font-bold uppercase whitespace-nowrap", pendente ? "bg-amber-100 text-amber-700" : (estourouSLA ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"))}>
                                                  {ev.sla_dias > 0 ? \`SLA: \${ev.sla_dias}d | Usado: \${diasAdicionados}d\` : 'Sem SLA'}
                                                </span>
                                              </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1 text-[11px] text-zinc-600 mt-3 p-2 bg-zinc-50 rounded border border-zinc-100">
                                              <div className="flex justify-between"><span>Início:</span> <span className="font-medium text-zinc-800">{dInicio.toLocaleString('pt-BR')}</span></div>
                                              <div className="flex justify-between"><span>Término:</span> <span className="font-medium text-zinc-800">{ev.data_fim ? new Date(ev.data_fim).toLocaleString('pt-BR') : 'Pendente'}</span></div>
                                              <div className="flex justify-between mt-1 pt-1 border-t border-zinc-200"><span>Responsável:</span> <span className="font-medium">{ev.responsavel}</span></div>
                                            </div>

                                            {(ev.motivo || ev.observacao) && (
                                              <div className="mt-2 text-[10px] text-zinc-600 italic border-l-2 border-zinc-300 pl-2">
                                                {ev.motivo && <span className="font-semibold block">{ev.motivo}</span>}
                                                {ev.observacao}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>`;

const targetPath = "c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaDetailsModal.tsx";
const content = fs.readFileSync(targetPath, "utf-8");

const lines = content.split(/\r?\n/);
let startLine = 477; // 0-indexed: line 478
let endLine = 529;   // 0-indexed: line 530

const before = lines.slice(0, startLine).join('\n');
const after = lines.slice(endLine + 1).join('\n');
const newContent = before + '\n' + replacement + '\n' + after;
fs.writeFileSync(targetPath, newContent);
console.log("Success by exact lines");
