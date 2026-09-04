"use client";

import { LayoutDashboard, FileText, Package, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Layers, BarChart2, Moon, Sun } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Fatura, calcularEtapa, calcularSLA, calcularStatus, calcularDiasRestantes } from "@/modules/compras/domain/Fatura";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { FaturasGantt } from "@/components/faturas/FaturasGantt";
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
  const isAdmin = !currentUser || (currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('felipe.castro')) || currentUser.startsWith('francisco.edson') || currentUser.startsWith('debora.mota');
  const isGabriel = currentUser.toLowerCase() === 'gabriel.oliveira';

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

  // Tabs
  const [mainTab, setMainTab] = useState<'gerencial' | 'operacional'>('gerencial');
  const [activeTab, setActiveTab] = useState<'faturas2' | 'insumos' | 'movimentacoes' | 'performance'>('faturas2');

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
    
    const admin = !user || (user.startsWith('pedro.queiroz') || user.startsWith('felipe.castro')) || user.startsWith('francisco.edson') || user.startsWith('debora.mota');
    if (!admin) {
      setMainTab('operacional');
      setActiveTab('insumos');
    }
    
    if (role === 'OPERACIONAL' && cd) {
      setUserCD(cd);
      setInsCD(cd);
    }
  }, []);

  // Options
  const anos = ["2023", "2024", "2025", "2026", "2027", "2028"];
  const meses = [
    { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" }, { value: "04", label: "Abril" },
    { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
    { value: "07", label: "Julho" }, { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" }, { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
  ];
  const dias = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  const uniqueCDs = Array.from(new Set(insumos.map(i => i.cd).filter(Boolean)))
    .filter(cd => !['raizes', 'curitiba'].includes((cd as string).toLowerCase()));

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

    filteredFaturas.forEach(f => {
      const etapa = calcularEtapa(f);
      const v = f.valor || 0;

      const isFinalizado = (etapa === 'Aguardando pagamento');
      const isEmAberto = (etapa !== 'Aguardando pagamento' && etapa !== 'Pago');
      const diasRestantes = calcularDiasRestantes(f.data_vencimento || '');
      // Considera atrasado apenas se data_vencimento existir e dias < 0
      const isAtrasado = !!f.data_vencimento && diasRestantes < 0;

      if (isEmAberto) {
        if (isAtrasado) {
          emAbertoAtraso.count++; emAbertoAtraso.val += v;
        } else {
          emAbertoNoPrazo.count++; emAbertoNoPrazo.val += v;
        }
      } else if (isFinalizado) {
        if (isAtrasado) {
          aguardandoAtraso.count++; aguardandoAtraso.val += v;
        } else {
          aguardandoNoPrazo.count++; aguardandoNoPrazo.val += v;
        }
      }

      const sla = calcularSLA(f);
      if (sla === 'Dentro do prazo') slaNoPrazo++;
      else if (sla === 'Próximo do vencimento') slaProximo++;
      else if (sla === 'Atrasado') slaAtrasado++;
    });

    return { emAbertoAtraso, emAbertoNoPrazo, aguardandoAtraso, aguardandoNoPrazo, slaNoPrazo, slaProximo, slaAtrasado };
  }, [filteredFaturas]);


  // Filtered Insumos (Snapshots)
  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => {
      if (insCD !== "todos" && i.cd !== insCD) return false;
      return true;
    });
  }, [insumos, insCD]);

  // Filtered Movimentações
  const filteredMovs = useMemo(() => {
    return movimentacoes.filter(m => {
      
      // Filtrar por CD
      if (insCD !== "todos" && m.cd !== insCD) return false;

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
  }, [movimentacoes, insumos, insAno, insMes, insDia, insCD]);


  // Insumos Stats
  const insumosStats = useMemo(() => {
    let criticos = 0, alertas = 0, confortaveis = 0;
    let totalEstoque = 0;

    filteredInsumos.forEach(i => {
      const cmd = parseFloat(i.cmd) || 10;
      const lt = parseFloat(i.lead_time) || 0;
      const real = i.estoque_real || 0;

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


  const entradasPendentesCount = useMemo(() => {
    return movimentacoes.filter(m => {
      if (m.status !== 'PENDENTE') return false;
      
      const cdLower = m.cd?.toLowerCase() || '';
      if (['raizes', 'curitiba'].includes(cdLower)) return false;

      if (userCD !== "todos" && cdLower !== userCD.toLowerCase()) return false;
      return true;
    }).length;
  }, [movimentacoes, userCD]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-transparent">
      <header className="glass-panel px-8 py-5 flex items-center justify-between flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-700 border border-purple-100">
            <BarChart2 className="w-6 h-6" strokeWidth={2.5} />
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
      
      <div className="px-8 pt-6 pb-0 flex flex-col gap-5">
        {isAdmin && (
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
        )}
        
        <div className="flex flex-wrap gap-2 p-1 bg-zinc-100/80 border border-zinc-200 rounded-lg w-fit">
          {mainTab === 'gerencial' && isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('faturas2')}
                className={`px-5 py-2 rounded-md font-semibold text-[13px] transition-all ${activeTab === 'faturas2' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'}`}
              >
                Faturas 2.0
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-5 py-2 rounded-md font-semibold text-[13px] transition-all ${activeTab === 'performance' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'}`}
              >
                Performance Semanal
              </button>
            </>
          )}
          
          {mainTab === 'operacional' && (
            <>
              <button
                onClick={() => setActiveTab('insumos')}
                className={`px-5 py-2 rounded-md font-semibold text-[13px] transition-all ${activeTab === 'insumos' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'}`}
              >
                Insumos
              </button>
              <button
                onClick={() => setActiveTab('movimentacoes')}
                className={`px-5 py-2 rounded-md font-semibold text-[13px] transition-all ${activeTab === 'movimentacoes' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'}`}
              >
                Movimentações
              </button>
            </>
          )}
        </div>
      </div>

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

                  {/* 2. Fluxo de Faturas 2.0 */}
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    <h2 className="text-lg font-bold text-zinc-800">Fluxo de Faturas 2.0 <span className="text-sm font-normal text-zinc-500">(Nexa / SAP)</span></h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div 
                      onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?sla=No%20prazo&ano=${fatAno}&mes=${fatMes}`)}
                      className="glass-card rounded-xl border border-zinc-200/50 p-6 flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-600">Dentro do prazo</p>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{faturasCards.slaNoPrazo}</div>
                        <p className="text-sm mt-2 font-medium text-zinc-500">faturas no prazo</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?sla=Pr%C3%B3ximas&ano=${fatAno}&mes=${fatMes}`)}
                      className="glass-card rounded-xl border border-zinc-200/50 p-6 flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-amber-600">Próximas do limite</p>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{faturasCards.slaProximo}</div>
                        <p className="text-sm mt-2 font-medium text-zinc-500">faturas em alerta</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => router.push(`/compras/faturas-sap/${fatCategoria === 'Serviço' ? 'servicos' : fatCategoria === 'Material' ? 'materiais' : 'todas'}?sla=Atrasadas&ano=${fatAno}&mes=${fatMes}`)}
                      className="glass-card rounded-xl border border-zinc-200/50 p-6 flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-red-600">Atrasadas no Fluxo</p>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{faturasCards.slaAtrasado}</div>
                        <p className="text-sm mt-2 font-medium text-zinc-500">faturas atrasadas</p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Gantt Operacional */}
                  <div className="mt-8 mb-8">
                    <FaturasGantt faturas={filteredFaturas} flowType="2.0" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sessão Insumos (Apenas Entradas e Aprovações) */}
          {(activeTab === 'insumos') && (
            <div>
              {!isGabriel ? (
                <div className="mb-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-zinc-400" />
                      <h2 className="text-lg font-bold text-zinc-800">Entradas e Aprovações</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <SelectFilter 
                        label="CD"
                        value={userCD} 
                        onChange={(e) => setUserCD(e.target.value)}
                        disabled={userRole === 'OPERACIONAL'}
                        options={[
                          { value: "todos", label: "Todos" },
                          ...uniqueCDs.map(cd => ({ value: cd as string, label: (cd as string).toUpperCase() }))
                        ]}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InsumoCard 
                      title="Aprovações Pendentes"
                      value={entradasPendentesCount}
                      subtitle={userCD === "todos" ? "Filtre por CD para habilitar o atalho" : "Movimentações aguardando aprovação"}
                      icon={Package}
                      colorClass="text-orange-600"
                      borderClass={userCD === "todos" ? "border-orange-200" : "border-orange-200 cursor-pointer hover:shadow-md transition-all"}
                      bgClass="bg-orange-50/20"
                      onClick={userCD !== "todos" ? () => router.push(`/compras/formularios/${userCD.toLowerCase()}?tab=pendentes`) : undefined}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 mb-12 text-zinc-500 bg-white rounded-xl border border-zinc-200 shadow-sm">
                  <Package className="w-12 h-12 mb-4 text-zinc-300" />
                  <p className="text-lg font-medium">Esta seção é restrita aos responsáveis por entradas.</p>
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
}
