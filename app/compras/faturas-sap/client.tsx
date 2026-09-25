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
import { FaturaDetailsModal } from "@/components/faturas/FaturaDetailsModal";
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
      is_sap, rc_sap, pedido_sap, data_rc_sap, data_pedido_sap, nexa_chamado, numero_pc_nexa, identificador, insumos, created_at, responsavel, codigo_fatura, tipo_documento,
      ...dadosPermanentes 
    } = fatura as any;
    
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
      
      {selectedStage && (
        <TimeDetailsModal
          isOpen={!!selectedStage}
          onClose={() => setSelectedStage(null)}
          fatura={selectedStage.fatura}
          stage={selectedStage.stage}
        />
      )}

      {isModalOpen && (
        <FaturaSAPModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          fatura={faturaToEdit}
          categoriaAtiva={categoria as "Serviço" | "Material"}
          onSave={handleSave}
        />
      )}

      <FaturaDetailsModal
        isOpen={!!expandedFaturaId}
        onClose={() => setExpandedFaturaId(null)}
        fatura={faturas.find(f => f.id === expandedFaturaId) || null}
        faturaPeriodos={faturaPeriodos}
        canEditOrDelete={canEditOrDelete}
        handleDuplicate={handleDuplicate}
        setFaturaToTransfer={setFaturaToTransfer}
        handleEdit={handleEdit}
        setSelectedStage={setSelectedStage}
        getStatusColor={getStatusColor}
        getEtapaColor={getEtapaColor}
        getEtapaLabel={getEtapaLabel}
      />

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
