"use client";

import { LayoutDashboard, FileText, Package, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Layers, BarChart2, Moon, Sun, Eye, Truck, Calendar } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Fatura, calcularEtapa, calcularSLA, calcularStatus, calcularDiasRestantes, calcularViabilidadePagamento, getStatusColor, getEtapaColor, getEtapaLabel } from "@/modules/compras/domain/Fatura";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { calcularDatasPrevisao } from "@/lib/previsaoRecebimento";

import { FaturasGantt } from "@/components/faturas/FaturasGantt";
import { FaturaDetailsModal } from "@/components/faturas/FaturaDetailsModal";
import { TimeDetailsModal } from "@/components/faturas/TimeDetailsModal";
import { getFaturaPeriodosAction } from "../faturas-sap/periodos-actions";
import { SelectFilter } from "@/components/ui/select-filter";
import ApresentacaoSemanalClient from "@/app/compras/apresentacao-semanal/client";
import { getUserRole, getUserCD } from "@/lib/roles";

// Components
function FaturaCard({ title, value, count, colorClass, borderClass, bgClass }: { title: string, value: string, count: number, colorClass: string, borderClass: string, bgClass: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-6 flex flex-col justify-between h-full", borderClass)}>
      <div className="flex items-center justify-between mb-4">
        <p className={cn("text-[13px] font-bold uppercase tracking-wider", colorClass)}>{title}</p>
        <div className={cn("w-2 h-2 rounded-full", colorClass.replace('text-', 'bg-'))}></div>
      </div>
      <div>
        <div className="text-3xl font-bold text-zinc-900">{value}</div>
        <p className="text-sm mt-2 font-medium text-zinc-500">{count} faturas</p>
      </div>
    </div>
  );
}

