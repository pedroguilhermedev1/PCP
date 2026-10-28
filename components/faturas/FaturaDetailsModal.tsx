import React from 'react';
import { Fatura, calcularStatus, calcularEtapa, getEtapasDatas, calcularTempoDias, parseObservacoes, isFaturaEfetivamentePaga } from "@/modules/compras/domain/Fatura";
import { formatCNPJ, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, ArrowRightLeft, Edit, FileText, Clock, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUserName } from "@/lib/roles";

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
                                const ehFluxoNexa = fatura.fluxo_iniciado_por === 'Nexa' || !fatura.is_sap;
                                const datas = getEtapasDatas(fatura);
                                const obs = parseObservacoes(fatura.observacoes);
                                const efetivamentePaga = isFaturaEfetivamentePaga(fatura);

                                const tempoRcAprov = calcularTempoDias(datas.sap_rc_criacao, datas.sap_rc_aprovacao);
                                const tempoSapNexa = calcularTempoDias(datas.sap_rc_aprovacao || datas.sap_pc_geracao, datas.nexa_abertura);
                                const tempoNexaFiscal = calcularTempoDias(datas.nexa_abertura, datas.fiscal_conclusao);
                                const tempoFiscalPagto = calcularTempoDias(datas.fiscal_conclusao, datas.pagamento_efetiva || datas.pagamento_prevista);

                                // Helper para cálculo de dias úteis entre datas
                                const calcDiasUteis = (dInicioStr?: string, dFimStr?: string): number | null => {
                                  if (!dInicioStr) return null;
                                  const start = new Date(dInicioStr.includes('T') ? dInicioStr : dInicioStr + 'T00:00:00');
                                  const end = dFimStr ? new Date(dFimStr.includes('T') ? dFimStr : dFimStr + 'T00:00:00') : new Date();
                                  start.setHours(0,0,0,0);
                                  end.setHours(0,0,0,0);
                                  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
                                  if (end < start) return 0;
                                  let dias = 0;
                                  let cur = new Date(start);
                                  while (cur < end) {
                                    cur.setDate(cur.getDate() + 1);
                                    const dw = cur.getDay();
                                    if (dw !== 0 && dw !== 6) dias++;
                                  }
                                  return dias;
                                };

                                interface TimelineItem {
                                  codigo: string;
                                  titulo: string;
                                  subtitulo: string;
                                  data_inicio?: string;
                                  data_inicio_herdada?: boolean;
                                  data_fim?: string;
                                  sla_dias: number;
                                  responsavel: string;
                                  status: 'concluido' | 'em_andamento' | 'pendente';
                                  dias_utilizados: number | null;
                                  estourou_sla: boolean;
                                  eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }>;
                                  motivo?: string;
                                  observacao?: string;
                                  is_ocorrencia?: boolean;
                                }

                                let items: TimelineItem[] = [];

                                if (!ehFluxoNexa) {
                                  // ========================================================
                                  // FLUXO 1: SAP + Nexa (Sequência completa: T1 → T2 → T3 → T4)
                                  // ========================================================

                                  // --- T1: SAP (RC, Aprovação, PC) ---
                                  const t1Inicio = datas.sap_rc_criacao || fatura.rc_data_inicio || fatura.data_rc_sap || fatura.data_recebimento;
                                  const t1Fim = datas.sap_pc_geracao || fatura.data_pedido_sap || fatura.pc_data_fim;
                                  const t1Concluido = Boolean(datas.sap_pc_geracao || fatura.pedido_sap || fatura.doc_subsequente_criado);
                                  const t1EmAndamento = !t1Concluido && Boolean(t1Inicio || datas.sap_rc_aprovacao || fatura.rc_sap);
                                  const t1Status: 'concluido' | 'em_andamento' | 'pendente' = t1Concluido ? 'concluido' : (t1EmAndamento ? 'em_andamento' : 'pendente');
                                  const t1Dias = calcDiasUteis(t1Inicio, t1Fim);
                                  const t1Sla = 3;

                                  const t1Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Nº RC', valor: fatura.rc_sap || 'Pendente', destaque: !!fatura.rc_sap },
                                    { label: 'Criação da RC', valor: formatDateDisplay(datas.sap_rc_criacao) },
                                    { label: 'Aprovação da RC', valor: datas.sap_rc_aprovacao ? formatDateDisplay(datas.sap_rc_aprovacao) : 'Pendente', destaque: !!datas.sap_rc_aprovacao },
                                    { label: 'Nº Pedido (PC)', valor: fatura.pedido_sap || 'Pendente', destaque: !!fatura.pedido_sap },
                                    { label: 'Geração do PC', valor: datas.sap_pc_geracao ? formatDateDisplay(datas.sap_pc_geracao) : 'Pendente' },
                                    { label: 'Doc. Subsequente', valor: fatura.doc_subsequente_criado ? 'Criado' : 'Pendente', destaque: fatura.doc_subsequente_criado }
                                  ];
                                  if (tempoRcAprov !== null) {
                                    t1Eventos.push({ label: 'Criação → Aprovação', valor: `${tempoRcAprov} dia(s)` });
                                  }

                                  items.push({
                                    codigo: 'T1',
                                    titulo: 'SAP (RC, Aprovação, PC)',
                                    subtitulo: 'Requisição de Compras, Aprovação e Geração do Pedido',
                                    data_inicio: t1Inicio,
                                    data_fim: t1Concluido ? t1Fim : undefined,
                                    sla_dias: t1Sla,
                                    responsavel: fatura.responsavel_t1 || fatura.responsavel || 'Suprimentos / PCP',
                                    status: t1Status,
                                    dias_utilizados: t1Dias,
                                    estourou_sla: t1Dias !== null && t1Dias > t1Sla,
                                    eventos: t1Eventos
                                  });

                                  // --- T2: Nexa (Chamado) ---
                                  const t2Inicio = fatura.nexa_data_inicio || datas.sap_pc_geracao || datas.sap_rc_aprovacao || datas.nexa_abertura;
                                  const t2Fim = datas.nexa_conclusao || fatura.nexa_data_fim || (fatura.nexa_chamado && datas.nexa_abertura ? datas.nexa_abertura : undefined);
                                  const t2Concluido = Boolean(fatura.nexa_chamado || datas.nexa_abertura || fatura.nexa_data_envio || fatura.nexa_emitiu_nf || datas.fiscal_inicio);
                                  const t2EmAndamento = !t2Concluido && (t1Concluido || Boolean(fatura.nexa_data_inicio));
                                  const t2Status: 'concluido' | 'em_andamento' | 'pendente' = t2Concluido ? 'concluido' : (t2EmAndamento ? 'em_andamento' : 'pendente');
                                  const t2Dias = calcDiasUteis(t2Inicio, t2Fim);
                                  const t2Sla = 1;

                                  const t2Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Chamado / Ticket', valor: fatura.nexa_chamado || 'Aguardando abertura', destaque: !!fatura.nexa_chamado },
                                    { label: 'Data Abertura', valor: datas.nexa_abertura ? formatDateDisplay(datas.nexa_abertura) : 'Não registrada' },
                                    { label: 'Doc. Emitido?', valor: fatura.nexa_emitiu_nf ? 'Sim' : 'Não' },
                                    { label: 'Doc. Anexado?', valor: fatura.nexa_anexada ? 'Sim' : 'Não' }
                                  ];
                                  if (tempoSapNexa !== null) {
                                    t2Eventos.push({ label: 'SAP → Nexa', valor: `${tempoSapNexa} dia(s)` });
                                  }

                                  items.push({
                                    codigo: 'T2',
                                    titulo: 'Nexa (Abertura / Chamado)',
                                    subtitulo: 'Abertura do Chamado e Anexo de Documentos',
                                    data_inicio: t2Inicio,
                                    data_inicio_herdada: !fatura.nexa_data_inicio && !!(datas.sap_pc_geracao || datas.sap_rc_aprovacao),
                                    data_fim: t2Concluido ? t2Fim : undefined,
                                    sla_dias: t2Sla,
                                    responsavel: 'Nexa / Operação',
                                    status: t2Status,
                                    dias_utilizados: t2Dias,
                                    estourou_sla: t2Dias !== null && t2Dias > t2Sla,
                                    eventos: t2Eventos
                                  });

                                  // --- T3: Lançamento Fiscal ---
                                  const t3Inicio = fatura.fiscal_data_inicio || datas.nexa_abertura || datas.nexa_inicio;
                                  const t3Fim = datas.fiscal_conclusao || fatura.fiscal_data_fim || fatura.nexa_data_conclusao_lancamento;
                                  const t3Concluido = Boolean(fatura.nexa_lancamento_concluido || datas.fiscal_conclusao);
                                  const t3EmAndamento = !t3Concluido && t2Concluido;
                                  const t3Status: 'concluido' | 'em_andamento' | 'pendente' = t3Concluido ? 'concluido' : (t3EmAndamento ? 'em_andamento' : 'pendente');
                                  const t3Dias = calcDiasUteis(t3Inicio, t3Fim);
                                  const t3Sla = 3;

                                  const t3Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Lançamento Concluído?', valor: fatura.nexa_lancamento_concluido ? 'Sim' : 'Não', destaque: fatura.nexa_lancamento_concluido },
                                    { label: 'Conclusão Fiscal', valor: datas.fiscal_conclusao ? formatDateDisplay(datas.fiscal_conclusao) : 'Pendente' },
                                    { label: 'Usuário Fiscal', valor: formatUserName(fatura.usuario_nexa_lancamento) || 'Não atribuído' }
                                  ];
                                  if (tempoNexaFiscal !== null) {
                                    t3Eventos.push({ label: 'Nexa → Fiscal', valor: `${tempoNexaFiscal} dia(s)` });
                                  }
                                  if (obs.fiscal_observacao) {
                                    t3Eventos.push({ label: 'Observação', valor: obs.fiscal_observacao });
                                  }

                                  items.push({
                                    codigo: 'T3',
                                    titulo: 'Lançamento Fiscal',
                                    subtitulo: 'Validação e Escrituração Fiscal no Nexa',
                                    data_inicio: t3Inicio,
                                    data_inicio_herdada: !fatura.fiscal_data_inicio && !!(datas.nexa_abertura || datas.nexa_inicio),
                                    data_fim: t3Concluido ? t3Fim : undefined,
                                    sla_dias: t3Sla,
                                    responsavel: formatUserName(fatura.usuario_nexa_lancamento) || 'Fiscal',
                                    status: t3Status,
                                    dias_utilizados: t3Dias,
                                    estourou_sla: t3Dias !== null && t3Dias > t3Sla,
                                    eventos: t3Eventos
                                  });

                                  // --- T4: Programação e Pagamento ---
                                  const t4Inicio = fatura.pagamento_data_inicio || fatura.prog_data_inicio || datas.fiscal_conclusao;
                                  const t4Fim = datas.pagamento_efetiva || fatura.data_pagamento_real || fatura.pagamento_data_fim;
                                  const t4Concluido = efetivamentePaga;
                                  const t4EmAndamento = !t4Concluido && (t3Concluido || Boolean(fatura.nexa_pagamento_programado || datas.pagamento_prevista));
                                  const t4Status: 'concluido' | 'em_andamento' | 'pendente' = t4Concluido ? 'concluido' : (t4EmAndamento ? 'em_andamento' : 'pendente');
                                  const t4Dias = calcDiasUteis(t4Inicio, t4Fim);
                                  const t4Sla = 3;

                                  const t4Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Status do Pagamento', valor: datas.pagamento_status, destaque: t4Concluido },
                                    { label: 'Previsão Pagamento', valor: datas.pagamento_prevista ? formatDateDisplay(datas.pagamento_prevista) : 'Não programada' },
                                    { label: 'Pagamento Efetivo', valor: datas.pagamento_efetiva ? formatDateDisplay(datas.pagamento_efetiva) : 'Pendente', destaque: t4Concluido },
                                    { label: 'Forma de Pagamento', valor: fatura.forma_pagamento || '-' }
                                  ];
                                  if (tempoFiscalPagto !== null) {
                                    t4Eventos.push({ label: 'Fiscal → Pagamento', valor: `${tempoFiscalPagto} dia(s)` });
                                  }
                                  if (obs.pagamento_observacao) {
                                    t4Eventos.push({ label: 'Observação', valor: obs.pagamento_observacao });
                                  }

                                  items.push({
                                    codigo: 'T4',
                                    titulo: 'Programação e Pagamento',
                                    subtitulo: 'Programação Financeira e Baixa Efetiva',
                                    data_inicio: t4Inicio,
                                    data_inicio_herdada: !fatura.pagamento_data_inicio && !fatura.prog_data_inicio && !!datas.fiscal_conclusao,
                                    data_fim: t4Concluido ? t4Fim : undefined,
                                    sla_dias: t4Sla,
                                    responsavel: 'Financeiro',
                                    status: t4Status,
                                    dias_utilizados: t4Dias,
                                    estourou_sla: t4Dias !== null && t4Dias > t4Sla,
                                    eventos: t4Eventos
                                  });

                                } else {
                                  // ========================================================
                                  // FLUXO 2: Somente Nexa (Sequência completa: T1 → T2 → T3)
                                  // ========================================================

                                  // --- T1: Nexa / Solicitação ---
                                  const t1Inicio = fatura.nexa_data_inicio || datas.nexa_abertura || fatura.data_recebimento;
                                  const t1Fim = datas.nexa_conclusao || fatura.nexa_data_fim || datas.nexa_abertura;
                                  const t1Concluido = Boolean(fatura.nexa_chamado || datas.nexa_abertura || datas.nexa_conclusao || datas.fiscal_inicio);
                                  const t1EmAndamento = !t1Concluido && Boolean(t1Inicio);
                                  const t1Status: 'concluido' | 'em_andamento' | 'pendente' = t1Concluido ? 'concluido' : (t1EmAndamento ? 'em_andamento' : 'pendente');
                                  const t1Dias = calcDiasUteis(t1Inicio, t1Fim);
                                  const t1Sla = 1;

                                  const t1Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Chamado / Ticket', valor: fatura.nexa_chamado || 'Aguardando abertura', destaque: !!fatura.nexa_chamado },
                                    { label: 'Data de Abertura', valor: datas.nexa_abertura ? formatDateDisplay(datas.nexa_abertura) : 'Não registrada' },
                                    { label: 'Doc. Emitido?', valor: fatura.nexa_emitiu_nf ? 'Sim' : 'Não' },
                                    { label: 'Doc. Anexado?', valor: fatura.nexa_anexada ? 'Sim' : 'Não' },
                                    { label: 'Responsável', valor: formatUserName(fatura.responsavel_t1) || 'Nexa / Operação' }
                                  ];

                                  items.push({
                                    codigo: 'T1',
                                    titulo: 'Nexa / Solicitação',
                                    subtitulo: 'Abertura de Chamado no Nexa e Anexo de Documentos',
                                    data_inicio: t1Inicio,
                                    data_fim: t1Concluido ? t1Fim : undefined,
                                    sla_dias: t1Sla,
                                    responsavel: formatUserName(fatura.responsavel_t1) || 'Nexa / Operação',
                                    status: t1Status,
                                    dias_utilizados: t1Dias,
                                    estourou_sla: t1Dias !== null && t1Dias > t1Sla,
                                    eventos: t1Eventos
                                  });

                                  // --- T2: Lançamento Fiscal ---
                                  const t2Inicio = fatura.fiscal_data_inicio || datas.nexa_abertura || datas.nexa_inicio;
                                  const t2Fim = datas.fiscal_conclusao || fatura.fiscal_data_fim || fatura.nexa_data_conclusao_lancamento;
                                  const t2Concluido = Boolean(fatura.nexa_lancamento_concluido || datas.fiscal_conclusao);
                                  const t2EmAndamento = !t2Concluido && t1Concluido;
                                  const t2Status: 'concluido' | 'em_andamento' | 'pendente' = t2Concluido ? 'concluido' : (t2EmAndamento ? 'em_andamento' : 'pendente');
                                  const t2Dias = calcDiasUteis(t2Inicio, t2Fim);
                                  const t2Sla = 1;

                                  const t2Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Lançamento Concluído?', valor: fatura.nexa_lancamento_concluido ? 'Sim' : 'Não', destaque: fatura.nexa_lancamento_concluido },
                                    { label: 'Conclusão Fiscal', valor: datas.fiscal_conclusao ? formatDateDisplay(datas.fiscal_conclusao) : 'Pendente' },
                                    { label: 'Usuário Fiscal', valor: formatUserName(fatura.usuario_nexa_lancamento) || 'Não atribuído' }
                                  ];
                                  if (tempoNexaFiscal !== null) {
                                    t2Eventos.push({ label: 'Nexa → Fiscal', valor: `${tempoNexaFiscal} dia(s)` });
                                  }
                                  if (obs.fiscal_observacao) {
                                    t2Eventos.push({ label: 'Observação', valor: obs.fiscal_observacao });
                                  }

                                  items.push({
                                    codigo: 'T2',
                                    titulo: 'Lançamento Fiscal',
                                    subtitulo: 'Escrituração Fiscal e Conferência no Nexa',
                                    data_inicio: t2Inicio,
                                    data_inicio_herdada: !fatura.fiscal_data_inicio && !!(datas.nexa_abertura || datas.nexa_inicio),
                                    data_fim: t2Concluido ? t2Fim : undefined,
                                    sla_dias: t2Sla,
                                    responsavel: formatUserName(fatura.usuario_nexa_lancamento) || 'Fiscal',
                                    status: t2Status,
                                    dias_utilizados: t2Dias,
                                    estourou_sla: t2Dias !== null && t2Dias > t2Sla,
                                    eventos: t2Eventos
                                  });

                                  // --- T3: Programação e Pagamento ---
                                  const t3Inicio = fatura.pagamento_data_inicio || fatura.prog_data_inicio || datas.fiscal_conclusao;
                                  const t3Fim = datas.pagamento_efetiva || fatura.data_pagamento_real || fatura.pagamento_data_fim;
                                  const t3Concluido = efetivamentePaga;
                                  const t3EmAndamento = !t3Concluido && (t2Concluido || Boolean(fatura.nexa_pagamento_programado || datas.pagamento_prevista));
                                  const t3Status: 'concluido' | 'em_andamento' | 'pendente' = t3Concluido ? 'concluido' : (t3EmAndamento ? 'em_andamento' : 'pendente');
                                  const t3Dias = calcDiasUteis(t3Inicio, t3Fim);
                                  const t3Sla = 3;

                                  const t3Eventos: Array<{ label: string; valor: string | React.ReactNode; destaque?: boolean }> = [
                                    { label: 'Status do Pagamento', valor: datas.pagamento_status, destaque: t3Concluido },
                                    { label: 'Previsão Pagamento', valor: datas.pagamento_prevista ? formatDateDisplay(datas.pagamento_prevista) : 'Não programada' },
                                    { label: 'Pagamento Efetivo', valor: datas.pagamento_efetiva ? formatDateDisplay(datas.pagamento_efetiva) : 'Pendente', destaque: t3Concluido },
                                    { label: 'Forma de Pagamento', valor: fatura.forma_pagamento || '-' }
                                  ];
                                  if (tempoFiscalPagto !== null) {
                                    t3Eventos.push({ label: 'Fiscal → Pagamento', valor: `${tempoFiscalPagto} dia(s)` });
                                  }
                                  if (obs.pagamento_observacao) {
                                    t3Eventos.push({ label: 'Observação', valor: obs.pagamento_observacao });
                                  }

                                  items.push({
                                    codigo: 'T3',
                                    titulo: 'Programação e Pagamento',
                                    subtitulo: 'Programação Financeira e Quitação Efetiva',
                                    data_inicio: t3Inicio,
                                    data_inicio_herdada: !fatura.pagamento_data_inicio && !fatura.prog_data_inicio && !!datas.fiscal_conclusao,
                                    data_fim: t3Concluido ? t3Fim : undefined,
                                    sla_dias: t3Sla,
                                    responsavel: 'Financeiro',
                                    status: t3Status,
                                    dias_utilizados: t3Dias,
                                    estourou_sla: t3Dias !== null && t3Dias > t3Sla,
                                    eventos: t3Eventos
                                  });
                                }

                                // Ocorrências registradas
                                if (fatura.ocorrencias && fatura.ocorrencias.length > 0) {
                                  fatura.ocorrencias.forEach((oc, index) => {
                                    const ocInicio = oc.destino_data_inicio || oc.data_envio;
                                    const ocFim = oc.destino_data_fim;
                                    const ocDias = calcDiasUteis(ocInicio, ocFim);
                                    items.push({
                                      codigo: oc.t_destino_codigo || `OC.${index + 1}`,
                                      titulo: `Ocorrência (${oc.t_destino || 'Retorno'})`,
                                      subtitulo: oc.motivo || 'Ocorrência registrada no fluxo',
                                      data_inicio: ocInicio,
                                      data_fim: ocFim,
                                      sla_dias: 1,
                                      responsavel: oc.destino_responsavel || 'Operação',
                                      status: ocFim ? 'concluido' : 'em_andamento',
                                      dias_utilizados: ocDias,
                                      estourou_sla: ocDias !== null && ocDias > 1,
                                      eventos: [
                                        { label: 'Origem', valor: oc.t_origem || '-' },
                                        { label: 'Destino', valor: oc.t_destino || '-' },
                                        { label: 'Motivo', valor: oc.motivo || '-' }
                                      ],
                                      is_ocorrencia: true,
                                      motivo: oc.motivo
                                    });
                                  });
                                }

                                return (
                                  <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                                    {items.map((item, idx) => {
                                      const isConcluido = item.status === 'concluido';
                                      const isEmAndamento = item.status === 'em_andamento';
                                      const atrasado = item.estourou_sla;

                                      const nodeBg = isConcluido 
                                        ? (atrasado ? 'bg-red-600 text-white border-red-200' : 'bg-emerald-600 text-white border-emerald-200')
                                        : isEmAndamento 
                                          ? 'bg-amber-500 text-white border-amber-200 ring-4 ring-amber-100' 
                                          : 'bg-zinc-200 text-zinc-600 border-zinc-300';

                                      const badgeClass = isConcluido 
                                        ? (atrasado ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                        : isEmAndamento 
                                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                          : 'bg-zinc-100 text-zinc-600 border-zinc-200';

                                      const badgeText = isConcluido 
                                        ? (atrasado ? 'Concluído com Atraso' : 'Concluído no Prazo')
                                        : isEmAndamento 
                                          ? 'Em Andamento' 
                                          : 'Aguardando Início';

                                      return (
                                        <div key={idx} className="relative group">
                                          {/* Indicador do nó no eixo vertical */}
                                          <div className={cn(
                                            "absolute -left-6 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-xs z-10 transition-transform",
                                            nodeBg
                                          )}>
                                            {item.codigo}
                                          </div>

                                          {/* Card do histórico da etapa */}
                                          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition-all p-5">
                                            {/* Cabeçalho do Card */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-zinc-900 text-sm">{item.titulo}</span>
                                                  {item.is_ocorrencia && (
                                                    <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                      Ocorrência
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-0.5">{item.subtitulo}</p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", badgeClass)}>
                                                  {badgeText}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Grid: Início, Conclusão, Duração e SLA */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs bg-zinc-50/70 rounded-lg p-3 my-3 border border-zinc-100">
                                              <div>
                                                <span className="text-zinc-500 text-[11px] block font-medium">Data de Início</span>
                                                <span className="font-semibold text-zinc-800">
                                                  {item.data_inicio ? (
                                                    <>
                                                      {formatDateDisplay(item.data_inicio)}
                                                      {item.data_inicio_herdada && (
                                                        <span className="ml-1 text-[10px] text-zinc-400 font-normal">(herdada)</span>
                                                      )}
                                                    </>
                                                  ) : (
                                                    <span className="text-zinc-400 font-normal">Aguardando início</span>
                                                  )}
                                                </span>
                                              </div>

                                              <div>
                                                <span className="text-zinc-500 text-[11px] block font-medium">Data de Conclusão</span>
                                                <span className="font-semibold text-zinc-800">
                                                  {item.data_fim ? (
                                                    formatDateDisplay(item.data_fim)
                                                  ) : isConcluido ? (
                                                    <span className="text-emerald-700 font-medium">Concluído</span>
                                                  ) : isEmAndamento ? (
                                                    <span className="text-amber-700 font-medium">Em andamento</span>
                                                  ) : (
                                                    <span className="text-zinc-400 font-normal">Pendente</span>
                                                  )}
                                                </span>
                                              </div>

                                              <div>
                                                <span className="text-zinc-500 text-[11px] block font-medium">Duração & SLA</span>
                                                <span className="font-semibold text-zinc-800">
                                                  {item.dias_utilizados !== null ? (
                                                    <span className={atrasado ? "text-red-600" : "text-emerald-700"}>
                                                      {item.dias_utilizados} {item.dias_utilizados === 1 ? 'dia útil' : 'dias úteis'}
                                                      <span className="text-zinc-400 font-normal text-[10px] ml-1">
                                                        (SLA: {item.sla_dias}d)
                                                      </span>
                                                    </span>
                                                  ) : (
                                                    <span className="text-zinc-400 font-normal">
                                                      SLA padrão: {item.sla_dias} {item.sla_dias === 1 ? 'dia' : 'dias'}
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Eventos e Movimentações Relevantes */}
                                            <div>
                                              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-2">
                                                Eventos e Movimentações Relevantes
                                              </span>
                                              <div className="flex flex-wrap gap-2">
                                                {item.eventos.map((ev, eIdx) => (
                                                  <div 
                                                    key={eIdx}
                                                    className={cn(
                                                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors",
                                                      ev.destaque 
                                                        ? "bg-purple-50 text-purple-900 border-purple-200 font-medium" 
                                                        : "bg-white text-zinc-700 border-zinc-200"
                                                    )}
                                                  >
                                                    <span className="text-zinc-400 text-[11px] font-normal">{ev.label}:</span>
                                                    <span className="font-semibold">{ev.valor}</span>
                                                  </div>
                                                ))}
                                              </div>
                                              <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                                                <span>Responsável: <strong className="text-zinc-600 font-medium">{item.responsavel}</strong></span>
                                              </div>
                                            </div>
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
