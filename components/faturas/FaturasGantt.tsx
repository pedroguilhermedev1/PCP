"use client";

import React, { useState, useMemo } from 'react';
import { Fatura, calcularEtapa } from '@/modules/compras/domain/Fatura';
import { cn } from '@/lib/utils';
import { Info, X } from 'lucide-react';

interface FaturasGanttProps {
  faturas: Fatura[];
}

export function FaturasGantt({ faturas }: FaturasGanttProps) {
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
        // Base Line: Recebimento -> Vencimento
        const dataBase = f.data_recebimento || f.data_emissao || f.data_vencimento;
        const prazoTotal = calculateDaysDiff(dataBase, f.data_vencimento);

        const calcRelativeDay = (dateStr?: string) => {
          if (!dateStr) return null;
          return calculateDaysDiff(dataBase, dateStr);
        };

        const etapaAtual = calcularEtapa(f);
        
        // Define stage boundaries (Dates)
        const startInt = dataBase;
        const endInt = f.data_abertura_heflo || (etapaAtual === 'Integração' ? todayStr : startInt);
        
        const startHeflo = f.data_abertura_heflo;
        const endHeflo = f.data_aprovacao || (etapaAtual === 'HEFLO' && startHeflo ? todayStr : startHeflo);

        const startErp = f.data_aprovacao;
        const endErp = f.data_abertura_v360 || (etapaAtual === 'ERP' && startErp ? todayStr : startErp);

        const startV360 = f.data_abertura_v360;
        const isV360Done = f.status_pagamento === 'Aguardando pagamento' || f.status_pagamento === 'Pago';
        const endV360 = isV360Done ? startV360 : (etapaAtual === 'V360' && startV360 ? todayStr : startV360);

        // Calculate metrics
        const totalDiasFluxo = calcRelativeDay(endV360 || endErp || endHeflo || endInt || todayStr) || 0;
        const diasRestantesMeta = prazoTotal - totalDiasFluxo;

        let riskStatus: 'green' | 'yellow' | 'red' = 'green';
        if (diasRestantesMeta < 0) riskStatus = 'red';
        else if (diasRestantesMeta <= 3) riskStatus = 'yellow';

        return {
          fatura: f,
          dataBase,
          prazoTotal,
          etapaAtual,
          totalDiasFluxo,
          diasRestantesMeta,
          riskStatus,
          stages: {
            integracao: { start: startInt, end: endInt, relStart: calcRelativeDay(startInt), relEnd: calcRelativeDay(endInt) },
            heflo: { start: startHeflo, end: endHeflo, relStart: calcRelativeDay(startHeflo), relEnd: calcRelativeDay(endHeflo) },
            erp: { start: startErp, end: endErp, relStart: calcRelativeDay(startErp), relEnd: calcRelativeDay(endErp) },
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
  }, [faturas, todayStr, filtroAno, filtroMes, filtroCD]);

  const selectedData = useMemo(() => {
    return processedFaturas.find(p => p.fatura.id === selectedFaturaId);
  }, [selectedFaturaId, processedFaturas]);

  // Viewport setup for Timeline
  const minDay = 0;
  // Encontra o max day baseado no maior prazoTotal ou no maior dia atual
  const maxDynamicDay = processedFaturas.reduce((max, pf) => Math.max(max, pf.prazoTotal, pf.totalDiasFluxo), 30);
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

  // Generate day headers (every 2 days to avoid crowding if maxDay is large)
  const step = totalDays > 40 ? 5 : totalDays > 20 ? 2 : 1;
  const dayHeaders = Array.from({ length: Math.floor(totalDays / step) + 1 }, (_, i) => i * step);

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

      <div className="flex flex-col lg:flex-row h-[500px] bg-white rounded-xl shadow-sm border border-zinc-200 w-full max-w-full">
        {processedFaturas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
            <Info className="w-10 h-10 mb-4 opacity-30" />
            <p className="font-medium text-zinc-600">Nenhuma fatura encontrada</p>
            <p className="text-sm mt-1">Tente ajustar os filtros acima.</p>
          </div>
        ) : (
          <>
            {/* LEFT & CENTER PANEL (GANTT) */}
            <div className="flex-1 flex flex-col relative overflow-x-auto overflow-y-hidden w-full">
          
          {/* TIMELINE HEADER */}
          <div className="flex sticky top-0 bg-white z-20 border-b border-zinc-200 w-full min-w-[600px]">
            <div className="w-[140px] shrink-0 border-r border-zinc-200 p-3 font-bold text-zinc-500 text-xs flex flex-col justify-center bg-white sticky left-0 z-30">
              FATURA
            </div>
            <div className="flex-1 relative min-h-[50px] bg-zinc-50/50">
              
              <div className="absolute inset-0 flex items-center justify-center px-4">
                 <span className="text-xs font-bold text-zinc-400">Dias de Processamento (Recebimento → Vencimento)</span>
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

              {processedFaturas.map((pf) => (
              <div 
                key={pf.fatura.id} 
                onClick={() => setSelectedFaturaId(pf.fatura.id)}
                className={cn(
                  "flex group cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 transition-colors relative z-0 min-h-[48px] py-1",
                  selectedFaturaId === pf.fatura.id ? "bg-blue-50 border-blue-200 z-20" : ""
                )}
              >
                {/* Row Label */}
                <div className="w-[140px] shrink-0 border-r border-zinc-200 px-2 flex items-center bg-white group-hover:bg-zinc-50 sticky left-0 z-30">
                  <div className="flex flex-col flex-1 truncate pr-2">
                    <span className="text-[11px] font-bold text-zinc-800 truncate">{pf.fatura.codigo_fatura || pf.fatura.numero_documento}</span>
                    <span className="text-[9px] text-zinc-500 truncate">{pf.fatura.fornecedor}</span>
                  </div>
                  {/* Risk Badge */}
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
                      width: getWidth(0, pf.prazoTotal) 
                    }}
                    title={`Prazo Total: ${pf.prazoTotal} dias`}
                  ></div>
                  
                  {/* Meta Marker */}
                  <div 
                    className="absolute top-0 bottom-0 border-l border-dashed border-zinc-400 z-0 pointer-events-none"
                    style={{ left: getLeftPos(pf.prazoTotal) }}
                  ></div>

                  {/* Stages */}
                  <div className="relative h-4 w-full flex items-center">
                    {/* Integração Bar */}
                    {pf.stages.integracao.relStart !== null && pf.stages.integracao.relEnd !== null && (
                      <div 
                        className="absolute h-full bg-red-400 rounded-l-sm shadow-sm z-10 hover:brightness-95 transition-all cursor-pointer"
                        style={{ 
                          left: getLeftPos(pf.stages.integracao.relStart), 
                          width: getWidth(pf.stages.integracao.relStart, pf.stages.integracao.relEnd) 
                        }}
                        title={`Integração: ${pf.stages.integracao.relEnd - pf.stages.integracao.relStart} dias`}
                      ></div>
                    )}

                    {/* Heflo Bar */}
                    {pf.stages.heflo.relStart !== null && pf.stages.heflo.relEnd !== null && (
                      <div 
                        className="absolute h-full bg-blue-400 shadow-sm z-10 hover:brightness-95 transition-all cursor-pointer"
                        style={{ 
                          left: getLeftPos(pf.stages.heflo.relStart), 
                          width: getWidth(pf.stages.heflo.relStart, pf.stages.heflo.relEnd) 
                        }}
                        title={`Heflo: ${pf.stages.heflo.relEnd - pf.stages.heflo.relStart} dias`}
                      ></div>
                    )}

                    {/* ERP Bar */}
                    {pf.stages.erp.relStart !== null && pf.stages.erp.relEnd !== null && (
                      <div 
                        className="absolute h-full bg-zinc-400 shadow-sm z-10 hover:brightness-95 transition-all cursor-pointer"
                        style={{ 
                          left: getLeftPos(pf.stages.erp.relStart), 
                          width: getWidth(pf.stages.erp.relStart, pf.stages.erp.relEnd) 
                        }}
                        title={`ERP: ${pf.stages.erp.relEnd - pf.stages.erp.relStart} dias`}
                      ></div>
                    )}

                    {/* V360 Bar */}
                    {pf.stages.v360.relStart !== null && pf.stages.v360.relEnd !== null && (
                      <div 
                        className="absolute h-full bg-orange-400 rounded-r-sm shadow-sm z-10 hover:brightness-95 transition-all cursor-pointer"
                        style={{ 
                          left: getLeftPos(pf.stages.v360.relStart), 
                          width: getWidth(pf.stages.v360.relStart, pf.stages.v360.relEnd) 
                        }}
                        title={`V360: ${pf.stages.v360.relEnd - pf.stages.v360.relStart} dias`}
                      ></div>
                    )}
                  </div>

                </div>
              </div>
            ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL (DETAILS) */}
        {selectedData && (
        <div className="w-full lg:w-[280px] border-t lg:border-t-0 lg:border-l border-zinc-200 bg-zinc-50 text-zinc-800 flex flex-col shrink-0">
          <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto relative">
              
              <button 
                onClick={() => setSelectedFaturaId(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 rounded-full transition-colors"
                title="Fechar detalhes"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-zinc-200 pb-3 pr-6">
                <h3 className="text-sm font-bold truncate mb-1">{selectedData.fatura.codigo_fatura || selectedData.fatura.numero_documento}</h3>
                <p className="text-[11px] text-zinc-500 font-medium">NF: {selectedData.fatura.numero_documento}</p>
                <p className="text-[11px] text-zinc-600 truncate">{selectedData.fatura.fornecedor}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", 
                    selectedData.riskStatus === 'red' ? 'bg-red-100 text-red-700' :
                    selectedData.riskStatus === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {selectedData.riskStatus === 'red' ? 'ATRASADO' : selectedData.riskStatus === 'yellow' ? 'ATENÇÃO' : 'NO PRAZO'}
                  </span>
                  <span className="bg-zinc-200 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded">
                    {selectedData.etapaAtual}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-100 pb-1">
                  <span className="text-zinc-500">CD:</span>
                  <span className="font-semibold text-right">{getFaturaCD(selectedData.fatura) || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-1">
                  <span className="text-zinc-500">Valor:</span>
                  <span className="font-semibold text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedData.fatura.valor)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-1">
                  <span className="text-zinc-500">Recebimento:</span>
                  <span className="font-semibold text-right">{selectedData.dataBase.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-zinc-800 font-semibold">Vencimento (Meta):</span>
                  <span className="font-bold text-zinc-900 text-right">{selectedData.fatura.data_vencimento?.split('-').reverse().join('/')}</span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <div className="bg-white p-2 rounded flex justify-between items-center border border-zinc-200 shadow-sm">
                  <span className="text-xs text-zinc-600">Dias Utilizados:</span>
                  <span className="font-bold text-sm text-zinc-900">{selectedData.totalDiasFluxo} de {selectedData.prazoTotal}</span>
                </div>
                
                <div className={cn("p-2 rounded flex justify-between items-center border",
                  selectedData.diasRestantesMeta < 0 ? "bg-red-50 border-red-200 text-red-700" :
                  selectedData.diasRestantesMeta <= 3 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                  "bg-green-50 border-green-200 text-green-700"
                )}>
                  <span className="text-xs font-semibold">Saldo de Dias:</span>
                  <span className="font-bold text-sm">
                    {selectedData.diasRestantesMeta < 0 ? `${selectedData.diasRestantesMeta} (Atraso)` : selectedData.diasRestantesMeta}
                  </span>
                </div>
              </div>

            </div>
        </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
