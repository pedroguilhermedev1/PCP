"use client";

import React, { useState, useMemo } from 'react';
import { Fatura, calcularEtapa } from '@/modules/compras/domain/Fatura';
import { cn } from '@/lib/utils';
import { Info, ChevronDown, ChevronRight, Calendar, Activity, CheckCircle, Clock } from 'lucide-react';

interface FaturasGanttProps {
  faturas: Fatura[];
  flowType?: '1.0' | '2.0';
}

export function FaturasGantt({ faturas, flowType = '1.0' }: FaturasGanttProps) {
  const [selectedFaturaId, setSelectedFaturaId] = useState<string | null>(null);
  
  // Local Filters
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroCD, setFiltroCD] = useState<string>('todos');

  const getFaturaCD = (f: Fatura): string => {
    return f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '';
  };

  const calculateDaysDiff = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const calcMetaOperacional = (vencimentoStr?: string) => {
    if (!vencimentoStr) return null;
    const d = new Date(vencimentoStr + 'T00:00:00');
    d.setDate(d.getDate() - 10);
    return d.toISOString().split('T')[0];
  };

  const processedFaturas = useMemo(() => {
    return faturas
      .filter(f => f.data_vencimento && f.status_pagamento !== 'Pago') // Faturas ativas
      .filter(f => {
        // Filtros locais
        const d = new Date(f.data_emissao || (f as any).created_at || f.data_vencimento || new Date().toISOString());
        const ano = d.getFullYear().toString();
        const mes = (d.getMonth() + 1).toString().padStart(2, '0');
        
        if (filtroAno !== 'todos' && ano !== filtroAno) return false;
        if (filtroMes !== 'todos' && mes !== filtroMes) return false;
        
        if (filtroCD !== 'todos') {
          const lowerFiltro = filtroCD.toLowerCase();
          const cd = getFaturaCD(f)?.toLowerCase();
          if (cd !== lowerFiltro) return false;
        }
        return true;
      })
      .map(f => {
        const dataBase = f.data_recebimento || f.data_emissao || f.data_vencimento;
        const metaDate = calcMetaOperacional(f.data_vencimento) || f.data_vencimento;
        const prazoTotalOperacional = calculateDaysDiff(dataBase, metaDate);
        const diasAteVencimento = calculateDaysDiff(todayStr, f.data_vencimento);

        const calcRelativeDay = (dateStr?: string) => {
          if (!dateStr) return null;
          return calculateDaysDiff(dataBase, dateStr);
        };

        const etapaAtual = calcularEtapa(f);
        const isAguardandoOuPago = f.status_pagamento === 'Aguardando pagamento' || f.status_pagamento === 'Pago' || f.doc_subsequente_criado;
        
        // Define stage boundaries (Dates) based on flow type
        const startInt = dataBase;
        let endInt, startReq, endReq, startApr, endApr, startV360, endV360;

        if (flowType === '2.0') {
          endInt = f.data_rc_sap || (etapaAtual === 'Cadastro da NF' && !isAguardandoOuPago ? todayStr : startInt);
          
          startReq = f.data_rc_sap;
          endReq = f.data_pedido_sap || (etapaAtual === 'Requisição de Compras' && startReq && !isAguardandoOuPago ? todayStr : startReq);

          startApr = f.data_pedido_sap;
          endApr = isAguardandoOuPago ? startApr : (etapaAtual === 'Pedido de Compras' && startApr ? todayStr : startApr);

          startV360 = null;
          endV360 = null;
        } else {
          // Flow 1.0
          endInt = f.data_abertura_heflo || (etapaAtual === 'Cadastro da NF' && !isAguardandoOuPago ? todayStr : startInt);
          
          startReq = f.data_abertura_heflo;
          endReq = f.data_aprovacao || (etapaAtual === 'Requisição de Compras' && startReq && !isAguardandoOuPago ? todayStr : startReq);

          startApr = f.data_aprovacao;
          endApr = f.data_abertura_v360 || (etapaAtual === 'Aprovação' && startApr && !isAguardandoOuPago ? todayStr : startApr);

          startV360 = f.data_abertura_v360;
          endV360 = isAguardandoOuPago ? startV360 : (etapaAtual === 'Inclusão no V360' && startV360 ? todayStr : startV360);
        }

        // Calculate metrics
        const totalDiasFluxo = calcRelativeDay(endV360 || endApr || endReq || endInt || startInt) || 0;
        const diasRestantesMeta = prazoTotalOperacional - totalDiasFluxo;

        let riskStatus: 'green' | 'yellow' | 'red' = 'green';
        if (diasRestantesMeta < 0) riskStatus = 'red';
        else if (diasRestantesMeta <= 3) riskStatus = 'yellow';

        return {
          fatura: f,
          dataBase,
          metaDate,
          prazoTotalOperacional,
          diasAteVencimento,
          etapaAtual,
          totalDiasFluxo,
          diasRestantesMeta,
          riskStatus,
          isAguardandoOuPago,
          stages: {
            cadastro: { start: startInt, end: endInt, relStart: calcRelativeDay(startInt), relEnd: calcRelativeDay(endInt) },
            requisicao: { start: startReq, end: endReq, relStart: calcRelativeDay(startReq), relEnd: calcRelativeDay(endReq) },
            aprovacaoOuPedido: { start: startApr, end: endApr, relStart: calcRelativeDay(startApr), relEnd: calcRelativeDay(endApr) },
            v360: { start: startV360, end: endV360, relStart: calcRelativeDay(startV360), relEnd: calcRelativeDay(endV360) }
          }
        };
      })
      .sort((a, b) => {
        // Red > Yellow > Green
        const riskOrder = { 'red': 0, 'yellow': 1, 'green': 2 };
        if (riskOrder[a.riskStatus] !== riskOrder[b.riskStatus]) {
          return riskOrder[a.riskStatus] - riskOrder[b.riskStatus];
        }
        return a.diasRestantesMeta - b.diasRestantesMeta;
      });
  }, [faturas, todayStr, filtroAno, filtroMes, filtroCD, flowType]);

  // Viewport setup for Timeline
  const minDay = 0;
  const maxDynamicDay = processedFaturas.reduce((max, pf) => Math.max(max, pf.prazoTotalOperacional, pf.totalDiasFluxo), 30);
  const maxDay = maxDynamicDay + 5; // buffer de 5 dias
  const totalDays = maxDay - minDay;
  
  const getLeftPos = (day: number) => `${Math.max(0, Math.min(100, ((day - minDay) / totalDays) * 100))}%`;
  const getWidth = (startDay: number, endDay: number) => {
     let w = ((endDay - startDay) / totalDays) * 100;
     if (w < 0.5 && startDay !== null && endDay !== null) w = 0.5;
     return `${Math.max(0, Math.min(100, w))}%`;
  };

  const uniqueCDs = useMemo(() => {
    const cds = new Set<string>();
    faturas.forEach(f => {
      const cd = getFaturaCD(f);
      if (cd && cd !== '-') cds.add(cd.toLowerCase());
    });
    return Array.from(cds).sort();
  }, [faturas]);

  const availableAnos = useMemo(() => {
    const _anos = new Set<string>();
    faturas.forEach(f => {
      const d = new Date(f.data_emissao || (f as any).created_at || f.data_vencimento || new Date().toISOString());
      _anos.add(d.getFullYear().toString());
    });
    return Array.from(_anos).sort();
  }, [faturas]);

  const availableMeses = useMemo(() => {
    const _meses = new Set<string>();
    faturas.forEach(f => {
      const d = new Date(f.data_emissao || (f as any).created_at || f.data_vencimento || new Date().toISOString());
      _meses.add((d.getMonth() + 1).toString().padStart(2, '0'));
    });
    return Array.from(_meses).sort();
  }, [faturas]);

  const mesLabels: Record<string, string> = {
    "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
    "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Set", "10": "Out", "11": "Nov", "12": "Dez"
  };

  const step = totalDays > 40 ? 5 : totalDays > 20 ? 2 : 1;
  const dayHeaders = Array.from({ length: Math.floor(totalDays / step) + 1 }, (_, i) => i * step);

  const toggleAccordion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFaturaId === id) setSelectedFaturaId(null);
    else setSelectedFaturaId(id);
  };

  return (
    <div className="w-full mt-8 overflow-hidden flex-1">
      
      {/* HEADER GANTT & FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 w-full">
        <h2 className="text-lg font-bold text-zinc-800 shrink-0">Gantt Operacional</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">CD</span>
            <select 
              value={filtroCD} 
              onChange={(e) => setFiltroCD(e.target.value)}
              className="text-xs font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[60px]"
            >
              <option value="todos">Todos</option>
              {uniqueCDs.map(cd => <option key={cd} value={cd}>{cd.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Ano</span>
            <select 
              value={filtroAno} 
              onChange={(e) => setFiltroAno(e.target.value)}
              className="text-xs font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[60px]"
            >
              <option value="todos">Todos</option>
              {availableAnos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Mês</span>
            <select 
              value={filtroMes} 
              onChange={(e) => setFiltroMes(e.target.value)}
              className="text-xs font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[70px]"
            >
              <option value="todos">Todos</option>
              {availableMeses.map(m => <option key={m} value={m}>{mesLabels[m]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-zinc-200 w-full max-w-full">
        {processedFaturas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
            <Info className="w-10 h-10 mb-4 opacity-30" />
            <p className="font-medium text-zinc-600">Nenhuma fatura encontrada</p>
            <p className="text-sm mt-1">Tente ajustar os filtros acima.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative overflow-x-auto overflow-y-hidden w-full">
          
          {/* TIMELINE HEADER */}
          <div className="flex sticky top-0 bg-white z-20 border-b border-zinc-200 w-full min-w-[600px]">
            <div className="w-[160px] shrink-0 border-r border-zinc-200 p-3 font-bold text-zinc-500 text-xs flex flex-col justify-center bg-white sticky left-0 z-30">
              FATURA
            </div>
            <div className="flex-1 relative min-h-[50px] bg-zinc-50/50">
              
              <div className="absolute inset-0 flex items-center justify-center px-4">
                 <span className="text-xs font-bold text-zinc-400">Dias Operacionais (Recebimento → Meta 10 Dias)</span>
              </div>

              {/* Day markers */}
              <div className="absolute bottom-0 w-full h-4 border-t border-zinc-100 flex text-[10px] font-bold text-zinc-400">
                {dayHeaders.map(d => (
                  <div key={d} className="absolute -translate-x-1/2 border-l border-zinc-200 h-full pl-0.5" style={{ left: getLeftPos(d) }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROWS CONTAINER */}
          <div className="flex-1 overflow-y-auto pb-4 w-full min-w-[600px]">
            <div className="relative min-h-max flex flex-col w-full">

              {processedFaturas.map((pf) => {
                const isExpanded = selectedFaturaId === pf.fatura.id;
                
                return (
                <div 
                  key={pf.fatura.id} 
                  className={cn(
                    "flex flex-col border-b border-zinc-100 transition-colors relative z-0",
                    isExpanded ? "bg-zinc-50 border-blue-200 z-10 shadow-sm" : "hover:bg-zinc-50"
                  )}
                >
                  <div className="flex min-h-[48px] py-1 cursor-pointer" onClick={(e) => toggleAccordion(pf.fatura.id, e)}>
                    {/* Row Label */}
                    <div className="w-[160px] shrink-0 border-r border-zinc-200 px-2 flex items-center bg-white group-hover:bg-zinc-50 sticky left-0 z-30 gap-1">
                      <div className="text-zinc-400 hover:text-zinc-600 transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col flex-1 truncate pr-2">
                        <span className="text-[11px] font-bold text-zinc-800 truncate">{pf.fatura.codigo_fatura || pf.fatura.numero_documento}</span>
                        <span className="text-[9px] text-zinc-500 truncate">{pf.fatura.fornecedor}</span>
                      </div>
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0 shadow-sm",
                        pf.riskStatus === 'red' ? 'bg-red-500' :
                        pf.riskStatus === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                      )}></div>
                    </div>

                    {/* Row Timeline */}
                    <div className="flex-1 relative h-full flex flex-col justify-center px-0">
                      {/* Grid lines */}
                      {dayHeaders.map(d => (
                        <div 
                          key={d} 
                          className="absolute top-0 bottom-0 w-px z-0 pointer-events-none bg-zinc-100"
                          style={{ left: getLeftPos(d) }}
                        ></div>
                      ))}

                      {/* Base Line (Meta) */}
                      <div 
                        className="absolute h-6 bg-zinc-100 border border-zinc-200/60 rounded-sm z-0"
                        style={{ 
                          left: getLeftPos(0), 
                          width: getWidth(0, pf.prazoTotalOperacional) 
                        }}
                        title={`Meta: ${pf.prazoTotalOperacional} dias`}
                      ></div>
                      
                      {/* Meta Marker */}
                      <div 
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-red-400 z-0 pointer-events-none"
                        style={{ left: getLeftPos(pf.prazoTotalOperacional) }}
                        title="Meta Operacional"
                      ></div>

                      {/* Stages Composite Bar */}
                      <div className="relative h-4 w-full flex items-center">
                        {pf.stages.cadastro.relStart !== null && pf.stages.cadastro.relEnd !== null && (
                          <div 
                            className="absolute h-full bg-red-400 rounded-l-sm shadow-sm z-10"
                            style={{ left: getLeftPos(pf.stages.cadastro.relStart), width: getWidth(pf.stages.cadastro.relStart, pf.stages.cadastro.relEnd) }}
                            title={`Cadastro: ${pf.stages.cadastro.relEnd - pf.stages.cadastro.relStart} dias`}
                          ></div>
                        )}
                        {pf.stages.requisicao.relStart !== null && pf.stages.requisicao.relEnd !== null && (
                          <div 
                            className="absolute h-full bg-blue-400 shadow-sm z-10"
                            style={{ left: getLeftPos(pf.stages.requisicao.relStart), width: getWidth(pf.stages.requisicao.relStart, pf.stages.requisicao.relEnd) }}
                            title={`Requisição: ${pf.stages.requisicao.relEnd - pf.stages.requisicao.relStart} dias`}
                          ></div>
                        )}
                        {pf.stages.aprovacaoOuPedido.relStart !== null && pf.stages.aprovacaoOuPedido.relEnd !== null && (
                          <div 
                            className="absolute h-full bg-zinc-400 shadow-sm z-10"
                            style={{ left: getLeftPos(pf.stages.aprovacaoOuPedido.relStart), width: getWidth(pf.stages.aprovacaoOuPedido.relStart, pf.stages.aprovacaoOuPedido.relEnd) }}
                            title={`${flowType === '2.0' ? 'Pedido SAP' : 'Aprovação'}: ${pf.stages.aprovacaoOuPedido.relEnd - pf.stages.aprovacaoOuPedido.relStart} dias`}
                          ></div>
                        )}
                        {flowType === '1.0' && pf.stages.v360.relStart !== null && pf.stages.v360.relEnd !== null && (
                          <div 
                            className="absolute h-full bg-orange-400 rounded-r-sm shadow-sm z-10"
                            style={{ left: getLeftPos(pf.stages.v360.relStart), width: getWidth(pf.stages.v360.relStart, pf.stages.v360.relEnd) }}
                            title={`V360: ${pf.stages.v360.relEnd - pf.stages.v360.relStart} dias`}
                          ></div>
                        )}
                        {pf.isAguardandoOuPago && (
                          <div 
                            className="absolute h-full flex items-center justify-center z-10"
                            style={{ left: getLeftPos(pf.totalDiasFluxo), transform: 'translateX(-50%)' }}
                            title="Entregue ao Financeiro"
                          >
                            <div className="w-4 h-4 bg-emerald-500 rounded-sm border border-emerald-600 rotate-45 flex items-center justify-center"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="w-full bg-white border-t border-zinc-100 flex flex-col md:flex-row p-4 pl-[160px] gap-6 text-sm">
                      {/* Left Block: Resumo da Fatura & Financeiro */}
                      <div className="flex flex-col gap-4 min-w-[250px]">
                        <div>
                          <h4 className="font-bold text-zinc-800 text-xs uppercase mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> Detalhes Gerais</h4>
                          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs text-zinc-600">
                            <span className="font-medium text-zinc-500">NF:</span> <span>{pf.fatura.numero_documento}</span>
                            <span className="font-medium text-zinc-500">Fornecedor:</span> <span className="truncate">{pf.fatura.fornecedor}</span>
                            <span className="font-medium text-zinc-500">CD:</span> <span>{getFaturaCD(pf.fatura) || '-'}</span>
                            <span className="font-medium text-zinc-500">Valor:</span> <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pf.fatura.valor)}</span>
                          </div>
                        </div>

                        <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg">
                          <h4 className="font-bold text-indigo-900 text-xs uppercase mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Situação Financeira</h4>
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-indigo-700/70 font-medium">Vencimento Original:</span>
                              <span className="font-bold text-indigo-900">{pf.fatura.data_vencimento?.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-indigo-700/70 font-medium">Dias até o Vencimento:</span>
                              <span className={cn("font-bold px-2 py-0.5 rounded", pf.diasAteVencimento < 0 ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700")}>
                                {pf.diasAteVencimento < 0 ? 'Vencida' : `${pf.diasAteVencimento} dias`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Operacional & Etapas */}
                      <div className="flex flex-col gap-4 flex-1">
                        <div>
                          <h4 className="font-bold text-zinc-800 text-xs uppercase mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Situação Operacional</h4>
                          <div className="flex gap-4">
                            <div className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex flex-col justify-center items-center">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Status Atual</span>
                              <span className="text-sm font-bold text-zinc-800 text-center">{pf.etapaAtual}</span>
                            </div>
                            <div className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex flex-col justify-center items-center">
                              <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Meta Operacional</span>
                              <span className="text-sm font-bold text-zinc-800">{pf.metaDate?.split('-').reverse().join('/')}</span>
                            </div>
                            <div className={cn("flex-1 p-3 rounded-lg border flex flex-col justify-center items-center", 
                              pf.diasRestantesMeta < 0 ? "bg-red-50 border-red-200" :
                              pf.diasRestantesMeta <= 3 ? "bg-yellow-50 border-yellow-200" :
                              "bg-green-50 border-green-200"
                            )}>
                              <span className={cn("text-[10px] uppercase font-bold mb-1", 
                                pf.diasRestantesMeta < 0 ? "text-red-600/70" :
                                pf.diasRestantesMeta <= 3 ? "text-yellow-600/70" : "text-green-600/70"
                              )}>Saldo Operacional</span>
                              <span className={cn("text-lg font-bold leading-none", 
                                pf.diasRestantesMeta < 0 ? "text-red-700" :
                                pf.diasRestantesMeta <= 3 ? "text-yellow-700" : "text-green-700"
                              )}>
                                {pf.diasRestantesMeta < 0 ? `${pf.diasRestantesMeta} (Atraso)` : `${pf.diasRestantesMeta} dias`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-zinc-800 text-xs uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Linha do Tempo</h4>
                          <div className="flex flex-col gap-1">
                            {/* Breakdown */}
                            <div className="flex items-center text-xs gap-3">
                              <span className="w-[140px] text-zinc-500 flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400"></div> Cadastro da NF</span>
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded overflow-hidden flex">
                                <div className="bg-red-400 h-full" style={{ width: `${(Math.max(0, (pf.stages.cadastro.relEnd || 0) - (pf.stages.cadastro.relStart || 0)) / Math.max(1, pf.prazoTotalOperacional)) * 100}%` }}></div>
                              </div>
                              <span className="w-[40px] text-right font-medium text-zinc-700">{(pf.stages.cadastro.relEnd || 0) - (pf.stages.cadastro.relStart || 0)}d</span>
                            </div>

                            <div className="flex items-center text-xs gap-3">
                              <span className="w-[140px] text-zinc-500 flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-400"></div> Requisição de Compras</span>
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded overflow-hidden flex">
                                <div className="bg-blue-400 h-full" style={{ width: `${(Math.max(0, (pf.stages.requisicao.relEnd || 0) - (pf.stages.requisicao.relStart || 0)) / Math.max(1, pf.prazoTotalOperacional)) * 100}%` }}></div>
                              </div>
                              <span className="w-[40px] text-right font-medium text-zinc-700">{(pf.stages.requisicao.relEnd || 0) - (pf.stages.requisicao.relStart || 0)}d</span>
                            </div>

                            <div className="flex items-center text-xs gap-3">
                              <span className="w-[140px] text-zinc-500 flex items-center gap-1"><div className="w-2 h-2 rounded bg-zinc-400"></div> {flowType === '2.0' ? 'Pedido de Compras' : 'Aprovação'}</span>
                              <div className="flex-1 h-1.5 bg-zinc-100 rounded overflow-hidden flex">
                                <div className="bg-zinc-400 h-full" style={{ width: `${(Math.max(0, (pf.stages.aprovacaoOuPedido.relEnd || 0) - (pf.stages.aprovacaoOuPedido.relStart || 0)) / Math.max(1, pf.prazoTotalOperacional)) * 100}%` }}></div>
                              </div>
                              <span className="w-[40px] text-right font-medium text-zinc-700">{(pf.stages.aprovacaoOuPedido.relEnd || 0) - (pf.stages.aprovacaoOuPedido.relStart || 0)}d</span>
                            </div>

                            {flowType === '1.0' && (
                              <div className="flex items-center text-xs gap-3">
                                <span className="w-[140px] text-zinc-500 flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-400"></div> Inclusão no V360</span>
                                <div className="flex-1 h-1.5 bg-zinc-100 rounded overflow-hidden flex">
                                  <div className="bg-orange-400 h-full" style={{ width: `${(Math.max(0, (pf.stages.v360.relEnd || 0) - (pf.stages.v360.relStart || 0)) / Math.max(1, pf.prazoTotalOperacional)) * 100}%` }}></div>
                                </div>
                                <span className="w-[40px] text-right font-medium text-zinc-700">{(pf.stages.v360.relEnd || 0) - (pf.stages.v360.relStart || 0)}d</span>
                              </div>
                            )}

                            {pf.isAguardandoOuPago && (
                               <div className="flex items-center text-xs gap-3 mt-2 text-emerald-600 font-medium">
                                 <CheckCircle className="w-4 h-4" /> Entregue ao Financeiro ({pf.totalDiasFluxo} dias de fluxo)
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>

          </div>
        )}
      </div>
    </div>
  );
}
