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

  const addDays = (dateStr: string, days: number) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const processedFaturas = useMemo(() => {
    return faturas
      .filter(f => f.data_vencimento && f.status_pagamento !== 'Pago') // Faturas ativas
      .filter(f => {
        // Aplicação dos filtros locais
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
        const limiteOperacional = addDays(f.data_vencimento, -10);
        
        const calcRelativeDay = (dateStr?: string) => {
          if (!dateStr) return null;
          return calculateDaysDiff(limiteOperacional, dateStr);
        };

        const etapaAtual = calcularEtapa(f);
        
        // Define stage boundaries
        const startInt = f.data_recebimento || f.data_emissao || f.data_abertura_heflo || limiteOperacional; // fallback if missing
        const endInt = f.data_abertura_heflo || (etapaAtual === 'Integração' ? todayStr : startInt);
        
        const startHeflo = f.data_abertura_heflo;
        const endHeflo = f.data_aprovacao || (etapaAtual === 'HEFLO' && startHeflo ? todayStr : startHeflo);

        const startErp = f.data_aprovacao;
        const endErp = f.data_abertura_v360 || (etapaAtual === 'ERP' && startErp ? todayStr : startErp);

        const startV360 = f.data_abertura_v360;
        const isV360Done = f.status_pagamento === 'Aguardando pagamento' || f.status_pagamento === 'Pago';
        const endV360 = isV360Done ? startV360 : (etapaAtual === 'V360' && startV360 ? todayStr : startV360);

        // Calculate metrics
        const totalDiasFluxo = calculateDaysDiff(startInt, endV360 || endErp || endHeflo || endInt || todayStr);
        const diasRestantesMeta = calcRelativeDay(todayStr) !== null ? -(calcRelativeDay(todayStr)!) : 0;

        let riskStatus: 'green' | 'yellow' | 'red' = 'green';
        if (isV360Done) {
           const fimV360Day = calcRelativeDay(startV360);
           if (fimV360Day !== null && fimV360Day > 0) riskStatus = 'red';
        } else {
           if (diasRestantesMeta < 0) riskStatus = 'red';
           else if (diasRestantesMeta <= 3) riskStatus = 'yellow';
        }

        return {
          fatura: f,
          limiteOperacional,
          etapaAtual,
          totalDiasFluxo,
          diasRestantesMeta,
          riskStatus,
          stages: {
            integracao: { start: startInt, end: endInt, relStart: calcRelativeDay(startInt), relEnd: calcRelativeDay(endInt), sla: 1 },
            heflo: { start: startHeflo, end: endHeflo, relStart: calcRelativeDay(startHeflo), relEnd: calcRelativeDay(endHeflo), sla: 4 },
            erp: { start: startErp, end: endErp, relStart: calcRelativeDay(startErp), relEnd: calcRelativeDay(endErp), sla: 1 },
            v360: { start: startV360, end: endV360, relStart: calcRelativeDay(startV360), relEnd: calcRelativeDay(endV360), sla: 4 }
          }
        };
      })
      .sort((a, b) => {
        // Sort by risk (red > yellow > green) and then by date
        const riskOrder = { 'red': 0, 'yellow': 1, 'green': 2 };
        if (riskOrder[a.riskStatus] !== riskOrder[b.riskStatus]) {
          return riskOrder[a.riskStatus] - riskOrder[b.riskStatus];
        }
        return new Date(a.limiteOperacional).getTime() - new Date(b.limiteOperacional).getTime();
      });
  }, [faturas, todayStr, filtroAno, filtroMes, filtroCD]);

  const selectedData = useMemo(() => {
    return processedFaturas.find(p => p.fatura.id === selectedFaturaId);
  }, [selectedFaturaId, processedFaturas]);

  // Viewport setup for Timeline
  const minDay = -20;
  const maxDay = 10;
  const totalDays = maxDay - minDay;
  const getLeftPos = (day: number) => `${Math.max(0, Math.min(100, ((day - minDay) / totalDays) * 100))}%`;
  const getWidth = (startDay: number, endDay: number) => {
     let w = ((endDay - startDay) / totalDays) * 100;
     // Give a minimum width to visually show instantaneous steps
     if (w < 1.5 && startDay !== null && endDay !== null) w = 1.5;
     return `${Math.max(0, Math.min(100, w))}%`;
  };

  const totalFaturas = processedFaturas.length;
  const emRisco = processedFaturas.filter(p => p.riskStatus === 'red').length;
  const mediaDias = totalFaturas > 0 ? (processedFaturas.reduce((acc, curr) => acc + curr.totalDiasFluxo, 0) / totalFaturas).toFixed(1) : '0';

  // Remove early return to avoid React hook error
  // We will conditionally render the empty state instead.

  const uniqueCDs = useMemo(() => {
    const cds = new Set<string>();
    faturas.forEach(f => {
      const cd = getFaturaCD(f);
      if (cd && cd !== '-') {
        cds.add(cd.toLowerCase());
      }
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

  return (
    <div className="w-full mt-8 overflow-hidden">
      
      {/* HEADER GANTT & FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
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

      <div className="flex flex-col lg:flex-row h-[400px] bg-white rounded-xl shadow-sm border border-zinc-200">
        {processedFaturas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
            <Info className="w-10 h-10 mb-4 opacity-30" />
            <p className="font-medium text-zinc-600">Nenhuma fatura encontrada</p>
            <p className="text-sm mt-1">Tente ajustar os filtros acima.</p>
          </div>
        ) : (
          <>
            {/* LEFT & CENTER PANEL (GANTT) */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* TIMELINE HEADER */}
          <div className="flex sticky top-0 bg-white z-20 border-b border-zinc-200">
            <div className="w-[120px] shrink-0 border-r border-zinc-200 p-3 font-bold text-zinc-500 text-xs flex items-center">
              FATURA
            </div>
            <div className="flex-1 relative min-h-[50px]">
              
              <div className="absolute inset-0 flex items-center">
                <div className="flex-1 text-center border-r border-dashed border-zinc-200 text-xs font-bold text-red-600">Integração</div>
                <div className="flex-1 text-center border-r border-dashed border-zinc-200 text-xs font-bold text-blue-600">Heflo</div>
                <div className="flex-1 text-center border-r border-dashed border-zinc-200 text-xs font-bold text-zinc-600">ERP</div>
                <div className="flex-1 text-center text-xs font-bold text-orange-600">V360</div>
              </div>

              {/* Day markers */}
              <div className="absolute bottom-0 w-full h-4 border-t border-zinc-100 flex text-[10px] font-medium text-zinc-400">
                {[-15, -10, -5, 0, 5].map(d => (
                  <div key={d} className="absolute -translate-x-1/2" style={{ left: getLeftPos(d) }}>
                    {d === 0 ? 'Meta' : `${d} dias`}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROWS CONTAINER */}
          <div className="flex-1 flex flex-col relative overflow-y-auto pb-4">
            {/* LIMIT LINE */}
            <div className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-red-500 z-10 opacity-50" style={{ left: `calc(120px + ${getLeftPos(0)})` }}></div>

            {processedFaturas.map((pf) => (
              <div 
                key={pf.fatura.id} 
                onClick={() => setSelectedFaturaId(pf.fatura.id)}
                className={cn(
                  "flex group cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 transition-colors relative z-0 h-10",
                  selectedFaturaId === pf.fatura.id ? "bg-blue-50 border-blue-200 z-20" : ""
                )}
              >
                {/* Row Label */}
                <div className="w-[120px] shrink-0 border-r border-zinc-200 p-2 flex items-center bg-white group-hover:bg-zinc-50">
                  <div className="flex flex-col flex-1 truncate pr-2">
                    <span className="text-xs font-semibold text-zinc-800 truncate">{pf.fatura.numero_documento}</span>
                  </div>
                  {/* Risk Badge */}
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    pf.riskStatus === 'red' ? 'bg-red-500' :
                    pf.riskStatus === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                  )}></div>
                </div>

                {/* Row Timeline */}
                <div className="flex-1 relative h-full">
                  {/* Grid lines */}
                  {[-15, -10, -5, 5].map(d => (
                    <div key={d} className="absolute top-0 bottom-0 w-px bg-zinc-100 z-0" style={{ left: getLeftPos(d) }}></div>
                  ))}

                  {/* Integração Bar */}
                  {pf.stages.integracao.relStart !== null && pf.stages.integracao.relEnd !== null && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 h-4 bg-red-400 rounded-l shadow-sm z-10 hover:h-6 hover:z-20 transition-all cursor-pointer"
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
                      className="absolute top-1/2 -translate-y-1/2 h-4 bg-blue-400 shadow-sm z-10 hover:h-6 hover:z-20 transition-all cursor-pointer"
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
                      className="absolute top-1/2 -translate-y-1/2 h-4 bg-zinc-400 shadow-sm z-10 hover:h-6 hover:z-20 transition-all cursor-pointer"
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
                      className="absolute top-1/2 -translate-y-1/2 h-4 bg-orange-400 rounded-r shadow-sm z-10 hover:h-6 hover:z-20 transition-all cursor-pointer"
                      style={{ 
                        left: getLeftPos(pf.stages.v360.relStart), 
                        width: getWidth(pf.stages.v360.relStart, pf.stages.v360.relEnd) 
                      }}
                      title={`V360: ${pf.stages.v360.relEnd - pf.stages.v360.relStart} dias`}
                    ></div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT PANEL (DETAILS) */}
        <div className="w-full lg:w-[280px] border-t lg:border-t-0 lg:border-l border-zinc-200 bg-zinc-50 text-zinc-800 flex flex-col shrink-0">
          {selectedData ? (
            <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto relative">
              
              <button 
                onClick={() => setSelectedFaturaId(null)}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 rounded-full transition-colors"
                title="Fechar detalhes"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-zinc-200 pb-3 pr-6">
                <h3 className="text-sm font-bold truncate mb-1">{selectedData.fatura.numero_documento}</h3>
                <p className="text-xs text-zinc-600 truncate">{selectedData.fatura.fornecedor}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", 
                    selectedData.riskStatus === 'red' ? 'bg-red-100 text-red-700' :
                    selectedData.riskStatus === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {selectedData.riskStatus === 'red' ? 'RISCO ALTO' : selectedData.riskStatus === 'yellow' ? 'ATENÇÃO' : 'OK'}
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
                  <span className="text-zinc-500">Vencimento:</span>
                  <span className="font-semibold text-right">{selectedData.fatura.data_vencimento?.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-zinc-800 font-semibold">Limite Operacional:</span>
                  <span className="font-bold text-zinc-900 text-right">{selectedData.limiteOperacional.split('-').reverse().join('/')}</span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <div className="bg-white p-2 rounded flex justify-between items-center border border-zinc-200 shadow-sm">
                  <span className="text-xs text-zinc-600">Dias Utilizados:</span>
                  <span className="font-bold text-sm text-zinc-900">{selectedData.totalDiasFluxo}</span>
                </div>
                
                <div className={cn("p-2 rounded flex justify-between items-center border",
                  selectedData.diasRestantesMeta < 0 ? "bg-red-50 border-red-200 text-red-700" :
                  selectedData.diasRestantesMeta <= 3 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                  "bg-green-50 border-green-200 text-green-700"
                )}>
                  <span className="text-xs font-semibold">Dias p/ Meta:</span>
                  <span className="font-bold text-sm">
                    {selectedData.diasRestantesMeta < 0 ? `${selectedData.diasRestantesMeta} (Atraso)` : selectedData.diasRestantesMeta}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Selecione uma fatura para visualizar detalhes.</p>
            </div>
          )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
