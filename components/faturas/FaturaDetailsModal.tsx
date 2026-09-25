import React from 'react';
import { Fatura, calcularStatus, calcularEtapa } from "@/modules/compras/domain/Fatura";
import { formatCNPJ, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, ArrowRightLeft, Edit, FileText, Clock, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura | null;
  faturaPeriodos: any[];
  canEditOrDelete: boolean;
  handleDuplicate: (f: Fatura) => void;
  setFaturaToTransfer: (f: Fatura) => void;
  handleEdit: (f: Fatura) => void;
  setSelectedStage: (s: {fatura: any, stage: string}) => void;
  getStatusColor: (s: string) => string;
  getEtapaColor: (e: string) => string;
  getEtapaLabel: (e: string) => string;
}

export function FaturaDetailsModal({ 
  isOpen, onClose, fatura, faturaPeriodos, canEditOrDelete, 
  handleDuplicate, setFaturaToTransfer, handleEdit, setSelectedStage,
  getStatusColor, getEtapaColor, getEtapaLabel
}: Props) {
  if (!isOpen || !fatura) return null;
  
  const status = calcularStatus(fatura);
  const etapa = calcularEtapa(fatura);
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center z-10 shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-700" />
            <h2 className="text-xl font-bold text-zinc-900">Detalhes da Fatura</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
                        <div className="flex flex-col lg:flex-row min-h-[400px]">
                          {/* Main Content Area */}
                          <div className="flex-1 p-8 border-r border-zinc-200">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                              <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-purple-700" />
                                <h3 className="text-xl font-bold text-zinc-900">Detalhes da Fatura</h3>
                              </div>
                              {canEditOrDelete && (
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleDuplicate(fatura)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicar
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setFaturaToTransfer(fatura)}>
                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                    Transferir / Devolver
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => handleEdit(fatura)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {/* Iniciais */}
                              <div className="space-y-5">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2">Informações Básicas</h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Fornecedor</span>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.fornecedor}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">CNPJ</span>
                                    <span className="text-sm font-medium text-zinc-900">{formatCNPJ(fatura.cnpj)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Nota Fiscal</span>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.numero_documento}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Valor Total</span>
                                    <span className="text-sm font-bold text-zinc-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Classificação */}
                              <div className="space-y-5">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2">Classificação</h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">CD / Unidade</span>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.cd || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Centro de Custo</span>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.centro_custo || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Conta Contábil</span>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.conta_contabil || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Tipo Serviço</span>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.tipo_servico || '-'}</span>
                                  </div>
                                </div>
                              </div>

                                                            {/* Fluxo */}
                              <div className="space-y-5 col-span-1 md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-zinc-200">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Fluxo de Trabalho ({fatura.fluxo_iniciado_por || 'SAP'})</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {fatura.fluxo_iniciado_por !== 'Nexa' ? (
                                    <>
                                      {/* T1 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T1'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                                        <span className="text-[11px] font-bold text-purple-800 uppercase block mb-2 mt-1">RC SAP</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.rc_sap || 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.data_rc_sap?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T2 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T2'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-indigo-50 rounded-full border border-indigo-300 flex items-center justify-center text-[10px] font-bold text-indigo-700">T2</div>
                                        <span className="text-[11px] font-bold text-indigo-800 uppercase block mb-2 mt-1">Aprovação RC</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.data_aprovacao ? 'Aprovada' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.data_aprovacao?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T3 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T3'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T3</div>
                                          <span className="text-[11px] font-bold text-blue-800 uppercase block mb-2 mt-1">Pedido SAP (PC)</span>
                                          <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-zinc-900">{fatura.pedido_sap || 'Pendente'}</span>
                                            <span className="text-[10px] text-zinc-500">{fatura.data_pedido_sap?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                          </div>
                                        </div>
                                        {/* Doc Sub */}
                                        <div className="mt-3 pt-2 border-t border-zinc-100 flex justify-between items-center">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Doc Subsequente</span>
                                          <span className="text-[10px] font-medium text-emerald-600">{fatura.doc_subsequente_criado ? 'Criado' : 'Não criado'}</span>
                                        </div>
                                      </div>

                                      {/* T4 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T4'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T4</div>
                                        <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-2 mt-1">Solicitação Nexa</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_chamado || (fatura.nexa_anexada ? 'Anexada' : 'Pendente')}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_envio?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T5 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T5'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T5</div>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 mt-1">Lançamento Fiscal</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T6 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T6'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-amber-50 rounded-full border border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-700">T6</div>
                                        <span className="text-[11px] font-bold text-amber-800 uppercase block mb-2 mt-1">Programação Pgto</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_pagamento_programado ? 'Programado' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_prevista_pagamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T7 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T7'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T7</div>
                                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-2 mt-1">Efetuar Pagamento</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_pagamento_realizado ? 'Pago' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.data_pagamento_real?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* T1 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T1'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                                          <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-2 mt-1">Solicitação Nexa (Ticket)</span>
                                          <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-zinc-900">{fatura.nexa_chamado || 'Pendente'}</span>
                                            <span className="text-[10px] text-zinc-500">{fatura.nexa_data_envio?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                          </div>
                                        </div>
                                        {/* Sub-item PC Nexa */}
                                        <div className="mt-3 pt-2 border-t border-zinc-100 flex justify-between items-center">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase">PC Vinculado</span>
                                          <div className="text-right flex flex-col">
                                            <span className="text-[10px] font-medium text-blue-600">{fatura.numero_pc_nexa || (fatura.pc_nexa_concluido ? 'Concluído' : 'Pendente')}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* T2 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T2'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T2</div>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 mt-1">Lançamento Fiscal</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T3 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T3'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-amber-50 rounded-full border border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-700">T3</div>
                                        <span className="text-[11px] font-bold text-amber-800 uppercase block mb-2 mt-1">Programação Pgto</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_pagamento_programado ? 'Programado' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.nexa_data_prevista_pagamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T4 */}
                                      <div onClick={() => setSelectedStage({fatura: fatura, stage: 'T4'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-2 mt-1">Efetuar Pagamento</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{fatura.nexa_pagamento_realizado ? 'Pago' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{fatura.data_pagamento_real?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Insumos */}
                            {fatura.insumos && fatura.insumos.length > 0 && fatura.insumos.some(i => !(i as any)._meta) && (
                              <div className="mt-8">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2 mb-4">Insumos Vinculados</h4>
                                <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                                  <Table>
                                    <TableHeader className="bg-zinc-50">
                                      <TableRow>
                                        <TableHead className="text-[10px] uppercase">Código</TableHead>
                                        <TableHead className="text-[10px] uppercase">Item</TableHead>
                                        <TableHead className="text-[10px] uppercase text-right">Qtd</TableHead>
                                        <TableHead className="text-[10px] uppercase text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {fatura.insumos.filter(i => !(i as any)._meta).map((ins, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="text-xs font-mono text-zinc-500">{ins.codigo}</TableCell>
                                          <TableCell className="text-xs font-medium">{ins.item}</TableCell>
                                          <TableCell className="text-xs text-right">{ins.quantidade}</TableCell>
                                          <TableCell className="text-xs text-right font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ins.valor_total || 0)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* Histórico de Tempos e SLAs */}
                            <div className="mt-8 pt-8 border-t border-zinc-200">
                              <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-amber-600" />
                                <h3 className="text-lg font-bold text-zinc-900">Histórico de SLAs e Transferências</h3>
                              </div>
                              
                              {faturaPeriodos.length === 0 ? (
                                <div className="p-6 bg-zinc-50 rounded-lg text-center text-zinc-500 text-sm">
                                  Nenhum histórico registrado ainda. Transfira o processo para iniciar a contagem.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {faturaPeriodos.map((p, idx) => {
                                    const dInicio = new Date(p.data_inicio);
                                    const dTermino = p.data_termino ? new Date(p.data_termino) : new Date();
                                    const diffDias = Math.ceil((dTermino.getTime() - dInicio.getTime()) / (1000 * 3600 * 24));
                                    const estourouSLA = diffDias > p.sla_dias;
                                    
                                    return (
                                      <div key={p.id} className="relative pl-6 pb-4 border-l-2 border-zinc-200 last:border-0 last:pb-0">
                                        <div className={cn("absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-white", !p.data_termino ? "bg-amber-500" : (estourouSLA ? "bg-red-500" : "bg-emerald-500"))}></div>
                                        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Etapa: {p.etapa_nome}</span>
                                              <h4 className="text-base font-bold text-zinc-800">Time: {p.time_responsavel}</h4>
                                            </div>
                                            <div className="text-right">
                                              <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", !p.data_termino ? "bg-amber-100 text-amber-700" : (estourouSLA ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"))}>
                                                SLA: {p.sla_dias} dias | Usado: {diffDias} dias
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-sm text-zinc-600 mb-3">
                                            <p><strong>Início:</strong> {dInicio.toLocaleString('pt-BR')}</p>
                                            {p.data_termino && <p><strong>Fim:</strong> {new Date(p.data_termino).toLocaleString('pt-BR')}</p>}
                                          </div>
                                          {p.motivo_transferencia && (
                                            <div className="bg-zinc-50 p-3 rounded border border-zinc-100 text-sm">
                                              <p className="font-semibold text-zinc-800 mb-1">Motivo: {p.motivo_transferencia}</p>
                                              {p.observacao_transferencia && <p className="text-zinc-600">{p.observacao_transferencia}</p>}
                                              <p className="text-xs text-zinc-400 mt-2 block">Transferido por: {p.usuario_transferencia || 'Sistema'}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Panel Summary */}
                          <div className="w-full lg:w-80 bg-white p-6 border-l border-zinc-200 flex flex-col gap-6">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Resumo Executivo</h4>
                              
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Status Atual</span>
                                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border inline-block", getStatusColor(status))}>
                                    {status}
                                  </span>
                                </div>
                                
                                <div>
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Etapa no Fluxo</span>
                                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border inline-block", getEtapaColor(etapa))}>
                                    {getEtapaLabel(etapa)}
                                  </span>
                                </div>

                                <div className="pt-3 border-t border-zinc-100">
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Responsável</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                      {fatura.responsavel ? fatura.responsavel.substring(0, 2).toUpperCase() : '?'}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-900">{fatura.responsavel || 'Não atribuído'}</span>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Datas Críticas</span>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-500">Emissão</span>
                                      <span className="font-medium">{fatura.data_emissao?.split('-').reverse().join('/')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-500">Vencimento</span>
                                      <span className="font-medium text-orange-600">{fatura.data_vencimento?.split('-').reverse().join('/')}</span>
                                    </div>
                                  </div>
                                </div>

                                {(fatura.forma_pagamento || fatura.possui_encargo) && (
                                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                                    {fatura.forma_pagamento && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-zinc-500 font-semibold">Forma Pagamento</span>
                                        <span className="font-medium">{fatura.forma_pagamento}</span>
                                      </div>
                                    )}
                                    {fatura.possui_encargo && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-red-500 font-semibold">Encargos</span>
                                        <span className="font-medium text-red-600">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor_encargo || 0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {fatura.observacoes && (
                                  <div className="pt-3 border-t border-zinc-100">
                                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Observações</span>
                                    <p className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-100 italic">
                                      "{fatura.observacoes}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
        </div>
      </div>
    </div>
  )
}
