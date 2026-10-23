"use client";

import { useState, useEffect } from "react";
import { Fatura, calcularStatus, calcularEtapa, calcularSlaDinamico, getEtapasDatas, calcularTempoDias, parseObservacoes, buildObservacoes } from "@/modules/compras/domain/Fatura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, X } from "lucide-react";
import { cn, formatCNPJ } from "@/lib/utils";
import { useFornecedores } from "@/hooks/useFornecedores";
import { supabase } from "@/lib/supabase";
import { formatUserName, getUserRole } from "@/lib/roles";
import { calcularDatasPrevisao, formatarPeriodoEstimado } from "@/lib/previsaoRecebimento";

interface FaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura | null;
  categoriaAtiva: 'Serviço' | 'Material';
  onSave: (f: Fatura) => void;
}

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'Pendente';
  const parts = dateStr.split('T');
  return parts[0].split('-').reverse().join('/');
};

export function FaturaSAPModal({ isOpen, onClose, fatura, categoriaAtiva, onSave }: FaturaModalProps) {
  const isEditing = !!fatura;
  const { fornecedores } = useFornecedores(categoriaAtiva);

  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('pcp_user') || '' : '';
  const isReadOnly = getUserRole(currentUser) === 'LIDERANCA' || getUserRole(currentUser) === 'REPORTS';

  const metaInsumo = (fatura?.insumos?.find(i => (i as any)._meta) as any) || {};

  const [formData, setFormData] = useState<Partial<Fatura>>({
    categoria: categoriaAtiva,
    possui_encargo: false,
    status_pagamento: 'Em andamento',
    forma_pagamento: fatura?.forma_pagamento || 'Boleto',
    fluxo_iniciado_por: fatura?.fluxo_iniciado_por || 'SAP',
    ...fatura,
    previsao_recebimento_dias_min: fatura?.previsao_recebimento_dias_min ?? metaInsumo.previsao_recebimento_dias_min ?? undefined,
    previsao_recebimento_dias_max: fatura?.previsao_recebimento_dias_max ?? metaInsumo.previsao_recebimento_dias_max ?? undefined,
    previsao_recebimento_data_inicio: fatura?.previsao_recebimento_data_inicio ?? metaInsumo.previsao_recebimento_data_inicio ?? undefined,
    previsao_recebimento_data_fim: fatura?.previsao_recebimento_data_fim ?? metaInsumo.previsao_recebimento_data_fim ?? undefined,
    historico_previsao: fatura?.historico_previsao ?? metaInsumo.historico_previsao ?? [],
    fiscal_observacao: fatura?.fiscal_observacao || parseObservacoes(fatura?.observacoes).fiscal_observacao || '',
    pagamento_observacao: fatura?.pagamento_observacao || parseObservacoes(fatura?.observacoes).pagamento_observacao || '',
    cd: fatura?.cd || metaInsumo.cd || fatura?.insumos?.[0]?.cd || '',
    codigo_fornecedor: fatura?.codigo_fornecedor || metaInsumo.codigo_fornecedor || fatura?.insumos?.[0]?.codigo_fornecedor || '',
    insumos: fatura?.insumos?.filter(i => !(i as any)._meta) || [],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [showPendenciaModal, setShowPendenciaModal] = useState(false);
  const [ocorrenciaModal, setOcorrenciaModal] = useState<{isOpen: boolean, t_origem?: string, novoDestino?: string, novoMotivo?: string}>({isOpen: false});
  const MOTIVOS_OCORRENCIA = [
  'Inserir informações faltantes',
  'Solicitar correção de informações',
  'Anexar documentos para pagamento',
  'Validar informações do processo',
  'Acompanhar aprovação',
  'Aguardar retorno de outra área',
  'Aguardar retorno do fornecedor',
  'Tratar divergência no processo'
];
  const [novaPendencia, setNovaPendencia] = useState({
    etapa_origem: '',
    etapa_destino: '',
    data_abertura: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19),
    responsavel: localStorage.getItem('pcp_user') || '',
    motivo: '',
    justificativa: '',
    sla_dias: 1,
    status: 'Aberta' as const
  });
  const [contasProtheus, setContasProtheus] = useState<{conta_protheus: string, desc_conta_protheus: string}[]>([]);
  const [availableInsumos, setAvailableInsumos] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      supabase?.from('contas_protheus').select('*').then(({data}) => {
        if (data) setContasProtheus(data);
      });
      const user = localStorage.getItem('pcp_user') || '';
      if (user && !formData.responsavel) {
        setFormData(prev => ({ ...prev, responsavel: user, responsavel_t1: prev.responsavel_t1 || user }));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && categoriaAtiva === 'Material') {
      supabase?.from('estoque_insumos')
        .select('codigo, item, cd, empresa')
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
  }, [isOpen, categoriaAtiva, formData.cd]);

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
    if (isReadOnly) return;
    setFormError(null);

    if (categoriaAtiva === 'Material' && formData.insumos && formData.insumos.length > 0) {
      const somaInsumos = formData.insumos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
      const valorFatura = formData.valor || 0;
      
      if (Math.abs(somaInsumos - valorFatura) > 0.01) {
        setFormError(`A soma dos insumos (R$ ${somaInsumos.toFixed(2)}) não confere com o valor total da fatura (R$ ${valorFatura.toFixed(2)}).`);
        return;
      }
    }

    // Validação do período estimado de recebimento
    const rawMin = formData.previsao_recebimento_dias_min;
    const rawMax = formData.previsao_recebimento_dias_max;
    const prevDiasMin = rawMin !== undefined && rawMin !== null && rawMin !== ('' as any) ? Number(rawMin) : undefined;
    const prevDiasMax = rawMax !== undefined && rawMax !== null && rawMax !== ('' as any) ? Number(rawMax) : undefined;

    if (prevDiasMin !== undefined || prevDiasMax !== undefined) {
      if (prevDiasMin === undefined || prevDiasMax === undefined || prevDiasMin < 1 || prevDiasMax < 1 || !Number.isInteger(prevDiasMin) || !Number.isInteger(prevDiasMax)) {
        setFormError("O período estimado de recebimento deve ser composto por números inteiros positivos (mínimo de 1 dia útil).");
        return;
      }
      if (prevDiasMin > prevDiasMax) {
        setFormError("O prazo mínimo em dias úteis não pode ser maior que o prazo máximo.");
        return;
      }
    }

    const baseCriacao = formData.data_criacao || formData.created_at || formData.data_recebimento || formData.data_emissao || new Date().toISOString().slice(0, 10);
    let finalDataInicio: string | undefined = formData.previsao_recebimento_data_inicio;
    let finalDataFim: string | undefined = formData.previsao_recebimento_data_fim;

    if (prevDiasMin && prevDiasMax) {
      const calc = calcularDatasPrevisao(baseCriacao, prevDiasMin, prevDiasMax);
      finalDataInicio = calc.data_inicio;
      finalDataFim = calc.data_fim;
    }

    // Auditoria de histórico de alteração do período
    const user = typeof window !== 'undefined' ? localStorage.getItem('pcp_user') || 'Sistema' : 'Sistema';
    let historicoPrev = formData.historico_previsao ? [...formData.historico_previsao] : [];
    if (
      fatura?.previsao_recebimento_dias_min &&
      (fatura.previsao_recebimento_dias_min !== prevDiasMin || fatura.previsao_recebimento_dias_max !== prevDiasMax)
    ) {
      historicoPrev.push({
        dias_min: prevDiasMin || 0,
        dias_max: prevDiasMax || 0,
        data_inicio: finalDataInicio,
        data_fim: finalDataFim,
        alterado_por: user,
        data_alteracao: new Date().toISOString()
      });
    }

    const currentInsumos = formData.insumos || [];
    const metaObj = { 
      _meta: true, 
      cd: formData.cd, 
      codigo_fornecedor: formData.codigo_fornecedor,
      previsao_recebimento_dias_min: prevDiasMin,
      previsao_recebimento_dias_max: prevDiasMax,
      previsao_recebimento_data_inicio: finalDataInicio,
      previsao_recebimento_data_fim: finalDataFim,
      historico_previsao: historicoPrev
    };
    
    const safeCategoria = categoriaAtiva === 'Serviço' ? 'Servico' : categoriaAtiva;
    const currentDatas = getEtapasDatas(formData);
    const combinedObs = buildObservacoes(formData.fiscal_observacao, formData.pagamento_observacao, formData.observacoes);
    const finalFatura = {
      ...formData,
      previsao_recebimento_dias_min: prevDiasMin,
      previsao_recebimento_dias_max: prevDiasMax,
      previsao_recebimento_data_inicio: finalDataInicio,
      previsao_recebimento_data_fim: finalDataFim,
      historico_previsao: historicoPrev,
      data_aprovacao: formData.data_aprovacao || currentDatas.sap_rc_aprovacao || null,
      data_pedido_sap: formData.data_pedido_sap || (formData.pedido_sap ? currentDatas.sap_pc_geracao : null),
      nexa_data_inicio: formData.nexa_data_inicio || currentDatas.nexa_inicio || null,
      fiscal_data_inicio: formData.fiscal_data_inicio || currentDatas.fiscal_inicio || null,
      fiscal_data_fim: formData.fiscal_data_fim || currentDatas.fiscal_conclusao || null,
      prog_data_inicio: formData.prog_data_inicio || currentDatas.pagamento_inicio || null,
      pagamento_data_inicio: formData.pagamento_data_inicio || currentDatas.pagamento_inicio || null,
      data_pagamento_real: formData.data_pagamento_real || currentDatas.pagamento_efetiva || null,
      observacoes: combinedObs || formData.observacoes || '',
      conta_contabil: formData.conta_contabil,
      descricao_contabil: formData.descricao_contabil,
      marca: formData.marca || 'PCP',
      editado_por: localStorage.getItem('pcp_user') || '',
      is_sap: true,
      id: formData.id || `F-${Math.floor(Math.random() * 100000)}__CAT__${safeCategoria}`,
      insumos: [
        ...currentInsumos.map(ins => ({ ...ins, cd: formData.cd, codigo_fornecedor: formData.codigo_fornecedor, conta_contabil: ins.conta_protheus, descricao_contabil: ins.desc_conta_protheus })),
        metaObj
      ],
    } as Fatura;
    onSave(finalFatura);
  };


  const SLA_DIAS = 3;
  const RESPONSAVEIS_LIST = ["Heitor Ribeiro", "Raphael Ramiro", "Débora Mota", "Diego Simões", "Rogger Hendler", "Guilherme Teixeira", "Rafael Inácio", "Joana Sá", "Luiz Felipe", "Rafael Soares", "Fernanda Serrano"];

  const MultiSelectResponsavel = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => {
    const selected = value ? value.split(', ') : [];
    const toggle = (v: string) => {
      if (selected.includes(v)) onChange(selected.filter(x => x !== v).join(', '));
      else onChange([...selected, v].join(', '));
    };
    return (
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-zinc-200 rounded-md p-2 bg-white shadow-sm mt-1 custom-scrollbar">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 text-[11px] text-zinc-700 cursor-pointer hover:bg-zinc-50 p-1 rounded">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 w-3 h-3" />
            {opt}
          </label>
        ))}
      </div>
    );
  };

  const SlaBadge = ({ startDate, endDate, slaDias = 3, forceSla }: { startDate?: string, endDate?: string, slaDias?: number, forceSla?: number }) => {
    const dynamicSla = forceSla ?? calcularSlaDinamico(formData as any, slaDias);
    slaDias = dynamicSla;
    if (!startDate) return null;
    const start = new Date(startDate + 'T00:00:00');
    const prazoFinal = new Date(start);
    
    let diasAdicionados = 0;
    while (diasAdicionados < slaDias) {
      prazoFinal.setDate(prazoFinal.getDate() + 1);
      const diaSemana = prazoFinal.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAdicionados++;
      }
    }
    
    if (endDate) {
      return <div className="text-[9px] text-green-600 font-bold mt-2 bg-green-50 px-2 py-1 rounded-sm inline-block border border-green-200 w-full">Concluído em: {endDate.split('T')[0].split('-').reverse().join('/')}</div>;
    }
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const timeDiff = prazoFinal.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    let colorClass = "text-amber-600 bg-amber-50 border-amber-200";
    let text = `${diasRestantes} dia(s) restante(s)`;
    if (diasRestantes < 0) {
      colorClass = "text-red-600 bg-red-50 border-red-200";
      text = `Atrasado ${Math.abs(diasRestantes)} dia(s)`;
    } else if (diasRestantes === 0) {
      colorClass = "text-orange-600 bg-orange-50 border-orange-200";
      text = "Vence hoje";
    }

    return (
      <div className={`text-[9px] font-bold mt-2 px-2 py-1 rounded-sm inline-block border ${colorClass} w-full`}>
        SLA ({slaDias} {slaDias === 1 ? 'dia' : 'dias'}): {text}
      </div>
    );
  };

  
  const handleAddPendencia = () => {
    if (!novaPendencia.etapa_origem || !novaPendencia.etapa_destino || !novaPendencia.motivo) {
      alert("Preencha origem, destino e motivo.");
      return;
    }
    const newP = { ...novaPendencia, id: Math.random().toString(36).substring(7) };
    setFormData(prev => ({
      ...prev,
      pendencias: [...(prev.pendencias || []), newP]
    }));
    setShowPendenciaModal(false);
    setNovaPendencia({
      ...novaPendencia,
      motivo: '',
      justificativa: '',
      data_abertura: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19)
    });
  };

  const handleConcluirPendencia = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pendencias: prev.pendencias?.map(p => 
        p.id === id ? { ...p, status: 'Concluída', data_conclusao: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19) } : p
      )
    }));
  };

  const autoStatus = calcularStatus(formData);
  const autoEtapa = calcularEtapa(formData);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
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
                      setFormData(prev => ({ 
                        ...prev, 
                        fornecedor: value, 
                        cnpj: formatCNPJ(fornecedorMatch.cnpj), 
                        codigo_fornecedor: fornecedorMatch.codigo_fornecedor,
                        tipo_servico: fornecedorMatch.tipo_servico || prev.tipo_servico
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, fornecedor: value }));
                    }
                  }} placeholder="Nome do Fornecedor" />
                  <datalist id="fornecedores-list">
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.nome_fantasia || f.razao_social} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CNPJ</label>
                  <Input value={formData.cnpj || ""} onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cód. Fornecedor</label>
                  <Input value={formData.codigo_fornecedor || ""} onChange={handleInputChange('codigo_fornecedor')} placeholder="Código do fornecedor" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Documento</label>
                  <Input value={formData.numero_documento || ""} onChange={handleInputChange('numero_documento')} placeholder="Documento..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Total (Previsto / RC / Documento)</label>
                  <Input type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Emissão</label>
                  <Input type="date" value={(formData.data_emissao || "").substring(0, 10)} onChange={handleInputChange('data_emissao')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Recebimento</label>
                  <Input type="date" value={(formData.data_recebimento || "").substring(0, 10)} onChange={handleInputChange('data_recebimento')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input type="date" value={(formData.data_vencimento || "").substring(0, 10)} onChange={handleInputChange('data_vencimento')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Centro de Custo</label>
                  <Input value={formData.centro_custo || ""} onChange={handleInputChange('centro_custo')} placeholder="Centro de Custo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta Contábil</label>
                  <Input value={formData.conta_contabil || ""} onChange={handleInputChange('conta_contabil')} placeholder="Conta Contábil" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição Contábil</label>
                  <Input value={formData.descricao_contabil || ""} onChange={handleInputChange('descricao_contabil')} placeholder="Descrição da Conta Contábil" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filial</label>
                  <Input value={formData.filial || ""} onChange={handleInputChange('filial')} placeholder="Filial" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CD / Unidade</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.cd || ""} onChange={handleSelectChange('cd')}>
                    <option value="" disabled>Selecione um CD</option>
                    {["Fortaleza", "Jundiaí", "NSE", "COC", "PSD"].map(cd => (
                      <option key={cd} value={cd}>{cd}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fluxo Iniciado Por</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.fluxo_iniciado_por || "SAP"} onChange={handleSelectChange('fluxo_iniciado_por')}>
                    <option value="SAP">SAP</option>
                    <option value="Nexa">Nexa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Responsável</label>
                  <Input value={formatUserName(formData.responsavel)} readOnly className="bg-zinc-100 text-zinc-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Editado Por</label>
                  <Input value={formatUserName(formData.editado_por)} readOnly className="bg-zinc-100 text-zinc-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    value={formData.forma_pagamento || "Boleto"} onChange={handleSelectChange('forma_pagamento')}>
                    <option value="Boleto">Boleto</option>
                    <option value="Pix">Pix</option>
                    <option value="TED">TED</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cód. {categoriaAtiva}</label>
                  <Input value={formData.codigo_servico || ""} onChange={handleInputChange('codigo_servico')} placeholder="Ex: 000100" />
                </div>
              </div>

              {categoriaAtiva === 'Serviço' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-zinc-100 pt-4">
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Conta Protheus</label>
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
                    />
                    <datalist id="contas-protheus-list">
                      {contasProtheus.map(c => (
                        <option key={c.conta_protheus} value={c.conta_protheus}>{c.desc_conta_protheus}</option>
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium">Descrição Conta Protheus</label>
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
                    Itens da Fatura
                  </h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const current = formData.insumos || [];
                      setFormData({...formData, insumos: [...current, { codigo: '', item: '', quantidade: 1, tipo_item: 'Insumo' }]});
                    }} className="gap-2">
                      <Plus className="w-4 h-4" /> Insumo
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const current = formData.insumos || [];
                      setFormData({...formData, insumos: [...current, { codigo: 'SRV-MANUAL', item: '', quantidade: 1, tipo_item: 'Serviço' }]});
                    }} className="gap-2">
                      <Plus className="w-4 h-4" /> Serviço
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const current = formData.insumos || [];
                      setFormData({...formData, insumos: [...current, { codigo: 'TAX-MANUAL', item: '', quantidade: 1, tipo_item: 'Imposto/Taxa' }]});
                    }} className="gap-2">
                      <Plus className="w-4 h-4" /> Imposto/Taxa
                    </Button>
                  </div>
                </div>

                {(!formData.insumos || formData.insumos.length === 0) ? (
                  <div className="text-sm text-zinc-500 text-center py-4 bg-zinc-50 rounded-lg border border-zinc-100">
                    Nenhum insumo adicionado a esta fatura.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.insumos.map((ins, index) => (
                      <div key={index} className="flex flex-col gap-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="space-y-2 md:col-span-4 relative">
                            <label className="text-xs font-medium text-zinc-700">{ins.tipo_item || 'Insumo'}</label>
                            {ins.tipo_item === 'Serviço' || ins.tipo_item === 'Imposto/Taxa' ? (
                              <Input 
                                value={ins.item} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newInsumos = [...(formData.insumos || [])];
                                  newInsumos[index] = { ...ins, item: val };
                                  setFormData({ ...formData, insumos: newInsumos });
                                }} 
                                placeholder={`Descrição do ${ins.tipo_item}...`} 
                              />
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-medium text-zinc-700">Código {(!ins.tipo_item || ins.tipo_item === 'Insumo') && '(Auto)'}</label>
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
                            }} />
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
                            }} placeholder="R$ 0,00" />
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

            {/* Período Estimado de Recebimento */}
            <section className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                    Período Estimado de Recebimento
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Prazo em dias úteis (segunda a sexta-feira) a partir da criação da fatura. Compartilhado por todos os itens.
                  </p>
                </div>
                {(() => {
                  const baseCriacao = formData.data_criacao || formData.created_at || formData.data_recebimento || formData.data_emissao || new Date().toISOString().slice(0, 10);
                  const pMin = formData.previsao_recebimento_dias_min ? Number(formData.previsao_recebimento_dias_min) : undefined;
                  const pMax = formData.previsao_recebimento_dias_max ? Number(formData.previsao_recebimento_dias_max) : undefined;
                  let datas = { data_inicio: formData.previsao_recebimento_data_inicio, data_fim: formData.previsao_recebimento_data_fim };
                  if (pMin && pMax && pMin >= 1 && pMax >= pMin) {
                    datas = calcularDatasPrevisao(baseCriacao, pMin, pMax);
                  }
                  const texto = formatarPeriodoEstimado(pMin, pMax, datas.data_inicio, datas.data_fim);
                  return (
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 self-start sm:self-auto",
                      texto === "Não informado"
                        ? "text-zinc-500 bg-zinc-100 border-zinc-200"
                        : "text-purple-700 bg-purple-50 border-purple-200"
                    )}>
                      {texto}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">De (dias úteis)</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Ex: 3"
                    value={formData.previsao_recebimento_dias_min ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                      handleChange("previsao_recebimento_dias_min", isNaN(val as number) ? undefined : val);
                    }}
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Até (dias úteis)</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Ex: 5"
                    value={formData.previsao_recebimento_dias_max ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                      handleChange("previsao_recebimento_dias_max", isNaN(val as number) ? undefined : val);
                    }}
                    disabled={isReadOnly}
                    className="h-9"
                  />
                </div>
              </div>
            </section>

            {/* Fluxos de Trabalho */}
            {(() => {
              const etapasDatas = getEtapasDatas(formData);
              const isFluxoSap = formData.fluxo_iniciado_por === 'SAP';

              const tempoRcAprov = calcularTempoDias(etapasDatas.sap_rc_criacao, etapasDatas.sap_rc_aprovacao);
              const tempoSapNexa = calcularTempoDias(etapasDatas.sap_rc_aprovacao || etapasDatas.sap_pc_geracao, etapasDatas.nexa_abertura);
              const tempoNexaFiscal = calcularTempoDias(etapasDatas.nexa_abertura, etapasDatas.fiscal_conclusao);
              const tempoFiscalPagto = calcularTempoDias(etapasDatas.fiscal_conclusao, etapasDatas.pagamento_efetiva || etapasDatas.pagamento_prevista);

              if (isFluxoSap) {
                return (
                  <div className="space-y-4 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Fluxo de Trabalho 1 (SAP + Nexa)</h4>
                      <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">SAP → Nexa → Fiscal → Pagamento</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* T1 - SAP (RC, Aprovação, PC) */}
                      <div className="relative p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-300 transition-all shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="absolute -top-3 left-4 w-6 h-6 bg-purple-50 rounded-full border border-purple-300 flex items-center justify-center text-[10px] font-bold text-purple-700">T1</div>
                          <span className="text-[11px] font-bold text-purple-800 uppercase block mb-1 mt-1">SAP (RC, Aprovação, PC)</span>
                          <div className="mb-3"><SlaBadge startDate={formData.data_recebimento} endDate={etapasDatas.sap_pc_geracao} slaDias={3} /></div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data de Criação (RC)</label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                type="date" 
                                value={(formData.rc_data_inicio || formData.data_rc_sap || "").substring(0, 10)} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({ ...prev, rc_data_inicio: val, data_rc_sap: val }));
                                }} 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número da RC</label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                value={formData.rc_sap || ""} 
                                onChange={handleInputChange('rc_sap')} 
                                placeholder="Pendente" 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-purple-700 uppercase flex items-center justify-between">
                                <span>Data de Aprovação (RC)</span>
                                <span className="text-[9px] text-purple-500 font-normal">Marco Transição</span>
                              </label>
                              <Input 
                                className="h-7 text-xs border-purple-200 bg-purple-50/20" 
                                type="date" 
                                value={(formData.data_aprovacao || formData.aprovacao_data_fim || "").substring(0, 10)} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    data_aprovacao: val,
                                    aprovacao_data_fim: val,
                                    rc_data_fim: val,
                                    pc_data_inicio: val,
                                    data_pedido_sap: prev.pedido_sap && !prev.data_pedido_sap ? val : prev.data_pedido_sap,
                                    nexa_data_inicio: prev.nexa_data_inicio || val
                                  }));
                                }} 
                              />
                            </div>

                            <div className="space-y-1 pt-1 border-t border-purple-100">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número do Pedido (PC)</label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                value={formData.pedido_sap || ""} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    pedido_sap: val,
                                    data_pedido_sap: val && !prev.data_pedido_sap ? (prev.data_aprovacao || prev.aprovacao_data_fim || '') : prev.data_pedido_sap
                                  }));
                                }} 
                                placeholder="Pendente / Não gerado" 
                              />
                              {formData.data_aprovacao && !formData.pedido_sap && (
                                <p className="text-[9px] text-amber-600 font-medium">⚠️ PC pendente após aprovação</p>
                              )}
                            </div>

                            {tempoRcAprov !== null && (
                              <div className="text-[9px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded">
                                Tempo Criação → Aprovação: {tempoRcAprov} dia(s)
                              </div>
                            )}

                            <label className="flex items-center justify-between cursor-pointer group mt-2 pt-2 border-t border-zinc-100">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-emerald-600 transition-colors">Doc subsequente criado</span>
                              <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                checked={!!formData.doc_subsequente_criado}
                                onChange={(e) => handleChange('doc_subsequente_criado', e.target.checked)}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Ocorrências temporariamente ocultas */}
                        {false && (
                          <>
                            {formData.ocorrencias?.filter(oc => oc.t_destino === 'T1').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                  <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida' || oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Pendente Origem';
                                    if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Devolver para {oc.t_origem}</Button>
                                )}
                              </div>
                            ))}

                            {formData.ocorrencias?.filter(oc => oc.t_origem === 'T1' && oc.status !== 'Pendente Destino').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                  <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {oc.status !== 'Resolvida' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Resolvida';
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Finalizar Ocorrência</Button>
                                )}
                              </div>
                            ))}

                            {!autoStatus.includes('Pago') && (
                              <div className="mt-4 pt-3 border-t border-purple-100 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T1'})}>⚠️ Nova Ocorrência</Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* T2 - Nexa */}
                      <div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T2</div>
                          <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa</span>
                          <div className="mb-3"><SlaBadge startDate={etapasDatas.nexa_inicio} endDate={etapasDatas.nexa_abertura} slaDias={1} /></div>

                          <div className="space-y-3">
                            {/* Data de início herdada */}
                            <div className="p-2 rounded bg-cyan-50/50 border border-cyan-100 space-y-0.5">
                              <span className="text-[9px] font-semibold text-cyan-700 uppercase block">Início (Herdada Aprovação SAP)</span>
                              <span className="text-xs font-bold text-cyan-900">{formatDateDisplay(etapasDatas.nexa_inicio)}</span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número do Chamado / Ticket</label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                value={formData.nexa_chamado || ""} 
                                onChange={handleInputChange('nexa_chamado')} 
                                placeholder="Ex: 204910" 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data de Abertura do Chamado</label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                type="date" 
                                value={(formData.nexa_data_envio || formData.nexa_data_inicio || "").substring(0, 10)} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    nexa_data_envio: val,
                                    nexa_data_inicio: prev.nexa_data_inicio || val,
                                    fiscal_data_inicio: prev.fiscal_data_inicio || val
                                  }));
                                }} 
                              />
                            </div>

                            {tempoSapNexa !== null && (
                              <div className="text-[9px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded">
                                Tempo Aprovação → Abertura Nexa: {tempoSapNexa} dia(s)
                              </div>
                            )}

                            {/* Checkbox único de conclusão da etapa */}
                            <div className="mt-3 pt-2 border-t border-zinc-100">
                              <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-[10px] font-bold text-zinc-700 uppercase group-hover:text-cyan-600 transition-colors">Etapa concluída</span>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                                  checked={Boolean(formData.nexa_emitiu_nf && formData.nexa_anexada)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const todayStr = new Date().toISOString().slice(0, 10);
                                    setFormData(prev => ({
                                      ...prev,
                                      nexa_emitiu_nf: checked,
                                      nexa_anexada: checked,
                                      nexa_data_fim: checked ? (prev.nexa_data_fim || todayStr) : prev.nexa_data_fim,
                                      fiscal_data_inicio: checked ? (prev.fiscal_data_inicio || prev.nexa_data_fim || todayStr) : prev.fiscal_data_inicio
                                    }));
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Ocorrências temporariamente ocultas */}
                        {false && (
                          <>
                            {formData.ocorrencias?.filter(oc => oc.t_destino === 'T2').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                  <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Pendente Origem';
                                    if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Devolver para {oc.t_origem}</Button>
                                )}
                              </div>
                            ))}

                            {formData.ocorrencias?.filter(oc => oc.t_origem === 'T2' && oc.status !== 'Pendente Destino').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                  <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {oc.status !== 'Resolvida' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Resolvida';
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Finalizar Ocorrência</Button>
                                )}
                              </div>
                            ))}

                            {!autoStatus.includes('Pago') && (
                              <div className="mt-4 pt-3 border-t border-cyan-100 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T2'})}>⚠️ Nova Ocorrência</Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* T3 - Fiscal */}
                      <div className="relative p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-400 transition-all shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T3</div>
                          <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1 mt-1">Fiscal</span>
                          <div className="mb-3"><SlaBadge startDate={etapasDatas.fiscal_inicio} endDate={etapasDatas.fiscal_conclusao} slaDias={3} /></div>

                          <div className="space-y-3">
                            {/* Data de início herdada do Nexa */}
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                              <span className="text-[9px] font-semibold text-slate-600 uppercase block">Início (Herdada Nexa)</span>
                              <span className="text-xs font-bold text-slate-900">{formatDateDisplay(etapasDatas.fiscal_inicio)}</span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data de Conclusão (Fiscal)</label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                type="date" 
                                value={(formData.fiscal_data_fim || formData.nexa_data_conclusao_lancamento || "").substring(0, 10)} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    fiscal_data_fim: val,
                                    nexa_data_conclusao_lancamento: val,
                                    prog_data_inicio: prev.prog_data_inicio || val,
                                    pagamento_data_inicio: prev.pagamento_data_inicio || val
                                  }));
                                }} 
                              />
                            </div>

                            {tempoNexaFiscal !== null && (
                              <div className="text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                Tempo Nexa → Fiscal: {tempoNexaFiscal} dia(s)
                              </div>
                            )}

                            {/* Campo de observacao opcional */}
                            <div className="space-y-1 pt-1 border-t border-zinc-100">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                                <span>Observação (Fiscal)</span>
                                <span className="text-[9px] text-zinc-400 font-normal">Opcional</span>
                              </label>
                              <textarea 
                                className="w-full h-14 text-xs border border-zinc-200 rounded p-1.5 resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                placeholder="Ex: pendência de validação, documento fiscal em correção, reenvio..."
                                value={formData.fiscal_observacao || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, fiscal_observacao: e.target.value }))}
                              />
                            </div>

                            {/* Lançamento concluído posicionado após Observação */}
                            <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-zinc-100">
                              <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento concluído</span>
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-zinc-300 text-slate-600 focus:ring-slate-500"
                                checked={!!formData.nexa_lancamento_concluido}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const todayStr = new Date().toISOString().slice(0, 10);
                                  setFormData(prev => ({
                                    ...prev,
                                    nexa_lancamento_concluido: checked,
                                    fiscal_data_fim: checked ? (prev.fiscal_data_fim || todayStr) : prev.fiscal_data_fim,
                                    nexa_data_conclusao_lancamento: checked ? (prev.nexa_data_conclusao_lancamento || todayStr) : prev.nexa_data_conclusao_lancamento,
                                    prog_data_inicio: checked ? (prev.prog_data_inicio || prev.fiscal_data_fim || todayStr) : prev.prog_data_inicio,
                                    pagamento_data_inicio: checked ? (prev.pagamento_data_inicio || prev.fiscal_data_fim || todayStr) : prev.pagamento_data_inicio,
                                    usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                                  }));
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Ocorrências temporariamente ocultas */}
                        {false && (
                          <>
                            {formData.ocorrencias?.filter(oc => oc.t_destino === 'T3').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                  <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Pendente Origem';
                                    if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Devolver para {oc.t_origem}</Button>
                                )}
                              </div>
                            ))}

                            {formData.ocorrencias?.filter(oc => oc.t_origem === 'T3' && oc.status !== 'Pendente Destino').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                  <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {oc.status !== 'Resolvida' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Resolvida';
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Finalizar Ocorrência</Button>
                                )}
                              </div>
                            ))}

                            {!autoStatus.includes('Pago') && (
                              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T3'})}>⚠️ Nova Ocorrência</Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* T4 - Pagamento (Programação e Realização) */}
                      <div className="relative p-4 bg-white rounded-xl border border-green-300 hover:border-green-400 transition-all shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T4</div>
                          <span className="text-[11px] font-bold text-green-800 uppercase block mb-1 mt-1">Pagamento (Prog + Real)</span>
                          <div className="mb-3"><SlaBadge startDate={etapasDatas.pagamento_inicio} endDate={etapasDatas.pagamento_efetiva} slaDias={3} /></div>

                          <div className="space-y-3">
                            {/* Data de início herdada do Fiscal */}
                            <div className="p-2 rounded bg-green-50/60 border border-green-200 space-y-0.5">
                              <span className="text-[9px] font-semibold text-green-700 uppercase block">Início (Herdada Fiscal)</span>
                              <span className="text-xs font-bold text-green-900">{formatDateDisplay(etapasDatas.pagamento_inicio)}</span>
                            </div>

                            {/* Status do Pagamento */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Status do Pagamento</label>
                              <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-md text-[10px] font-bold text-center">
                                <button
                                  type="button"
                                  className={`py-1 rounded transition-all ${etapasDatas.pagamento_status === 'Pendente' ? 'bg-white shadow text-amber-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      nexa_pagamento_programado: false,
                                      nexa_pagamento_realizado: false,
                                      status_pagamento: 'Em andamento',
                                      data_pagamento_real: '',
                                      pagamento_data_fim: ''
                                    }));
                                  }}
                                >
                                  Pendente
                                </button>
                                <button
                                  type="button"
                                  className={`py-1 rounded transition-all ${etapasDatas.pagamento_status === 'Programado' ? 'bg-white shadow text-blue-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      nexa_pagamento_programado: true,
                                      nexa_pagamento_realizado: false,
                                      status_pagamento: 'Em andamento',
                                      data_pagamento_real: '',
                                      pagamento_data_fim: ''
                                    }));
                                  }}
                                >
                                  Programado
                                </button>
                                <button
                                  type="button"
                                  className={`py-1 rounded transition-all ${etapasDatas.pagamento_status === 'Pago' ? 'bg-white shadow text-green-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                  onClick={() => {
                                    const todayStr = new Date().toISOString().slice(0, 10);
                                    setFormData(prev => ({
                                      ...prev,
                                      nexa_pagamento_realizado: true,
                                      status_pagamento: 'Pago',
                                      data_pagamento_real: prev.data_pagamento_real || todayStr,
                                      pagamento_data_fim: prev.pagamento_data_fim || todayStr
                                    }));
                                  }}
                                >
                                  Pago
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                                <span>Data Prevista para Pagamento</span>
                                <span className="text-[9px] text-blue-600 font-normal">Programação</span>
                              </label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                type="date" 
                                value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    nexa_data_prevista_pagamento: val,
                                    nexa_pagamento_programado: !!val ? true : prev.nexa_pagamento_programado
                                  }));
                                }} 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                                <span>Data Efetiva do Pagamento</span>
                                <span className="text-[9px] text-green-600 font-normal">Realização</span>
                              </label>
                              <Input 
                                className="h-7 text-xs border-zinc-200" 
                                type="date" 
                                value={(formData.data_pagamento_real || formData.pagamento_data_fim || "").substring(0, 10)} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    data_pagamento_real: val,
                                    pagamento_data_fim: val,
                                    nexa_pagamento_realizado: !!val,
                                    status_pagamento: !!val ? 'Pago' : 'Em andamento'
                                  }));
                                }} 
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                              <Input 
                                className="h-7 text-xs border-green-200" 
                                type="number" 
                                step="0.01" 
                                value={formData.valor || ""} 
                                onChange={handleInputChange('valor')} 
                              />
                            </div>

                            {tempoFiscalPagto !== null && (
                              <div className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                                Tempo Envio Fiscal → Pagamento: {tempoFiscalPagto} dia(s)
                              </div>
                            )}

                            {/* Observacao opcional */}
                            <div className="space-y-1 pt-1 border-t border-zinc-100">
                              <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                                <span>Observação (Pagamento)</span>
                                <span className="text-[9px] text-zinc-400 font-normal">Opcional</span>
                              </label>
                              <textarea 
                                className="w-full h-14 text-xs border border-zinc-200 rounded p-1.5 resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                                placeholder="Ex: justificativa de atraso ou ocorrência no pagamento..."
                                value={formData.pagamento_observacao || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, pagamento_observacao: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Ocorrências temporariamente ocultas */}
                        {false && (
                          <>
                            {formData.ocorrencias?.filter(oc => oc.t_destino === 'T4').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                  <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Pendente Origem';
                                    if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Devolver para {oc.t_origem}</Button>
                                )}
                              </div>
                            ))}

                            {formData.ocorrencias?.filter(oc => oc.t_origem === 'T4' && oc.status !== 'Pendente Destino').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                  <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {oc.status !== 'Resolvida' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Resolvida';
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Finalizar Ocorrência</Button>
                                )}
                              </div>
                            ))}

                            {!autoStatus.includes('Pago') && (
                              <div className="mt-4 pt-3 border-t border-green-100 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T4'})}>⚠️ Nova Ocorrência</Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Fluxo 2 (Nexa Direto) - Estrutura de 3 etapas: T1 Nexa, T2 Fiscal, T3 Pagamento
              return (
                <div className="space-y-4 pt-4 border-t border-zinc-200 mb-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Fluxo de Trabalho 2 (Nexa Direto)</h4>
                    <span className="text-[10px] text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full font-semibold">Nexa Solicitação → Lançamento Fiscal → Pagamento</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* T1 - Nexa / Solicitação */}
                    <div className="relative p-4 bg-white rounded-xl border border-cyan-200 hover:border-cyan-300 transition-all shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="absolute -top-3 left-4 w-6 h-6 bg-cyan-50 rounded-full border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-700">T1</div>
                        <span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa / Solicitação</span>
                        <div className="mb-3"><SlaBadge startDate={etapasDatas.nexa_abertura} endDate={etapasDatas.nexa_conclusao} slaDias={1} /></div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Número do Chamado / Ticket</label>
                            <Input 
                              className="h-7 text-xs border-zinc-200" 
                              value={formData.nexa_chamado || ""} 
                              onChange={handleInputChange('nexa_chamado')} 
                              placeholder="Ex: 204910" 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-cyan-700 uppercase">Data de Abertura do Chamado</label>
                            <Input 
                              className="h-7 text-xs border-cyan-200 bg-cyan-50/20" 
                              type="date" 
                              value={(formData.nexa_data_envio || formData.nexa_data_inicio || "").substring(0, 10)} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  nexa_data_envio: val,
                                  nexa_data_inicio: val,
                                  fiscal_data_inicio: prev.fiscal_data_inicio || val
                                }));
                              }} 
                            />
                          </div>

                          {/* Se houver data de conclusao historica, mostra sem exigir preenchimento */}
                          {formData.nexa_data_fim && (
                            <div className="p-2 rounded bg-zinc-50 border border-zinc-200 space-y-0.5">
                              <span className="text-[9px] font-semibold text-zinc-500 uppercase block">Conclusão Nexa (Histórico)</span>
                              <span className="text-xs font-medium text-zinc-800">{formatDateDisplay(formData.nexa_data_fim)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                        {/* Ocorrências temporariamente ocultas */}
                        {false && (
                          <>
                            {formData.ocorrencias?.filter(oc => oc.t_destino === 'T1').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                  <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].destino_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Pendente Origem';
                                    if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Devolver para {oc.t_origem}</Button>
                                )}
                              </div>
                            ))}

                            {formData.ocorrencias?.filter(oc => oc.t_origem === 'T1' && oc.status !== 'Pendente Destino').map(oc => (
                              <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                <div>
                                  <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                  <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_inicio = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                  <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].origem_data_fim = e.target.value;
                                    setFormData({...formData, ocorrencias: newOc});
                                  }} />
                                </div>
                                {oc.status !== 'Resolvida' && (
                                  <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                    const newOc = [...(formData.ocorrencias || [])];
                                    const idx = newOc.findIndex(x => x.id === oc.id);
                                    newOc[idx].status = 'Resolvida';
                                    setFormData({...formData, ocorrencias: newOc});
                                  }}>Finalizar Ocorrência</Button>
                                )}
                              </div>
                            ))}

                            {!autoStatus.includes('Pago') && (
                              <div className="mt-4 pt-3 border-t border-cyan-100 flex justify-end">
                                <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T1'})}>⚠️ Nova Ocorrência</Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                    {/* T2 - Lançamento Fiscal (no Nexa Direto é T2) */}
                    <div className="relative p-4 bg-white rounded-xl border border-slate-300 hover:border-slate-400 transition-all shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="absolute -top-3 left-4 w-6 h-6 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T2</div>
                        <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1 mt-1">Lançamento Fiscal</span>
                        <div className="mb-3"><SlaBadge startDate={etapasDatas.fiscal_inicio} endDate={etapasDatas.fiscal_conclusao} slaDias={3} /></div>

                        <div className="space-y-3">
                          {/* Data de início herdada do Nexa */}
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                            <span className="text-[9px] font-semibold text-slate-600 uppercase block">Início (Herdada Nexa)</span>
                            <span className="text-xs font-bold text-slate-900">{formatDateDisplay(etapasDatas.fiscal_inicio)}</span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Data de Conclusão</label>
                            <Input 
                              className="h-7 text-xs border-zinc-200" 
                              type="date" 
                              value={(formData.fiscal_data_fim || formData.nexa_data_conclusao_lancamento || "").substring(0, 10)} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  fiscal_data_fim: val,
                                  nexa_data_conclusao_lancamento: val,
                                  prog_data_inicio: prev.prog_data_inicio || val,
                                  pagamento_data_inicio: prev.pagamento_data_inicio || val
                                }));
                              }} 
                            />
                          </div>

                          {tempoNexaFiscal !== null && (
                            <div className="text-[9px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                              Tempo Nexa → Fiscal: {tempoNexaFiscal} dia(s)
                            </div>
                          )}

                          {/* Observacao opcional */}
                          <div className="space-y-1 pt-1 border-t border-zinc-100">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                              <span>Observação (Fiscal)</span>
                              <span className="text-[9px] text-zinc-400 font-normal">Opcional</span>
                            </label>
                            <textarea 
                              className="w-full h-14 text-xs border border-zinc-200 rounded p-1.5 resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              placeholder="Ex: pendência de validação, documento fiscal em correção, reenvio..."
                              value={formData.fiscal_observacao || ""}
                              onChange={(e) => setFormData(prev => ({ ...prev, fiscal_observacao: e.target.value }))}
                            />
                          </div>

                          {/* Lançamento concluído posicionado após Observação */}
                          <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-zinc-100">
                            <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">Lançamento concluído</span>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-zinc-300 text-slate-600 focus:ring-slate-500"
                              checked={!!formData.nexa_lancamento_concluido}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const todayStr = new Date().toISOString().slice(0, 10);
                                setFormData(prev => ({
                                  ...prev,
                                  nexa_lancamento_concluido: checked,
                                  fiscal_data_fim: checked ? (prev.fiscal_data_fim || todayStr) : prev.fiscal_data_fim,
                                  nexa_data_conclusao_lancamento: checked ? (prev.nexa_data_conclusao_lancamento || todayStr) : prev.nexa_data_conclusao_lancamento,
                                  prog_data_inicio: checked ? (prev.prog_data_inicio || prev.fiscal_data_fim || todayStr) : prev.prog_data_inicio,
                                  pagamento_data_inicio: checked ? (prev.pagamento_data_inicio || prev.fiscal_data_fim || todayStr) : prev.pagamento_data_inicio,
                                  usuario_nexa_lancamento: checked ? (localStorage.getItem('pcp_user') || '') : prev.usuario_nexa_lancamento
                                }));
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Ocorrências temporariamente ocultas */}
                      {false && (
                        <>
                          {formData.ocorrencias?.filter(oc => oc.t_destino === 'T2').map(oc => (
                            <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                              <div>
                                <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].destino_data_inicio = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].destino_data_fim = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].status = 'Pendente Origem';
                                  if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                  setFormData({...formData, ocorrencias: newOc});
                                }}>Devolver para {oc.t_origem}</Button>
                              )}
                            </div>
                          ))}

                          {formData.ocorrencias?.filter(oc => oc.t_origem === 'T2' && oc.status !== 'Pendente Destino').map(oc => (
                            <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                              <div>
                                <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].origem_data_inicio = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].origem_data_fim = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              {oc.status !== 'Resolvida' && (
                                <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].status = 'Resolvida';
                                  setFormData({...formData, ocorrencias: newOc});
                                }}>Finalizar Ocorrência</Button>
                              )}
                            </div>
                          ))}

                          {!autoStatus.includes('Pago') && (
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T2'})}>⚠️ Nova Ocorrência</Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* T3 - Pagamento (Programação e Realização - no Nexa Direto é T3) */}
                    <div className="relative p-4 bg-white rounded-xl border border-green-300 hover:border-green-400 transition-all shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="absolute -top-3 left-4 w-6 h-6 bg-green-50 rounded-full border border-green-300 flex items-center justify-center text-[10px] font-bold text-green-700">T3</div>
                        <span className="text-[11px] font-bold text-green-800 uppercase block mb-1 mt-1">Pagamento (Prog + Real)</span>
                        <div className="mb-3"><SlaBadge startDate={etapasDatas.pagamento_inicio} endDate={etapasDatas.pagamento_efetiva} slaDias={3} /></div>

                        <div className="space-y-3">
                          {/* Data de início herdada do Fiscal */}
                          <div className="p-2 rounded bg-green-50/60 border border-green-200 space-y-0.5">
                            <span className="text-[9px] font-semibold text-green-700 uppercase block">Início (Herdada Fiscal)</span>
                            <span className="text-xs font-bold text-green-900">{formatDateDisplay(etapasDatas.pagamento_inicio)}</span>
                          </div>

                          {/* Status do Pagamento */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Status do Pagamento</label>
                            <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-md text-[10px] font-bold text-center">
                              <button
                                type="button"
                                className={`py-1 rounded transition-all ${etapasDatas.pagamento_status === 'Pendente' ? 'bg-white shadow text-amber-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    nexa_pagamento_programado: false,
                                    nexa_pagamento_realizado: false,
                                    status_pagamento: 'Em andamento',
                                    data_pagamento_real: '',
                                    pagamento_data_fim: ''
                                  }));
                                }}
                              >
                                Pendente
                              </button>
                              <button
                                type="button"
                                className={`py-1 rounded transition-all ${etapasDatas.pagamento_status === 'Programado' ? 'bg-white shadow text-blue-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    nexa_pagamento_programado: true,
                                    nexa_pagamento_realizado: false,
                                    status_pagamento: 'Em andamento',
                                    data_pagamento_real: '',
                                    pagamento_data_fim: ''
                                  }));
                                }}
                              >
                                Programado
                              </button>
                              <button
                                type="button"
                                className={`py-1 rounded transition-all ${etapasDatas.pagamento_status === 'Pago' ? 'bg-white shadow text-green-700 font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                                onClick={() => {
                                  const todayStr = new Date().toISOString().slice(0, 10);
                                  setFormData(prev => ({
                                    ...prev,
                                    nexa_pagamento_realizado: true,
                                    status_pagamento: 'Pago',
                                    data_pagamento_real: prev.data_pagamento_real || todayStr,
                                    pagamento_data_fim: prev.pagamento_data_fim || todayStr
                                  }));
                                }}
                              >
                                Pago
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                              <span>Data Prevista para Pagamento</span>
                              <span className="text-[9px] text-blue-600 font-normal">Programação</span>
                            </label>
                            <Input 
                              className="h-7 text-xs border-zinc-200" 
                              type="date" 
                              value={(formData.nexa_data_prevista_pagamento || "").substring(0, 10)} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  nexa_data_prevista_pagamento: val,
                                  nexa_pagamento_programado: !!val ? true : prev.nexa_pagamento_programado
                                }));
                              }} 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                              <span>Data Efetiva do Pagamento</span>
                              <span className="text-[9px] text-green-600 font-normal">Realização</span>
                            </label>
                            <Input 
                              className="h-7 text-xs border-zinc-200" 
                              type="date" 
                              value={(formData.data_pagamento_real || formData.pagamento_data_fim || "").substring(0, 10)} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => ({
                                  ...prev,
                                  data_pagamento_real: val,
                                  pagamento_data_fim: val,
                                  nexa_pagamento_realizado: !!val,
                                  status_pagamento: !!val ? 'Pago' : 'Em andamento'
                                }));
                              }} 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                            <Input 
                              className="h-7 text-xs border-green-200" 
                              type="number" 
                              step="0.01" 
                              value={formData.valor || ""} 
                              onChange={handleInputChange('valor')} 
                            />
                          </div>

                          {tempoFiscalPagto !== null && (
                            <div className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                              Tempo Envio Fiscal → Pagamento: {tempoFiscalPagto} dia(s)
                            </div>
                          )}

                          {/* Observacao opcional */}
                          <div className="space-y-1 pt-1 border-t border-zinc-100">
                            <label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between">
                              <span>Observação (Pagamento)</span>
                              <span className="text-[9px] text-zinc-400 font-normal">Opcional</span>
                            </label>
                            <textarea 
                              className="w-full h-14 text-xs border border-zinc-200 rounded p-1.5 resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                              placeholder="Ex: justificativa de atraso ou ocorrência no pagamento..."
                              value={formData.pagamento_observacao || ""}
                              onChange={(e) => setFormData(prev => ({ ...prev, pagamento_observacao: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ocorrencias T3 Destino - Ocultado temporariamente */}
                      {false && (
                        <>
                          {formData.ocorrencias?.filter(oc => oc.t_destino === 'T3').map(oc => (
                            <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                              <div>
                                <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                                <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                                <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].destino_data_inicio = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                                <Input disabled={oc.status !== 'Pendente Destino'} className="h-7 text-xs border-red-200" type="date" value={(oc.destino_data_fim || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].destino_data_fim = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              {!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (
                                <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].status = 'Pendente Origem';
                                  if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();
                                  setFormData({...formData, ocorrencias: newOc});
                                }}>Devolver para {oc.t_origem}</Button>
                              )}
                            </div>
                          ))}

                          {/* Ocorrencias T3 Origem Retorno */}
                          {formData.ocorrencias?.filter(oc => oc.t_origem === 'T3' && oc.status !== 'Pendente Destino').map(oc => (
                            <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                              <div>
                                <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                                <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                                <Input disabled={oc.status !== 'Pendente Origem'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_inicio || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].origem_data_inicio = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                                <Input disabled={oc.status === 'Resolvida'} className="h-7 text-xs border-orange-200" type="date" value={(oc.origem_data_fim || '').substring(0, 10)} onChange={(e) => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].origem_data_fim = e.target.value;
                                  setFormData({...formData, ocorrencias: newOc});
                                }} />
                              </div>
                              {oc.status !== 'Resolvida' && (
                                <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                                  const newOc = [...(formData.ocorrencias || [])];
                                  const idx = newOc.findIndex(x => x.id === oc.id);
                                  newOc[idx].status = 'Resolvida';
                                  setFormData({...formData, ocorrencias: newOc});
                                }}>Finalizar Ocorrência</Button>
                              )}
                            </div>
                          ))}

                          {!autoStatus.includes('Pago') && (
                            <div className="mt-4 pt-3 border-t border-green-100 flex justify-end">
                              <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T3'})}>⚠️ Nova Ocorrência</Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}


            <section className="space-y-4 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                Status e Etapa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
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
                  autoEtapa === 'Cadastro do Documento' ? 'bg-red-500 border-red-600' :
                  autoEtapa === 'Requisição de Compras' ? 'bg-blue-500 border-blue-600' :
                  autoEtapa === 'Aprovação' ? 'bg-zinc-500 border-zinc-600' :
                  autoEtapa === 'Inclusão no V360' ? 'bg-orange-500 border-orange-600' :
                  autoEtapa === 'Pedido de Compras' ? 'bg-purple-500 border-purple-600' :
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
            
          
            

      {/* Modal de Ocorrência */}
      {ocorrenciaModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-600">Registrar Ocorrência</h3>
              <Button variant="ghost" size="icon" onClick={() => setOcorrenciaModal({isOpen: false})} className="h-8 w-8"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">T de Destino</label>
                <select 
                  className="w-full h-9 rounded-md border border-zinc-200 text-sm px-3"
                  value={ocorrenciaModal.novoDestino || ''}
                  onChange={(e) => setOcorrenciaModal(prev => ({...prev, novoDestino: e.target.value}))}
                >
                  <option value="">Selecione...</option>
                  <option value="T1">T1 (SAP/Nexa)</option>
                  <option value="T2">T2 (Nexa/PC)</option>
                  <option value="T3">T3 (Fiscal)</option>
                  <option value="T4">T4 (Pagamento)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Motivo</label>
                <select 
                  className="w-full h-9 rounded-md border border-zinc-200 text-sm px-3"
                  value={ocorrenciaModal.novoMotivo || ''}
                  onChange={(e) => setOcorrenciaModal(prev => ({...prev, novoMotivo: e.target.value}))}
                >
                  <option value="">Selecione...</option>
                  {MOTIVOS_OCORRENCIA.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOcorrenciaModal({isOpen: false})}>Cancelar</Button>
              <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => {
                if (!ocorrenciaModal.novoDestino || !ocorrenciaModal.novoMotivo) return;
                const newOcorrencia = {
                  id: Math.random().toString(36).substr(2, 9),
                  t_origem: ocorrenciaModal.t_origem || '',
                  t_destino: ocorrenciaModal.novoDestino,
                  motivo: ocorrenciaModal.novoMotivo,
                  data_envio: new Date().toISOString(),
                  t_destino_codigo: ocorrenciaModal.novoDestino + '.' + (((formData.ocorrencias || []).filter(o => o.t_destino === ocorrenciaModal.novoDestino).length) + 1),
                  t_origem_retorno_codigo: (ocorrenciaModal.t_origem || '') + '.' + (((formData.ocorrencias || []).filter(o => o.t_origem === ocorrenciaModal.t_origem).length) + 1),
                  status: 'Pendente Destino' as 'Pendente Destino'
                };
                setFormData(prev => ({...prev, ocorrencias: [...(prev.ocorrencias || []), newOcorrencia]}));
                setOcorrenciaModal({isOpen: false});
              }}>Enviar Ocorrência</Button>
            </div>
          </div>
        </div>
      )}

            </form>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-zinc-200 py-4 px-6 flex justify-end gap-2 shrink-0 rounded-b-xl">
          <Button variant="outline" type="button" onClick={onClose}>{isReadOnly ? 'Fechar' : 'Cancelar'}</Button>
          {!isReadOnly && <Button form="fatura-form" type="submit">{isEditing ? 'Salvar Alterações' : 'Criar Fatura'}</Button>}
        </div>

      </div>
    </div>
  );
}
