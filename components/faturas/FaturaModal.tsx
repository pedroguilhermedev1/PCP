"use client";

import { useState } from "react";
import { Fatura, calcularStatus, calcularEtapa } from "@/modules/compras/domain/Fatura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useFornecedores } from "@/hooks/useFornecedores";

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
  });

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
    const finalFatura = {
      ...formData,
      id: formData.id || `F-${Math.floor(Math.random() * 100000)}__CAT__${categoriaAtiva}`,
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
            
            <section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fornecedor</label>
                  <Input list="fornecedores-list" value={formData.fornecedor || ""} onChange={(e) => {
                    const value = e.target.value;
                    const fornecedorMatch = fornecedores.find(f => (f.nome_fantasia || f.razao_social) === value);
                    if (fornecedorMatch) {
                      setFormData(prev => ({ ...prev, fornecedor: value, cnpj: fornecedorMatch.cnpj }));
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
                  <Input value={formData.cnpj || ""} onChange={handleInputChange('cnpj')} placeholder="00.000.000/0000-00" />
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
                  <label className="text-sm font-medium">Nº Documento</label>
                  <Input value={formData.numero_documento || ""} onChange={handleInputChange('numero_documento')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Total</label>
                  <Input type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marca</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.marca || marcaAtiva} onChange={handleSelectChange('marca')}>
                    {["COC", "IS", "NSE", "PSD", "Raízes", "SAE", "SAS"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Centro de Custo</label>
                  <Input value={formData.centro_custo || ""} onChange={handleInputChange('centro_custo')} placeholder="Centro de Custo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filial</label>
                  <Input value={formData.filial || ""} onChange={handleInputChange('filial')} placeholder="Filial" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Documento</label>
                  <Input value={formData.tipo_documento || ""} onChange={handleInputChange('tipo_documento')} placeholder="Ex: NFE" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de {categoriaAtiva}</label>
                  <Input value={formData.tipo_servico || ""} onChange={handleInputChange('tipo_servico')} placeholder={`Tipo de ${categoriaAtiva}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cód. {categoriaAtiva}</label>
                  <Input value={formData.codigo_servico || ""} onChange={handleInputChange('codigo_servico')} placeholder="Ex: 000100" />
                </div>
              </div>
            </section>

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
                  )}>{autoStatus}</span>
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
                  )}>{autoEtapa}</span>
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
