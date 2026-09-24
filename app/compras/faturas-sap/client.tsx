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
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { Copy, Clock, ArrowRightLeft } from "lucide-react";
import { TransferModal } from "@/components/faturas/TransferModal";
import { TimeDetailsModal } from "@/components/faturas/TimeDetailsModal";
import { getFaturaPeriodosAction } from "./periodos-actions";

export function FaturasTableClient({ initialFaturas, categoria }: { initialFaturas: Fatura[], categoria: 'Serviço' | 'Material' | 'Todas' }) {
  const [faturas, setFaturas] = useState<Fatura[]>(initialFaturas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faturaToEdit, setFaturaToEdit] = useState<Fatura | null>(null);
  const [faturaToTransfer, setFaturaToTransfer] = useState<Fatura | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<{fatura: any, stage: string} | null>(null);
  const [faturaPeriodos, setFaturaPeriodos] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState("");

  const searchParams = useSearchParams();
  const defaultCD = searchParams.get('cd') || 'todos';
  const defaultSLA = searchParams.get('sla') || 'todos';
  const qAno = searchParams.get('ano') || 'todos';
  const qMes = searchParams.get('mes') || 'todos';

  const [filterCD, setFilterCD] = useState<string[]>([defaultCD]);
  const [filterSLA, setFilterSLA] = useState<string[]>([defaultSLA]);
  const [filterAno, setFilterAno] = useState<string[]>([qAno]);
  const [filterMes, setFilterMes] = useState<string[]>([qMes]);
  const defaultStatus = searchParams.get('status')?.replace('_', ' ') || 'todos';
  const [filterStatus, setFilterStatus] = useState<string[]>([defaultStatus]);
  const defaultStatusPagamento = searchParams.get('status_pagamento') || 'todos';
  const [filterStatusPagamento, setFilterStatusPagamento] = useState<string[]>([defaultStatusPagamento]);
  const [filterResponsavel, setFilterResponsavel] = useState<string[]>(['todos']);
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

  const canEditOrDelete = !currentUser || (currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('felipe.castro')) || currentUser.startsWith('francisco.edson') || (currentUser.startsWith('debora.mota') || currentUser.startsWith('raphael.ramiro'));

  const uniqueCDs = Array.from(new Set([
    "Fortaleza", "Jundiaí", "NSE", "COC", "PSD",
    ...faturas.map(f => f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd)
  ].filter(Boolean)));
  
  const uniqueResponsaveis = Array.from(new Set(faturas.map(f => f.responsavel).filter(Boolean))).sort();

  const faturasAposFiltroCategoria = faturas.filter(f => (categoria === 'Todas' || f.categoria === categoria) && f.is_sap);
  const faturasFiltradas = faturasAposFiltroCategoria.filter(f => {
    const fCD = (f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '').toLowerCase();
    if (!filterCD.includes('todos')) {
      if (!filterCD.some(cd => fCD === cd.toLowerCase())) return false;
    }

    if (!filterSLA.includes('todos')) {
      const sla = calcularSLA(f);
      const matchesSla = filterSLA.some(slaOpt => {
        if (slaOpt === 'No prazo' && sla === 'Dentro do prazo') return true;
        if (slaOpt === 'Próximas' && sla === 'Próximo do vencimento') return true;
        if (slaOpt === 'Atrasadas' && sla === 'Atrasado') return true;
        return false;
      });
      if (!matchesSla) return false;
    }

    const dataStr = f.data_emissao || (f as any).created_at || new Date().toISOString();
    const d = new Date(dataStr);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const y = d.getFullYear().toString();
    
    if (!filterAno.includes('todos') && !filterAno.includes(y)) return false;
    if (!filterMes.includes('todos') && !filterMes.includes(m)) return false;

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

    if (!filterStatusPagamento.includes("todos")) {
      if (!filterStatusPagamento.some(s => (f.status_pagamento || '').toLowerCase() === s.toLowerCase())) return false;
    }

    if (!filterResponsavel.includes("todos")) {
      if (!filterResponsavel.some(r => (f.responsavel || '') === r)) return false;
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

  const handleDuplicate = (fatura: Fatura) => {
    const { 
      id, numero_documento, valor, data_emissao, data_recebimento, data_vencimento, data_pagamento_real, 
      erp, heflo, v360, data_abertura_heflo, data_abertura_v360, data_aprovacao, 
      is_sap, rc_sap, pedido_sap, data_rc_sap, data_pedido_sap, nexa_chamado, numero_pc_nexa, 
      ...dadosPermanentes 
    } = fatura;
    
    const faturaDuplicada = {
      ...dadosPermanentes,
      id: '',
      numero_documento: '',
      valor: 0,
      data_emissao: '',
      data_recebimento: '',
      data_vencimento: '',
      status_pagamento: 'Em andamento' as any,
      doc_subsequente_criado: false,
      nexa_emitiu_nf: false,
      nexa_anexada: false,
      nexa_lancamento_concluido: false,
      nexa_pagamento_programado: false,
      nexa_pagamento_realizado: false,
      pc_nexa_concluido: false,
    };
    
    setFaturaToEdit(faturaDuplicada as Fatura);
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

  const toggleExpand = async (id: string) => {
    if (expandedFaturaId === id) {
      setExpandedFaturaId(null);
    } else {
      setExpandedFaturaId(id);
      try {
        const periodos = await getFaturaPeriodosAction(id);
        setFaturaPeriodos(periodos);
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
        setFaturaPeriodos([]);
      }
    }
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
            <MultiSelectFilter
              label="CD"
              options={[{value: "todos", label: "Todos"}, ...uniqueCDs.map(cd => ({value: cd as string, label: (cd as string).toUpperCase()}))]}
              selectedValues={filterCD}
              onChange={setFilterCD}
            />
            <MultiSelectFilter
              label="SLA Operacional"
              options={[
                {value: "todos", label: "Todos"},
                {value: "No prazo", label: "Dentro do prazo"},
                {value: "Próximas", label: "Próximas do limite"},
                {value: "Atrasadas", label: "Atrasadas no Fluxo"}
              ]}
              selectedValues={filterSLA}
              onChange={setFilterSLA}
            />
            <MultiSelectFilter
              label="Ano"
              options={[
                {value: "todos", label: "Todos"},
                ...["2023", "2024", "2025", "2026", "2027", "2028"].map(a => ({value: a, label: a}))
              ]}
              selectedValues={filterAno}
              onChange={setFilterAno}
            />
            <MultiSelectFilter
              label="Mês"
              options={[
                {value: "todos", label: "Todos"},
                {value: "01", label: "Janeiro"},
                {value: "02", label: "Fevereiro"},
                {value: "03", label: "Março"},
                {value: "04", label: "Abril"},
                {value: "05", label: "Maio"},
                {value: "06", label: "Junho"},
                {value: "07", label: "Julho"},
                {value: "08", label: "Agosto"},
                {value: "09", label: "Setembro"},
                {value: "10", label: "Outubro"},
                {value: "11", label: "Novembro"},
                {value: "12", label: "Dezembro"}
              ]}
              selectedValues={filterMes}
              onChange={setFilterMes}
            />
            <MultiSelectFilter
              label="Status"
              options={[
                {value: "todos", label: "Todos"},
                {value: "Pago", label: "Pago"},
                {value: "Pago (Vencida)", label: "Pago (Vencida)"},
                {value: "A Vencer", label: "A Vencer"},
                {value: "Vencido", label: "Vencida"}
              ]}
              selectedValues={filterStatus}
              onChange={setFilterStatus}
            />
            <MultiSelectFilter
              label="Resp."
              options={[{value: "todos", label: "Todos"}, ...uniqueResponsaveis.map(r => ({value: r, label: r}))]}
              selectedValues={filterResponsavel}
              onChange={setFilterResponsavel}
            />
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                              <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-purple-700" />
                                <h3 className="text-xl font-bold text-zinc-900">Detalhes da Fatura</h3>
                              </div>
                              {canEditOrDelete && (
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleDuplicate(f)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicar
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setFaturaToTransfer(f)}>
                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                    Transferir / Devolver
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => handleEdit(f)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </Button>
                                </div>
                              )}
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
                              <div className="space-y-5 col-span-1 md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-zinc-200">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Fluxo de Trabalho ({f.fluxo_iniciado_por || 'SAP'})</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {f.fluxo_iniciado_por !== 'Nexa' ? (
                                    <>
                                      {/* T1 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T1'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                                        <span className="text-[11px] font-bold text-purple-800 uppercase block mb-2 mt-1">RC SAP</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.rc_sap || 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.data_rc_sap?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T2 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T2'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-indigo-50 rounded-full border border-indigo-300 flex items-center justify-center text-[10px] font-bold text-indigo-700">T2</div>
                                        <span className="text-[11px] font-bold text-indigo-800 uppercase block mb-2 mt-1">Aprovação RC</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.data_aprovacao ? 'Aprovada' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.data_aprovacao?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T3 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T3'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-blue-50 rounded-full border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-700">T3</div>
                                          <span className="text-[11px] font-bold text-blue-800 uppercase block mb-2 mt-1">Pedido SAP (PC)</span>
                                          <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-zinc-900">{f.pedido_sap || 'Pendente'}</span>
                                            <span className="text-[10px] text-zinc-500">{f.data_pedido_sap?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                          </div>
                                        </div>
                                        {/* Doc Sub */}
                                        <div className="mt-3 pt-2 border-t border-zinc-100 flex justify-between items-center">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Doc Subsequente</span>
                                          <span className="text-[10px] font-medium text-emerald-600">{f.doc_subsequente_criado ? 'Criado' : 'Não criado'}</span>
                                        </div>
                                      </div>

                                      {/* T4 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T4'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T4</div>
                                        <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-2 mt-1">Solicitação Nexa</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_chamado || (f.nexa_anexada ? 'Anexada' : 'Pendente')}</span>
                                          <span className="text-[10px] text-zinc-500">{f.nexa_data_envio?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T5 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T5'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T5</div>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 mt-1">Lançamento Fiscal</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T6 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T6'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-amber-50 rounded-full border border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-700">T6</div>
                                        <span className="text-[11px] font-bold text-amber-800 uppercase block mb-2 mt-1">Programação Pgto</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_pagamento_programado ? 'Programado' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.nexa_data_prevista_pagamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T7 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T7'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T7</div>
                                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-2 mt-1">Efetuar Pagamento</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_pagamento_realizado ? 'Pago' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.data_pagamento_real?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* T1 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T1'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between">
                                        <div>
                                          <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                                          <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-2 mt-1">Solicitação Nexa (Ticket)</span>
                                          <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-zinc-900">{f.nexa_chamado || 'Pendente'}</span>
                                            <span className="text-[10px] text-zinc-500">{f.nexa_data_envio?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                          </div>
                                        </div>
                                        {/* Sub-item PC Nexa */}
                                        <div className="mt-3 pt-2 border-t border-zinc-100 flex justify-between items-center">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase">PC Vinculado</span>
                                          <div className="text-right flex flex-col">
                                            <span className="text-[10px] font-medium text-blue-600">{f.numero_pc_nexa || (f.pc_nexa_concluido ? 'Concluído' : 'Pendente')}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* T2 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T2'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T2</div>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 mt-1">Lançamento Fiscal</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_lancamento_concluido ? 'Concluído' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.nexa_data_conclusao_lancamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T3 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T3'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-amber-50 rounded-full border border-amber-300 flex items-center justify-center text-[10px] font-bold text-amber-700">T3</div>
                                        <span className="text-[11px] font-bold text-amber-800 uppercase block mb-2 mt-1">Programação Pgto</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_pagamento_programado ? 'Programado' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.nexa_data_prevista_pagamento?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>

                                      {/* T4 */}
                                      <div onClick={() => setSelectedStage({fatura: f, stage: 'T4'})} className="relative p-4 bg-white rounded-xl border border-zinc-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-2 mt-1">Efetuar Pagamento</span>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-zinc-900">{f.nexa_pagamento_realizado ? 'Pago' : 'Pendente'}</span>
                                          <span className="text-[10px] text-zinc-500">{f.data_pagamento_real?.split('-').reverse().join('/') || 'S/ Data'}</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
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

                            {/* Histórico de Tempos e SLAs */}
                            <div className="mt-8 pt-8 border-t border-zinc-200">
                              <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-amber-600" />
                                <h3 className="text-lg font-bold text-zinc-900">Histórico de SLAs e Transferências</h3>
                              </div>
                              
                              {faturaPeriodos.length === 0 ? (
                                <div className="p-6 bg-zinc-50 rounded-lg text-center text-zinc-500 text-sm">
                                  Nenhum histórico registrado ainda. Transfira o processo para iniciar a contagem.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {faturaPeriodos.map((p, idx) => {
                                    const dInicio = new Date(p.data_inicio);
                                    const dTermino = p.data_termino ? new Date(p.data_termino) : new Date();
                                    const diffDias = Math.ceil((dTermino.getTime() - dInicio.getTime()) / (1000 * 3600 * 24));
                                    const estourouSLA = diffDias > p.sla_dias;
                                    
                                    return (
                                      <div key={p.id} className="relative pl-6 pb-4 border-l-2 border-zinc-200 last:border-0 last:pb-0">
                                        <div className={cn("absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-white", !p.data_termino ? "bg-amber-500" : (estourouSLA ? "bg-red-500" : "bg-emerald-500"))}></div>
                                        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Etapa: {p.etapa_nome}</span>
                                              <h4 className="text-base font-bold text-zinc-800">Time: {p.time_responsavel}</h4>
                                            </div>
                                            <div className="text-right">
                                              <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", !p.data_termino ? "bg-amber-100 text-amber-700" : (estourouSLA ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"))}>
                                                SLA: {p.sla_dias} dias | Usado: {diffDias} dias
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-sm text-zinc-600 mb-3">
                                            <p><strong>Início:</strong> {dInicio.toLocaleString('pt-BR')}</p>
                                            {p.data_termino && <p><strong>Fim:</strong> {new Date(p.data_termino).toLocaleString('pt-BR')}</p>}
                                          </div>
                                          {p.motivo_transferencia && (
                                            <div className="bg-zinc-50 p-3 rounded border border-zinc-100 text-sm">
                                              <p className="font-semibold text-zinc-800 mb-1">Motivo: {p.motivo_transferencia}</p>
                                              {p.observacao_transferencia && <p className="text-zinc-600">{p.observacao_transferencia}</p>}
                                              <p className="text-xs text-zinc-400 mt-2 block">Transferido por: {p.usuario_transferencia || 'Sistema'}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
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

      <ConfirmDeleteModal 
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => handleDelete(itemToDelete!)}
      />

      <TransferModal 
        isOpen={!!faturaToTransfer}
        onClose={() => setFaturaToTransfer(null)}
        fatura={faturaToTransfer}
        onSuccess={() => {
          if (expandedFaturaId === faturaToTransfer?.id) {
            // refresh data
            toggleExpand(faturaToTransfer.id);
            setTimeout(() => toggleExpand(faturaToTransfer.id), 50);
          }
        }}
      />
      </div>
    </div>
  );
}
