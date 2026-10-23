import React from 'react';
import { Fatura, calcularStatus, calcularEtapa, getEtapasDatas, calcularTempoDias, parseObservacoes } from "@/modules/compras/domain/Fatura";
import { formatCNPJ, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, ArrowRightLeft, Edit, FileText, Clock, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'S/ Data';
  const parts = dateStr.split('T');
  return parts[0].split('-').reverse().join('/');
};

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
                                  {/* Botão Transferir / Devolver ocultado temporariamente */}
                                  {false && (
                                    <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => fatura && setFaturaToTransfer(fatura)}>
                                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                                      Transferir / Devolver
                                    </Button>
                                  )}
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
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Documento</span>
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
                                {(() => {
                                  const datas = getEtapasDatas(fatura);
                                  const obs = parseObservacoes(fatura.observacoes);
                                  const isFluxoSap = fatura.fluxo_iniciado_por !== 'Nexa';

                                  const tempoRcAprov = calcularTempoDias(datas.sap_rc_criacao, datas.sap_rc_aprovacao);
                                  const tempoSapNexa = calcularTempoDias(datas.sap_rc_aprovacao || datas.sap_pc_geracao, datas.nexa_abertura);
                                  const tempoNexaFiscal = calcularTempoDias(datas.nexa_abertura, datas.fiscal_conclusao);
                                  const tempoFiscalPagto = calcularTempoDias(datas.fiscal_conclusao, datas.pagamento_efetiva || datas.pagamento_prevista);

                                  if (isFluxoSap) {
                                    return (
                                      <>
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            Fluxo de Trabalho 1 (SAP + Nexa)
                                          </h4>
                                          <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold w-fit">
                                            SAP → Nexa → Fiscal → Pagamento
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                          {/* T1 - SAP */}
                                          <div 
                                            className="relative p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-purple-50/30"
                                            onClick={() => setSelectedStage({fatura, stage: "T1"})}
                                          >
                                            <div>
                                              <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                                              <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1 mt-1">SAP (RC, Aprovação, PC)</span>

                                              <div className="space-y-2.5 mt-3 text-xs">
                                                <div className="flex justify-between pb-1.5 border-b border-purple-100">
                                                  <span className="text-zinc-500 font-medium">Nº RC:</span>
                                                  <span className="font-bold text-zinc-900">{fatura.rc_sap || 'Pendente'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-zinc-500">Criação RC:</span>
                                                  <span className="font-medium text-zinc-800">{formatDateDisplay(datas.sap_rc_criacao)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1 px-1.5 rounded bg-purple-50/60 border border-purple-100">
                                                  <span className="text-purple-700 font-semibold text-[11px]">Aprovação RC:</span>
                                                  <span className="font-bold text-purple-900 text-[11px]">{formatDateDisplay(datas.sap_rc_aprovacao)}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-purple-100">
                                                  <span className="text-zinc-500 font-medium">Nº Pedido (PC):</span>
                                                  <span className="font-bold text-zinc-900">{fatura.pedido_sap || 'Pendente'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                  <span className="text-zinc-500">Geração PC:</span>
                                                  <span className="font-medium text-zinc-700">
                                                    {formatDateDisplay(datas.sap_pc_geracao)}
                                                    {datas.sap_pc_is_inherited && (
                                                      <span className="ml-1 text-[9px] text-purple-600 font-normal">(herdada)</span>
                                                    )}
                                                  </span>
                                                </div>

                                                {tempoRcAprov !== null && (
                                                  <div className="text-[9px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-center">
                                                    Criação → Aprovação: {tempoRcAprov} dia(s)
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Ocorrências ocultadas temporariamente */}
                                            {false && (
                                              <div className="mt-3 space-y-1.5">
                                                {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T1' || oc.t_origem === 'T1').map(oc => (
                                                  <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T1' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                    <div className="flex justify-between">
                                                      <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T1' ? 'text-red-700' : 'text-orange-700')}>
                                                        {oc.t_destino === 'T1' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                      </h5>
                                                    </div>
                                                    <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T1' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* T2 - Nexa */}
                                          <div 
                                            className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-cyan-50/30"
                                            onClick={() => setSelectedStage({fatura, stage: "T2"})}
                                          >
                                            <div>
                                              <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T2</div>
                                              <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa</span>

                                              <div className="space-y-2.5 mt-3 text-xs">
                                                <div className="flex justify-between items-center py-1 px-1.5 rounded bg-cyan-50/60 border border-cyan-100">
                                                  <span className="text-cyan-700 font-semibold text-[11px]">Início (Herdada SAP):</span>
                                                  <span className="font-bold text-cyan-900 text-[11px]">{formatDateDisplay(datas.nexa_inicio)}</span>
                                                </div>
                                                <div className="flex justify-between pb-1.5 border-b border-cyan-100">
                                                  <span className="text-zinc-500 font-medium">Chamado:</span>
                                                  <span className="font-bold text-zinc-900">{fatura.nexa_chamado || 'Pendente'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-zinc-500">Abertura:</span>
                                                  <span className="font-bold text-cyan-800">{formatDateDisplay(datas.nexa_abertura)}</span>
                                                </div>
                                                {datas.nexa_conclusao && (
                                                  <div className="flex justify-between text-[11px]">
                                                    <span className="text-zinc-500">Conclusão:</span>
                                                    <span className="font-medium text-zinc-700">{formatDateDisplay(datas.nexa_conclusao)}</span>
                                                  </div>
                                                )}
                                                {tempoSapNexa !== null && (
                                                  <div className="text-[9px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-center">
                                                    Aprovação → Abertura: {tempoSapNexa} dia(s)
                                                  </div>
                                                )}
                                                <div className="pt-1.5 border-t border-cyan-100 flex justify-between text-[10px] text-zinc-500">
                                                  <span>Etapa concluída: <b className="text-zinc-800">{fatura.nexa_emitiu_nf && fatura.nexa_anexada ? 'Sim' : 'Não'}</b></span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Ocorrências ocultadas temporariamente */}
                                            {false && (
                                              <div className="mt-3 space-y-1.5">
                                                {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T2' || oc.t_origem === 'T2').map(oc => (
                                                  <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T2' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                    <div className="flex justify-between">
                                                      <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T2' ? 'text-red-700' : 'text-orange-700')}>
                                                        {oc.t_destino === 'T2' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                      </h5>
                                                    </div>
                                                    <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T2' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* T3 - Fiscal */}
                                          <div 
                                            className="relative p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-400 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-slate-50/30"
                                            onClick={() => setSelectedStage({fatura, stage: "T3"})}
                                          >
                                            <div>
                                              <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                                              <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1 mt-1">Fiscal</span>

                                              <div className="space-y-2.5 mt-3 text-xs">
                                                <div className="flex justify-between items-center py-1 px-1.5 rounded bg-slate-100 border border-slate-200">
                                                  <span className="text-slate-600 font-semibold text-[11px]">Início (Herdada Nexa):</span>
                                                  <span className="font-bold text-slate-900 text-[11px]">{formatDateDisplay(datas.fiscal_inicio)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-zinc-500 font-medium">Status:</span>
                                                  <span className={cn("font-bold text-[11px] px-2 py-0.5 rounded", fatura.nexa_lancamento_concluido ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                                                    {fatura.nexa_lancamento_concluido ? 'Concluído' : 'Em andamento'}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-zinc-500">Conclusão Fiscal:</span>
                                                  <span className="font-bold text-slate-800">{formatDateDisplay(datas.fiscal_conclusao)}</span>
                                                </div>

                                                {tempoNexaFiscal !== null && (
                                                  <div className="text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-center">
                                                    Nexa → Fiscal: {tempoNexaFiscal} dia(s)
                                                  </div>
                                                )}

                                                {obs.fiscal_observacao && (
                                                  <div className="pt-2 border-t border-slate-100">
                                                    <span className="text-[9px] font-semibold text-zinc-500 uppercase block mb-0.5">Observação:</span>
                                                    <p className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 italic line-clamp-2">
                                                      "{obs.fiscal_observacao}"
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Ocorrências ocultadas temporariamente */}
                                            {false && (
                                              <div className="mt-3 space-y-1.5">
                                                {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T3' || oc.t_origem === 'T3').map(oc => (
                                                  <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T3' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                    <div className="flex justify-between">
                                                      <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T3' ? 'text-red-700' : 'text-orange-700')}>
                                                        {oc.t_destino === 'T3' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                      </h5>
                                                    </div>
                                                    <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T3' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* T4 - Pagamento */}
                                          <div 
                                            className="relative p-4 bg-white rounded-xl border border-green-300 hover:border-green-400 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-green-50/30"
                                            onClick={() => setSelectedStage({fatura, stage: "T4"})}
                                          >
                                            <div>
                                              <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                              <span className="text-[11px] font-bold text-green-800 uppercase block mb-1 mt-1">Pagamento (Prog + Real)</span>

                                              <div className="space-y-2.5 mt-3 text-xs">
                                                <div className="flex justify-between items-center py-1 px-1.5 rounded bg-green-50/60 border border-green-200">
                                                  <span className="text-green-700 font-semibold text-[11px]">Início (Herdada Fiscal):</span>
                                                  <span className="font-bold text-green-900 text-[11px]">{formatDateDisplay(datas.pagamento_inicio)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                  <span className="text-zinc-500 font-medium">Status:</span>
                                                  <span className={cn(
                                                    "font-bold text-[10px] px-2 py-0.5 rounded",
                                                    datas.pagamento_status === 'Pago' ? 'bg-green-100 text-green-800' :
                                                    datas.pagamento_status === 'Programado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                  )}>
                                                    {datas.pagamento_status}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-zinc-500">Data Prevista:</span>
                                                  <span className="font-semibold text-blue-700">{formatDateDisplay(datas.pagamento_prevista)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-zinc-500 font-medium">Data Efetiva (Real):</span>
                                                  <span className="font-bold text-green-700">{formatDateDisplay(datas.pagamento_efetiva)}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t border-green-100">
                                                  <span className="text-zinc-500 font-medium">Valor Pago:</span>
                                                  <span className="font-bold text-zinc-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor || 0)}</span>
                                                </div>

                                                {tempoFiscalPagto !== null && (
                                                  <div className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-center">
                                                    Envio Fiscal → Pagamento: {tempoFiscalPagto} dia(s)
                                                  </div>
                                                )}

                                                {obs.pagamento_observacao && (
                                                  <div className="pt-2 border-t border-green-100">
                                                    <span className="text-[9px] font-semibold text-zinc-500 uppercase block mb-0.5">Observação:</span>
                                                    <p className="text-[10px] text-green-800 bg-green-50 p-1.5 rounded border border-green-200 italic line-clamp-2">
                                                      "{obs.pagamento_observacao}"
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Ocorrências ocultadas temporariamente */}
                                            {false && (
                                              <div className="mt-3 space-y-1.5">
                                                {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T4' || oc.t_origem === 'T4').map(oc => (
                                                  <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T4' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                    <div className="flex justify-between">
                                                      <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T4' ? 'text-red-700' : 'text-orange-700')}>
                                                        {oc.t_destino === 'T4' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                      </h5>
                                                    </div>
                                                    <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T4' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    );
                                  }

                                  // Fluxo 2 (Nexa Direto) - Exibição de 3 etapas
                                  return (
                                    <>
                                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                          Fluxo de Trabalho 2 (Nexa Direto)
                                        </h4>
                                        <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full font-semibold w-fit">
                                          Nexa Solicitação → Lançamento Fiscal → Pagamento
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* T1 - Nexa / Solicitação */}
                                        <div 
                                          className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-cyan-50/30"
                                          onClick={() => setSelectedStage({fatura, stage: "T1"})}
                                        >
                                          <div>
                                            <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                                            <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa / Solicitação</span>

                                            <div className="space-y-2.5 mt-3 text-xs">
                                              <div className="flex justify-between pb-1.5 border-b border-cyan-100">
                                                <span className="text-zinc-500 font-medium">Chamado:</span>
                                                <span className="font-bold text-zinc-900">{fatura.nexa_chamado || 'Pendente'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-zinc-500">Data Abertura:</span>
                                                <span className="font-bold text-cyan-800">{formatDateDisplay(datas.nexa_abertura)}</span>
                                              </div>
                                              {datas.nexa_conclusao && (
                                                <div className="flex justify-between text-[11px]">
                                                  <span className="text-zinc-500">Conclusão (Histórico):</span>
                                                  <span className="font-medium text-zinc-700">{formatDateDisplay(datas.nexa_conclusao)}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Ocorrências ocultadas temporariamente */}
                                          {false && (
                                            <div className="mt-3 space-y-1.5">
                                              {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T1' || oc.t_origem === 'T1').map(oc => (
                                                <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T1' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                  <div className="flex justify-between">
                                                    <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T1' ? 'text-red-700' : 'text-orange-700')}>
                                                      {oc.t_destino === 'T1' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                    </h5>
                                                  </div>
                                                  <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T1' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* T2 - Lançamento Fiscal */}
                                        <div 
                                          className="relative p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-400 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-slate-50/30"
                                          onClick={() => setSelectedStage({fatura, stage: "T2"})}
                                        >
                                          <div>
                                            <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T2</div>
                                            <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1 mt-1">Lançamento Fiscal</span>

                                            <div className="space-y-2.5 mt-3 text-xs">
                                              <div className="flex justify-between items-center py-1 px-1.5 rounded bg-slate-100 border border-slate-200">
                                                <span className="text-slate-600 font-semibold text-[11px]">Início (Herdada Nexa):</span>
                                                <span className="font-bold text-slate-900 text-[11px]">{formatDateDisplay(datas.fiscal_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-zinc-500 font-medium">Status:</span>
                                                <span className={cn("font-bold text-[11px] px-2 py-0.5 rounded", fatura.nexa_lancamento_concluido ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                                                  {fatura.nexa_lancamento_concluido ? 'Concluído' : 'Em andamento'}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-zinc-500">Conclusão Fiscal:</span>
                                                <span className="font-bold text-slate-800">{formatDateDisplay(datas.fiscal_conclusao)}</span>
                                              </div>

                                              {tempoNexaFiscal !== null && (
                                                <div className="text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-center">
                                                  Nexa → Fiscal: {tempoNexaFiscal} dia(s)
                                                </div>
                                              )}

                                              {obs.fiscal_observacao && (
                                                <div className="pt-2 border-t border-slate-100">
                                                  <span className="text-[9px] font-semibold text-zinc-500 uppercase block mb-0.5">Observação:</span>
                                                  <p className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 italic line-clamp-2">
                                                    "{obs.fiscal_observacao}"
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Ocorrências ocultadas temporariamente */}
                                          {false && (
                                            <div className="mt-3 space-y-1.5">
                                              {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T2' || oc.t_origem === 'T2').map(oc => (
                                                <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T2' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                  <div className="flex justify-between">
                                                    <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T2' ? 'text-red-700' : 'text-orange-700')}>
                                                      {oc.t_destino === 'T2' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                    </h5>
                                                  </div>
                                                  <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T2' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* T3 - Pagamento */}
                                        <div 
                                          className="relative p-4 bg-white rounded-xl border border-green-300 hover:border-green-400 transition-all shadow-sm flex flex-col justify-between cursor-pointer hover:bg-green-50/30"
                                          onClick={() => setSelectedStage({fatura, stage: "T3"})}
                                        >
                                          <div>
                                            <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T3</div>
                                            <span className="text-[11px] font-bold text-green-800 uppercase block mb-1 mt-1">Pagamento (Prog + Real)</span>

                                            <div className="space-y-2.5 mt-3 text-xs">
                                              <div className="flex justify-between items-center py-1 px-1.5 rounded bg-green-50/60 border border-green-200">
                                                <span className="text-green-700 font-semibold text-[11px]">Início (Herdada Fiscal):</span>
                                                <span className="font-bold text-green-900 text-[11px]">{formatDateDisplay(datas.pagamento_inicio)}</span>
                                              </div>
                                              <div className="flex justify-between items-center">
                                                <span className="text-zinc-500 font-medium">Status:</span>
                                                <span className={cn(
                                                  "font-bold text-[10px] px-2 py-0.5 rounded",
                                                  datas.pagamento_status === 'Pago' ? 'bg-green-100 text-green-800' :
                                                  datas.pagamento_status === 'Programado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                )}>
                                                  {datas.pagamento_status}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-zinc-500">Data Prevista:</span>
                                                <span className="font-semibold text-blue-700">{formatDateDisplay(datas.pagamento_prevista)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-zinc-500 font-medium">Data Efetiva (Real):</span>
                                                <span className="font-bold text-green-700">{formatDateDisplay(datas.pagamento_efetiva)}</span>
                                              </div>
                                              <div className="flex justify-between pt-1 border-t border-green-100">
                                                <span className="text-zinc-500 font-medium">Valor Pago:</span>
                                                <span className="font-bold text-zinc-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor || 0)}</span>
                                              </div>

                                              {tempoFiscalPagto !== null && (
                                                <div className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded text-center">
                                                  Envio Fiscal → Pagamento: {tempoFiscalPagto} dia(s)
                                                </div>
                                              )}

                                              {obs.pagamento_observacao && (
                                                <div className="pt-2 border-t border-green-100">
                                                  <span className="text-[9px] font-semibold text-zinc-500 uppercase block mb-0.5">Observação:</span>
                                                  <p className="text-[10px] text-green-800 bg-green-50 p-1.5 rounded border border-green-200 italic line-clamp-2">
                                                    "{obs.pagamento_observacao}"
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Ocorrências ocultadas temporariamente */}
                                          {false && (
                                            <div className="mt-3 space-y-1.5">
                                              {fatura?.ocorrencias?.filter(oc => oc.t_destino === 'T3' || oc.t_origem === 'T3').map(oc => (
                                                <div key={oc.id} className={cn("p-2 rounded-lg space-y-1 border", oc.t_destino === 'T3' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
                                                  <div className="flex justify-between">
                                                    <h5 className={cn("text-[10px] font-bold", oc.t_destino === 'T3' ? 'text-red-700' : 'text-orange-700')}>
                                                      {oc.t_destino === 'T3' ? `${oc.t_destino_codigo} - Ocorrência` : `${oc.t_origem_retorno_codigo} - Retorno`}
                                                    </h5>
                                                  </div>
                                                  <p className={cn("text-[9px] font-medium leading-tight", oc.t_destino === 'T3' ? 'text-red-600' : 'text-orange-600')}>{oc.motivo}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
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

                            {/* Histórico e Auditoria (Fase 4) */}
                            <div className="mt-8 pt-8 border-t border-zinc-200">
                              <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-amber-600" />
                                <h3 className="text-lg font-bold text-zinc-900">Histórico de Ciclos e SLAs</h3>
                              </div>
                              
                              {(() => {
                                // Build unified history
                                let history: any[] = [];
                                const addEvent = (cycle: number | string, code: string, name: string, startDate: any, endDate: any, slaDias: number, responsavel: any) => {
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
                                    addEvent(cycle, oc.t_destino_codigo, `Ocorrência (${oc.t_destino}) - ${oc.motivo}`, oc.destino_data_inicio || oc.data_envio, oc.destino_data_fim, 1, oc.destino_responsavel);
                                    addEvent(cycle, oc.t_origem_retorno_codigo, `Retorno (${oc.t_origem})`, oc.origem_data_inicio, oc.origem_data_fim, 1, oc.origem_responsavel);
                                  });
                                }

                                history.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

                                // Add the old manual periodos for legacy compatibility
                                if (faturaPeriodos && faturaPeriodos.length > 0) {
                                  faturaPeriodos.forEach((p, idx) => {
                                    history.push({
                                      cycle: 0,
                                      codigo: 'Man',
                                      nome: `Manual: ${p.etapa_nome} (${p.time_responsavel})`,
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
                                                  {ev.sla_dias > 0 ? `SLA: ${ev.sla_dias}d | Usado: ${diasAdicionados}d` : 'Sem SLA'}
                                                </span>
                                              </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1 text-[11px] text-zinc-600 mt-3 p-2 bg-zinc-50 rounded border border-zinc-100">
                                              <div className="flex justify-between"><span>Início:</span> <span className="font-medium text-zinc-800">{dInicio.toLocaleDateString('pt-BR')}</span></div>
                                              <div className="flex justify-between"><span>Término:</span> <span className="font-medium text-zinc-800">{ev.data_fim ? new Date(ev.data_fim).toLocaleDateString('pt-BR') : 'Pendente'}</span></div>
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
                                      <span className="font-medium">{formatDateDisplay(fatura.data_emissao)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-500">Vencimento</span>
                                      <span className="font-medium text-orange-600">{formatDateDisplay(fatura.data_vencimento)}</span>
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
