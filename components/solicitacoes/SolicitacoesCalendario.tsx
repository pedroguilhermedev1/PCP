"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Filter,
  Info,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { extrairMetaDeObservacoes, calcularDatasPrevisao, formatarPeriodoEstimado } from "@/lib/previsaoRecebimento";
import { cn, formatUserName } from "@/lib/utils";
import { getUserRole, getUserCD } from "@/lib/roles";

export interface PrevisaoItem {
  item: string;
  codigo?: string;
  quantidadePrevista?: number;
  quantidadeRecebida?: number;
  saldoPendente?: number;
}

export interface PrevisaoEvento {
  id: string;
  faturaId?: string;
  numeroDocumento: string;
  fornecedor: string;
  cd: string;
  itens: string[];
  detalhesItens?: PrevisaoItem[];
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  diasMin: number;
  diasMax: number;
  status: 'PENDENTE' | 'PARCIAL' | 'CONCLUIDO' | 'ENCERRADO';
  origem: 'fatura' | 'movimentacao';
}

interface SolicitacoesCalendarioProps {
  cd: string;
  userRole?: string | null;
  userCD?: string | null;
}

// Configurações de cores e identificação visual por Centro de Distribuição
const CD_CONFIG: Record<string, {
  nome: string;
  sigla: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barBg: string;
  barBorder: string;
  barText: string;
  barHover: string;
  indicator: string;
}> = {
  fortaleza: {
    nome: 'Fortaleza',
    sigla: 'FOR',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    barBg: 'bg-purple-100/95',
    barBorder: 'border-purple-300',
    barText: 'text-purple-950',
    barHover: 'hover:bg-purple-200/90',
    indicator: 'bg-purple-600'
  },
  jundiai: {
    nome: 'Jundiaí',
    sigla: 'JDI',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    barBg: 'bg-blue-100/95',
    barBorder: 'border-blue-300',
    barText: 'text-blue-950',
    barHover: 'hover:bg-blue-200/90',
    indicator: 'bg-blue-600'
  },
  nse: {
    nome: 'NSE',
    sigla: 'NSE',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    barBg: 'bg-amber-100/95',
    barBorder: 'border-amber-300',
    barText: 'text-amber-950',
    barHover: 'hover:bg-amber-200/90',
    indicator: 'bg-amber-600'
  },
  coc: {
    nome: 'COC',
    sigla: 'COC',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    barBg: 'bg-emerald-100/95',
    barBorder: 'border-emerald-300',
    barText: 'text-emerald-950',
    barHover: 'hover:bg-emerald-200/90',
    indicator: 'bg-emerald-600'
  },
  psd: {
    nome: 'PSD',
    sigla: 'PSD',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    barBg: 'bg-indigo-100/95',
    barBorder: 'border-indigo-300',
    barText: 'text-indigo-950',
    barHover: 'hover:bg-indigo-200/90',
    indicator: 'bg-indigo-600'
  }
};

const CD_OPTIONS = [
  { value: 'todos', label: 'Todos os CDs' },
  { value: 'fortaleza', label: 'Fortaleza' },
  { value: 'jundiai', label: 'Jundiaí' },
  { value: 'nse', label: 'NSE' },
  { value: 'coc', label: 'COC' },
  { value: 'psd', label: 'PSD' }
];

