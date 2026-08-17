"use client";

import React, { useState, useMemo } from "react";
import { Fatura } from "@/modules/compras/domain/Fatura";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateDesvioFatura } from "./actions";

// Ícones
import { Check, X, FileText, ChevronRight, Filter, Target, BarChart2 } from "lucide-react";

const PRAZO_MINIMO_ADERENCIA = 10;

function getLastFullWeekEnd() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const diffToLastSunday = day === 0 ? 7 : day;
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - diffToLastSunday);
  lastSunday.setHours(23, 59, 59, 999);
  return lastSunday;
}

function getWeekBoundaries(offsetWeeksAgo: number) {
  const end = getLastFullWeekEnd();
  end.setDate(end.getDate() - ((offsetWeeksAgo - 1) * 7));

  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function getIdealDate(fatura: Fatura) {
  if (!fatura.data_vencimento) return null;
  // Use T12:00:00 to avoid timezone shift issues parsing yyyy-MM-dd
  const ideal = new Date(fatura.data_vencimento + 'T12:00:00');
  ideal.setDate(ideal.getDate() - PRAZO_MINIMO_ADERENCIA);
  ideal.setHours(0,0,0,0);
  return ideal;
}

function isRealizado(fatura: Fatura) {
  return fatura.nexa_pagamento_programado === true || fatura.nexa_pagamento_realizado === true;
}

export default function ApresentacaoSemanalClient({ faturas }: { faturas: Fatura[] }) {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(1);
  const [agrupamento, setAgrupamento] = useState<"CD" | "Fornecedor">("CD");
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);

  // Form state
  const [motivo, setMotivo] = useState("");
  const [acao, setAcao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [statusAcao, setStatusAcao] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);

  // Calculate Weeks
  const w1 = useMemo(() => getWeekBoundaries(selectedWeekOffset), [selectedWeekOffset]);
  
  // Mapear faturas Planejadas da W-1
  const planejadasW1 = faturas.filter(f => {
    const ideal = getIdealDate(f);
    if (!ideal) return false;
    return ideal >= w1.start && ideal <= w1.end;
  });

  const realizadasW1 = planejadasW1.filter(isRealizado);
  const backlogW1 = planejadasW1.filter(f => !isRealizado(f));
  
  const aderenciaGeral = planejadasW1.length > 0 ? (realizadasW1.length / planejadasW1.length) * 100 : 0;

  // Matriz de Aderência (Grouping)
  const matriz = useMemo(() => {
    const map = new Map<string, { planejado: number, realizado: number }>();
    planejadasW1.forEach(f => {
      let key = agrupamento === "CD" ? (f.cd || "SEM CD") : (f.fornecedor || "SEM FORNECEDOR");
      // simplificar o nome do fornecedor para a matriz caber
      if (agrupamento === "Fornecedor" && key.length > 15) {
        key = key.substring(0, 15) + '...';
      }
      
      const stats = map.get(key) || { planejado: 0, realizado: 0 };
      stats.planejado++;
      if (isRealizado(f)) stats.realizado++;
      map.set(key, stats);
    });

    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats,
      aderencia: stats.planejado > 0 ? (stats.realizado / stats.planejado) * 100 : 0
    })).sort((a, b) => b.planejado - a.planejado); // sort by volume
  }, [planejadasW1, agrupamento]);

  // Motivos do Desvio (Chart Data)
  const motivosData = useMemo(() => {
    const counts = new Map<string, number>();
    backlogW1.forEach(f => {
      const motivo = f.motivo_desvio || "Não Classificado";
      counts.set(motivo, (counts.get(motivo) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [backlogW1]);

  // Evolução de Atraso (Aging)
  const agingData = useMemo(() => {
    let dias03 = 0;
    let dias47 = 0;
    let dias7mais = 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    backlogW1.forEach(f => {
      const ideal = getIdealDate(f);
      if (!ideal) return;
      const delay = differenceInDays(today, ideal);
      
      if (delay <= 3) dias03++;
      else if (delay <= 7) dias47++;
      else dias7mais++;
    });

    return [
      { name: "0-3 dias", count: dias03 },
      { name: "4-7 dias", count: dias47 },
      { name: "> 7 dias", count: dias7mais }
    ];
  }, [backlogW1]);

  const handleEditClick = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setMotivo(fatura.motivo_desvio || "");
    setAcao(fatura.acao_corretiva || "");
    setResponsavel(fatura.acao_responsavel || "");
    setStatusAcao(fatura.acao_status || "");
  };

  const handleSaveDesvio = async () => {
    if (!selectedFatura) return;
    setIsSaving(true);
    try {
      await updateDesvioFatura(selectedFatura.id, {
        motivo_desvio: motivo,
        acao_corretiva: acao,
        acao_responsavel: responsavel,
        acao_status: statusAcao
      });
      // Atualizar estado local
      selectedFatura.motivo_desvio = motivo;
      selectedFatura.acao_corretiva = acao;
      selectedFatura.acao_responsavel = responsavel;
      selectedFatura.acao_status = statusAcao;
      setSelectedFatura(null);
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 pb-24 max-w-[1600px] mx-auto space-y-8 font-sans">
      
      {/* Header WBR */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-purple-900 tracking-tight uppercase">Performance de Faturas 2.0</h1>
            <select 
              value={selectedWeekOffset} 
              onChange={e => setSelectedWeekOffset(Number(e.target.value))}
              className="bg-white border border-purple-200 text-purple-700 font-bold py-1.5 px-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer"
            >
              <option value={1}>W-1 (Semana Passada)</option>
              <option value={2}>W-2</option>
              <option value={3}>W-3</option>
              <option value={4}>W-4</option>
              <option value={5}>W-5</option>
              <option value={6}>W-6</option>
              <option value={7}>W-7</option>
              <option value={8}>W-8</option>
            </select>
          </div>
          <p className="text-zinc-500 font-medium mt-1">Aderência NF & Backlog - Visão W-{selectedWeekOffset} ({format(w1.start, 'dd/MM/yyyy')} a {format(w1.end, 'dd/MM/yyyy')})</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Aderência W-1</p>
            <p className={cn("text-4xl font-black", aderenciaGeral === 100 ? "text-emerald-500" : (aderenciaGeral >= 80 ? "text-amber-500" : "text-red-500"))}>
              {aderenciaGeral.toFixed(1)}%
            </p>
          </div>
          <div className="h-12 w-px bg-zinc-200"></div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Planejado</p>
                <p className="text-xl font-bold text-zinc-700">{planejadasW1.length}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Realizado</p>
                <p className="text-xl font-bold text-zinc-700">{realizadasW1.length}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Backlog</p>
                <p className="text-xl font-bold text-red-500">{backlogW1.length}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Tabela de Aderência W-1 */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            Matriz de Aderência
          </h2>
          <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
            <button 
              onClick={() => setAgrupamento('CD')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", agrupamento === 'CD' ? "bg-white text-purple-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
            >
              Visão CD
            </button>
            <button 
              onClick={() => setAgrupamento('Fornecedor')}
              className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", agrupamento === 'Fornecedor' ? "bg-white text-purple-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
            >
              Visão Fornecedor
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 font-bold text-xs uppercase bg-[#1e3a5f] text-white border-r border-[#2a4d7a] w-32">Dimensão</th>
                {matriz.map((item, i) => (
                  <th key={i} className="px-4 py-3 font-bold text-xs uppercase bg-[#1e3a5f] text-white text-center border-r border-[#2a4d7a] min-w-[120px]">
                    {item.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4 font-bold text-xs text-zinc-600 uppercase border-r border-zinc-100 bg-zinc-50">Aderência W-1</td>
                {matriz.map((item, i) => (
                  <td key={i} className={cn(
                    "px-4 py-4 font-bold text-center border-r border-zinc-100",
                    item.aderencia === 100 ? "bg-emerald-50 text-emerald-600" : (item.aderencia === 0 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600")
                  )}>
                    {item.aderencia.toFixed(0)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-3 font-bold text-xs text-zinc-500 uppercase border-r border-zinc-100">Volume Planejado</td>
                {matriz.map((item, i) => (
                  <td key={i} className="px-4 py-3 font-medium text-center text-zinc-500 border-r border-zinc-100">
                    {item.planejado}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos Lado a Lado */}
      <div className="grid grid-cols-2 gap-8">
        
        {/* Motivos */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden p-6">
           <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600" />
            Motivo do Backlog (Qtd. Faturas)
          </h2>
          <div className="h-64">
             {motivosData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={motivosData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [value, "Qtd"]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#1e3a5f" radius={[0, 4, 4, 0]} barSize={24}>
                       {motivosData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.name === 'Não Classificado' ? '#e2e8f0' : '#1e3a5f'} />
                       ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">Nenhum desvio na W-1! 🎉</div>
             )}
          </div>
        </div>

        {/* Evolução / Tempo Parado */}
        <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden p-6">
           <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            Evolução por Tempo de Atraso
          </h2>
          <div className="h-64">
            {backlogW1.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [value, "Qtd"]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#1e3a5f" radius={[4, 4, 0, 0]} barSize={60} label={{ position: 'top', fill: '#1e3a5f', fontWeight: 'bold' }} />
                  </BarChart>
               </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">Nenhum atraso registrado.</div>
            )}
          </div>
        </div>

      </div>

      {/* Tabela de Backlog / Apontamento de Planos de Ação */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden mt-8">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
          <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-500" />
            Faturas em Backlog (Ação Necessária)
          </h2>
        </div>
        {backlogW1.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Nenhuma fatura em backlog.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Fatura / NF</th>
                  <th className="px-6 py-3 font-semibold">Fornecedor</th>
                  <th className="px-6 py-3 font-semibold">Data Ideal (Prazo 10d)</th>
                  <th className="px-6 py-3 font-semibold">Motivo Desvio</th>
                  <th className="px-6 py-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {backlogW1.map(f => {
                  const hasJustificativa = !!f.motivo_desvio || !!f.acao_corretiva;
                  const isExpanded = expandedFaturaId === f.id;
                  return (
                  <React.Fragment key={f.id}>
                    <tr onClick={() => setExpandedFaturaId(isExpanded ? null : f.id)} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-700">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={cn("w-4 h-4 text-zinc-400 transition-transform", isExpanded && "rotate-90")} />
                          <div>
                            {f.tipo_documento || f.id.split('__')[0]}
                            <div className="text-zinc-400 font-sans mt-0.5 font-normal">NF: {f.numero_documento || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-800">
                        {f.fornecedor}
                        <div className="text-zinc-500 text-xs font-normal mt-0.5">{f.cd || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-100">
                          {format(getIdealDate(f)!, 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {f.motivo_desvio ? (
                          <span className="text-zinc-700 font-medium bg-zinc-100 px-2.5 py-1 rounded-md text-xs">{f.motivo_desvio}</span>
                        ) : (
                          <span className="text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md text-xs border border-amber-200">Não classificado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(f); }} 
                          className={cn(
                            "text-xs font-bold px-3 py-1.5 rounded-md transition-colors",
                            hasJustificativa 
                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200" 
                              : "text-purple-600 bg-purple-50 hover:bg-purple-100"
                          )}
                        >
                          {hasJustificativa ? "Justificado" : "Justificar"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && hasJustificativa && (
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <td colSpan={5} className="px-12 py-6">
                          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm grid grid-cols-3 gap-6">
                            <div className="col-span-3 lg:col-span-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Ação Corretiva</span>
                              <p className="text-sm text-zinc-700 font-medium leading-relaxed">{f.acao_corretiva || 'Nenhuma ação preenchida.'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Responsável</span>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                  {f.acao_responsavel ? f.acao_responsavel.substring(0, 2).toUpperCase() : '?'}
                                </div>
                                <span className="text-sm font-semibold text-zinc-800">{f.acao_responsavel || 'Não definido'}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Status da Ação</span>
                              <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-md",
                                f.acao_status === 'Concluído' ? "bg-emerald-100 text-emerald-700" :
                                f.acao_status === 'Em Andamento' ? "bg-blue-100 text-blue-700" :
                                "bg-zinc-200 text-zinc-700"
                              )}>
                                {f.acao_status || 'Pendente'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Justificativa */}
      {selectedFatura && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900 text-lg">Justificar Desvio</h3>
              <button onClick={() => setSelectedFatura(null)} className="text-zinc-400 hover:text-zinc-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Fatura</label>
                  <p className="font-semibold text-zinc-800">{selectedFatura.fornecedor} (NF: {selectedFatura.numero_documento})</p>
               </div>

               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Motivo Principal</label>
                  <select 
                    value={motivo} 
                    onChange={e => setMotivo(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="">Selecione um motivo...</option>
                    <option value="Atraso Fornecedor">Atraso Fornecedor</option>
                    <option value="Atraso Time de Compras">Atraso Time de Compras</option>
                    <option value="Atraso Time de Recebimento">Atraso Time de Recebimento</option>
                    <option value="Atraso Time de Pagamentos">Atraso Time de Pagamentos</option>
                    <option value="Outros">Outros</option>
                  </select>
               </div>

               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Ação Corretiva</label>
                  <textarea 
                    value={acao}
                    onChange={e => setAcao(e.target.value)}
                    placeholder="O que está sendo feito para resolver?"
                    className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    rows={3}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Responsável</label>
                    <input 
                      type="text" 
                      value={responsavel}
                      onChange={e => setResponsavel(e.target.value)}
                      placeholder="Nome do responsável"
                      className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Status da Ação</label>
                    <select 
                      value={statusAcao} 
                      onChange={e => setStatusAcao(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
              <button onClick={() => setSelectedFatura(null)} className="px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors text-sm">Cancelar</button>
              <button disabled={isSaving} onClick={handleSaveDesvio} className="px-6 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 rounded-lg transition-colors text-sm flex items-center gap-2">
                {isSaving ? "Salvando..." : <><Check className="w-4 h-4" /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
