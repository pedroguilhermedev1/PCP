"use client";

import { Fatura, calcularStatus, calcularEtapa } from "@/modules/compras/domain/Fatura";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { FaturaModal } from "@/components/faturas/FaturaModal";
import { saveFaturaAction, deleteFaturaAction } from "./actions";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export function FaturasTableClient({ initialFaturas, categoria }: { initialFaturas: Fatura[], categoria: 'Serviço' | 'Material' }) {
  const [faturas, setFaturas] = useState<Fatura[]>(initialFaturas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faturaToEdit, setFaturaToEdit] = useState<Fatura | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<string | null>("COC");
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    setFaturas(initialFaturas);
  }, [initialFaturas]);

  useEffect(() => {
    const savedMarca = localStorage.getItem(`selectedMarca_${categoria}`);
    if (savedMarca) {
      setSelectedMarca(savedMarca);
    }
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setCurrentUser(user);
    }
  }, [categoria]);

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson');

  const handleSetSelectedMarca = (marca: string) => {
    setSelectedMarca(marca);
    localStorage.setItem(`selectedMarca_${categoria}`, marca);
  };

  const marcas = ["SAS", "SAE", "IS", "EI", "Pleno", "MM", "GF", "PSD", "Positivo", "COC", "Geekie", "Nave"];

  const faturasAposFiltroCategoria = faturas.filter(f => f.categoria === categoria);
  const faturasFiltradas = selectedMarca 
    ? faturasAposFiltroCategoria.filter(f => f.marca === selectedMarca)
    : [];

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-purple-900 mb-4">Gestão de Compras</h1>
        
        <div className="flex flex-wrap gap-2">
          {marcas.map(marca => (
            <Button 
              key={marca} 
              variant={selectedMarca === marca ? "default" : "outline"}
              onClick={() => handleSetSelectedMarca(marca)}
            >
              {marca}
            </Button>
          ))}
        </div>
      </div>

      {selectedMarca && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-8">
            <h2 className="text-lg font-semibold text-purple-900">Compras - {selectedMarca}</h2>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Compra
            </Button>
          </div>

          <div className="bg-white rounded-md border shadow-sm w-full overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status Fatura</TableHead>
                  <TableHead>Etapa</TableHead>
                  {canEditOrDelete && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturasOrdenadas.map((f) => {
                  const status = calcularStatus(f);
                  const etapa = calcularEtapa(f);

                  return (
                    <React.Fragment key={f.id}>
                      <TableRow 
                        className={`cursor-pointer hover:bg-zinc-50 ${expandedFaturaId === f.id ? 'bg-zinc-50' : ''}`}
                        onClick={() => toggleExpand(f.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-xs text-zinc-400 font-bold">{f.identificador || 'S/ ID'}</span>
                            <span>{f.fornecedor}</span>
                          </div>
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
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEtapaColor(etapa)}>
                            {etapa}
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
                          <TableCell colSpan={canEditOrDelete ? 7 : 6} className="p-0 border-b">
                            <div className="p-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <h3 className="text-lg font-bold text-purple-900">Detalhes da Compra</h3>
                                {canEditOrDelete && (
                                  <Button variant="secondary" size="sm" onClick={() => handleEdit(f)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Compra
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
                                    <span className="text-sm font-medium">{f.cnpj}</span>
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
                    <TableCell colSpan={canEditOrDelete ? 7 : 6} className="text-center py-8 text-zinc-500">
                      Nenhuma fatura encontrada para {selectedMarca}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {isModalOpen && selectedMarca && (
        <FaturaModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          fatura={faturaToEdit}
          marcaAtiva={selectedMarca}
          categoriaAtiva={categoria}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
