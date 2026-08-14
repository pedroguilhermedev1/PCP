"use client";

import { Fatura, calcularStatus, calcularEtapa, calcularSLA } from "@/modules/compras/domain/Fatura";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight, FileText, Search, DollarSign } from "lucide-react";
import React, { useState, useEffect } from "react";
import { FaturaModal } from "@/components/faturas/FaturaModal";
import { saveFaturaAction, deleteFaturaAction } from "./actions";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { formatCNPJ, cn } from "@/lib/utils";

export function FaturasTableClient({ initialFaturas, categoria }: { initialFaturas: Fatura[], categoria: 'Serviço' | 'Material' }) {
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
  const [filterStatus, setFilterStatus] = useState<string>('todos');
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

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson') || currentUser.startsWith('debora.mota');

  const uniqueCDs = Array.from(new Set([
    "Fortaleza", "Jundiaí", "NSE", "COC", "PSD",
    ...faturas.map(f => f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd)
  ].filter(Boolean)));

  const faturasAposFiltroCategoria = faturas.filter(f => f.categoria === categoria && !f.is_sap);
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

    if (filterStatus !== "todos") {
      const stat = calcularStatus(f);
      if (stat.toLowerCase() !== filterStatus.toLowerCase()) return false;
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      const matchFornecedor = f.fornecedor?.toLowerCase().startsWith(term);
      const matchNumero = f.numero_documento?.toLowerCase().startsWith(term);
      const matchRC = f.rc_sap?.toLowerCase().startsWith(term) || f.heflo?.toLowerCase().startsWith(term);
      const matchPC = f.erp?.toLowerCase().startsWith(term) || f.v360?.toLowerCase().startsWith(term);
      const matchPedidoSAP = f.pedido_sap?.toLowerCase().startsWith(term);
      const matchCodigoNexa = f.identificador?.toLowerCase().startsWith(term);
      
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
    
    const prevFaturas = [...faturas];
    setFaturas(prev => prev.filter(f => f.id !== id));
    try {
      await deleteFaturaAction(id);
      toast.success("Registro excluído com sucesso.");
    } catch (error) {
      console.error("Failed to delete", error);
      toast.error("Erro ao excluir registro.");
      setFaturas(prevFaturas);
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
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Faturas - {categoria}</h1>
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
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[100px]"
            >
              <option value="todos">Todos</option>
              <option value="Pago">Pago</option>
              <option value="Pago (Vencida)">Pago (Vencida)</option>
              <option value="A Vencer">A Vencer</option>
              <option value="Vencido">Vencida</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-8">
        <h2 className="text-lg font-semibold text-purple-900">Lista de Faturas</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Fatura
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] w-full overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
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
                    className={`cursor-pointer border-b border-zinc-100 transition-colors ${expandedFaturaId === f.id ? 'bg-purple-50/80 shadow-inner' : 'hover:bg-purple-50/50'}`}
                    onClick={() => toggleExpand(f.id)}
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
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", getStatusColor(status))}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium border", getEtapaColor(etapa))}>
                        {getEtapaLabel(etapa)}
                      </span>
                    </TableCell>
                    {canEditOrDelete && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                    <TableRow className="bg-zinc-50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <TableCell colSpan={canEditOrDelete ? 10 : 9} className="p-0 border-b">
                        <div className="p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-purple-900">Detalhes da Fatura</h3>
                            {canEditOrDelete && (
                              <Button variant="secondary" size="sm" onClick={() => handleEdit(f)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Fatura
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Iniciais</h4>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Fornecedor</span>
                                <span className="text-sm font-medium">{f.fornecedor}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">CNPJ</span>
                                <span className="text-sm font-medium">{formatCNPJ(f.cnpj)}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Documento</span>
                                <span className="text-sm font-medium">{f.numero_documento}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Valor</span>
                                <span className="text-sm font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valor)}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Emissão</span>
                                <span className="text-sm font-medium">{f.data_emissao?.split('-').reverse().join('/')}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Recebimento</span>
                                <span className="text-sm font-medium">{f.data_recebimento?.split('-').reverse().join('/')}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Classificação</h4>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Centro de Custo</span>
                                <span className="text-sm font-medium">{f.centro_custo}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Filial</span>
                                <span className="text-sm font-medium">{f.filial}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Conta Contábil</span>
                                <span className="text-sm font-medium">{f.conta_contabil || '-'}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Descrição Contábil</span>
                                <span className="text-sm font-medium">{f.descricao_contabil || '-'}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Tipo Serv</span>
                                <span className="text-sm font-medium">{f.tipo_servico}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Cód Serv</span>
                                <span className="text-sm font-medium">{f.codigo_servico}</span>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Processos</h4>
                              <div className="p-2 bg-blue-50/50 rounded border border-blue-100 flex flex-col gap-1">
                                <span className="text-xs font-bold text-blue-800">HEFLO</span>
                                <span className="text-sm">{f.heflo || '-'}</span>
                                <span className="text-xs text-zinc-500">{f.data_abertura_heflo?.split('-').reverse().join('/') || '-'}</span>
                              </div>
                              <div className="p-2 bg-zinc-50/50 rounded border border-zinc-200 flex flex-col gap-1">
                                <span className="text-xs font-bold text-zinc-600">ERP</span>
                                <span className="text-sm">{f.erp || '-'}</span>
                                <span className="text-xs text-zinc-500">{f.data_aprovacao?.split('-').reverse().join('/') || '-'}</span>
                              </div>
                              <div className="p-2 bg-orange-50/50 rounded border border-orange-100 flex flex-col gap-1">
                                <span className="text-xs font-bold text-orange-800">V360</span>
                                <span className="text-sm">{f.v360 || '-'}</span>
                                <span className="text-xs text-zinc-500">{f.data_abertura_v360?.split('-').reverse().join('/') || '-'}</span>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Controle e Financeiro</h4>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Responsável</span>
                                <span className="text-sm font-medium">{f.responsavel}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Forma Pgto</span>
                                <span className="text-sm font-medium">{f.forma_pagamento}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Status Pagamento</span>
                                <Badge variant="outline" className="font-bold">{f.status_pagamento}</Badge>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Possui Encargo?</span>
                                <span className="text-sm font-medium">{f.possui_encargo ? 'Sim' : 'Não'}</span>
                                {f.possui_encargo && (
                                  <span className="text-sm font-medium ml-2 text-red-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valor_encargo || 0)}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Observações</span>
                                <span className="text-sm">{f.observacoes || '-'}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-zinc-500 block">Data Real de Pagamento</span>
                                <span className="text-sm font-medium">{f.data_pagamento_real?.split('-').reverse().join('/') || '-'}</span>
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
        <FaturaModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          fatura={faturaToEdit}
          categoriaAtiva={categoria}
          onSave={handleSave}
        />
      )}
      </div>
    </div>
  );
}