export function SolicitacoesCalendario({ cd, userRole: propRole, userCD: propCD }: SolicitacoesCalendarioProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [eventos, setEventos] = useState<PrevisaoEvento[]>([]);
  const [loading, setLoading] = useState(true);

  // Usuário e permissões
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(propRole || null);
  const [currentUserCD, setCurrentUserCD] = useState<string | null>(propCD || null);

  const formatCd = (name?: string | null) =>
    name && typeof name === 'string'
      ? name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")
      : "";

  const cdNormalized = formatCd(cd);

  // Filtro de CD selecionado (padrão é o CD da página)
  const [selectedCd, setSelectedCd] = useState<string>(cdNormalized || 'todos');

  // Modais de detalhamento
  const [selectedEventModal, setSelectedEventModal] = useState<PrevisaoEvento | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    dateFormatted: string;
    eventos: PrevisaoEvento[];
  } | null>(null);

  // Obter permissões do usuário
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('pcp_user');
      if (user) {
        const role = getUserRole(user);
        const uCd = getUserCD(user);
        setCurrentUserRole(role);
        setCurrentUserCD(uCd);
      }
    }
  }, []);

  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';

  // Se o usuário for operacional, ele é estritamente restrito ao CD dele
  const effectiveSelectedCd = useMemo(() => {
    if (!isAdmin && currentUserCD) {
      return formatCd(currentUserCD);
    }
    return selectedCd;
  }, [isAdmin, currentUserCD, selectedCd]);

  const getCdConfig = (cdKey?: string | null) => {
    const norm = formatCd(cdKey || '');
    return CD_CONFIG[norm] || {
      nome: (cdKey || 'Geral').toUpperCase(),
      sigla: (cdKey || 'GER').slice(0, 3).toUpperCase(),
      badgeBg: 'bg-zinc-100',
      badgeText: 'text-zinc-700',
      badgeBorder: 'border-zinc-200',
      barBg: 'bg-zinc-100/95',
      barBorder: 'border-zinc-300',
      barText: 'text-zinc-900',
      barHover: 'hover:bg-zinc-200',
      indicator: 'bg-zinc-500'
    };
  };

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatBrDate = (dateStr?: string | null) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Carregar dados tanto de faturas quanto de aprovações pendentes (estoque_movimentacoes)
  const carregarPrevisoes = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Buscar faturas de compras não canceladas/excluídas
      const { data: faturas, error: faturaErr } = await supabase
        .from('faturas')
        .select('*')
        .or('excluido.is.null,excluido.eq.false')
        .order('created_at', { ascending: false });

      // 2. Buscar todas as movimentações de estoque (aprovações pendentes e histórico)
      const { data: movs, error: movErr } = await supabase
        .from('estoque_movimentacoes')
        .select('*')
        .order('data_hora', { ascending: false });

      const listaEventos: PrevisaoEvento[] = [];
      const faturasProcessadas = new Set<string>();

      // A) Extrair períodos de faturas
      if (faturas && faturas.length > 0) {
        for (const fat of faturas) {
          // Ignorar se cancelada
          const fatStatus = String(fat.status || '').toUpperCase();
          if (fatStatus.includes('CANCELAD') || fatStatus.includes('EXCLUID')) {
            continue;
          }

          const rawInsumos = Array.isArray(fat.insumos) ? fat.insumos : [];
          const metaObj = rawInsumos.find((i: any) => i && i._meta) || {};
          const subPrevisao = metaObj.previsao_recebimento || {};

          const fatCd = formatCd(fat.cd || metaObj.cd || rawInsumos[0]?.cd || '');

          // Extrair prazos e datas
          let diasMin = fat.previsao_recebimento_dias_min ?? metaObj.previsao_recebimento_dias_min ?? subPrevisao.dias_min;
          let diasMax = fat.previsao_recebimento_dias_max ?? metaObj.previsao_recebimento_dias_max ?? subPrevisao.dias_max;
          let dataInicio = fat.previsao_recebimento_data_inicio ?? metaObj.previsao_recebimento_data_inicio ?? subPrevisao.data_inicio;
          let dataFim = fat.previsao_recebimento_data_fim ?? metaObj.previsao_recebimento_data_fim ?? subPrevisao.data_fim;

          // Se faltam as datas mas existem dias úteis, calcular automaticamente a partir da data de criação
          if ((!dataInicio || !dataFim) && diasMin && diasMax) {
            const baseDate = fat.data_criacao || fat.created_at || fat.data_recebimento;
            if (baseDate) {
              const calc = calcularDatasPrevisao(baseDate, Number(diasMin), Number(diasMax));
              if (!dataInicio) dataInicio = calc.data_inicio;
              if (!dataFim) dataFim = calc.data_fim;
            }
          }

          if (!dataInicio || !dataFim) {
            continue;
          }

          // Higienizar strings de data (YYYY-MM-DD)
          let cleanInicio = dataInicio.includes('T') ? dataInicio.split('T')[0] : dataInicio.split(' ')[0];
          let cleanFim = dataFim.includes('T') ? dataFim.split('T')[0] : dataFim.split(' ')[0];

          if (cleanInicio > cleanFim) {
            const temp = cleanInicio;
            cleanInicio = cleanFim;
            cleanFim = temp;
          }

          // Identificar itens da fatura
          const validInsumos = rawInsumos.filter((i: any) => i && !i._meta);
          const nomesItens: string[] = Array.from(
            new Set(
              validInsumos
                .map((i: any) => (i.item || i.descricao || '').trim())
                .filter(Boolean)
            )
          );

          if (nomesItens.length === 0) continue;

          // Verificar movimentações correspondentes para determinar status real de entrega
          const movsFatura = (movs || []).filter(m => m.fatura_id === fat.id);
          let statusCalculado: 'PENDENTE' | 'PARCIAL' | 'CONCLUIDO' | 'ENCERRADO' = 'PENDENTE';

          const detalhesItens: PrevisaoItem[] = validInsumos.map((i: any) => {
            const movItem = movsFatura.find(m => m.codigo === i.codigo || m.item === i.item);
            let qtdPrev = Number(i.quantidade) || 0;
            let qtdRec = 0;
            if (movItem) {
              const { meta } = extrairMetaDeObservacoes(movItem.observacoes);
              qtdPrev = meta.quantidade_prevista ?? qtdPrev;
              qtdRec = meta.quantidade_recebida ?? (movItem.status === 'Aprovada' || movItem.status === 'CONFIRMADO' ? qtdPrev : 0);
            }
            return {
              item: i.item || i.descricao || 'Item sem nome',
              codigo: i.codigo,
              quantidadePrevista: qtdPrev,
              quantidadeRecebida: qtdRec,
              saldoPendente: Math.max(0, qtdPrev - qtdRec)
            };
          });

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

          const rawFatId = fat && fat.id != null ? String(fat.id) : '';
          const fatDocNum = fat.numero_documento || (rawFatId.includes('__') ? rawFatId.split('__')[0] : rawFatId) || 'Sem número';

          faturasProcessadas.add(rawFatId);

          listaEventos.push({
            id: `fat_${rawFatId}`,
            faturaId: rawFatId,
            numeroDocumento: fatDocNum,
            fornecedor: fat.fornecedor || 'Fornecedor não informado',
            cd: fatCd,
            itens: nomesItens,
            detalhesItens,
            dataInicio: cleanInicio,
            dataFim: cleanFim,
            diasMin: Number(diasMin) || 1,
            diasMax: Number(diasMax) || 1,
            status: statusCalculado,
            origem: 'fatura'
          });
        }
      }

      // B) Extrair períodos de aprovações pendentes em estoque_movimentacoes
      // (garante que itens cadastrados em Solicitações / Pendentes apareçam automaticamente)
      if (movs && movs.length > 0) {
        // Agrupar movimentações que compartilham o mesmo período e documento
        const movsComPrevisao = movs.filter(m => {
          const mStatus = String(m.status || '').toUpperCase();
          if (mStatus === 'REPROVADO' || mStatus === 'REJEITADO' || mStatus === 'CANCELADO' || mStatus === 'EXCLUIDO') {
            return false;
          }
          // Se já foi processada via fatura, não duplicar a faixa principal
          if (m.fatura_id && faturasProcessadas.has(m.fatura_id)) {
            return false;
          }
          const { meta } = extrairMetaDeObservacoes(m.observacoes);
          return !!(meta.previsao_data_inicio || (meta.previsao_dias_min && meta.previsao_dias_max));
        });

        // Agrupar por chave: CD + fatura_id/documento + dataInicio + dataFim
        const agrupadasPorChave: Record<string, {
          movs: typeof movs;
          cd: string;
          fornecedor: string;
          numeroDocumento: string;
          faturaId?: string;
          dataInicio: string;
          dataFim: string;
          diasMin: number;
          diasMax: number;
        }> = {};

        for (const m of movsComPrevisao) {
          const { meta, textoLegivel } = extrairMetaDeObservacoes(m.observacoes);
          let mDataInicio = meta.previsao_data_inicio;
          let mDataFim = meta.previsao_data_fim;
          let mDiasMin = meta.previsao_dias_min || 1;
          let mDiasMax = meta.previsao_dias_max || 1;

          if ((!mDataInicio || !mDataFim) && mDiasMin && mDiasMax) {
            const baseDate = meta.data_criacao_original || m.data_hora;
            if (baseDate) {
              const calc = calcularDatasPrevisao(baseDate, Number(mDiasMin), Number(mDiasMax));
              mDataInicio = calc.data_inicio;
              mDataFim = calc.data_fim;
            }
          }

          if (!mDataInicio || !mDataFim) continue;

          let cleanInicio = mDataInicio.includes('T') ? mDataInicio.split('T')[0] : mDataInicio.split(' ')[0];
          let cleanFim = mDataFim.includes('T') ? mDataFim.split('T')[0] : mDataFim.split(' ')[0];

          if (cleanInicio > cleanFim) {
            const temp = cleanInicio;
            cleanInicio = cleanFim;
            cleanFim = temp;
          }

          const mCd = formatCd(m.cd || '');
          let docNum = 'Solicitação';
          let fornecedor = 'Solicitação Interna';

          // Extrair informações legíveis de observações
          if (textoLegivel) {
            const parts = textoLegivel.split('|').map((p: string) => p.trim());
            for (const p of parts) {
              if (p.startsWith('Fatura ')) {
                docNum = p.replace('Fatura ', '').trim();
              } else if (p.toLowerCase().includes('fornecedor')) {
                fornecedor = p.replace(/fornecedor:?/i, '').trim();
              }
            }
          }

          if (m.empresa) fornecedor = m.empresa;
          const rawMFatId = m && m.fatura_id != null ? String(m.fatura_id) : '';
          if (rawMFatId && docNum === 'Solicitação') {
            docNum = rawMFatId.includes('__') ? rawMFatId.split('__')[0] : rawMFatId;
          }

          const chave = `${mCd}__${docNum}__${cleanInicio}__${cleanFim}`;
          if (!agrupadasPorChave[chave]) {
            agrupadasPorChave[chave] = {
              movs: [],
              cd: mCd,
              fornecedor,
              numeroDocumento: docNum,
              faturaId: m.fatura_id,
              dataInicio: cleanInicio,
              dataFim: cleanFim,
              diasMin: Number(mDiasMin) || 1,
              diasMax: Number(mDiasMax) || 1
            };
          }
          agrupadasPorChave[chave].movs.push(m);
        }

        // Criar eventos a partir das movimentações agrupadas
        for (const [chave, grupo] of Object.entries(agrupadasPorChave)) {
          const itensUnicos = Array.from(new Set(grupo.movs.map(m => m.item).filter(Boolean)));
          const detalhes: PrevisaoItem[] = grupo.movs.map(m => {
            const { meta } = extrairMetaDeObservacoes(m.observacoes);
            const qtdPrev = meta.quantidade_prevista ?? (Number(m.quantidade) || 0);
            const qtdRec = meta.quantidade_recebida ?? (m.status === 'Aprovada' || m.status === 'CONFIRMADO' ? qtdPrev : 0);
            return {
              item: m.item,
              codigo: m.codigo,
              quantidadePrevista: qtdPrev,
              quantidadeRecebida: qtdRec,
              saldoPendente: Math.max(0, qtdPrev - qtdRec)
            };
          });

          // Determinar status do grupo
          let statusCalculado: 'PENDENTE' | 'PARCIAL' | 'CONCLUIDO' | 'ENCERRADO' = 'PENDENTE';
          const totalPrev = detalhes.reduce((acc, d) => acc + (d.quantidadePrevista || 0), 0);
          const totalRec = detalhes.reduce((acc, d) => acc + (d.quantidadeRecebida || 0), 0);
          const todosConcluidos = grupo.movs.every(m => m.status === 'Aprovada' || m.status === 'CONFIRMADO');
          const temEncerrado = grupo.movs.some(m => m.status === 'ENCERRADO');

          if (todosConcluidos && totalRec >= totalPrev && totalPrev > 0) {
            statusCalculado = 'CONCLUIDO';
          } else if (temEncerrado) {
            statusCalculado = 'ENCERRADO';
          } else if (totalRec > 0) {
            statusCalculado = 'PARCIAL';
          }

          listaEventos.push({
            id: `mov_${chave}`,
            faturaId: grupo.faturaId,
            numeroDocumento: grupo.numeroDocumento,
            fornecedor: grupo.fornecedor,
            cd: grupo.cd,
            itens: itensUnicos,
            detalhesItens: detalhes,
            dataInicio: grupo.dataInicio,
            dataFim: grupo.dataFim,
            diasMin: grupo.diasMin,
            diasMax: grupo.diasMax,
            status: statusCalculado,
            origem: 'movimentacao'
          });
        }
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

  // Filtrar eventos de acordo com o CD selecionado
  const eventosFiltrados = useMemo(() => {
    if (effectiveSelectedCd === 'todos') {
      return eventos;
    }
    return eventos.filter(ev => ev.cd === effectiveSelectedCd);
  }, [eventos, effectiveSelectedCd]);

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

  // Construção segura dos dias do calendário em semanas (sem timezone drift)
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

    const todayStr = formatDateStr(new Date());

    // Dias do mês anterior para preencher a primeira semana
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateStr = formatDateStr(d);
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
        const dateStr = formatDateStr(d);
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

  // Função ao clicar em um dia específico
  const handleDayClick = (dateStr: string) => {
    if (!dateStr) return;
    const eventosNoDia = eventosFiltrados.filter(ev => {
      return ev && ev.dataInicio && ev.dataFim && dateStr >= ev.dataInicio && dateStr <= ev.dataFim;
    });

    if (eventosNoDia.length === 0) return;

    setSelectedDayEvents({
      dateStr,
      dateFormatted: formatBrDate(dateStr),
      eventos: eventosNoDia
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de cabeçalho do calendário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-700">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 text-lg leading-tight">{monthNameCapitalized}</h3>
              {loading && (
                <span className="text-[11px] text-zinc-400 animate-pulse">Atualizando...</span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {effectiveSelectedCd === 'todos' 
                ? 'Previsões estimadas de entrega para todos os Centros de Distribuição' 
                : `Previsões estimadas de entrega para o CD ${getCdConfig(effectiveSelectedCd).nome}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de CD (disponível para Admins; bloqueado para operacional) */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <label htmlFor="cd-filter" className="text-xs font-semibold text-zinc-600">CD:</label>
              <select
                id="cd-filter"
                value={selectedCd}
                onChange={(e) => setSelectedCd(e.target.value)}
                className="text-xs font-medium bg-transparent border-none text-zinc-800 focus:outline-none cursor-pointer pr-1"
              >
                {CD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1">
              <span className="text-xs font-semibold text-zinc-600">CD:</span>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded",
                getCdConfig(effectiveSelectedCd).badgeBg,
                getCdConfig(effectiveSelectedCd).badgeText
              )}>
                {getCdConfig(effectiveSelectedCd).nome}
              </span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8 font-medium">
            Hoje
          </Button>
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 text-zinc-600 hover:text-zinc-900" title="Mês anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 text-zinc-600 hover:text-zinc-900" title="Próximo mês">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legenda clara e informativa */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-zinc-600 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/80">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-300 inline-block shadow-2xs" />
            <span>Previsão estimada pendente</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 inline-block shadow-2xs" />
            <span>Recebimento parcial</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300 inline-block shadow-2xs" />
            <span>Recebimento concluído</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Faixas contínuas indicam a janela prevista de entrega (dias úteis). Clique na faixa para ver os detalhes.</span>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/90 text-center text-xs font-semibold text-zinc-600">
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

            // Encontrar eventos que cruzam os dias desta semana
            const weekEvents = eventosFiltrados
              .filter(ev => ev.dataInicio <= weekEndStr && ev.dataFim >= weekStartStr)
              .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

            return (
              <div 
                key={weekIdx} 
                className="min-h-[125px] flex flex-col justify-start relative bg-white pb-2"
              >
                {/* Grade de fundo dos 7 dias */}
                <div className="grid grid-cols-7 absolute inset-0 pointer-events-none divide-x divide-zinc-100">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className={cn(
                        "h-full transition-colors",
                        !day.isCurrentMonth && "bg-zinc-50/40",
                        day.isToday && "bg-purple-50/25"
                      )}
                    />
                  ))}
                </div>

                {/* Cabeçalhos numéricos dos dias */}
                <div className="grid grid-cols-7 relative z-10 pt-1.5 px-1">
                  {week.map((day, dIdx) => {
                    const dayEventsCount = eventosFiltrados.filter(
                      ev => day.dateStr >= ev.dataInicio && day.dateStr <= ev.dataFim
                    ).length;
                    const hasEvents = dayEventsCount > 0;

                    return (
                      <div
                        key={dIdx}
                        onClick={() => hasEvents && handleDayClick(day.dateStr)}
                        className={cn(
                          "flex items-center justify-between px-1.5 py-0.5 rounded-md cursor-default text-xs",
                          hasEvents && "cursor-pointer hover:bg-zinc-100/70"
                        )}
                        title={hasEvents ? `${dayEventsCount} previsão(ões) de entrega neste dia` : undefined}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-full font-medium transition-transform",
                            !day.isCurrentMonth && "text-zinc-300",
                            day.isCurrentMonth && !day.isToday && "text-zinc-700",
                            day.isToday && "bg-purple-600 text-white font-bold shadow-xs",
                            hasEvents && !day.isToday && "font-bold text-zinc-900"
                          )}
                        >
                          {day.dayNumber}
                        </span>

                        {hasEvents && (
                          <span 
                            className="text-[10px] font-bold px-1 py-0.2 rounded-full bg-purple-100 text-purple-700 sm:hidden"
                          >
                            {dayEventsCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Faixas contínuas de eventos na semana (Thick Horizontal Bars) */}
                <div className="relative z-10 flex flex-col gap-1.5 py-1 px-1 mt-1">
                  {weekEvents.slice(0, 4).map((ev, evIdx) => {
                    // Calcular colunas de início e fim nesta semana (0 = Dom, 6 = Sáb)
                    const rawStart = week.findIndex(d => d.dateStr === ev.dataInicio);
                    const rawEnd = week.findIndex(d => d.dateStr === ev.dataFim);

                    const colStart = rawStart >= 0 ? rawStart : 0;
                    const colEnd = rawEnd >= 0 ? rawEnd : 6;

                    const startsThisWeek = rawStart >= 0;
                    const endsThisWeek = rawEnd >= 0;
                    const isSingleDay = colStart === colEnd;

                    const cdConfig = getCdConfig(ev.cd);

                    // Estilo de cores conforme status e CD
                    let barColors = cn(
                      cdConfig.barBg,
                      cdConfig.barText,
                      cdConfig.barBorder,
                      cdConfig.barHover
                    );

                    if (ev.status === 'CONCLUIDO') {
                      barColors = "bg-emerald-100/95 text-emerald-950 border-emerald-300 hover:bg-emerald-200/90";
                    } else if (ev.status === 'PARCIAL') {
                      barColors = "bg-amber-100/95 text-amber-950 border-amber-300 hover:bg-amber-200/90";
                    }

                    const periodoLegivel = formatarPeriodoEstimado(
                      ev.diasMin,
                      ev.diasMax,
                      ev.dataInicio,
                      ev.dataFim
                    );

                    return (
                      <div
                        key={ev.id || evIdx}
                        className="grid grid-cols-7 w-full"
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventModal(ev);
                          }}
                          style={{
                            gridColumnStart: colStart + 1,
                            gridColumnEnd: colEnd + 2,
                            backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.015), rgba(0,0,0,0.015) 8px, transparent 8px, transparent 16px)'
                          }}
                          className={cn(
                            "h-7 sm:h-6.5 text-[11px] font-medium flex items-center px-2 cursor-pointer border shadow-2xs transition-all overflow-hidden truncate select-none group",
                            barColors,
                            // Bordas e arredondamento que indicam início, fim ou continuidade da faixa
                            startsThisWeek ? "rounded-l-md border-l-2" : "rounded-l-none border-l-0 opacity-95",
                            endsThisWeek ? "rounded-r-md border-r-2" : "rounded-r-none border-r-0 opacity-95",
                            isSingleDay && "rounded-md"
                          )}
                          title={`Previsão de Recebimento (${periodoLegivel})\nFornecedor: ${ev.fornecedor}\nCD: ${cdConfig.nome}\nItens: ${ev.itens.join(', ')}`}
                        >
                          {/* Seta indicando continuidade da semana anterior */}
                          {!startsThisWeek && (
                            <span className="text-[10px] font-black mr-1 text-zinc-500 shrink-0">
                              ←
                            </span>
                          )}

                          {/* Tag visual de CD quando vendo 'Todos os CDs' */}
                          {effectiveSelectedCd === 'todos' && (
                            <span className={cn(
                              "text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 mr-1.5 shadow-2xs border",
                              cdConfig.badgeBg,
                              cdConfig.badgeText,
                              cdConfig.badgeBorder
                            )}>
                              {cdConfig.sigla}
                            </span>
                          )}

                          {/* Tag de identificação explícita de Previsão */}
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/75 border border-black/5 shadow-2xs shrink-0 mr-1.5">
                            <Clock className="w-2.5 h-2.5 opacity-70" />
                            Previsão
                          </span>

                          {/* Nome do Fornecedor e itens previstos */}
                          <span className="truncate font-bold">
                            {ev.fornecedor}
                          </span>

                          <span className="hidden md:inline truncate text-[10px] opacity-80 ml-1.5">
                            · {ev.itens.join(', ')}
                          </span>

                          {/* Indicador de status */}
                          {ev.status === 'CONCLUIDO' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-200/80 px-1 py-0.2 rounded ml-auto shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Concluído
                            </span>
                          )}
                          {ev.status === 'PARCIAL' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1 py-0.2 rounded ml-auto shrink-0">
                              <Clock className="w-2.5 h-2.5" /> Parcial
                            </span>
                          )}

                          {/* Seta indicando continuidade para a próxima semana */}
                          {!endsThisWeek && (
                            <span className="text-[10px] font-black ml-auto pl-1 text-zinc-500 shrink-0">
                              →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {weekEvents.length > 4 && (
                    <div 
                      onClick={() => handleDayClick(week[0].dateStr)}
                      className="text-[10px] text-zinc-500 hover:text-purple-700 font-semibold px-2 cursor-pointer transition-colors"
                    >
                      + {weekEvents.length - 4} outra(s) previsão(ões) nesta semana
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Detalhes de uma Previsão Específica ao Clicar na Faixa */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                    Previsão Estimada de Recebimento
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Documento: {selectedEventModal.numeroDocumento}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                onClick={() => setSelectedEventModal(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Conteúdo */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Card de Informações Principais */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Fornecedor
                    </span>
                    <p className="text-sm font-bold text-zinc-900">{selectedEventModal.fornecedor}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      getCdConfig(selectedEventModal.cd).badgeBg,
                      getCdConfig(selectedEventModal.cd).badgeText,
                      getCdConfig(selectedEventModal.cd).badgeBorder
                    )}>
                      CD {getCdConfig(selectedEventModal.cd).nome}
                    </span>

                    {selectedEventModal.status === 'CONCLUIDO' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Recebido Concluído
                      </span>
                    ) : selectedEventModal.status === 'PARCIAL' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Recebimento Parcial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Previsão Pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Período Estimado em Destaque */}
                <div className="p-3 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Janela Estimada de Entrega
                      </span>
                      <p className="text-xs font-bold text-purple-900">
                        {formatBrDate(selectedEventModal.dataInicio)} até {formatBrDate(selectedEventModal.dataFim)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                    {selectedEventModal.diasMin === selectedEventModal.diasMax
                      ? `${selectedEventModal.diasMin} dias úteis`
                      : `${selectedEventModal.diasMin} a ${selectedEventModal.diasMax} dias úteis`}
                  </span>
                </div>

                {/* Aviso explicativo de previsão */}
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Esta faixa representa uma previsão estimada de chegada calculada em dias úteis. A entrega física pode ocorrer em qualquer dia dentro deste intervalo.
                  </span>
                </div>
              </div>

              {/* Lista detalhada de Itens Previstos */}
              <div>
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  Itens Previstos ({selectedEventModal.itens.length})
                </span>
                <div className="space-y-2">
                  {selectedEventModal.detalhesItens && selectedEventModal.detalhesItens.length > 0 ? (
                    selectedEventModal.detalhesItens.map((det, detIdx) => (
                      <div 
                        key={detIdx} 
                        className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-zinc-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-zinc-800">{det.item}</p>
                            {det.codigo && (
                              <span className="text-[10px] text-zinc-400">Código: {det.codigo}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-zinc-700">
                            Qtd: {det.quantidadePrevista || 0}
                          </span>
                          {det.saldoPendente !== undefined && det.saldoPendente > 0 && det.quantidadeRecebida !== undefined && det.quantidadeRecebida > 0 && (
                            <span className="block text-[10px] text-amber-600 font-semibold">
                              Saldo: {det.saldoPendente} pendente
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    selectedEventModal.itens.map((nome, nIdx) => (
                      <div key={nIdx} className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/70 text-xs font-medium text-zinc-800 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{nome}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé com botão de fechar */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEventModal(null)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Resumo de Todos os Eventos ao Clicar em um Dia do Calendário */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
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

            {/* Conteúdo com os eventos do dia */}
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-zinc-500 mb-2">
                {selectedDayEvents.eventos.length} previsão(ões) de entrega incluem esta data:
              </p>

              {selectedDayEvents.eventos.map((ev, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 hover:bg-zinc-100/60 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedDayEvents(null);
                    setSelectedEventModal(ev);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Fornecedor / Documento
                      </span>
                      <p className="text-sm font-bold text-zinc-900">
                        {ev.fornecedor} <span className="text-xs font-normal text-zinc-500">({ev.numeroDocumento})</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                        getCdConfig(ev.cd).badgeBg,
                        getCdConfig(ev.cd).badgeText,
                        getCdConfig(ev.cd).badgeBorder
                      )}>
                        CD {getCdConfig(ev.cd).nome}
                      </span>

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
                          <Clock className="w-3 h-3" /> Previsão
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-zinc-600 bg-white p-2 rounded border border-zinc-200/80 flex items-center justify-between">
                    <span>Período: <strong>{formatBrDate(ev.dataInicio)} a {formatBrDate(ev.dataFim)}</strong></span>
                    <span className="text-[11px] text-purple-700 font-medium">({ev.diasMin} a {ev.diasMax} dias úteis)</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Itens Previstos ({ev.itens.length})
                    </span>
                    <ul className="space-y-1">
                      {ev.itens.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-xs text-zinc-700 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
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
