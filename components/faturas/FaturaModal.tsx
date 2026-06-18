"use client";

import { useState, useEffect } from "react";
import { Fatura, calcularStatus, calcularEtapa } from "@/modules/compras/domain/Fatura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { cn, formatCNPJ } from "@/lib/utils";
import { useFornecedores } from "@/hooks/useFornecedores";
import { supabase } from "@/lib/supabase";

interface FaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura | null;
  marcaAtiva: string;
  categoriaAtiva: 'Serviço' | 'Material';
  onSave: (f: Fatura) => void;
}

export function FaturaModal({ isOpen, onClose, fatura, marcaAtiva, categoriaAtiva, onSave }: FaturaModalProps) {
  const isEditing = !!fatura;
  const { fornecedores } = useFornecedores(categoriaAtiva);

  const [formData, setFormData] = useState<Partial<Fatura>>({
    marca: marcaAtiva,
    categoria: categoriaAtiva,
    possui_encargo: false,
    status_pagamento: 'Em andamento',
    ...fatura,
    cd: fatura?.cd || fatura?.insumos?.find(i => (i as any)._meta)?.cd || fatura?.insumos?.[0]?.cd || '',
    codigo_fornecedor: fatura?.codigo_fornecedor || fatura?.insumos?.find(i => (i as any)._meta)?.codigo_fornecedor || fatura?.insumos?.[0]?.codigo_fornecedor || '',
    insumos: fatura?.insumos?.filter(i => !(i as any)._meta) || [],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [contasProtheus, setContasProtheus] = useState<{conta_protheus: string, desc_conta_protheus: string}[]>([]);
  const [availableInsumos, setAvailableInsumos] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      supabase?.from('contas_protheus').select('*').then(({data}) => {
        if (data) setContasProtheus(data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && categoriaAtiva === 'Material' && formData.marca) {
      supabase?.from('estoque_insumos')
        .select('codigo, item, cd, empresa')
        .eq('empresa', formData.marca)
        .then(({data}) => {
          if (data) {
            if (formData.cd) {
              const cdNorm = formData.cd.toLowerCase().trim();
              const filtered = data.filter(d => d.cd.toLowerCase().includes(cdNorm) || cdNorm.includes(d.cd.toLowerCase()));
              setAvailableInsumos(filtered.length > 0 ? filtered : data);
            } else {
              setAvailableInsumos(data);
            }
          }
        });
    } else {
      setAvailableInsumos([]);
    }
  }, [isOpen, categoriaAtiva, formData.marca, formData.cd]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Fatura, value: any) => {
    let newFormData = { ...formData, [field]: value };

    if (field === 'possui_encargo' && value === false) {
      newFormData.valor_encargo = undefined;
    }

    setFormData(newFormData);
  };

  const handleSelectChange = (field: keyof Fatura) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(field, e.target.value);
  };

  const handleInputChange = (field: keyof Fatura) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    handleChange(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (categoriaAtiva === 'Material' && formData.insumos && formData.insumos.length > 0) {
      const somaInsumos = formData.insumos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
      const valorFatura = formData.valor || 0;
      
      if (Math.abs(somaInsumos - valorFatura) > 0.01) {
        setFormError(`A soma dos insumos (R$ ${somaInsumos.toFixed(2)}) não confere com o valor total da fatura (R$ ${valorFatura.toFixed(2)}).`);
        return;
      }
    }

    const currentInsumos = formData.insumos || [];
    const metaObj = { _meta: true, cd: formData.cd, codigo_fornecedor: formData.codigo_fornecedor };
    
    const finalFatura = {
      ...formData,
      id: formData.id || `F-${Math.floor(Math.random() * 100000)}__CAT__${categoriaAtiva}`,
      insumos: [
        ...currentInsumos.map(ins => ({ ...ins, cd: formData.cd, codigo_fornecedor: formData.codigo_fornecedor })),
        metaObj
      ],
    } as Fatura;
    onSave(finalFatura);
  };

  const autoStatus = calcularStatus(formData);
  const autoEtapa = calcularEtapa(formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl my-auto flex flex-col max-h-[90vh]">
        
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center z-10 shrink-0 rounded-t-xl">
          <h2 className="text-xl font-bold text-zinc-900">{isEditing ? 'Editar Fatura' : 'Nova Fatura'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} type="button">X</Button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 bg-zinc-50/50">
          <form id="fatura-form" onSubmit={handleSubmit} className="space-y-6">
            
            {formError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Fornecedor</label>
                  <Input list="fornecedores-list" value={formData.fornecedor || ""} onChange={(e) => {
                    const value = e.target.value;
                    const fornecedorMatch = fornecedores.find(f => (f.nome_fantasia || f.razao_social) === value);
                    if (fornecedorMatch) {
                      setFormData(prev => ({ ...prev, fornecedor: value, cnpj: formatCNPJ(fornecedorMatch.cnpj), codigo_fornecedor: fornecedorMatch.codigo_fornecedor }));
                    } else {
                      setFormData(prev => ({ ...prev, fornecedor: value }));
                    }
                  }} required placeholder="Nome do Fornecedor" />
                  <datalist id="fornecedores-list">
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.nome_fantasia || f.razao_social} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CNPJ</label>
                  <Input value={formData.cnpj || ""} onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cód. Fornecedor</label>
                  <Input value={formData.codigo_fornecedor || ""} onChange={handleInputChange('codigo_fornecedor')} placeholder="Código do fornecedor" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Emissão</label>
                  <Input type="date" value={formData.data_emissao || ""} onChange={handleInputChange('data_emissao')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Recebimento</label>
                  <Input type="date" value={formData.data_recebimento || ""} onChange={handleInputChange('data_recebimento')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input type="date" value={formData.data_vencimento || ""} onChange={handleInputChange('data_vencimento')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nota Fiscal</label>
                  <Input value={formData.numero_documento || ""} onChange={handleInputChange('numero_documento')} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Total</label>
                  <Input type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marca</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.marca || marcaAtiva} onChange={handleSelectChange('marca')} required>
                    {["SAS", "SAE", "IS", "EI", "Pleno", "MM", "GF", "NSE"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Centro de Custo</label>
                  <Input value={formData.centro_custo || ""} onChange={handleInputChange('centro_custo')} placeholder="Centro de Custo" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filial</label>
                  <Input value={formData.filial || ""} onChange={handleInputChange('filial')} placeholder="Filial" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CD / Unidade</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.cd || ""} onChange={handleSelectChange('cd')} required>
                    <option value="" disabled>Selecione um CD</option>
                    {["Fortaleza", "Jundiaí", "NSE"].map(cd => (
                      <option key={cd} value={cd}>{cd}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Documento</label>
                  <Input value={formData.tipo_documento || ""} onChange={handleInputChange('tipo_documento')} placeholder="Ex: NFE" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de {categoriaAtiva}</label>
                  <Input value={formData.tipo_servico || ""} onChange={handleInputChange('tipo_servico')} placeholder={`Tipo de ${categoriaAtiva}`} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cód. {categoriaAtiva}</label>
                  <Input value={formData.codigo_servico || ""} onChange={handleInputChange('codigo_servico')} placeholder="Ex: 000100" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta Contábil</label>
                  <Input value={formData.conta_contabil || ""} onChange={handleInputChange('conta_contabil')} placeholder="Conta Contábil" />
                </div>
              </div>

              {categoriaAtiva === 'Serviço' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-zinc-100 pt-4">
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Conta Protheus *</label>
                    <Input 
                      value={formData.conta_protheus || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({...prev, conta_protheus: val}));
                        const match = contasProtheus.find(c => c.conta_protheus === val);
                        if (match) setFormData(prev => ({...prev, conta_protheus: match.conta_protheus, desc_conta_protheus: match.desc_conta_protheus}));
                      }}
                      list="contas-protheus-list"
                      placeholder="Ex: 102030" 
                      required={categoriaAtiva === 'Serviço'} 
                    />
                    <datalist id="contas-protheus-list">
                      {contasProtheus.map(c => (
                        <option key={c.conta_protheus} value={c.conta_protheus}>{c.desc_conta_protheus}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Descrição Conta Protheus *</label>
                    <Input 
                      value={formData.desc_conta_protheus || ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({...prev, desc_conta_protheus: val}));
                        const match = contasProtheus.find(c => c.desc_conta_protheus === val);
                        if (match) setFormData(prev => ({...prev, conta_protheus: match.conta_protheus, desc_conta_protheus: match.desc_conta_protheus}));
                      }}
                      list="desc-contas-protheus-list"
                      placeholder="Descrição da conta" 
                      required={categoriaAtiva === 'Serviço'} 
                    />
                    <datalist id="desc-contas-protheus-list">
                      {contasProtheus.map(c => (
                        <option key={c.conta_protheus} value={c.desc_conta_protheus}>{c.conta_protheus}</option>
                      ))}
                    </datalist>
                  </div>
                </div>
              )}
            </section>

            {categoriaAtiva === 'Material' && (
              <section className="space-y-4 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                    Insumos da Compra
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const current = formData.insumos || [];
                    setFormData({...formData, insumos: [...current, { codigo: '', item: '', quantidade: 1 }]});
                  }} className="gap-2">
                    <Plus className="w-4 h-4" /> Adicionar Insumo
                  </Button>
                </div>

                {(!formData.insumos || formData.insumos.length === 0) ? (
                  <div className="text-sm text-zinc-500 text-center py-4 bg-zinc-50 rounded-lg border border-zinc-100">
                    Nenhum insumo adicionado a esta fatura. (Preencha a Marca para listar os insumos corretamente)
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.insumos.map((ins, index) => (
                      <div key={index} className="flex flex-col gap-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="space-y-2 md:col-span-4 relative">
                            <label className="text-xs font-medium text-zinc-700">Insumo</label>
                            <Input 
                              list={`insumos-list-${index}`}
                              value={ins.item} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const match = availableInsumos.find(a => a.item === val);
                                const newInsumos = [...(formData.insumos || [])];
                                newInsumos[index] = { ...ins, item: val, codigo: match ? match.codigo : ins.codigo };
                                setFormData({ ...formData, insumos: newInsumos });
                              }} 
                              placeholder="Selecione o insumo..." 
                              required
                            />
                            <datalist id={`insumos-list-${index}`}>
                              {availableInsumos.map((a, i) => {
                                const rawCd = a.cd.includes('-') ? a.cd.split('-')[0] : a.cd;
                                const cdFormatted = rawCd.charAt(0).toUpperCase() + rawCd.slice(1).toLowerCase();
                                return (
                                  <option key={`${a.codigo}-${i}`} value={a.item}>{a.codigo} ({cdFormatted})</option>
                                );
                              })}
                            </datalist>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-medium text-zinc-700">Código (Auto)</label>
                            <Input value={ins.codigo} readOnly className="bg-zinc-100 text-zinc-500 cursor-not-allowed" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-medium text-zinc-700">Qtd</label>
                            <Input type="number" min="1" value={ins.quantidade} onChange={(e) => {
                              const newInsumos = [...(formData.insumos || [])];
                              const qtd = parseFloat(e.target.value) || 0;
                              const preco = newInsumos[index].preco_unitario || 0;
                              newInsumos[index].quantidade = qtd;
                              newInsumos[index].valor_total = parseFloat((qtd * preco).toFixed(2));
                              setFormData({ ...formData, insumos: newInsumos });
                            }} required />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-medium text-zinc-700">Preço Unit.</label>
                            <Input type="number" step="0.01" value={ins.preco_unitario || ""} onChange={(e) => {
                              const newInsumos = [...(formData.insumos || [])];
                              const preco = parseFloat(e.target.value) || 0;
                              const qtd = newInsumos[index].quantidade || 0;
                              newInsumos[index].preco_unitario = preco;
                              newInsumos[index].valor_total = parseFloat((qtd * preco).toFixed(2));
                              setFormData({ ...formData, insumos: newInsumos });
                            }} required placeholder="R$ 0,00" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-medium text-zinc-700">Total (Auto)</label>
                            <Input value={ins.valor_total || ""} readOnly className="bg-zinc-100 text-zinc-500 cursor-not-allowed" placeholder="R$ 0,00" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-4">
                          <div className="space-y-2 md:col-span-5 relative">
                            <label className="text-xs font-medium text-zinc-700">Conta Protheus</label>
                            <Input 
                              value={ins.conta_protheus || ""} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const newInsumos = [...(formData.insumos || [])];
                                newInsumos[index].conta_protheus = val;
                                const match = contasProtheus.find(c => c.conta_protheus === val);
                                if (match) {
                                  newInsumos[index].conta_protheus = match.conta_protheus;
                                  newInsumos[index].desc_conta_protheus = match.desc_conta_protheus;
                                }
                                setFormData({ ...formData, insumos: newInsumos });
                              }}
                              list={`contas-insumo-list-${index}`}
                              placeholder="Ex: 102030" 
                              required 
                            />
                            <datalist id={`contas-insumo-list-${index}`}>
                              {contasProtheus.map(c => (
                                <option key={c.conta_protheus} value={c.conta_protheus}>{c.desc_conta_protheus}</option>
                              ))}
                            </datalist>
                          </div>
                          <div className="space-y-2 md:col-span-6 relative">
                            <label className="text-xs font-medium text-zinc-700">Desc. Conta Protheus</label>
                            <Input 
                              value={ins.desc_conta_protheus || ""} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const newInsumos = [...(formData.insumos || [])];
                                newInsumos[index].desc_conta_protheus = val;
                                const match = contasProtheus.find(c => c.desc_conta_protheus === val);
                                if (match) {
                                  newInsumos[index].conta_protheus = match.conta_protheus;
                                  newInsumos[index].desc_conta_protheus = match.desc_conta_protheus;
                                }
                                setFormData({ ...formData, insumos: newInsumos });
                              }}
                              list={`desc-contas-insumo-list-${index}`}
                              placeholder="Descrição..." 
                              required 
                            />
                            <datalist id={`desc-contas-insumo-list-${index}`}>
                              {contasProtheus.map(c => (
                                <option key={c.conta_protheus} value={c.desc_conta_protheus}>{c.conta_protheus}</option>
                              ))}
                            </datalist>
                          </div>
                          <div className="md:col-span-1 pb-1 flex justify-end">
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                              const newInsumos = formData.insumos!.filter((_, i) => i !== index);
                              setFormData({ ...formData, insumos: newInsumos });
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-4 p-4 border border-blue-400 bg-blue-50 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm text-blue-900">Integração HEFLO</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-900">ID HEFLO</label>
                  <Input className="border-blue-200 focus-visible:ring-blue-500 bg-white" value={formData.heflo || ""} onChange={handleInputChange('heflo')} placeholder="HF-..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-900">Data de Abertura HEFLO</label>
                  <Input className="border-blue-200 focus-visible:ring-blue-500 bg-white" type="date" value={formData.data_abertura_heflo || ""} onChange={handleInputChange('data_abertura_heflo')} />
                </div>
              </div>

              <div className="space-y-4 p-4 border border-slate-400 bg-slate-50 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm text-slate-900">Integração ERP</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-900">ID ERP</label>
                  <Input className="border-slate-300 focus-visible:ring-slate-500 bg-white" value={formData.erp || ""} onChange={handleInputChange('erp')} placeholder="ERP-..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-900">Data de Aprovação</label>
                  <Input className="border-slate-300 focus-visible:ring-slate-500 bg-white" type="date" value={formData.data_aprovacao || ""} onChange={handleInputChange('data_aprovacao')} />
                </div>
              </div>

              <div className="space-y-4 p-4 border border-orange-400 bg-orange-50 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm text-orange-900">Integração V360</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-orange-900">ID V360</label>
                  <Input className="border-orange-200 focus-visible:ring-orange-500 bg-white" value={formData.v360 || ""} onChange={handleInputChange('v360')} placeholder="V-..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-orange-900">Data de Abertura V360</label>
                  <Input className="border-orange-200 focus-visible:ring-orange-500 bg-white" type="date" value={formData.data_abertura_v360 || ""} onChange={handleInputChange('data_abertura_v360')} />
                </div>
              </div>
            </div>

            <section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" 
                  value={formData.observacoes || ""} 
                  onChange={(e) => handleChange('observacoes', e.target.value)} 
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor do Encargo</label>
                  <Input type="number" step="0.01" value={formData.valor_encargo || ""} onChange={handleInputChange('valor_encargo')} placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Pagamento</label>
                  <Input type="date" value={formData.data_pagamento_real || ""} onChange={handleInputChange('data_pagamento_real')} />
                </div>
              </div>
            </section>

            <section className="space-y-4 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                Status e Etapa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                <div className="space-y-2 border-l-4 pl-3 border-zinc-300">
                  <label className="text-sm font-bold text-zinc-700">Status do Pagamento (Manual)</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.status_pagamento || "Em andamento"} onChange={handleSelectChange('status_pagamento')}>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Aguardando pagamento">Aguardando pagamento</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>

                <div className={cn("p-3 rounded-md border space-y-1 transition-colors", 
                  autoStatus === 'Vencido' ? 'bg-red-100 border-red-200' :
                  autoStatus === 'Pago' ? 'bg-green-100 border-green-200' :
                  autoStatus === 'A vencer' ? 'bg-purple-200 border-purple-200' :
                  'bg-zinc-100 border-zinc-200'
                )}>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest block",
                    autoStatus === 'Vencido' ? 'text-red-700' :
                    autoStatus === 'Pago' ? 'text-green-700' :
                    autoStatus === 'A vencer' ? 'text-purple-900' :
                    'text-zinc-600'
                  )}>Status (Auto)</span>
                  <span className={cn("text-sm font-bold",
                    autoStatus === 'Vencido' ? 'text-red-900' :
                    autoStatus === 'Pago' ? 'text-green-900' :
                    autoStatus === 'A vencer' ? 'text-purple-900' :
                    'text-zinc-900'
                  )}>{autoStatus?.toUpperCase()}</span>
                </div>

                <div className={cn("p-3 rounded-md border space-y-1 transition-colors",
                  autoEtapa === 'Integração' ? 'bg-red-500 border-red-600' :
                  autoEtapa === 'HEFLO' ? 'bg-blue-500 border-blue-600' :
                  autoEtapa === 'ERP' ? 'bg-zinc-500 border-zinc-600' :
                  autoEtapa === 'V360' ? 'bg-orange-500 border-orange-600' :
                  autoEtapa === 'Aguardando pagamento' ? 'bg-green-300 border-green-400' :
                  autoEtapa === 'Pago' ? 'bg-green-700 border-green-800' :
                  'bg-zinc-500 border-zinc-600'
                )}>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest block",
                    autoEtapa === 'Aguardando pagamento' ? 'text-green-900' :
                    'text-white/80'
                  )}>Etapa (Auto)</span>
                  <span className={cn("text-sm font-bold",
                    autoEtapa === 'Aguardando pagamento' ? 'text-green-900' :
                    'text-white'
                  )}>{autoEtapa?.toUpperCase()}</span>
                </div>
              </div>
            </section>
            
          </form>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-zinc-200 py-4 px-6 flex justify-end gap-2 shrink-0 rounded-b-xl">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button form="fatura-form" type="submit">{isEditing ? 'Salvar Alterações' : 'Criar Fatura'}</Button>
        </div>

      </div>
    </div>
  );
}
