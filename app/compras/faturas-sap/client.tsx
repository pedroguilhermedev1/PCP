"use client";

import { Fatura, calcularStatus, calcularEtapa, calcularSLA } from "@/modules/compras/domain/Fatura";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight, FileText, Search, DollarSign, Eye } from "lucide-react";
import React, { useState, useEffect } from "react";
import { FaturaSAPModal } from "@/components/faturas/FaturaSAPModal";
import { saveFaturaAction, deleteFaturaAction } from "./actions";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { formatCNPJ, cn } from "@/lib/utils";

export function FaturasTableClient({ initialFaturas, categoria }: { initialFaturas: Fatura[], categoria: 'Serviço' | 'Material' | 'Todas' }) {
  const [faturas, setFaturas] = useState<Fatura[]>(initialFaturas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faturaToEdit, setFaturaToEdit] = useState<Fatura | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState("");

  const searchParams = useSearchParams();
  const defaultCD = searchParams.get('cd') || 'todos';
  const defaultSLA = searchParams.get('sla') || 'todos';
  const qAno = searchParams.get('ano') || 'todos';
  const qMes = searchParams.get('mes') || 'todos';

  const [filterCD, setFilterCD] = useState<string>(defaultCD);
  const [filterSLA, setFilterSLA] = useState<string>(defaultSLA);
  const [filterAno, setFilterAno] = useState<string>(qAno);
  const [filterMes, setFilterMes] = useState<string>(qMes);
  const defaultStatus = searchParams.get('status')?.replace('_', ' ') || 'todos';
  const [filterStatus, setFilterStatus] = useState<string[]>([defaultStatus]);
  const defaultStatusPagamento = searchParams.get('status_pagamento') || 'todos';
  const [filterStatusPagamento, setFilterStatusPagamento] = useState<string>(defaultStatusPagamento);
  const [filterResponsavel, setFilterResponsavel] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    setFaturas(initialFaturas);
  }, [initialFaturas]);

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setCurrentUser(user);
    }
  }, [categoria]);

  const canEditOrDelete = !currentUser || (currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('felipe.castro')) || currentUser.startsWith('francisco.edson') || currentUser.startsWith('debora.mota');

  const uniqueCDs = Array.from(new Set([
    "Fortaleza", "Jundiaí", "NSE", "COC", "PSD",
    ...faturas.map(f => f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd)
  ].filter(Boolean)));
  
  const uniqueResponsaveis = Array.from(new Set(faturas.map(f => f.responsavel).filter(Boolean))).sort();

  const faturasAposFiltroCategoria = faturas.filter(f => (categoria === 'Todas' || f.categoria === categoria) && f.is_sap);
  const faturasFiltradas = faturasAposFiltroCategoria.filter(f => {
    const fCD = (f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '').toLowerCase();
    if (filterCD !== 'todos' && fCD !== filterCD.toLowerCase()) return false;

    if (filterSLA !== 'todos') {
      const sla = calcularSLA(f);
      if (filterSLA === 'No prazo' && sla !== 'Dentro do prazo') return false;
      if (filterSLA === 'Próximas' && sla !== 'Próximo do vencimento') return false;
      if (filterSLA === 'Atrasadas' && sla !== 'Atrasado') return false;
    }

    if (filterAno !== "todos" || filterMes !== "todos") {
      const dataStr = f.data_emissao || (f as any).created_at || new Date().toISOString();
      const d = new Date(dataStr);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const y = d.getFullYear().toString();
      
      if (filterAno !== "todos" && y !== filterAno) return false;
      if (filterMes !== "todos" && m !== filterMes) return false;
    }

    if (!filterStatus.includes("todos")) {
      const stat = calcularStatus(f);
      if (!filterStatus.some(s => stat.toLowerCase() === s.toLowerCase())) return false;
    }
    
    const filterEtapa = searchParams.get('filtro_etapa');
    if (filterEtapa) {
      const etapa = calcularEtapa(f);
      const isFinalizado = (etapa === 'Aguardando pagamento' || etapa === 'Pago');
      if (filterEtapa === 'aguardando' && !isFinalizado) return false;
      if (filterEtapa === 'em_aberto' && isFinalizado) return false;
    }
    
    const etapaExata = searchParams.get('etapa_exata');
    if (etapaExata) {
      const etapa = calcularEtapa(f);
      if (etapaExata === 'programacao' && etapa !== 'Aguardando programação de pagamento') return false;
    }

    if (filterStatusPagamento !== "todos") {
      if ((f.status_pagamento || '').toLowerCase() !== filterStatusPagamento.toLowerCase()) return false;
    }

    if (filterResponsavel !== "todos") {
      if ((f.responsavel || '') !== filterResponsavel) return false;
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      const matchFornecedor = f.fornecedor?.toLowerCase().startsWith(term);
      const matchNumero = f.numero_documento?.toLowerCase().startsWith(term);
      const matchRC = f.rc_sap?.toLowerCase().startsWith(term) || f.heflo?.toLowerCase().startsWith(term);
      const matchPC = f.erp?.toLowerCase().startsWith(term) || f.v360?.toLowerCase().startsWith(term);
      const matchPedidoSAP = f.pedido_sap?.toLowerCase().startsWith(term);
      const matchCodigoNexa = f.identificador?.toLowerCase().startsWith(term) || f.nexa_chamado?.toLowerCase().startsWith(term) || f.numero_pc_nexa?.toLowerCase().startsWith(term);
      
      if (!matchFornecedor && !matchNumero && !matchRC && !matchPC && !matchPedidoSAP && !matchCodigoNexa) {
        return false;
      }
    }

    return true;
  });

  const handleCreate = () => {
    setFaturaToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (fatura: Fatura) => {
    setFaturaToEdit(fatura);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const res = await deleteFaturaAction(id);
      if (res && !res.success) {
        toast.error(res.error);
        return;
      }
      
      setFaturas(prev => prev.filter(f => f.id !== id));
      toast.success("Registro excluído com sucesso.");
    } catch (error) {
      console.error("Failed to delete", error);
      toast.error("Erro ao excluir registro.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedFaturaId(prev => prev === id ? null : id);
  };

  const handleSave = async (savedFatura: Fatura) => {
    try {
      const res = await saveFaturaAction(savedFatura);
      if (res && !res.success) {
        toast.error(`Erro ao salvar registro: ${res.error}`);
        return;
      }
      if (faturaToEdit) {
        setFaturas(prev => prev.map(f => f.id === savedFatura.id ? savedFatura : f));
      } else {
        setFaturas(prev => [...prev, savedFatura]);
      }
      setIsModalOpen(false);
      toast.success("Registro salvo com sucesso.");
    } catch (error: any) {
      console.error("Failed to save", error);
      toast.error(`Erro ao salvar registro: ${error?.message || 'Verifique os dados e tente novamente.'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vencido': return 'bg-red-50 text-red-700 border-red-200';
      case 'Pago': return 'bg-green-50 text-green-700 border-green-200';
      case 'Pago (Vencida)': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'A vencer': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'Em andamento': return 'bg-zinc-50 text-zinc-700 border-zinc-200';
      case 'Integração': return 'bg-red-50 text-red-700 border-red-200';
      case 'HEFLO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ERP': return 'bg-zinc-50 text-zinc-700 border-zinc-200';
      case 'V360': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Aguardando programação de pagamento': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Aguardando pagamento': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Aguardando lançamento fiscal': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Aguardando emissão de NF': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Aguardando PC Nexa': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Pago': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  const getEtapaLabel = (etapa: string) => {
    switch (etapa) {
      case 'Aguardando programação de pagamento': return 'Prog. de Pagamento';
      case 'Aguardando lançamento fiscal': return 'Lançamento Fiscal';
      case 'Aguardando emissão de NF': return 'Emissão de NF';
      case 'Aguardando pagamento': return 'Pagamento';
      case 'Aguardando PC Nexa': return 'PC Nexa';
      default: return etapa;
    }
  };

  const faturasOrdenadas = faturasFiltradas.sort((a, b) => {
    const codeA = (a.codigo_fatura || a.tipo_documento || '').toLowerCase();
    const codeB = (b.codigo_fatura || b.tipo_documento || '').toLowerCase();
    if (codeA && codeB) return codeA.localeCompare(codeB);
    const da = new Date(a.data_emissao || '2099-12-31').getTime();
    const db = new Date(b.data_emissao || '2099-12-31').getTime();
    return da - db;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            handleDelete(itemToDelete);
            setItemToDelete(null);
          }
        }}
      />
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <DollarSign className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Faturas 2.0 - {categoria}</h1>
            <p className="text-sm text-zinc-500">Gestão e acompanhamento de faturas.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por Fornecedor, NF, RC, PC, Pedido SAP ou Cód NEXA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">CD</span>
            <select 
              value={filterCD} 
              onChange={(e) => setFilterCD(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[80px]"
            >
              <option value="todos">Todos</option>
              {uniqueCDs.map(cd => <option key={cd as string} value={cd as string}>{(cd as string).toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SLA Operacional</span>
            <select 
              value={filterSLA} 
              onChange={(e) => setFilterSLA(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[120px]"
            >
              <option value="todos">Todos</option>
              <option value="No prazo">Dentro do prazo</option>
              <option value="Próximas">Próximas do limite</option>
              <option value="Atrasadas">Atrasadas no Fluxo</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ano</span>
            <select 
              value={filterAno} 
              onChange={(e) => setFilterAno(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[70px]"
            >
              <option value="todos">Todos</option>
              {["2023", "2024", "2025", "2026", "2027", "2028"].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Mês</span>
            <select 
              value={filterMes} 
              onChange={(e) => setFilterMes(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[100px]"
            >
              <option value="todos">Todos</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm relative group cursor-pointer z-[60]">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
            <div className="text-sm font-medium text-zinc-800 min-w-[100px]">
              {filterStatus.length === 0 || filterStatus.includes('todos') ? 'Todos' : filterStatus.length > 1 ? `${filterStatus.length} selecionados` : filterStatus[0]}
            </div>
            
            <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-2 hidden group-hover:block min-w-[180px]">
              {['todos', 'Pago', 'Pago (Vencida)', 'A Vencer', 'Vencido'].map(opt => (
                <label key={opt} className="flex items-center gap-2 p-1.5 hover:bg-zinc-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filterStatus.includes(opt)}
                    onChange={(e) => {
                      if (opt === 'todos') {
                        setFilterStatus(['todos']);
                      } else {
                        const isChecked = e.target.checked;
                        let newFilter = filterStatus.filter(f => f !== 'todos');
                        if (isChecked) {
                          newFilter.push(opt);
                        } else {
                          newFilter = newFilter.filter(f => f !== opt);
                        }
                        if (newFilter.length === 0) newFilter = ['todos'];
                        setFilterStatus(newFilter);
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700">{opt === 'todos' ? 'Todos' : opt === 'Vencido' ? 'Vencida' : opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Resp.</span>
            <select 
              value={filterResponsavel} 
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[100px]"
            >
              <option value="todos">Todos</option>
              {uniqueResponsaveis.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-8">
        <h2 className="text-lg font-semibold text-purple-900">Lista de Faturas 2.0</h2>
        {categoria !== 'Todas' && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura
          </Button>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <Table className="w-full bg-white/40 backdrop-blur-sm rounded-xl">
          <TableHeader className="bg-zinc-50/80 border-b border-zinc-200">
            <TableRow className="border-zinc-100 hover:bg-transparent">
              <TableHead className="w-12 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">#</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Código</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">CD</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Fornecedor</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Local</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Nota Fiscal</TableHead>
              <TableHead className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Valor</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Vencimento</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Status Fatura</TableHead>
              <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Etapa</TableHead>
              {canEditOrDelete && <TableHead className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {faturasOrdenadas.map((f, index) => {
              const status = calcularStatus(f);
              const etapa = calcularEtapa(f);

              return (
                <React.Fragment key={f.id}>
                  <TableRow 
                    className={`border-b border-zinc-100 transition-colors ${expandedFaturaId === f.id ? 'bg-purple-50/80 shadow-inner' : 'hover:bg-purple-50/50'}`}
                  >
                    <TableCell className="text-center font-medium text-zinc-400 text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-zinc-600 font-medium text-xs bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                        {f.codigo_fatura || f.tipo_documento || 'S/ CÓD'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '-'}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-400 font-bold">{f.identificador || 'S/ ID'}</span>
                        <span>{f.fornecedor}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600">
                      {f.filial || '-'}
                    </TableCell>
                    <TableCell>{f.numero_documento}</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{f.data_vencimento?.split('-').reverse().join('/')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap", getStatusColor(status))}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap", getEtapaColor(etapa))}>
                        {getEtapaLabel(etapa)}
                      </span>
                    </TableCell>
                    {canEditOrDelete && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleExpand(f.id); }}>
                            <Eye className="w-4 h-4 text-purple-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(f); }}>
                            <Edit className="w-4 h-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setItemToDelete(f.id); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  
                  {expandedFaturaId === f.id && (
                    <TableRow className="bg-zinc-50/80 animate-in fade-in slide-in-from-top-2 duration-300">
                      <TableCell colSpan={canEditOrDelete ? 10 : 9} className="p-0 border-b">
                        <div className="flex flex-col lg:flex-row min-h-[400px]">
                          {/* Main Content Area */}
                          <div className="flex-1 p-8 border-r border-zinc-200">
                            <div className="flex items-center gap-3 mb-6">
                              <FileText className="w-6 h-6 text-purple-700" />
                              <h3 className="text-xl font-bold text-zinc-900">Detalhes da Fatura</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {/* Iniciais */}
                              <div className="space-y-5">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2">Informações Básicas</h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Fornecedor</span>
                                    <span className="text-sm font-medium text-zinc-900">{f.fornecedor}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">CNPJ</span>
                                    <span className="text-sm font-medium text-zinc-900">{formatCNPJ(f.cnpj)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Nota Fiscal</span>
                                    <span className="text-sm font-medium text-zinc-900">{f.numero_documento}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Valor Total</span>
                                    <span className="text-sm font-bold text-zinc-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valor)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Classificação */}
                              <div className="space-y-5">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2">Classificação</h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">CD / Unidade</span>
                                    <span className="text-sm font-medium text-zinc-900">{f.cd || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Centro de Custo</span>
                                    <span className="text-sm font-medium text-zinc-900">{f.centro_custo || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Conta Contábil</span>
                                    <span className="text-sm font-medium text-zinc-900">{f.conta_contabil || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-zinc-500 font-semibold block uppercase">Tipo Serviço</span>
                                    <span className="text-sm font-medium text-zinc-900">{f.tipo_servico || '-'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Fluxo */}
                              <div className="space-y-5">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2">Fluxo de Trabalho ({f.fluxo_iniciado_por || 'SAP'})</h4>
                                
                                {f.fluxo_iniciado_por !== 'Nexa' ? (
                                  <div className="space-y-3">
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                      <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1">RC SAP</span>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-purple-900">{f.rc_sap || 'Pendente'}</span>
                                        <span className="text-xs text-purple-600">{f.data_rc_sap?.split('-').reverse().join('/') || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                      <span className="text-[11px] font-bold text-indigo-800 uppercase block mb-1">Pedido SAP</span>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-indigo-900">{f.pedido_sap || 'Pendente'}</span>
                                        <span className="text-xs text-indigo-600">{f.data_pedido_sap?.split('-').reverse().join('/') || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                      <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">Doc Subsequente</span>
                                      <span className="text-sm font-medium text-emerald-900">{f.doc_subsequente_criado ? 'Criado' : 'Não criado'}</span>
                                    </div>
                                    
                                    {f.doc_subsequente_criado && (
                                      <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 space-y-3">
                                        <h5 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Continuação no Nexa</h5>
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                          <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1">Chamado / NF</span>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-900">{f.nexa_chamado || (f.nexa_anexada ? 'Anexada' : 'Pendente')}</span>
                                            <span className="text-xs text-blue-600">{f.nexa_data_envio?.split('-').reverse().join('/') || '-'}</span>
                                          </div>
                                        </div>
                                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                                          <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Lançamento Fiscal</span>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-900">{f.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                            <span className="text-xs text-slate-500">{f.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || '-'}</span>
                                          </div>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                          <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">Programação Pgto</span>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-amber-900">{f.nexa_pagamento_programado ? 'Programado' : 'Pendente'}</span>
                                            <span className="text-xs text-amber-600">{f.nexa_data_prevista_pagamento?.split('-').reverse().join('/') || '-'}</span>
                                          </div>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                          <span className="text-[11px] font-bold text-green-800 uppercase block mb-1">Pagamento Realizado</span>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-green-900">{f.nexa_pagamento_realizado ? 'Pago' : 'Pendente'}</span>
                                            <span className="text-xs text-green-600">{f.data_pagamento_real?.split('-').reverse().join('/') || '-'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                      <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1">Ticket Nexa (Chamado)</span>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-purple-900">{f.nexa_chamado || 'Pendente'}</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                      <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1">PC Nexa</span>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-blue-900">{f.numero_pc_nexa || (f.pc_nexa_concluido ? 'Concluído' : 'Pendente')}</span>
                                        <span className="text-xs text-blue-600">{f.data_pc_nexa?.split('-').reverse().join('/') || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                                      <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Lançamento Fiscal</span>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-900">{f.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                        <span className="text-xs text-slate-500">{f.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                      <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">Programação Pgto</span>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-amber-900">{f.nexa_pagamento_programado ? 'Programado' : 'Pendente'}</span>
                                        <span className="text-xs text-amber-600">{f.nexa_data_prevista_pagamento?.split('-').reverse().join('/') || '-'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Insumos */}
                            {f.insumos && f.insumos.length > 0 && f.insumos.some(i => !(i as any)._meta) && (
                              <div className="mt-8">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b pb-2 mb-4">Insumos Vinculados</h4>
                                <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                                  <Table>
                                    <TableHeader className="bg-zinc-50">
                                      <TableRow>
                                        <TableHead className="text-[10px] uppercase">Código</TableHead>
                                        <TableHead className="text-[10px] uppercase">Item</TableHead>
                                        <TableHead className="text-[10px] uppercase text-right">Qtd</TableHead>
                                        <TableHead className="text-[10px] uppercase text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {f.insumos.filter(i => !(i as any)._meta).map((ins, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="text-xs font-mono text-zinc-500">{ins.codigo}</TableCell>
                                          <TableCell className="text-xs font-medium">{ins.item}</TableCell>
                                          <TableCell className="text-xs text-right">{ins.quantidade}</TableCell>
                                          <TableCell className="text-xs text-right font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ins.valor_total || 0)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Panel Summary */}
                          <div className="w-full lg:w-80 bg-white p-6 border-l border-zinc-200 flex flex-col gap-6">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Resumo Executivo</h4>
                              
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Status Atual</span>
                                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border inline-block", getStatusColor(status))}>
                                    {status}
                                  </span>
                                </div>
                                
                                <div>
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Etapa no Fluxo</span>
                                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border inline-block", getEtapaColor(etapa))}>
                                    {getEtapaLabel(etapa)}
                                  </span>
                                </div>

                                <div className="pt-3 border-t border-zinc-100">
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Responsável</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                      {f.responsavel ? f.responsavel.substring(0, 2).toUpperCase() : '?'}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-900">{f.responsavel || 'Não atribuído'}</span>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Datas Críticas</span>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-500">Emissão</span>
                                      <span className="font-medium">{f.data_emissao?.split('-').reverse().join('/')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-500">Vencimento</span>
                                      <span className="font-medium text-orange-600">{f.data_vencimento?.split('-').reverse().join('/')}</span>
                                    </div>
                                  </div>
                                </div>

                                {(f.forma_pagamento || f.possui_encargo) && (
                                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                                    {f.forma_pagamento && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-zinc-500 font-semibold">Forma Pagamento</span>
                                        <span className="font-medium">{f.forma_pagamento}</span>
                                      </div>
                                    )}
                                    {f.possui_encargo && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-red-500 font-semibold">Encargos</span>
                                        <span className="font-medium text-red-600">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valor_encargo || 0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {f.observacoes && (
                                  <div className="pt-3 border-t border-zinc-100">
                                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase mb-1">Observações</span>
                                    <p className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-100 italic">
                                      "{f.observacoes}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            {faturasOrdenadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEditOrDelete ? 9 : 8} className="text-center py-8 text-zinc-500">
                  Nenhuma fatura encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {isModalOpen && (
        <FaturaSAPModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          fatura={faturaToEdit}
          categoriaAtiva={categoria as "Serviço" | "Material"}
          onSave={handleSave}
        />
      )}
      </div>
    </div>
  );
}
