"use client";

import { LayoutDashboard, FileText, Package, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Fatura, calcularEtapa } from "@/modules/compras/domain/Fatura";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  // Faturas Filters
  const [fatAno, setFatAno] = useState<string>(currentYear);
  const [fatMes, setFatMes] = useState<string>(currentMonth);

  // Insumos Filters
  const [insAno, setInsAno] = useState<string>(currentYear);
  const [insMes, setInsMes] = useState<string>(currentMonth);
  const [insDia, setInsDia] = useState<string>("todos");
  const [insCD, setInsCD] = useState<string>("todos");
  const [insMarca, setInsMarca] = useState<string>("todas");
  const [insTipoEnvio, setInsTipoEnvio] = useState<string>("Principal");

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('pcp_user') || '';
    const admins = [
      'pedro.queiroz',
      'debora.mota',
      'francisco.edson',
    ];
    setIsAdmin(admins.some(a => user.includes(a)));
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
  
  const uniqueCDs = Array.from(new Set(insumos.map(i => i.cd).filter(Boolean)));
  const uniqueMarcas = Array.from(new Set(insumos.map(i => i.empresa).filter(Boolean)));

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filtered Faturas
  const filteredFaturas = useMemo(() => {
    return faturas.filter(f => {
      // Usando data_emissao para filtro de Faturas, fallback para created_at ou hoje
      const dataStr = f.data_emissao || (f as any).created_at || new Date().toISOString();
      const d = new Date(dataStr);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const y = d.getFullYear().toString();
      
      if (fatAno !== "todos" && y !== fatAno) return false;
      if (fatMes !== "todos" && m !== fatMes) return false;
      return true;
    });
  }, [faturas, fatAno, fatMes]);

  // Faturas Status
  const faturasCards = useMemo(() => {
    let integracao = { count: 0, val: 0 };
    let heflo = { count: 0, val: 0 };
    let erp = { count: 0, val: 0 };
    let v360 = { count: 0, val: 0 };
    let aguardando = { count: 0, val: 0 };
    let pago = { count: 0, val: 0 };

    filteredFaturas.forEach(f => {
      const etapa = calcularEtapa(f);
      const v = f.valor || 0;
      if (etapa === 'Integração') { integracao.count++; integracao.val += v; }
      else if (etapa === 'HEFLO') { heflo.count++; heflo.val += v; }
      else if (etapa === 'ERP') { erp.count++; erp.val += v; }
      else if (etapa === 'V360') { v360.count++; v360.val += v; }
      else if (etapa === 'Aguardando pagamento') { aguardando.count++; aguardando.val += v; }
      else if (etapa === 'Pago') { pago.count++; pago.val += v; }
    });

    return { integracao, heflo, erp, v360, aguardando, pago };
  }, [filteredFaturas]);


  // Filtered Insumos (Snapshots)
  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => {
      const tipo = i.tipo_envio || 'Principal';
      if (tipo !== insTipoEnvio) return false;
      if (insCD !== "todos" && i.cd !== insCD) return false;
      if (insMarca !== "todas" && i.empresa !== insMarca) return false;
      return true;
    });
  }, [insumos, insCD, insMarca, insTipoEnvio]);

  // Filtered Movimentações
  const filteredMovs = useMemo(() => {
    return movimentacoes.filter(m => {
      const tipo = m.tipo_envio || 'Principal';
      if (tipo !== insTipoEnvio) return false;
      
      // Filtrar por CD / Marca
      if (insCD !== "todos" && m.cd !== insCD) return false;
      
      if (insMarca !== "todas") {
         // Cross reference to check if the codigo belongs to the marca
         const matchingInsumo = insumos.find(i => i.codigo === m.codigo && i.cd === m.cd);
         if (!matchingInsumo || matchingInsumo.empresa !== insMarca) return false;
      }

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
  }, [movimentacoes, insumos, insAno, insMes, insDia, insCD, insMarca, insTipoEnvio]);


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


  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-zinc-50/30">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-2 rounded-lg text-purple-900">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Dashboard</h1>
            <p className="text-sm text-zinc-500">Visão geral e indicadores do sistema.</p>
          </div>
        </div>
      </header>
      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Sessão Faturas */}
          {isAdmin && (
            <>
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    <h2 className="text-lg font-bold text-zinc-800">Fluxo de Faturas</h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Integração → Vermelho suave */}
                  <FaturaCard 
                    title="Integração" 
                    value={formatBRL(faturasCards.integracao.val)} 
                    count={faturasCards.integracao.count}
                    colorClass="text-red-500" 
                    borderClass="border-red-200" 
                    bgClass="bg-red-50/20" 
                  />
                  {/* Heflo → Azul suave */}
                  <FaturaCard 
                    title="Heflo" 
                    value={formatBRL(faturasCards.heflo.val)} 
                    count={faturasCards.heflo.count}
                    colorClass="text-blue-500" 
                    borderClass="border-blue-200" 
                    bgClass="bg-blue-50/20" 
                  />
                  {/* ERP → Cinza suave */}
                  <FaturaCard 
                    title="ERP" 
                    value={formatBRL(faturasCards.erp.val)} 
                    count={faturasCards.erp.count}
                    colorClass="text-zinc-500" 
                    borderClass="border-zinc-200" 
                    bgClass="bg-zinc-50/20" 
                  />
                  {/* V360 → Laranja suave */}
                  <FaturaCard 
                    title="V360" 
                    value={formatBRL(faturasCards.v360.val)} 
                    count={faturasCards.v360.count}
                    colorClass="text-orange-500" 
                    borderClass="border-orange-200" 
                    bgClass="bg-orange-50/20" 
                  />
                  {/* Aguardando Pagamento → Verde claro */}
                  <FaturaCard 
                    title="Aguardando Pagamento" 
                    value={formatBRL(faturasCards.aguardando.val)} 
                    count={faturasCards.aguardando.count}
                    colorClass="text-emerald-500" 
                    borderClass="border-emerald-200" 
                    bgClass="bg-emerald-50/20" 
                  />
                  {/* Pago → Verde escuro */}
                  <FaturaCard 
                    title="Pago" 
                    value={formatBRL(faturasCards.pago.val)} 
                    count={faturasCards.pago.count}
                    colorClass="text-green-600" 
                    borderClass="border-green-200" 
                    bgClass="bg-green-50/20" 
                  />
                </div>
              </div>

              <div className="border-t-2 border-dashed border-zinc-200 my-10"></div>
            </>
          )}

          {/* Sessão Insumos */}
          <div>
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-bold text-zinc-800">Insumos e Movimentações</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ano</span>
                  <select 
                    value={insAno} 
                    onChange={(e) => setInsAno(e.target.value)}
                    className="w-[90px] h-8 text-sm bg-white border border-zinc-200 rounded-md px-2 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todos">Todos</option>
                    {anos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mês</span>
                  <select 
                    value={insMes} 
                    onChange={(e) => setInsMes(e.target.value)}
                    className="w-[120px] h-8 text-sm bg-white border border-zinc-200 rounded-md px-2 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todos">Todos</option>
                    {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dia</span>
                  <select 
                    value={insDia} 
                    onChange={(e) => setInsDia(e.target.value)}
                    className="w-[80px] h-8 text-sm bg-white border border-zinc-200 rounded-md px-2 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todos">Todos</option>
                    {dias.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">CD</span>
                  <select 
                    value={insCD} 
                    onChange={(e) => setInsCD(e.target.value)}
                    className="w-[120px] h-8 text-sm bg-white border border-zinc-200 rounded-md px-2 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todos">Todos</option>
                    {uniqueCDs.map(cd => <option key={cd} value={cd}>{cd.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Marca</span>
                  <select 
                    value={insMarca} 
                    onChange={(e) => setInsMarca(e.target.value)}
                    className="w-[120px] h-8 text-sm bg-white border border-zinc-200 rounded-md px-2 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todas">Todas</option>
                    {uniqueMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 border-l pl-4 border-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Envio</span>
                  <select 
                    value={insTipoEnvio} 
                    onChange={(e) => setInsTipoEnvio(e.target.value)}
                    className="w-[130px] h-8 text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-2 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Complementar">Complementar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InsumoCard 
                title="Total de Itens Cadastrados"
                value={insumosStats.totalItens}
                subtitle="Itens únicos no CD/Marca"
                icon={Layers}
                colorClass="text-blue-600"
                borderClass="border-blue-200"
                bgClass="bg-blue-50/20"
              />
              <InsumoCard 
                title="Entradas (Período Selecionado)"
                value={insumosStats.entradas}
                subtitle="Qtd adicionada ao estoque"
                icon={TrendingUp}
                colorClass="text-emerald-600"
                borderClass="border-emerald-200"
                bgClass="bg-emerald-50/20"
              />
              <InsumoCard 
                title="Saídas (Período Selecionado)"
                value={insumosStats.saidas}
                subtitle="Qtd retirada do estoque"
                icon={TrendingDown}
                colorClass="text-orange-600"
                borderClass="border-orange-200"
                bgClass="bg-orange-50/20"
              />
              <InsumoCard 
                title="Itens em Situação Normal"
                value={insumosStats.confortaveis}
                subtitle="Acima do Lead Time + 3 dias"
                icon={CheckCircle}
                colorClass="text-emerald-600"
                borderClass="border-emerald-200"
                bgClass="bg-emerald-50/20"
                onClick={() => {
                   const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'fortaleza';
                   const marcaQuery = insMarca !== 'todas' ? `?empresa=${insMarca}` : '';
                   router.push(`/compras/insumos/${cdPath}${marcaQuery}`);
                }}
              />
              <InsumoCard 
                title="Itens em Alerta"
                value={insumosStats.alertas}
                subtitle="Entre Lead Time e +3 dias"
                icon={AlertTriangle}
                colorClass="text-amber-500"
                borderClass="border-amber-200"
                bgClass="bg-amber-50/20"
                onClick={() => {
                   const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'fortaleza';
                   const marcaQuery = insMarca !== 'todas' ? `?empresa=${insMarca}` : '';
                   router.push(`/compras/insumos/${cdPath}${marcaQuery}`);
                }}
              />
              <InsumoCard 
                title="Itens Críticos"
                value={insumosStats.criticos}
                subtitle="Cobertura ≤ Lead Time"
                icon={AlertTriangle}
                colorClass="text-red-600"
                borderClass="border-red-200"
                bgClass="bg-red-50/20"
                onClick={() => {
                   const cdPath = insCD !== 'todos' ? insCD.toLowerCase() : 'fortaleza';
                   const marcaQuery = insMarca !== 'todas' ? `?empresa=${insMarca}` : '';
                   router.push(`/compras/insumos/${cdPath}${marcaQuery}`);
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