function InsumoCard({ title, value, subtitle, icon: Icon, colorClass, borderClass, bgClass, onClick }: { title: string, value: string | number, subtitle: string, icon: any, colorClass: string, borderClass: string, bgClass: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn("glass-card rounded-xl p-6 flex flex-col justify-between h-full", borderClass, onClick ? "cursor-pointer" : "")}
    >
      <div className="flex items-center justify-between mb-4">
        <p className={cn("text-[13px] font-bold uppercase tracking-wider", colorClass)}>{title}</p>
        <Icon className={cn("w-5 h-5", colorClass)} />
      </div>
      <div>
        <div className="text-3xl font-bold text-zinc-900">{value}</div>
        <p className="text-sm mt-2 font-medium text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function DashboardClient({ 
  faturas, 
  insumos, 
  movimentacoes 
}: { 
  faturas: Fatura[], 
  insumos: any[], 
  movimentacoes: any[] 
}) {
  const router = useRouter();

  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const currentDay = new Date().getDate().toString().padStart(2, '0');

  // Auth
  const [currentUser, setCurrentUser] = useState("");
  const isSuperAdmin = currentUser?.toLowerCase().trim() === 'pedro.queiroz';
  const isAdmin = !currentUser || (currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('vando.sousa') || currentUser.startsWith('felipe.castro')) || currentUser.startsWith('francisco.edson') || (currentUser.startsWith('debora.mota') || currentUser.startsWith('raphael.ramiro') || currentUser.startsWith('moises'));

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pcp_theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pcp_theme', 'light');
      setTheme('light');
    }
  };

  // Tabs - Gerencial primeiro para administradores, Operacional para operacionais
  const [mainTab, setMainTab] = useState<'gerencial' | 'operacional'>('gerencial');
  const [activeTab, setActiveTab] = useState<'faturas2' | 'insumos' | 'movimentacoes' | 'performance'>('faturas2');
  const [selectedViewFatura, setSelectedViewFatura] = useState<any | null>(null);
  const [selectedStage, setSelectedStage] = useState<{fatura: any, stage: string} | null>(null);
  const [faturaPeriodos, setFaturaPeriodos] = useState<any[]>([]);
  const [listFiltroResp, setListFiltroResp] = useState('todos');
  const [listFiltroCD, setListFiltroCD] = useState('todos');
  const [listFiltroMes, setListFiltroMes] = useState('todos');
  const [listFiltroAno, setListFiltroAno] = useState('todos');
  const formatUserName = (n: string | null | undefined) => !n ? '-' : n.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

  const handleMainTabChange = (tab: 'gerencial' | 'operacional') => {
    setMainTab(tab);
    if (tab === 'gerencial') {
      setActiveTab('faturas2');
    } else {
      setActiveTab('insumos');
    }
  };

  // Filters Faturas
  const [fatAno, setFatAno] = useState<string>(currentYear);
  const [fatMes, setFatMes] = useState<string>("todos");
  const [fatCategoria, setFatCategoria] = useState<string>("Todas");

  // Insumos Filters
  const [insAno, setInsAno] = useState<string>(currentYear);
  const [insMes, setInsMes] = useState<string>(currentMonth);
  const [insDia, setInsDia] = useState<string>("todos");
  const [insCD, setInsCD] = useState<string>("todos");

  // User Dashboard Filters
  const [userCD, setUserCD] = useState<string>("todos");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('pcp_user') || '';
    setCurrentUser(user);
    const role = getUserRole(user);
    setUserRole(role);
    const cd = getUserCD(user);
    
    const admin = !user || (user.startsWith('pedro.queiroz') || user.startsWith('vando.sousa') || user.startsWith('felipe.castro')) || user.startsWith('francisco.edson') || (user.startsWith('debora.mota') || user.startsWith('raphael.ramiro') || user.startsWith('moises'));
    if (admin) {
      setMainTab('gerencial');
      setActiveTab('faturas2');
    } else {
      setMainTab('operacional');
      setActiveTab('insumos');
    }
    
    if (role === 'OPERACIONAL' && cd) {
      setUserCD(cd);
      setInsCD(cd);
    }
  }, []);

  // Options
  const anos = Array.from(new Set(faturas.map(f => {
    const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || (f as any).data_abertura || (f as any).created_at || (f as any).nexa_data_inicio || new Date().toISOString();
    let d = new Date(dataStr);
    if (isNaN(d.getTime()) && typeof dataStr === 'string' && dataStr.includes('/')) {
      const parts = dataStr.split('/');
      if (parts.length === 3) d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
    }
    if (isNaN(d.getTime())) d = new Date();
    return d.getFullYear().toString();
  }))).sort();
  const normalizeString = (str: string) => typeof str === 'string' ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim() : '';
  const meses = [
    { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" }, { value: "04", label: "Abril" },
    { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
    { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
  ];
  const dias = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  const normalizeCd = (val?: string | null) => {
    if (!val) return '';
    return val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  const formatCdLabel = (slug: string) => {
    const s = normalizeCd(slug);
    if (s === 'jundiai') return 'JUNDIAÍ';
    if (s === 'fortaleza') return 'FORTALEZA';
    if (s === 'nse') return 'NSE';
    if (s === 'coc') return 'COC';
    if (s === 'psd') return 'PSD';
    return slug.toUpperCase();
  };

  const uniqueCDs = Array.from(new Set(
    insumos
      .filter(i => !i.excluido)
      .map(i => {
        const n = normalizeCd(i.cd);
        if (!n || ['raizes', 'curitiba'].includes(n)) return null;
        return n;
      })
      .filter(Boolean)
  )).sort() as string[];

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filtered Faturas
  const filteredFaturas = useMemo(() => {
    return faturas.filter(f => {
      if (activeTab === 'faturas2' && !f.is_sap) return false;
      if (activeTab === 'insumos') return false;

      if (fatCategoria !== "Todas" && f.categoria !== fatCategoria) return false;

      // Usando data_vencimento para filtro de Faturas, fallback para data_emissao, created_at ou hoje
      const dataStr = f.data_vencimento || f.data_emissao || (f as any).created_at || new Date().toISOString();
      const d = new Date(dataStr);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const y = d.getFullYear().toString();
      
      if (fatAno !== "todos" && y !== fatAno) return false;
      if (fatMes !== "todos" && m !== fatMes) return false;
      return true;
    });
  }, [faturas, fatAno, fatMes, fatCategoria, activeTab]);

  // Faturas Status
  const faturasCards = useMemo(() => {
    let emAbertoAtraso = { count: 0, val: 0 };
    let emAbertoNoPrazo = { count: 0, val: 0 };
    let aguardandoAtraso = { count: 0, val: 0 };
    let aguardandoNoPrazo = { count: 0, val: 0 };

    let slaNoPrazo = 0;
    let slaProximo = 0;
    let slaAtrasado = 0;

    let novoSlaNoPrazo = 0;
    let novoSlaProximo = 0;
    let novoSlaAtrasado = 0;

    filteredFaturas.forEach(f => {
      const etapa = calcularEtapa(f);
      const stat = calcularStatus(f);
      const v = f.valor || 0;

      const isPaid = stat.startsWith('Pago') || f.status_pagamento === 'Pago' || Boolean(f.data_pagamento_real || f.pagamento_data_fim || f.nexa_pagamento_realizado);
      if (isPaid) return;

      const isAguardando = Boolean(
        etapa === 'Aguardando pagamento' ||
        etapa === 'Pagamento efetivo' ||
        etapa === 'Programação de pagamento' ||
        f.nexa_pagamento_programado ||
        f.nexa_data_prevista_pagamento ||
        f.prog_data_fim ||
        f.status_pagamento === 'Aguardando pagamento'
      );

      const isAtrasado = stat === 'Vencido';

      if (isAguardando) {
        if (isAtrasado) {
          aguardandoAtraso.count++; aguardandoAtraso.val += v;
        } else {
          aguardandoNoPrazo.count++; aguardandoNoPrazo.val += v;
        }
      } else {
        if (isAtrasado) {
          emAbertoAtraso.count++; emAbertoAtraso.val += v;
        } else {
          emAbertoNoPrazo.count++; emAbertoNoPrazo.val += v;
        }
      }

      const sla = calcularSLA(f);
      if (sla === 'Dentro do prazo') slaNoPrazo++;
      else if (sla === 'Próximo do vencimento') slaProximo++;
      else if (sla === 'Atrasado') slaAtrasado++;

      // Novo SLA
      if (!isAguardando && !isPaid) {
        const viabilidade = calcularViabilidadePagamento(f);
        if (viabilidade.statusViabilidade === 'viavel') novoSlaNoPrazo++;
        else if (viabilidade.statusViabilidade === 'risco') novoSlaProximo++;
        else if (viabilidade.statusViabilidade === 'perdido') novoSlaAtrasado++;
      }
    });

    return { 
      emAbertoAtraso, emAbertoNoPrazo, aguardandoAtraso, aguardandoNoPrazo, 
      slaNoPrazo, slaProximo, slaAtrasado,
      novoSlaNoPrazo, novoSlaProximo, novoSlaAtrasado
    };
  }, [filteredFaturas]);


  // Filtered Insumos (Snapshots)
  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => {
      if (i.excluido === true) return false;
      if (insCD !== "todos" && normalizeCd(i.cd) !== normalizeCd(insCD)) return false;
      return true;
    });
  }, [insumos, insCD]);

  // Filtered Movimentações
  const filteredMovs = useMemo(() => {
    return movimentacoes.filter(m => {
      
      // Filtrar por CD
      if (insCD !== "todos" && normalizeCd(m.cd) !== normalizeCd(insCD)) return false;

      // Filtrar por data
      if (!m.data_hora) return false;
      const d = new Date(m.data_hora);
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const ano = d.getFullYear().toString();

      if (insAno !== "todos" && ano !== insAno) return false;
      if (insMes !== "todos" && mes !== insMes) return false;
      if (insDia !== "todos" && dia !== insDia) return false;
      
      // Considerar apenas movimentações aprovadas
      if (m.status !== 'Aprovada' && m.status !== 'CONFIRMADO') return false;

      return true;
    });
  }, [movimentacoes, insAno, insMes, insDia, insCD]);


  // Insumos Stats
  const insumosStats = useMemo(() => {
    let criticos = 0, alertas = 0, confortaveis = 0;
    let totalEstoque = 0;

    filteredInsumos.forEach(i => {
      const cmd = parseFloat(i.cmd) || 10;
      const lt = parseFloat(i.lead_time) || 0;
      const real = parseFloat(i.estoque_real) || 0;

      totalEstoque += real;

      const cobertura = cmd > 0 ? (real / cmd) : Infinity;

      if (cobertura <= lt) criticos++;
      else if (cobertura > lt && cobertura <= (lt + 3)) alertas++;
      else confortaveis++;
    });

    let entradas = 0;
    let saidas = 0;

    filteredMovs.forEach(m => {
      if (m.tipo === 'Entrada') entradas += (m.quantidade || 0);
      if (m.tipo === 'Saída') saidas += (m.quantidade || 0);
    });

    return { 
      totalItens: filteredInsumos.length, 
      totalEstoque,
      entradas, 
      saidas,
      criticos, 
      alertas, 
      confortaveis 
    };
  }, [filteredInsumos, filteredMovs]);

  const formatBrDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
    const parts = clean.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatCd = (name: string) => name ? name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : '';

  const previsoesChegadaOperacional = useMemo(() => {
    const cdAlvo = normalizeCd(userRole === 'OPERACIONAL' && userCD ? userCD : (insCD !== 'todos' ? insCD : ''));
    
    // Data atual no formato YYYY-MM-DD para garantir que não apareçam previsões cujo período já terminou
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const toIsoDate = (str?: string | null): string => {
      if (!str) return '';
      const clean = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
      if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return clean;
    };

    const list: Array<{
      id: string;
      fornecedor: string;
      cd: string;
      dataInicio: string;
      dataFim: string;
      diasMin: number;
      diasMax: number;
      numeroDocumento?: string;
      itensResumo?: string;
    }> = [];

    for (const fat of faturas as any[]) {
      if (fat.categoria !== 'Material') continue;
      const statusFat = String(fat.status || '').toUpperCase();
      if (statusFat.includes('CANCELAD') || statusFat.includes('EXCLUID')) continue;

      const rawInsumos = Array.isArray(fat.insumos) ? fat.insumos : [];
      const metaObj: any = rawInsumos.find((i: any) => i && i._meta) || {};
      const subPrevisao: any = metaObj.previsao_recebimento || {};
      const fatCd = formatCd(fat.cd || metaObj.cd || rawInsumos[0]?.cd || '');

      if (cdAlvo && normalizeCd(fatCd) !== cdAlvo) continue;

      let diasMin = fat.previsao_recebimento_dias_min ?? metaObj.previsao_recebimento_dias_min ?? subPrevisao.dias_min;
      let diasMax = fat.previsao_recebimento_dias_max ?? metaObj.previsao_recebimento_dias_max ?? subPrevisao.dias_max;
      let dataInicio = fat.previsao_recebimento_data_inicio ?? metaObj.previsao_recebimento_data_inicio ?? subPrevisao.data_inicio;
      let dataFim = fat.previsao_recebimento_data_fim ?? metaObj.previsao_recebimento_data_fim ?? subPrevisao.data_fim;

      if ((!dataInicio || !dataFim) && diasMin && diasMax) {
        const baseDate = fat.data_criacao || (fat as any).created_at || (fat as any).data_recebimento;
        if (baseDate) {
          const calc = calcularDatasPrevisao(baseDate, Number(diasMin), Number(diasMax));
          if (!dataInicio) dataInicio = calc.data_inicio;
          if (!dataFim) dataFim = calc.data_fim;
        }
      }

      if (!dataInicio || !dataFim) continue;

      let cleanInicio = toIsoDate(dataInicio);
      let cleanFim = toIsoDate(dataFim);

      if (cleanInicio > cleanFim) {
        const temp = cleanInicio;
        cleanInicio = cleanFim;
        cleanFim = temp;
      }

      // Regra: Não exibir previsões cujo período já tenha terminado (fim < hoje).
      // Considerar a data final do período: se terminar hoje ou no futuro (cleanFim >= todayStr), exibir.
      if (cleanFim < todayStr) continue;

      const validInsumos = rawInsumos.filter((i: any) => i && !i._meta);
      const itensNomes = Array.from(new Set(validInsumos.map((i: any) => i.item || i.descricao || '').filter(Boolean))) as string[];
      const itensResumo = itensNomes.length > 0 ? itensNomes.slice(0, 2).join(', ') + (itensNomes.length > 2 ? ` (+${itensNomes.length - 2})` : '') : '';

      const rawId = String(fat.id || '');
      const doc = fat.numero_documento || (rawId.includes('__') ? rawId.split('__')[0] : rawId);

      list.push({
        id: String(fat.id),
        fornecedor: fat.fornecedor || 'Fornecedor não informado',
        cd: fatCd,
        dataInicio: cleanInicio,
        dataFim: cleanFim,
        diasMin: Number(diasMin) || 1,
        diasMax: Number(diasMax) || 1,
        numeroDocumento: doc,
        itensResumo
      });
    }

    return list.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
  }, [faturas, userRole, userCD, insCD]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-transparent">
      <header className="glass-panel px-8 py-5 flex items-center justify-between flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <BarChart2 className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Dashboard</h1>
            <p className="text-[13px] text-zinc-500 font-medium">Visão geral e indicadores do sistema</p>
          </div>
        </div>
        
        {currentUser && (
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 shadow-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-200/60 shadow-sm">
              <span className="text-sm font-semibold text-zinc-700">
                Bem Vindo(a), <span className="text-purple-700">{currentUser.split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ')}</span>!
              </span>
            </div>
          </div>
        )}
      </header>
      
      {isAdmin && (
        <div className="px-8 pt-6 pb-0 flex flex-col gap-5">
          <div className="flex gap-6 border-b border-zinc-200 w-full">
            <button
              onClick={() => handleMainTabChange('gerencial')}
              className={`pb-3 font-semibold text-[15px] transition-all border-b-[3px] -mb-[1px] ${mainTab === 'gerencial' ? 'border-purple-600 text-purple-700' : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'}`}
            >
              Gerencial
            </button>
            <button
              onClick={() => handleMainTabChange('operacional')}
              className={`pb-3 font-semibold text-[15px] transition-all border-b-[3px] -mb-[1px] ${mainTab === 'operacional' ? 'border-purple-600 text-purple-700' : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'}`}
            >
              Operacional
            </button>
          </div>
          
          {mainTab === 'gerencial' && (
            <div className="flex flex-wrap gap-2 p-1 bg-zinc-100/80 border border-zinc-200 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('faturas2')}
                className={`px-5 py-2 rounded-md font-semibold text-[13px] transition-all ${activeTab === 'faturas2' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'}`}
              >
                Faturas
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-5 py-2 rounded-md font-semibold text-[13px] transition-all ${activeTab === 'performance' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'}`}
              >
                Performance Semanal
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Sessão Faturas */}
          {(activeTab === 'faturas2') && (
            <>

              {isAdmin && (
                <div>
                  {/* 1. Status Faturas por Vencimento */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-zinc-400" />
                      <h2 className="text-lg font-bold text-zinc-800">Status Faturas por Vencimento</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <SelectFilter 
                        label="Categoria"
                        value={fatCategoria} 
                        onChange={(e) => setFatCategoria(e.target.value)}
                        options={[
                          { value: "Todas", label: "Todas" },
                          { value: "Material", label: "Material" },
                          { value: "Serviço", label: "Serviço" }
                        ]}
                      />
                      <SelectFilter 
                        label="Ano"
                        value={fatAno} 
                        onChange={(e) => setFatAno(e.target.value)}
                        options={[
                          { value: "todos", label: "Todos" },
                          ...anos.map(a => ({ value: a, label: a }))
                        ]}
                      />
                      <SelectFilter 
                        label="Mês"
                        value={fatMes} 
                        onChange={(e) => setFatMes(e.target.value)}
                        options={[
                          { value: "todos", label: "Todos" },
                          ...meses.map(m => ({ value: m.value, label: m.label }))
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="contents cursor-pointer" onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?status=Vencido&filtro_etapa=em_aberto&ano=${fatAno}&mes=${fatMes}`)}>
                      <FaturaCard title="Em Aberto, Em Atraso" value={formatBRL(faturasCards.emAbertoAtraso.val)} count={faturasCards.emAbertoAtraso.count} colorClass="text-red-700" borderClass="border-red-300" bgClass="bg-red-100/50" />
                    </div>
                    <div className="contents cursor-pointer" onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?status=A_vencer&filtro_etapa=em_aberto&ano=${fatAno}&mes=${fatMes}`)}>
                      <FaturaCard title="Em Aberto No Prazo" value={formatBRL(faturasCards.emAbertoNoPrazo.val)} count={faturasCards.emAbertoNoPrazo.count} colorClass="text-blue-600" borderClass="border-blue-200" bgClass="bg-blue-50/50" />
                    </div>
                    <div className="contents cursor-pointer" onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?status=Vencido&filtro_etapa=aguardando&ano=${fatAno}&mes=${fatMes}`)}>
                      <FaturaCard title="Aguardando Pgto em Atraso" value={formatBRL(faturasCards.aguardandoAtraso.val)} count={faturasCards.aguardandoAtraso.count} colorClass="text-orange-600" borderClass="border-orange-300" bgClass="bg-orange-100/50" />
                    </div>
                    <div className="contents cursor-pointer" onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?status=A_vencer&filtro_etapa=aguardando&ano=${fatAno}&mes=${fatMes}`)}>
                      <FaturaCard title="Aguardando Pgto no Prazo" value={formatBRL(faturasCards.aguardandoNoPrazo.val)} count={faturasCards.aguardandoNoPrazo.count} colorClass="text-emerald-600" borderClass="border-emerald-200" bgClass="bg-emerald-50/50" />
                    </div>
                  </div>

                  {/* 3. Fluxo de Faturas — Tempos e SLA */}
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-bold text-zinc-800">Fluxo de Faturas — Tempos e SLA <span className="text-sm font-normal text-zinc-500">(Novo Motor)</span></h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div 
                      onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?novo_sla=No%20prazo&ano=${fatAno}&mes=${fatMes}`)}
                      className="glass-card rounded-xl border border-zinc-200/50 p-6 flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">Dentro do prazo</p>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{faturasCards.novoSlaNoPrazo}</div>
                        <p className="text-sm mt-2 font-medium text-zinc-500">faturas no prazo</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?novo_sla=Pr%C3%B3ximas&ano=${fatAno}&mes=${fatMes}`)}
                      className="glass-card rounded-xl border border-zinc-200/50 p-6 flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-amber-600">Próximas do limite</p>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{faturasCards.novoSlaProximo}</div>
                        <p className="text-sm mt-2 font-medium text-zinc-500">faturas em alerta</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?novo_sla=Atrasadas&ano=${fatAno}&mes=${fatMes}`)}
                      className="glass-card rounded-xl border border-zinc-200/50 p-6 flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-red-600">Atrasadas no Fluxo</p>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{faturasCards.novoSlaAtrasado}</div>
                        <p className="text-sm mt-2 font-medium text-zinc-500">faturas atrasadas</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Gantt Operacional */}
                    <div className="mt-8 mb-8">
                      <div className="hidden">
                        <FaturasGantt faturas={filteredFaturas} flowType="2.0" />
                      </div>
                    </div>

                    {/* Lista de Faturas em vez do Gantt (Ocultada visualmente a pedido) */}
                    <div className="hidden mt-8 mb-8 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-zinc-800 uppercase">Lista de Faturas</h3>
                        <span className="text-xs font-medium text-zinc-500">{filteredFaturas.filter(f => {
                              
                                
                                  const cdRaw = f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '';
                                  const cd = normalizeString(cdRaw as string);
                                  const filterCd = normalizeString(listFiltroCD);
                                  if (listFiltroCD !== 'todos' && cd !== filterCd) return false;
                                  
                                  const respRaw = f.responsavel || '';
                                  const resp = normalizeString(respRaw);
                                  const filterResp = normalizeString(listFiltroResp);
                                  if (listFiltroResp !== 'todos' && resp !== filterResp) return false;
                                  
                                  const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || (f as any).data_abertura || (f as any).created_at || (f as any).nexa_data_inicio || new Date().toISOString();
                                  let d = new Date(dataStr);
                                  if (isNaN(d.getTime()) && typeof dataStr === 'string' && dataStr.includes('/')) {
                                    const parts = dataStr.split('/');
                                    if (parts.length === 3) d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
                                  }
                                  if (isNaN(d.getTime())) d = new Date();
                                  const m = (d.getMonth() + 1).toString().padStart(2, '0');
                                  const y = d.getFullYear().toString();
                                  
                                  if (listFiltroMes !== 'todos' && m !== listFiltroMes) return false;
                                  if (listFiltroAno !== 'todos' && y !== listFiltroAno) return false;
                                  
                                  return true;

                            }).length} faturas encontradas</span>
                      </div>

                      <div className="p-4 border-b border-zinc-100 flex flex-wrap gap-4 items-end bg-white">
                        <SelectFilter label="CD" value={listFiltroCD} onChange={(e) => setListFiltroCD(e.target.value)} options={[{value: 'todos', label: 'Todos'}, ...uniqueCDs.map(cd => ({value: cd, label: cd}))]} />
                        <SelectFilter label="Responsável" value={listFiltroResp} onChange={(e) => setListFiltroResp(e.target.value)} options={[{value: 'todos', label: 'Todos'}, ...Array.from(new Set(faturas.map(f => f.responsavel).filter(Boolean))).map(r => ({value: r, label: formatUserName(r)}))]} />
                        <SelectFilter label="Mês" value={listFiltroMes} onChange={(e) => setListFiltroMes(e.target.value)} options={[{value: 'todos', label: 'Todos'}, {value: '01', label: 'Janeiro'}, {value: '02', label: 'Fevereiro'}, {value: '03', label: 'Março'}, {value: '04', label: 'Abril'}, {value: '05', label: 'Maio'}, {value: '06', label: 'Junho'}, {value: '07', label: 'Julho'}, {value: '08', label: 'Agosto'}, {value: '09', label: 'Setembro'}, {value: '10', label: 'Outubro'}, {value: '11', label: 'Novembro'}, {value: '12', label: 'Dezembro'}]} />
                        <SelectFilter label="Ano" value={listFiltroAno} onChange={(e) => setListFiltroAno(e.target.value)} options={[{value: 'todos', label: 'Todos'}, ...anos.map(a => ({value: a, label: a}))]} />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase border-b border-zinc-200">
                            <tr>
                              <th className="px-4 py-3">Documento</th>
                              <th className="px-4 py-3">Fornecedor</th>
                              <th className="px-4 py-3">Responsável</th>
                              <th className="px-4 py-3">Etapa Atual</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {filteredFaturas.filter(f => {
                              
                                
                                  const cdRaw = f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '';
                                  const cd = normalizeString(cdRaw as string);
                                  const filterCd = normalizeString(listFiltroCD);
                                  if (listFiltroCD !== 'todos' && cd !== filterCd) return false;
                                  
                                  const respRaw = f.responsavel || '';
                                  const resp = normalizeString(respRaw);
                                  const filterResp = normalizeString(listFiltroResp);
                                  if (listFiltroResp !== 'todos' && resp !== filterResp) return false;
                                  
                                  const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || (f as any).data_abertura || (f as any).created_at || (f as any).nexa_data_inicio || new Date().toISOString();
                                  let d = new Date(dataStr);
                                  if (isNaN(d.getTime()) && typeof dataStr === 'string' && dataStr.includes('/')) {
                                    const parts = dataStr.split('/');
                                    if (parts.length === 3) d = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
                                  }
                                  if (isNaN(d.getTime())) d = new Date();
                                  const m = (d.getMonth() + 1).toString().padStart(2, '0');
                                  const y = d.getFullYear().toString();
                                  
                                  if (listFiltroMes !== 'todos' && m !== listFiltroMes) return false;
                                  if (listFiltroAno !== 'todos' && y !== listFiltroAno) return false;
                                  
                                  return true;

                            }).map(f => {
                              const s = calcularStatus(f);
                              return (
                              <React.Fragment key={f.id}>
<tr className="hover:bg-zinc-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-zinc-900">{f.numero_documento || '-'}</td>
                                <td className="px-4 py-3 text-zinc-600">{f.fornecedor}</td>
                                <td className="px-4 py-3 text-zinc-600">{formatUserName(f.responsavel)}</td>
                                <td className="px-4 py-3"><span className="px-2 py-1 bg-zinc-100 rounded text-xs text-zinc-700 font-medium">{f.etapa || 'Pendente'}</span></td>
                                <td className="px-4 py-3">
                                  <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                                    s.includes('Pago') ? "bg-emerald-100 text-emerald-800" :
                                    s === 'Vencido' ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                  )}>
                                    {s}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button 
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setSelectedViewFatura(f);
                                      try {
                                        const periodos = await getFaturaPeriodosAction(f.id);
                                        setFaturaPeriodos(periodos);
                                      } catch (err) {
                                        setFaturaPeriodos([]);
                                      }
                                    }} 
                                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                    title="Visualizar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>

                            
</React.Fragment>
)})}
                          </tbody>
                        </table>
                      </div>
                    </div>

                </div>
              )}
            </>
          )}

          {/* Sessão Insumos - Padrão Unificado para Todos os Usuários */}
          {(activeTab === 'insumos') && (
            <div>
              <div className="space-y-8 mb-12">
                {/* Cabeçalho da Situação do Estoque e Previsões */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-800">
                        Situação do Estoque e Previsões {userCD && userCD !== 'todos' ? `— CD ${formatCdLabel(userCD)}` : ''}
                      </h2>
                      <p className="text-xs text-zinc-500">Indicadores de cobertura física e datas previstas de entregas.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <SelectFilter 
                      label="CD"
                      value={userCD} 
                      onChange={(e) => {
                        setUserCD(e.target.value);
                        setInsCD(e.target.value);
                      }}
                      disabled={userRole === 'OPERACIONAL'}
                      options={[
                        { value: "todos", label: "Todos" },
                        ...uniqueCDs.map(cd => ({ value: cd as string, label: formatCdLabel(cd as string) }))
                      ]}
                    />
                  </div>
                </div>

                {/* 1. Os 3 cards: Situação Normal, Alerta e Críticos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InsumoCard 
                    title="Itens em Situação Normal" 
                    value={insumosStats.confortaveis} 
                    subtitle="Acima do Lead Time + 3 dias" 
                    icon={CheckCircle} 
                    colorClass="text-emerald-600" 
                    borderClass="border-emerald-200 cursor-pointer hover:shadow-md transition-all" 
                    bgClass="bg-emerald-50/20" 
                    onClick={() => { const cdPath = userCD && userCD !== 'todos' ? normalizeCd(userCD) : 'todas'; router.push(`/compras/insumos/${cdPath}?status=CONFORTÁVEL`); }} 
                  />
                  <InsumoCard 
                    title="Itens em Alerta" 
                    value={insumosStats.alertas} 
                    subtitle="Entre Lead Time e +3 dias" 
                    icon={AlertTriangle} 
                    colorClass="text-amber-500" 
                    borderClass="border-amber-200 cursor-pointer hover:shadow-md transition-all" 
                    bgClass="bg-amber-50/20" 
                    onClick={() => { const cdPath = userCD && userCD !== 'todos' ? normalizeCd(userCD) : 'todas'; router.push(`/compras/insumos/${cdPath}?status=ALERTA`); }} 
                  />
                  <InsumoCard 
                    title="Itens Críticos" 
                    value={insumosStats.criticos} 
                    subtitle="Cobertura ≤ Lead Time" 
                    icon={AlertTriangle} 
                    colorClass="text-red-600" 
                    borderClass="border-red-200 cursor-pointer hover:shadow-md transition-all" 
                    bgClass="bg-red-50/20" 
                    onClick={() => { const cdPath = userCD && userCD !== 'todos' ? normalizeCd(userCD) : 'todas'; router.push(`/compras/insumos/${cdPath}?status=CRÍTICO`); }} 
                  />
                </div>

                {/* 2. Card grande horizontalmente para informar as datas dos insumos que chegarão */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-base leading-tight">Próximas Chegadas de Fornecedores</h3>
                        <p className="text-xs text-zinc-500">Janelas estimadas de entrega para organizar o recebimento do CD.</p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                      {previsoesChegadaOperacional.length} {previsoesChegadaOperacional.length === 1 ? 'previsão ativa' : 'previsões ativas'}
                    </span>
                  </div>

                  <div className="p-5">
                    {previsoesChegadaOperacional.length === 0 ? (
                      <div className="p-8 text-center text-zinc-400">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-zinc-300 stroke-1" />
                        <p className="text-sm font-semibold text-zinc-600">Nenhuma entrega de fornecedor prevista para os próximos dias</p>
                        <p className="text-xs text-zinc-400 mt-1">Quando houver pedidos de compras com prazos estimados para este CD, as previsões aparecerão aqui.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {previsoesChegadaOperacional.map((prev) => (
                          <div 
                            key={prev.id} 
                            className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 hover:bg-purple-50/40 hover:border-purple-200 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="truncate pr-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Fornecedor</span>
                                <p className="font-bold text-zinc-900 text-sm truncate">{prev.fornecedor}</p>
                                {prev.itensResumo && (
                                  <p className="text-[11px] text-zinc-500 truncate mt-0.5" title={prev.itensResumo}>
                                    {prev.itensResumo}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {prev.numeroDocumento && (
                                  <span 
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200"
                                    title={`Número do Documento / NF: ${prev.numeroDocumento}`}
                                  >
                                    NF {prev.numeroDocumento}
                                  </span>
                                )}
                                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-700 shrink-0">
                                  {prev.cd.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 bg-white rounded-lg border border-purple-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Previsão de Chegada</span>
                                  <p className="text-xs font-black text-purple-950">
                                    {formatBrDate(prev.dataInicio)} a {formatBrDate(prev.dataFim)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded shrink-0">
                                {prev.diasMin === prev.diasMax ? `${prev.diasMin}d úteis` : `${prev.diasMin} a ${prev.diasMax}d úteis`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sessão Movimentações / Estoque Geral */}
          {(activeTab === 'movimentacoes') && (
            <div>
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-bold text-zinc-800">Insumos e Movimentações</h2>
                </div>
                
                <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
                  <SelectFilter 
                    label="Ano"
                    value={insAno} 
                    onChange={(e) => setInsAno(e.target.value)}
                    options={[
                      { value: "todos", label: "Todos" },
                      ...anos.map(a => ({ value: a, label: a }))
                    ]}
                  />
                  <SelectFilter 
                    label="Mês"
                    value={insMes} 
                    onChange={(e) => setInsMes(e.target.value)}
                    options={[
                      { value: "todos", label: "Todos" },
                      ...meses.map(m => ({ value: m.value, label: m.label }))
                    ]}
                  />
                  <SelectFilter 
                    label="Dia"
                    value={insDia} 
                    onChange={(e) => setInsDia(e.target.value)}
                    options={[
                      { value: "todos", label: "Todos" },
                      ...dias.map(d => ({ value: d, label: d }))
                    ]}
                  />
                  <div className="w-[1px] h-6 bg-zinc-200 hidden sm:block mx-1"></div>
                  <SelectFilter 
                    label="CD"
                    value={insCD} 
                    onChange={(e) => setInsCD(e.target.value)}
                    disabled={userRole === 'OPERACIONAL'}
                    options={[
                      { value: "todos", label: "Todos" },
                      ...uniqueCDs.map(cd => ({ value: cd as string, label: (cd as string).toUpperCase() }))
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InsumoCard title="Total de Itens Cadastrados" value={insumosStats.totalItens} subtitle="Itens únicos no CD" icon={Layers} colorClass="text-blue-600" borderClass="border-blue-200 cursor-default" bgClass="bg-blue-50/20" />
                <InsumoCard title="Entradas (Período Selecionado)" value={insumosStats.entradas} subtitle="Qtd adicionada ao estoque" icon={TrendingUp} colorClass="text-emerald-600" borderClass="border-emerald-200 cursor-default" bgClass="bg-emerald-50/20" />
                <InsumoCard title="Saídas (Período Selecionado)" value={insumosStats.saidas} subtitle="Qtd retirada do estoque" icon={TrendingDown} colorClass="text-orange-600" borderClass="border-orange-200 cursor-default" bgClass="bg-orange-50/20" />
                <InsumoCard title="Itens em Situação Normal" value={insumosStats.confortaveis} subtitle="Acima do Lead Time + 3 dias" icon={CheckCircle} colorClass="text-emerald-600" borderClass="border-emerald-200 cursor-pointer hover:shadow-md transition-all" bgClass="bg-emerald-50/20" onClick={() => { const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'todas'; router.push(`/compras/insumos/${cdPath}?status=CONFORTÁVEL`); }} />
                <InsumoCard title="Itens em Alerta" value={insumosStats.alertas} subtitle="Entre Lead Time e +3 dias" icon={AlertTriangle} colorClass="text-amber-500" borderClass="border-amber-200 cursor-pointer hover:shadow-md transition-all" bgClass="bg-amber-50/20" onClick={() => { const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'todas'; router.push(`/compras/insumos/${cdPath}?status=ALERTA`); }} />
                <InsumoCard title="Itens Críticos" value={insumosStats.criticos} subtitle="Cobertura ≤ Lead Time" icon={AlertTriangle} colorClass="text-red-600" borderClass="border-red-200 cursor-pointer hover:shadow-md transition-all" bgClass="bg-red-50/20" onClick={() => { const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'todas'; router.push(`/compras/insumos/${cdPath}?status=CRÍTICO`); }} />
              </div>
            </div>
          )}

          {/* Sessão Performance Semanal */}
          {(activeTab === 'performance') && (
            <div className="-mx-8 -mt-6">
              <ApresentacaoSemanalClient faturas={faturas} />
            </div>
          )}
        
        
      
        {selectedViewFatura && (
          <FaturaDetailsModal
            isOpen={!!selectedViewFatura}
            onClose={() => { setSelectedViewFatura(null); setFaturaPeriodos([]); }}
            fatura={selectedViewFatura}
            faturaPeriodos={faturaPeriodos}
            canEditOrDelete={false}
            handleDuplicate={() => {}}
            setFaturaToTransfer={() => {}}
            handleEdit={() => {}}
            setSelectedStage={setSelectedStage}
            getStatusColor={getStatusColor}
            getEtapaColor={getEtapaColor}
            getEtapaLabel={getEtapaLabel}
          />
        )}

        {selectedStage && (
          <TimeDetailsModal
            isOpen={!!selectedStage}
            onClose={() => setSelectedStage(null)}
            fatura={selectedStage.fatura}
            stage={selectedStage.stage}
          />
        )}

      </div>
    </div>
  </div>
  );
}
