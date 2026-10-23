"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Package, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { extrairMetaDeObservacoes } from "@/lib/previsaoRecebimento";
import { cn } from "@/lib/utils";

interface PrevisaoEvento {
  faturaId: string;
  numeroDocumento: string;
  fornecedor: string;
  cd: string;
  itens: string[];
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  diasMin: number;
  diasMax: number;
  status: 'PENDENTE' | 'PARCIAL' | 'CONCLUIDO' | 'ENCERRADO';
}

interface SolicitacoesCalendarioProps {
  cd: string;
}

export function SolicitacoesCalendario({ cd }: SolicitacoesCalendarioProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [eventos, setEventos] = useState<PrevisaoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    dateFormatted: string;
    eventos: PrevisaoEvento[];
  } | null>(null);

  const formatCd = (name: string) =>
    name ? name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : "";

  const cdNormalized = formatCd(cd);

  const carregarPrevisoes = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Buscar faturas
      const { data: faturas, error: faturaErr } = await supabase
        .from('faturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (faturaErr || !faturas) {
        setEventos([]);
        return;
      }

      // 2. Buscar movimentacoes deste CD para saber status real de recebimento
      const { data: movs } = await supabase
        .from('estoque_movimentacoes')
        .select('*')
        .ilike('cd', cdNormalized);

      const listaEventos: PrevisaoEvento[] = [];

      for (const fat of faturas) {
        const rawInsumos = Array.isArray(fat.insumos) ? fat.insumos : [];
        const metaObj = rawInsumos.find((i: any) => i && i._meta) || {};
        
        const faturaCd = formatCd(fat.cd || metaObj.cd || rawInsumos[0]?.cd || '');
        
        // Insumos pertinentes a este CD
        const insumosDoCd = rawInsumos.filter((i: any) => {
          if (!i || i._meta) return false;
          if (i.cd) return formatCd(i.cd) === cdNormalized;
          return faturaCd === cdNormalized;
        });

        if (insumosDoCd.length === 0 && faturaCd !== cdNormalized) {
          continue;
        }

        // Previsão da fatura
        const diasMin = fat.previsao_recebimento_dias_min ?? metaObj.previsao_recebimento_dias_min;
        const diasMax = fat.previsao_recebimento_dias_max ?? metaObj.previsao_recebimento_dias_max;
        const dataInicio = fat.previsao_recebimento_data_inicio ?? metaObj.previsao_recebimento_data_inicio;
        const dataFim = fat.previsao_recebimento_data_fim ?? metaObj.previsao_recebimento_data_fim;

        if (!diasMin || !diasMax || !dataInicio || !dataFim) {
          // Fatura antiga sem previsão estimada
          continue;
        }

        // Identificar itens previstos exclusivos
        const nomesItens: string[] = Array.from(
          new Set(
            insumosDoCd
              .map((i: any) => (i.item || i.descricao || '').trim())
              .filter(Boolean)
          )
        );

        if (nomesItens.length === 0) continue;

        // Verificar status real de recebimento nas movimentacoes
        const movsFatura = (movs || []).filter(m => m.fatura_id === fat.id);
        let statusCalculado: 'PENDENTE' | 'PARCIAL' | 'CONCLUIDO' | 'ENCERRADO' = 'PENDENTE';

        if (movsFatura.length > 0) {
          const totalQtdPrev = movsFatura.reduce((acc, m) => {
            const { meta } = extrairMetaDeObservacoes(m.observacoes);
            const valPrev = meta.quantidade_prevista !== undefined ? meta.quantidade_prevista : (Number(m.quantidade) || 0);
            return acc + valPrev;
          }, 0);

          const totalQtdRec = movsFatura.reduce((acc, m) => {
            const { meta } = extrairMetaDeObservacoes(m.observacoes);
            const valRec = meta.quantidade_recebida !== undefined 
              ? meta.quantidade_recebida 
              : (m.status === 'Aprovada' || m.status === 'CONFIRMADO' ? Number(m.quantidade) || 0 : 0);
            return acc + valRec;
          }, 0);

          const temEncerrado = movsFatura.some(m => m.status === 'ENCERRADO');
          const todosConcluidos = movsFatura.every(m => m.status === 'Aprovada' || m.status === 'CONFIRMADO');

          if (todosConcluidos && totalQtdRec >= totalQtdPrev && totalQtdPrev > 0) {
            statusCalculado = 'CONCLUIDO';
          } else if (temEncerrado) {
            statusCalculado = 'ENCERRADO';
          } else if (totalQtdRec > 0) {
            statusCalculado = 'PARCIAL';
          }
        }

        listaEventos.push({
          faturaId: fat.id,
          numeroDocumento: fat.numero_documento || fat.id.split('__')[0] || 'Sem número',
          fornecedor: fat.fornecedor || 'Fornecedor não informado',
          cd: cdNormalized,
          itens: nomesItens,
          dataInicio: dataInicio.includes('T') ? dataInicio.split('T')[0] : dataInicio,
          dataFim: dataFim.includes('T') ? dataFim.split('T')[0] : dataFim,
          diasMin,
          diasMax,
          status: statusCalculado
        });
      }

      setEventos(listaEventos);
    } catch (e) {
      console.error("Erro ao carregar previsões do calendário:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPrevisoes();
  }, [cd]);

  // Navegação de mês
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate);
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Construção dos dias do calendário em semanas
  const weeks = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Dom, 6 = Sáb
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const resultWeeks: Array<Array<{
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }>> = [];

    let currentWeek: Array<{
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Dias do mês anterior para preencher a primeira semana
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateStr = d.toISOString().slice(0, 10);
      currentWeek.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Dias do mês atual
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      currentWeek.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });

      if (currentWeek.length === 7) {
        resultWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Dias do próximo mês para completar a última semana
    if (currentWeek.length > 0) {
      let nextMonthDay = 1;
      while (currentWeek.length < 7) {
        const d = new Date(currentYear, currentMonth + 1, nextMonthDay);
        const dateStr = d.toISOString().slice(0, 10);
        currentWeek.push({
          date: d,
          dateStr,
          dayNumber: nextMonthDay,
          isCurrentMonth: false,
          isToday: dateStr === todayStr
        });
        nextMonthDay++;
      }
      resultWeeks.push(currentWeek);
    }

    return resultWeeks;
  }, [currentYear, currentMonth]);

  // Função ao clicar em um dia
  const handleDayClick = (dateStr: string) => {
    const eventosNoDia = eventos.filter(ev => {
      return dateStr >= ev.dataInicio && dateStr <= ev.dataFim;
    });

    if (eventosNoDia.length === 0) return;

    const parts = dateStr.split('-');
    const dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

    // Agrupar por fornecedor para evitar duplicidades
    const porFornecedor: Record<string, PrevisaoEvento> = {};
    for (const ev of eventosNoDia) {
      if (!porFornecedor[ev.fornecedor]) {
        porFornecedor[ev.fornecedor] = { ...ev, itens: [...ev.itens] };
      } else {
        // Mesclar itens sem duplicados
        const itensExistentes = new Set(porFornecedor[ev.fornecedor].itens);
        ev.itens.forEach(it => itensExistentes.add(it));
        porFornecedor[ev.fornecedor].itens = Array.from(itensExistentes);
      }
    }

    setSelectedDayEvents({
      dateStr,
      dateFormatted,
      eventos: Object.values(porFornecedor)
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de cabeçalho do calendário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 text-base">{monthNameCapitalized}</h3>
            <p className="text-xs text-zinc-500">
              Previsões de entrega estimadas para o CD {cd.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8">
            Hoje
          </Button>
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 text-zinc-600 hover:text-zinc-900">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 text-zinc-600 hover:text-zinc-900">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legenda discreta */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
          <span>Período estimado pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
          <span>Recebimento parcial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          <span>Recebimento concluído</span>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 text-center text-xs font-semibold text-zinc-600">
          <div className="py-2.5 text-zinc-400">Dom</div>
          <div className="py-2.5">Seg</div>
          <div className="py-2.5">Ter</div>
          <div className="py-2.5">Qua</div>
          <div className="py-2.5">Qui</div>
          <div className="py-2.5">Sex</div>
          <div className="py-2.5 text-zinc-400">Sáb</div>
        </div>

        {/* Semanas */}
        <div className="divide-y divide-zinc-200">
          {weeks.map((week, weekIdx) => {
            const weekStartStr = week[0].dateStr;
            const weekEndStr = week[6].dateStr;

            // Encontrar eventos que cruzam esta semana
            const weekEvents = eventos.filter(ev => {
              return ev.dataInicio <= weekEndStr && ev.dataFim >= weekStartStr;
            });

            return (
              <div key={weekIdx} className="min-h-[105px] flex flex-col justify-between relative bg-white">
                {/* Grade de fundo dos 7 dias */}
                <div className="grid grid-cols-7 absolute inset-0 pointer-events-none divide-x divide-zinc-100">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className={cn(
                        "h-full transition-colors",
                        !day.isCurrentMonth && "bg-zinc-50/50",
                        day.isToday && "bg-purple-50/20"
                      )}
                    />
                  ))}
                </div>

                {/* Cabeçalhos numéricos dos dias */}
                <div className="grid grid-cols-7 relative z-10 pt-1.5 px-1">
                  {week.map((day, dIdx) => {
                    const hasEvents = eventos.some(ev => day.dateStr >= ev.dataInicio && day.dateStr <= ev.dataFim);
                    return (
                      <div
                        key={dIdx}
                        onClick={() => hasEvents && handleDayClick(day.dateStr)}
                        className={cn(
                          "flex items-center justify-between px-1.5 py-0.5 rounded-md cursor-default text-xs",
                          hasEvents && "cursor-pointer hover:bg-zinc-100/70"
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-full font-medium",
                            !day.isCurrentMonth && "text-zinc-300",
                            day.isCurrentMonth && !day.isToday && "text-zinc-700",
                            day.isToday && "bg-purple-600 text-white font-bold"
                          )}
                        >
                          {day.dayNumber}
                        </span>
                        {hasEvents && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse sm:hidden" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Faixas contínuas de eventos na semana */}
                <div className="relative z-10 flex flex-col gap-1 py-1 px-1 mt-1 mb-1">
                  {weekEvents.slice(0, 3).map((ev, evIdx) => {
                    // Calcular colunas de início e fim nesta semana (0 a 6)
                    const rawStart = week.findIndex(d => d.dateStr === ev.dataInicio);
                    const rawEnd = week.findIndex(d => d.dateStr === ev.dataFim);

                    const colStart = rawStart >= 0 ? rawStart : 0;
                    const colEnd = rawEnd >= 0 ? rawEnd : 6;

                    const startsThisWeek = rawStart >= 0;
                    const endsThisWeek = rawEnd >= 0;

                    const isSingleDay = colStart === colEnd;

                    // Estilo de cores conforme status
                    let barColors = "bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200/90";
                    if (ev.status === 'CONCLUIDO') {
                      barColors = "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/90";
                    } else if (ev.status === 'PARCIAL') {
                      barColors = "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200/90";
                    }

                    return (
                      <div
                        key={evIdx}
                        className="grid grid-cols-7 w-full"
                      >
                        <div
                          onClick={() => {
                            // Ao clicar na barra, abre o modal do dia inicial da fatura
                            handleDayClick(ev.dataInicio);
                          }}
                          style={{
                            gridColumnStart: colStart + 1,
                            gridColumnEnd: colEnd + 2
                          }}
                          className={cn(
                            "h-5 text-[11px] font-medium flex items-center px-2 cursor-pointer border shadow-2xs transition-all overflow-hidden truncate",
                            barColors,
                            startsThisWeek ? "rounded-l-md" : "rounded-l-none border-l-0 opacity-90",
                            endsThisWeek ? "rounded-r-md" : "rounded-r-none border-r-0 opacity-90",
                            isSingleDay && "rounded-md"
                          )}
                          title={`${ev.fornecedor} (${ev.itens.join(', ')})`}
                        >
                          <span className="truncate font-semibold">{ev.fornecedor}</span>
                          <span className="hidden sm:inline text-[10px] opacity-75 ml-1">
                            ({ev.itens.length} {ev.itens.length === 1 ? 'item' : 'itens'})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {weekEvents.length > 3 && (
                    <div className="text-[10px] text-zinc-500 font-medium px-2">
                      + {weekEvents.length - 3} outra(s) previsão(ões)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pop-up Resumo ao Clicar em um Dia (Requirement 11.3) */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Cabeçalho do Pop-up */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-zinc-900">
                  Previsões para {selectedDayEvents.dateFormatted}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                onClick={() => setSelectedDayEvents(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Conteúdo: Fornecedor e Itens Previstos */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedDayEvents.eventos.map((ev, idx) => (
                <div key={idx} className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Fornecedor
                      </span>
                      <p className="text-sm font-semibold text-zinc-900">{ev.fornecedor}</p>
                    </div>
                    {ev.status === 'CONCLUIDO' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Recebido
                      </span>
                    ) : ev.status === 'PARCIAL' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Parcial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Previsto
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Itens Previstos
                    </span>
                    <ul className="space-y-1">
                      {ev.itens.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-xs text-zinc-700 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com botão de fechar */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDayEvents(null)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
