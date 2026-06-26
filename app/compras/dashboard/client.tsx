"use client";

import { LayoutDashboard, FileText, Package, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Layers, BarChart2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Fatura, calcularEtapa, calcularSLA, calcularStatus } from "@/modules/compras/domain/Fatura";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { FaturasGantt } from "@/components/faturas/FaturasGantt";

// Components
function FaturaCard({ title, value, count, colorClass, borderClass, bgClass }: { title: string, value: string, count: number, colorClass: string, borderClass: string, bgClass: string }) {
  return (
    <div className={cn("bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between h-full", borderClass, bgClass)}>
      <p className={cn("text-sm font-medium mb-2", colorClass)}>{title}</p>
      <div>
        <div className={cn("text-3xl font-bold", colorClass.replace('text-', 'text-').replace('-600', '-700').replace('-500', '-700'))}>{value}</div>
        <p className={cn("text-sm mt-2 font-medium opacity-80", colorClass)}>{count} faturas</p>
      </div>
    </div>
  );
}

function InsumoCard({ title, value, subtitle, icon: Icon, colorClass, borderClass, bgClass, onClick }: { title: string, value: string | number, subtitle: string, icon: any, colorClass: string, borderClass: string, bgClass: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn("bg-white rounded-xl shadow-sm border p-6 flex items-start justify-between h-full transition-transform hover:scale-[1.02]", borderClass, bgClass, onClick ? "cursor-pointer hover:shadow-md" : "")}
    >
      <div>
        <p className={cn("text-sm font-medium mb-2", colorClass)}>{title}</p>
        <div className={cn("text-4xl font-bold", colorClass.replace('text-', 'text-').replace('-600', '-700').replace('-500', '-700'))}>{value}</div>
        <p className={cn("text-sm mt-2 opacity-80", colorClass)}>{subtitle}</p>
      </div>
      <Icon className={cn("w-8 h-8 opacity-20", colorClass)} />
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
  const isAdmin = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson');

  // Tabs
  const [activeTab, setActiveTab] = useState<'faturas' | 'insumos'>('faturas');

  // Filters Faturas
  const [fatAno, setFatAno] = useState<string>(currentYear);
  const [fatMes, setFatMes] = useState<string>("todos");
  const [fatCategoria, setFatCategoria] = useState<string>("Todas");

  // Insumos Filters
  const [insAno, setInsAno] = useState<string>(currentYear);
  const [insMes, setInsMes] = useState<string>(currentMonth);
  const [insDia, setInsDia] = useState<string>("todos");
  const [insCD, setInsCD] = useState<string>("todos");
  const [insTipoEnvio, setInsTipoEnvio] = useState<string>("Principal");

  // User Dashboard Filters
  const [userCD, setUserCD] = useState<string>("todos");

  useEffect(() => {
    const user = localStorage.getItem('pcp_user') || '';
    setCurrentUser(user);
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
      if (fatCategoria !== "Todas" && f.categoria !== fatCategoria) return false;

      // Usando data_emissao para filtro de Faturas, fallback para created_at ou hoje
      const dataStr = f.data_emissao || (f as any).created_at || new Date().toISOString();
      const d = new Date(dataStr);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const y = d.getFullYear().toString();
      
      if (fatAno !== "todos" && y !== fatAno) return false;
      if (fatMes !== "todos" && m !== fatMes) return false;
      return true;
    });
  }, [faturas, fatAno, fatMes, fatCategoria]);

  // Faturas Status
  const faturasCards = useMemo(() => {
    let integracao = { count: 0, val: 0 };
    let heflo = { count: 0, val: 0 };
    let erp = { count: 0, val: 0 };
    let v360 = { count: 0, val: 0 };
    let aguardando = { count: 0, val: 0 };
    let pago = { count: 0, val: 0 };
    let atrasadasAberto = { count: 0, val: 0 };

    let slaNoPrazo = 0;
    let slaProximo = 0;
    let slaAtrasado = 0;

    filteredFaturas.forEach(f => {
      const etapa = calcularEtapa(f);
      const v = f.valor || 0;
      if (etapa === 'Integração') { integracao.count++; integracao.val += v; }
      else if (etapa === 'HEFLO') { heflo.count++; heflo.val += v; }
      else if (etapa === 'ERP') { erp.count++; erp.val += v; }
      else if (etapa === 'V360') { v360.count++; v360.val += v; }
      else if (etapa === 'Aguardando pagamento') { aguardando.count++; aguardando.val += v; }
      else if (etapa === 'Pago') { pago.count++; pago.val += v; }

      const sla = calcularSLA(f);
      if (sla === 'Dentro do prazo') slaNoPrazo++;
      else if (sla === 'Próximo do vencimento') slaProximo++;
      else if (sla === 'Atrasado') slaAtrasado++;

      const status = calcularStatus(f);
      if (status === 'Vencido' && f.status_pagamento !== 'Pago') {
        atrasadasAberto.count++;
        atrasadasAberto.val += v;
      }
    });

    return { integracao, heflo, erp, v360, aguardando, pago, atrasadasAberto, slaNoPrazo, slaProximo, slaAtrasado };
  }, [filteredFaturas]);


  // Filtered Insumos (Snapshots)
  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => {
      const tipo = i.tipo_envio || 'Principal';
      if (tipo !== insTipoEnvio) return false;
      if (insCD !== "todos" && i.cd !== insCD) return false;
      return true;
    });
  }, [insumos, insCD, insTipoEnvio]);

  // Filtered Movimentações
  const filteredMovs = useMemo(() => {
    return movimentacoes.filter(m => {
      const tipo = m.tipo_envio || 'Principal';
      if (tipo !== insTipoEnvio) return false;
      
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
      
      // Considerar apenas movimentações confirmadas
      if (m.status !== 'CONFIRMADO') return false;

      return true;
    });
  }, [movimentacoes, insumos, insAno, insMes, insDia, insCD, insTipoEnvio]);


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
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-zinc-50/30">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <BarChart2 className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Dashboard</h1>
            <p className="text-sm text-zinc-500">Visão geral e indicadores do sistema.</p>
          </div>
        </div>
      </header>
      
      {isAdmin && (
        <div className="px-6 md:px-8 pt-6 pb-0">
          <div className="flex gap-4 border-b border-zinc-200">
            <button
              onClick={() => setActiveTab('faturas')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'faturas' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Faturas
            </button>
            <button
              onClick={() => setActiveTab('insumos')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'insumos' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Insumos e Movimentações
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Sessão Faturas */}
          {activeTab === 'faturas' && (
            <>

              {isAdmin && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-zinc-400" />
                      <h2 className="text-lg font-bold text-zinc-800">Fluxo de Faturas <span className="text-sm font-normal text-zinc-500">(envio ideal para o time de pagamentos)</span></h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoria</span>
                        <select 
                          value={fatCategoria} 
                          onChange={(e) => setFatCategoria(e.target.value)}
                          className="w-[120px] h-9 bg-white border border-zinc-200 rounded-md text-sm px-2 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Todas">Todas</option>
                          <option value="Material">Material</option>
                          <option value="Serviço">Serviço</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ano</span>
                        <select 
                          value={fatAno} 
                          onChange={(e) => setFatAno(e.target.value)}
                          className="w-[100px] h-9 bg-white border border-zinc-200 rounded-md text-sm px-2 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="todos">Todos</option>
                          {anos.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mês</span>
                        <select 
                          value={fatMes} 
                          onChange={(e) => setFatMes(e.target.value)}
                          className="w-[140px] h-9 bg-white border border-zinc-200 rounded-md text-sm px-2 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="todos">Todos</option>
                          {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div 
                      onClick={() => router.push(`/compras/faturas/${fatCategoria === 'Serviço' ? 'servicos' : 'materiais'}?sla=No%20prazo&ano=${fatAno}&mes=${fatMes}`)}
                      className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 flex flex-col justify-between h-full bg-emerald-50/20 cursor-pointer hover:shadow-md transition-transform hover:scale-[1.02]"
                    >
                      <p className="text-sm font-medium mb-2 text-emerald-600">Dentro do prazo</p>
                      <div>
                        <div className="text-3xl font-bold text-emerald-700">{faturasCards.slaNoPrazo}</div>
                        <p className="text-sm mt-2 font-medium opacity-80 text-emerald-600">faturas no prazo</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => router.push(`/compras/faturas/${fatCategoria === 'Serviço' ? 'servicos' : 'materiais'}?sla=Pr%C3%B3ximas&ano=${fatAno}&mes=${fatMes}`)}
                      className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 flex flex-col justify-between h-full bg-amber-50/20 cursor-pointer hover:shadow-md transition-transform hover:scale-[1.02]"
                    >
                      <p className="text-sm font-medium mb-2 text-amber-600">Próximas do limite</p>
                      <div>
                        <div className="text-3xl font-bold text-amber-700">{faturasCards.slaProximo}</div>
                        <p className="text-sm mt-2 font-medium opacity-80 text-amber-600">faturas em alerta</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => router.push(`/compras/faturas/${fatCategoria === 'Serviço' ? 'servicos' : 'materiais'}?sla=Atrasadas&ano=${fatAno}&mes=${fatMes}`)}
                      className="bg-white rounded-xl shadow-sm border border-red-200 p-6 flex flex-col justify-between h-full bg-red-50/20 cursor-pointer hover:shadow-md transition-transform hover:scale-[1.02]"
                    >
                      <p className="text-sm font-medium mb-2 text-red-600">Atrasadas</p>
                      <div>
                        <div className="text-3xl font-bold text-red-700">{faturasCards.slaAtrasado}</div>
                        <p className="text-sm mt-2 font-medium opacity-80 text-red-600">faturas atrasadas</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 mb-8">
                    <FaturasGantt faturas={filteredFaturas} />
                  </div>

                  <div className="flex items-center gap-2 mb-6 mt-8">
                    <Layers className="w-5 h-5 text-zinc-400" />
                    <h2 className="text-lg font-bold text-zinc-800">Status das Faturas</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FaturaCard title="Integração" value={formatBRL(faturasCards.integracao.val)} count={faturasCards.integracao.count} colorClass="text-red-500" borderClass="border-red-200" bgClass="bg-red-50/20" />
                    <FaturaCard title="Heflo" value={formatBRL(faturasCards.heflo.val)} count={faturasCards.heflo.count} colorClass="text-blue-500" borderClass="border-blue-200" bgClass="bg-blue-50/20" />
                    <FaturaCard title="ERP" value={formatBRL(faturasCards.erp.val)} count={faturasCards.erp.count} colorClass="text-zinc-500" borderClass="border-zinc-200" bgClass="bg-zinc-50/20" />
                    <FaturaCard title="V360" value={formatBRL(faturasCards.v360.val)} count={faturasCards.v360.count} colorClass="text-orange-500" borderClass="border-orange-200" bgClass="bg-orange-50/20" />
                    <FaturaCard title="Atrasadas em Aberto" value={formatBRL(faturasCards.atrasadasAberto.val)} count={faturasCards.atrasadasAberto.count} colorClass="text-red-700" borderClass="border-red-300" bgClass="bg-red-100/50" />
                    <FaturaCard title="Aguardando Pagamento" value={formatBRL(faturasCards.aguardando.val)} count={faturasCards.aguardando.count} colorClass="text-emerald-500" borderClass="border-emerald-200" bgClass="bg-emerald-50/20" />
                    <FaturaCard title="Pago" value={formatBRL(faturasCards.pago.val)} count={faturasCards.pago.count} colorClass="text-green-600" borderClass="border-green-200" bgClass="bg-green-50/20" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sessão Insumos */}
          {(!isAdmin || activeTab === 'insumos') && (
            <div>
              <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    <h2 className="text-lg font-bold text-zinc-800">Entradas e Aprovações</h2>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">CD</span>
                    <select 
                      value={userCD} 
                      onChange={(e) => setUserCD(e.target.value)}
                      className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[80px]"
                    >
                      <option value="todos">Todos</option>
                      {uniqueCDs.map(cd => <option key={cd} value={cd}>{cd.toUpperCase()}</option>)}
                    </select>
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

              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-bold text-zinc-800">Insumos e Movimentações</h2>
                </div>
                
                <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ano</span>
                    <select value={insAno} onChange={(e) => setInsAno(e.target.value)} className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[55px]">
                      <option value="todos">Todos</option>
                      {anos.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Mês</span>
                    <select value={insMes} onChange={(e) => setInsMes(e.target.value)} className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[85px]">
                      <option value="todos">Todos</option>
                      {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Dia</span>
                    <select value={insDia} onChange={(e) => setInsDia(e.target.value)} className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[50px]">
                      <option value="todos">Todos</option>
                      {dias.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="w-[1px] h-6 bg-zinc-200 hidden sm:block mx-1"></div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">CD</span>
                    <select value={insCD} onChange={(e) => setInsCD(e.target.value)} className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[80px]">
                      <option value="todos">Todos</option>
                      {uniqueCDs.map(cd => <option key={cd} value={cd}>{cd.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="w-[1px] h-6 bg-zinc-200 hidden sm:block mx-1"></div>
                  <div className="flex items-center gap-2 bg-purple-50/80 px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm transition-colors hover:bg-purple-100/80">
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Envio</span>
                    <select value={insTipoEnvio} onChange={(e) => setInsTipoEnvio(e.target.value)} className="text-sm font-bold bg-transparent outline-none text-purple-800 cursor-pointer">
                      <option value="Principal">Principal</option>
                      <option value="Complementar">Complementar</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InsumoCard title="Total de Itens Cadastrados" value={insumosStats.totalItens} subtitle="Itens únicos no CD" icon={Layers} colorClass="text-blue-600" borderClass="border-blue-200" bgClass="bg-blue-50/20" />
                <InsumoCard title="Entradas (Período Selecionado)" value={insumosStats.entradas} subtitle="Qtd adicionada ao estoque" icon={TrendingUp} colorClass="text-emerald-600" borderClass="border-emerald-200" bgClass="bg-emerald-50/20" />
                <InsumoCard title="Saídas (Período Selecionado)" value={insumosStats.saidas} subtitle="Qtd retirada do estoque" icon={TrendingDown} colorClass="text-orange-600" borderClass="border-orange-200" bgClass="bg-orange-50/20" />
                <InsumoCard title="Itens em Situação Normal" value={insumosStats.confortaveis} subtitle="Acima do Lead Time + 3 dias" icon={CheckCircle} colorClass="text-emerald-600" borderClass="border-emerald-200" bgClass="bg-emerald-50/20" onClick={() => { const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'todas'; router.push(`/compras/insumos/${cdPath}?status=CONFORTÁVEL`); }} />
                <InsumoCard title="Itens em Alerta" value={insumosStats.alertas} subtitle="Entre Lead Time e +3 dias" icon={AlertTriangle} colorClass="text-amber-500" borderClass="border-amber-200" bgClass="bg-amber-50/20" onClick={() => { const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'todas'; router.push(`/compras/insumos/${cdPath}?status=ALERTA`); }} />
                <InsumoCard title="Itens Críticos" value={insumosStats.criticos} subtitle="Cobertura ≤ Lead Time" icon={AlertTriangle} colorClass="text-red-600" borderClass="border-red-200" bgClass="bg-red-50/20" onClick={() => { const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'todas'; router.push(`/compras/insumos/${cdPath}?status=CRÍTICO`); }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
