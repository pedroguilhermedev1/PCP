"use client";

import { Fatura, calcularStatus, calcularEtapa, calcularSLA } from "@/modules/compras/domain/Fatura";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { FaturaModal } from "@/components/faturas/FaturaModal";
import { saveFaturaAction, deleteFaturaAction } from "./actions";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { formatCNPJ } from "@/lib/utils";

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

  useEffect(() => {
    setFaturas(initialFaturas);
  }, [initialFaturas]);

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setCurrentUser(user);
    }
  }, [categoria]);

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson');

  const uniqueCDs = Array.from(new Set(faturas.map(f => f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd).filter(Boolean)));

  const faturasAposFiltroCategoria = faturas.filter(f => f.categoria === categoria);
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
    const prevFaturas = [...faturas];
    if (faturaToEdit) {
      setFaturas(prev => prev.map(f => f.id === savedFatura.id ? savedFatura : f));
    } else {
      setFaturas(prev => [...prev, savedFatura]);
    }
    setIsModalOpen(false);
    
    try {
      await saveFaturaAction(savedFatura);
      toast.success("Registro salvo com sucesso.");
    } catch (error) {
      console.error("Failed to save", error);
      toast.error("Erro ao salvar registro.");
      setFaturas(prevFaturas);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vencido': return 'bg-red-100 text-red-700 font-bold';
      case 'Pago': return 'bg-green-100 text-green-700 font-bold';
      case 'Pago (Vencida)': return 'bg-amber-100 text-amber-700 font-bold';
      case 'A vencer': return 'bg-purple-200 text-purple-900 font-bold';
      default: return 'bg-zinc-100 text-zinc-800 font-bold';
    }
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'Integração': return 'bg-red-500 text-white';
      case 'HEFLO': return 'bg-blue-500 text-white';
      case 'ERP': return 'bg-zinc-500 text-white';
      case 'V360': return 'bg-orange-500 text-white';
      case 'Aguardando pagamento': return 'bg-green-300 text-green-900';
      case 'Pago': return 'bg-green-700 text-white';
      default: return 'bg-zinc-500 text-white';
    }
  };

  const faturasOrdenadas = faturasFiltradas.sort((a, b) => {
    const da = new Date(a.data_vencimento || '2099-12-31').getTime();
    const db = new Date(b.data_vencimento || '2099-12-31').getTime();
    return da - db;
  });

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
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
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-purple-900">Gestão de Faturas</h1>
        
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
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">SLA / Prazo</span>
            <select 
              value={filterSLA} 
              onChange={(e) => setFilterSLA(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none text-zinc-800 cursor-pointer min-w-[120px]"
            >
              <option value="todos">Todos</option>
              <option value="No prazo">Dentro do prazo</option>
              <option value="Próximas">Próximas do limite</option>
              <option value="Atrasadas">Atrasadas</option>
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
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-8">
        <h2 className="text-lg font-semibold text-purple-900">LISTA DE FATURAS</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          NOVA FATURA
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm w-full overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>CD</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Nota Fiscal</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status Fatura</TableHead>
              <TableHead>Etapa</TableHead>
              {canEditOrDelete && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {faturasOrdenadas.map((f, index) => {
              const status = calcularStatus(f);
              const etapa = calcularEtapa(f);

              return (
                <React.Fragment key={f.id}>
                  <TableRow 
                    className={`cursor-pointer hover:bg-zinc-50 ${expandedFaturaId === f.id ? 'bg-zinc-50' : ''}`}
                    onClick={() => toggleExpand(f.id)}
                  >
                    <TableCell className="text-center font-medium text-zinc-400 text-xs">
                      {index + 1}
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
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-zinc-600 bg-zinc-50">{f.filial || 'Indefinido'}</Badge>
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
                      <Badge variant="outline" className={getStatusColor(status)}>
                        {status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEtapaColor(etapa)}>
                        {etapa.toUpperCase()}
                      </Badge>
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
                    <TableRow className="bg-zinc-50">
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
                                <span className="text-xs text-zinc-500 block">Tipo Doc</span>
                                <span className="text-sm font-medium">{f.tipo_documento}</span>
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
  );
}
