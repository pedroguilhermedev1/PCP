"use client";

import { Box, CheckCircle2, AlertCircle, MessageCircle, MessageSquare, Settings2, Calendar, RotateCcw, Send, History, AlertTriangle, FileText, CheckCheck, X, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUserName, cn } from "@/lib/utils";
import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { useInsumosMovimentacoes, InsumoMovimentacao } from "@/hooks/useInsumos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { getUserRole, getUserCD } from "@/lib/roles";
import { SolicitacoesCalendario } from "@/components/solicitacoes/SolicitacoesCalendario";
import { extrairMetaDeObservacoes, formatarPeriodoEstimado } from "@/lib/previsaoRecebimento";

const cd_names_map: Record<string, string> = {
  fortaleza: 'Fortaleza',
  jundiai: 'Jundiaí',
  nse: 'NSE',
  coc: 'COC',
  psd: 'PSD'
};

function FormulariosModuleClientInner({ cd }: { cd: string }) {
  
  const { insumos, refetch: refetchInsumos } = useEstoqueInsumos(cd);
  const { movimentacoes, refresh, loading } = useInsumosMovimentacoes(cd, undefined, 'PENDENTE,PARCIAL,AGUARDANDO_CONFERENCIA');
  const { movimentacoes: histAprovadas, refresh: refreshAprovadas } = useInsumosMovimentacoes(cd, undefined, 'Aprovada,CONFIRMADO');
  const { movimentacoes: movsReprovadas, refresh: refreshReprovadas } = useInsumosMovimentacoes(cd, undefined, 'REPROVADO');
  const { movimentacoes: movsPendenciasCriador, refresh: refreshPendenciasCriador } = useInsumosMovimentacoes(cd, undefined, 'REPROVADO,PARCIAL,AGUARDANDO_CONFERENCIA,ENCERRADO');

  const [activeTab, setActiveTab] = useState<'NOVA' | 'PENDENTES' | 'REPROVADAS' | 'CALENDARIO' | 'AJUSTE' | 'EXTERNA'>('PENDENTES');
  const [filterPendencia, setFilterPendencia] = useState<'TODAS' | 'REPROVADA' | 'PARCIAL' | 'AGUARDANDO_CONFERENCIA' | 'ENCERRADO'>('TODAS');
  const [editingReprovadaId, setEditingReprovadaId] = useState<string | null>(null);

  const [recebimentoModal, setRecebimentoModal] = useState<{
    isOpen: boolean;
    mov?: InsumoMovimentacao;
    meta?: any;
    qtdRecebidaAgora: number;
    observacao: string;
    encerrarSaldo: boolean;
    justificativaEncerramento: string;
    isSubmitting?: boolean;
  }>({
    isOpen: false,
    qtdRecebidaAgora: 0,
    observacao: '',
    encerrarSaldo: false,
    justificativaEncerramento: '',
    isSubmitting: false
  });

  const [reprovarModal, setReprovarModal] = useState<{
    isOpen: boolean;
    mov?: InsumoMovimentacao;
    motivo: string;
    isSubmitting?: boolean;
  }>({
    isOpen: false,
    motivo: '',
    isSubmitting: false
  });

  const [encaminharModal, setEncaminharModal] = useState<{
    isOpen: boolean;
    mov?: InsumoMovimentacao;
    texto: string;
    isSubmitting?: boolean;
  }>({
    isOpen: false,
    texto: '',
    isSubmitting: false
  });

  const refreshAll = () => {
    refresh();
    refreshAprovadas();
    refreshReprovadas();
    refreshPendenciasCriador();
    refetchInsumos();
  };

  const [filterCD, setFilterCD] = useState("TODOS");

  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pendentes') {
      setActiveTab('PENDENTES');
    }
  }, [searchParams]);

  const [responsavel, setResponsavel] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCD, setUserCD] = useState<string | null>(null);
  const tipo = 'Saída';
  const [codigo, setCodigo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [item, setItem] = useState("");
  const [quantidade, setQuantidade] = useState<number | "">("");
  const [identificador, setIdentificador] = useState("");
  const [setor, setSetor] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [justificativa, setJustificativa] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const cdName = cd_names_map[cd] || cd.toUpperCase();

  const [responsavelOriginal, setResponsavelOriginal] = useState("");
  const isAjusteAllowed = (responsavelOriginal.toLowerCase() === 'pedro.queiroz' || responsavelOriginal.toLowerCase() === 'vando.sousa' || responsavelOriginal.toLowerCase() === 'felipe.castro') || responsavelOriginal.toLowerCase() === 'francisco.edson';
  const isExternaAllowed = isAjusteAllowed && cd.toLowerCase() === 'psd';

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      const formatted = formatUserName(user);
      setResponsavel(formatted);
      setResponsavelOriginal(user);
      const role = getUserRole(user);
      const userCd = getUserCD(user);
      
      setUserRole(role);
      setUserCD(userCd);

      if ((user.toLowerCase() === 'pedro.queiroz' || user.toLowerCase() === 'vando.sousa' || user.toLowerCase() === 'felipe.castro') || user.toLowerCase() === 'francisco.edson') {
        setActiveTab('AJUSTE');
      }
      
      if (role === 'OPERACIONAL' && userCd && cd.toLowerCase() !== userCd.toLowerCase()) {
        window.location.href = `/compras/formularios/${userCd.toLowerCase()}`;
      }
    } else {
      setResponsavel("Usuário não identificado");
    }
  }, [cd]);

  useEffect(() => {
    setSolicitante(responsavel);
  }, [responsavel]);

  const setoresBase = ["Expedição", "CIQ", "Estoque", "Recebimento", "PMM"];
  const isPrivileged = (responsavelOriginal.toLowerCase().startsWith('pedro.queiroz') || responsavelOriginal.toLowerCase().startsWith('vando.sousa') || responsavelOriginal.toLowerCase().startsWith('felipe.castro')) || responsavelOriginal.toLowerCase().startsWith('francisco.edson');
  let setores = isPrivileged ? [...setoresBase, "Ajuste de Inventário"] : setoresBase;

  if (cd.toLowerCase() === 'jundiai' && responsavelOriginal.toLowerCase().startsWith('raphael.farrao')) {
    setores = [...setoresBase, "Conferência", "Pedidos", "QG"];
  }

  const uniqueInsumos = useMemo(() => {
    const seen = new Set();
    return insumos.filter(i => {
      if (seen.has(i.item)) return false;
      seen.add(i.item);
      return true;
    });
  }, [insumos]);

  useEffect(() => {
    // When item changes, set the code automatically.
    const selected = uniqueInsumos.find(i => i.item === item);
    if (selected) {
      setCodigo(selected.codigo);
      setEmpresa(selected.empresa || "");
    } else {
      setCodigo("");
      setEmpresa("");
    }
  }, [item, uniqueInsumos]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canApprove = isPrivileged || (userRole === 'OPERACIONAL' && userCD?.toLowerCase() === cd.toLowerCase());

  const formatNumeroDocumento = (m: InsumoMovimentacao) => {
    if (m.observacoes && m.observacoes.includes('Fatura ')) {
      const obsClean = m.observacoes.split('___META_PCP___:')[0];
      const obsParts = obsClean.split('|')[0].trim();
      if (obsParts.startsWith('Fatura ') && obsParts !== 'Fatura não informada') {
        return obsParts.replace('Fatura ', '').trim();
      }
      if (obsParts === 'Fatura não informada') {
        return 'Não informada';
      }
    }
    if (m.fatura_id && typeof m.fatura_id === 'string' && m.fatura_id.includes('__')) {
      const prefix = m.fatura_id.split('__')[0];
      if (prefix && prefix !== 'null' && prefix !== 'undefined') return prefix;
    }
    return m.identificador || m.codigo_movimentacao || 'S/ ID';
  };

  const formatDataCriacao = (m: InsumoMovimentacao, meta: any) => {
    const dataStr = meta?.data_criacao_original || m.data_hora;
    if (!dataStr) return '-';
    const clean = dataStr.includes('T') ? dataStr.split('T')[0] : dataStr.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
  };

  const openRecebimentoModal = (m: InsumoMovimentacao) => {
    const { meta } = extrairMetaDeObservacoes(m.observacoes);
    const qtdPrev = meta.quantidade_prevista ?? Number(m.quantidade);
    const qtdRec = meta.quantidade_recebida ?? 0;
    const saldoPend = meta.saldo_pendente ?? (qtdPrev - qtdRec);
    
    setRecebimentoModal({
      isOpen: true,
      mov: m,
      meta,
      qtdRecebidaAgora: saldoPend,
      observacao: '',
      encerrarSaldo: false,
      justificativaEncerramento: '',
      isSubmitting: false
    });
  };

  const handleConfirmarRecebimento = async () => {
    if (!recebimentoModal.mov) return;
    setRecebimentoModal(prev => ({ ...prev, isSubmitting: true }));
    setErrorMsg('');
    try {
      const res = await fetch(`/api/movimentacoes/${recebimentoModal.mov.id}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantidadeRecebidaAgora: recebimentoModal.qtdRecebidaAgora,
          usuario: responsavel,
          observacao: recebimentoModal.observacao,
          encerrarSaldo: recebimentoModal.encerrarSaldo,
          justificativaEncerramento: recebimentoModal.justificativaEncerramento
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar recebimento');

      setSuccessMsg(data.mensagem || 'Recebimento registrado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 7000);
      setRecebimentoModal(prev => ({ ...prev, isOpen: false }));
      refreshAll();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setRecebimentoModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openReprovarModal = (m: InsumoMovimentacao) => {
    setReprovarModal({
      isOpen: true,
      mov: m,
      motivo: '',
      isSubmitting: false
    });
  };

  const handleReprovar = async () => {
    if (!reprovarModal.mov) return;
    if (!reprovarModal.motivo.trim()) {
      setErrorMsg('Informe o motivo da reprovação.');
      return;
    }
    setReprovarModal(prev => ({ ...prev, isSubmitting: true }));
    setErrorMsg('');
    try {
      const res = await fetch(`/api/movimentacoes/${reprovarModal.mov.id}/reprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: reprovarModal.motivo,
          usuario: responsavel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reprovar');

      setSuccessMsg('Solicitação reprovada e registrada no histórico.');
      setTimeout(() => setSuccessMsg(''), 5000);
      setReprovarModal(prev => ({ ...prev, isOpen: false }));
      refreshAll();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setReprovarModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleReabrir = async (movId: string) => {
    setErrorMsg('');
    try {
      const res = await fetch(`/api/movimentacoes/${movId}/reabrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: responsavel })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao reabrir');

      setSuccessMsg('Solicitação reaberta com sucesso e retornada para Aprovações Pendentes.');
      setTimeout(() => setSuccessMsg(''), 5000);
      refreshAll();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const openEncaminharModal = (m: InsumoMovimentacao) => {
    setEncaminharModal({
      isOpen: true,
      mov: m,
      texto: '',
      isSubmitting: false
    });
  };

  const handleEncaminhar = async () => {
    if (!encaminharModal.mov) return;
    if (!encaminharModal.texto.trim()) {
      setErrorMsg('A observação é obrigatória para encaminhar a pendência.');
      return;
    }
    setEncaminharModal(prev => ({ ...prev, isSubmitting: true }));
    setErrorMsg('');
    try {
      const res = await fetch(`/api/movimentacoes/${encaminharModal.mov.id}/encaminhar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: encaminharModal.texto,
          usuario: responsavel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao encaminhar');

      setSuccessMsg('Pendência encaminhada com sucesso ao responsável pelo recebimento.');
      setTimeout(() => setSuccessMsg(''), 5000);
      setEncaminharModal(prev => ({ ...prev, isOpen: false }));
      refreshAll();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setEncaminharModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!item || !quantidade || !tipo) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    if (tipo === 'Saída' && (!setor || !justificativa || !solicitante)) {
      setErrorMsg("Para saídas, preencha setor responsável, solicitante e justificativa.");
      return;
    }
    
    if (tipo === 'Saída') {
      const selectedInsumo = insumos.find(i => i.item === item);
      if (selectedInsumo && Number(quantidade) > (selectedInsumo.estoque_real || 0)) {
        setErrorMsg(`A quantidade solicitada (${quantidade}) é maior que o saldo em estoque (${selectedInsumo.estoque_real || 0}).`);
        return;
      }
    }

    // Se estivermos editando uma reprovada, chamamos a API de update
    if (editingReprovadaId) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/movimentacoes/${editingReprovadaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantidade: Number(quantidade),
            setor: tipo === 'Saída' ? setor : undefined,
            observacoes: tipo === 'Saída' ? justificativa : undefined,
            status: 'PENDENTE'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao re-submeter.');

        setSuccessMsg(`Solicitação corrigida e reenviada com sucesso!`);
        refreshReprovadas();
        refresh();
        setTimeout(() => setSuccessMsg(""), 5000);

        // Limpar
        setEditingReprovadaId(null);
        setItem("");
        setCodigo("");
        setQuantidade("");
        setIdentificador("");
        setSetor("");
        setSolicitante("");
        setJustificativa("");
        setActiveTab('REPROVADAS');
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Erro inesperado ao corrigir.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    
    let finalCodigo = codigo;
    const isLeadership = userRole !== 'OPERACIONAL';
    const respLower = responsavelOriginal.toLowerCase();
    const isExcludedUser = respLower.includes('pedro') || respLower.includes('edson') || respLower.includes('débora') || respLower.includes('debora');

    if (!finalCodigo) {
      if (userRole === 'OPERACIONAL' && !isExcludedUser && !isLeadership) {
        finalCodigo = "-";
      } else {
        setErrorMsg("O código do item é obrigatório para o seu perfil.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          codigo: finalCodigo,
          item,
          cd,
          empresa,
          identificador: identificador || undefined,
          quantidade: Number(quantidade),
          usuario: responsavel,
          setor: tipo === 'Saída' ? setor : undefined,
          observacoes: tipo === 'Saída' ? justificativa : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar solicitação.');
      }

      if (tipo === 'Saída') {
        setSuccessMsg(`Saída registrada e estoque atualizado com sucesso!`);
        refetchInsumos();
      } else {
        setSuccessMsg(`Solicitação de entrada enviada para aprovação com sucesso!`);
      }
      refresh();
      setTimeout(() => setSuccessMsg(""), 5000);

      // Limpar formulário
      setItem("");
      setCodigo("");
      setQuantidade("");
      setIdentificador("");
      setSetor("");
      setSolicitante("");
      setJustificativa("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro inesperado ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ajuste Form State
  const [ajusteItem, setAjusteItem] = useState("");
  const [ajusteTipo, setAjusteTipo] = useState<"Ajuste de Entrada" | "Ajuste de Saída">("Ajuste de Entrada");
  const [ajusteQuantidade, setAjusteQuantidade] = useState<number | "">("");
  const [ajusteMotivo, setAjusteMotivo] = useState("");
  const [ajusteObs, setAjusteObs] = useState("");

  const handleAjusteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!ajusteItem || !ajusteTipo || !ajusteQuantidade || !ajusteMotivo) {
      setErrorMsg("Preencha Item, Tipo, Quantidade e Motivo.");
      return;
    }
    const selected = insumos.find(i => i.item === ajusteItem);
    if (!selected) {
      setErrorMsg("Item inválido.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      
      const estoqueAnterior = selected.estoque_real || 0;
      let estoquePosterior = estoqueAnterior;
      if (ajusteTipo === 'Ajuste de Entrada') estoquePosterior += Number(ajusteQuantidade);
      else estoquePosterior -= Number(ajusteQuantidade);
      
      const obsPayload = JSON.stringify({
        motivo: ajusteMotivo,
        obs: ajusteObs,
        estoque_anterior: estoqueAnterior,
        estoque_posterior: estoquePosterior
      });

      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: ajusteTipo,
          codigo: selected.codigo || "-",
          item: ajusteItem,
          cd,
          empresa: selected.empresa || "",
          quantidade: Number(ajusteQuantidade),
          usuario: responsavel,
          observacoes: obsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar ajuste.');

      setSuccessMsg(`Ajuste de estoque salvo com sucesso! Novo saldo: ${data.novo_estoque}`);
      refetchInsumos();
      refreshAprovadas();
      
      setTimeout(() => setSuccessMsg(""), 5000);

      setAjusteItem("");
      setAjusteQuantidade("");
      setAjusteMotivo("");
      setAjusteObs("");
    } catch(err: any) {
      setErrorMsg(err.message || 'Erro ao ajustar estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Externa Form State
  const [extItem, setExtItem] = useState("");
  const [extNovaQtd, setExtNovaQtd] = useState<number | "">("");

  const extInsumo = useMemo(() => insumos.find(i => i.item === extItem), [extItem, insumos]);
  const extEstoqueAtual = extInsumo ? (extInsumo.estoque_real || 0) : "";
  const extDiferenca = (typeof extNovaQtd === 'number' && typeof extEstoqueAtual === 'number') 
    ? extNovaQtd - extEstoqueAtual 
    : "";

  const handleExternaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!extItem || extNovaQtd === "") {
      setErrorMsg("Preencha o Item e a Nova Quantidade.");
      return;
    }
    const selected = insumos.find(i => i.item === extItem);
    if (!selected) {
      setErrorMsg("Item inválido.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const anterior = selected.estoque_real || 0;
      const posterior = Number(extNovaQtd);
      const diff = posterior - anterior;
      
      let tipoExterna = 'Atualização Externa Neutra';
      if (diff > 0) tipoExterna = 'Atualização Externa de Entrada';
      else if (diff < 0) tipoExterna = 'Atualização Externa de Saída';
      
      const obsPayload = JSON.stringify({
        estoque_anterior: anterior,
        estoque_posterior: posterior,
        diferenca: diff,
        origem: "Atualização Externa"
      });

      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoExterna,
          codigo: selected.codigo || "-",
          item: extItem,
          cd,
          empresa: selected.empresa || "",
          quantidade: Math.abs(diff),
          usuario: responsavel,
          observacoes: obsPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar atualização externa.');

      setSuccessMsg(`Atualização externa salva com sucesso! Novo saldo: ${data.novo_estoque ?? posterior}`);
      refetchInsumos();
      refreshAprovadas();
      
      setTimeout(() => setSuccessMsg(""), 5000);

      setExtItem("");
      setExtNovaQtd("");
    } catch(err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar estoque externamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMovs = useMemo(() => {
    let list = movimentacoes;
    const allowedCodigos = new Set(insumos.map(i => i.codigo));
    list = list.filter(m => allowedCodigos.has(m.codigo));
    return list;
  }, [movimentacoes, insumos]);

  const ajustesHistory = useMemo(() => {
    return histAprovadas.filter(m => m.tipo === 'Ajuste de Entrada' || m.tipo === 'Ajuste de Saída');
  }, [histAprovadas]);

  const externaHistory = useMemo(() => {
    return histAprovadas.filter(m => m.tipo.startsWith('Atualização Externa'));
  }, [histAprovadas]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 pt-4 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <MessageSquare className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Solicitações - CD {cdName}</h1>
            <p className="text-sm text-zinc-500">Solicitação de Entrada e Saída de Insumos.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-transparent">
          <button 
            className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'NOVA' ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setActiveTab('NOVA')}
          >
            NOVA SOLICITAÇÃO
          </button>

          <button 
            className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'PENDENTES' ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setActiveTab('PENDENTES')}
          >
            APROVAÇÕES PENDENTES
            {movimentacoes.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {movimentacoes.length}
              </span>
            )}
          </button>

          <button 
            className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'REPROVADAS' ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setActiveTab('REPROVADAS')}
          >
            PENDÊNCIAS
            {movsPendenciasCriador.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {movsPendenciasCriador.length}
              </span>
            )}
          </button>

          <button 
            className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'CALENDARIO' ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setActiveTab('CALENDARIO')}
          >
            <Calendar className="w-4 h-4" />
            CALENDÁRIO
          </button>

          {isAjusteAllowed && (
            <button 
              className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'AJUSTE' ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab('AJUSTE')}
            >
              <Settings2 className="w-4 h-4" />
              AJUSTE DE ESTOQUE
            </button>
          )}

          {isExternaAllowed && (
            <button 
              className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'EXTERNA' ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab('EXTERNA')}
            >
              <Settings2 className="w-4 h-4" />
              ATUALIZAÇÃO EXTERNA
            </button>
          )}
        </div>
      </header>

      <div className={`flex-1 p-6 md:p-8 overflow-y-auto w-full flex justify-center items-start bg-transparent`}>
        <div className={`w-full max-w-[1600px]`}>
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-3 border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{successMsg}</span>
            </div>
          )}
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-3 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{errorMsg}</span>
            </div>
          )}

          <div className="w-full">
            <div className="pb-4 mb-6 border-b border-zinc-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-zinc-800">
                  {activeTab === 'NOVA' ? (editingReprovadaId ? 'CORRIGIR SOLICITAÇÃO' : 'NOVA SOLICITAÇÃO') 
                    : activeTab === 'PENDENTES' ? 'APROVAÇÕES PENDENTES' 
                    : activeTab === 'REPROVADAS' ? 'PENDÊNCIAS EM ACOMPANHAMENTO'
                    : activeTab === 'CALENDARIO' ? 'CALENDÁRIO DE ENTREGAS'
                    : 'AJUSTE DE ESTOQUE'}
                </h2>
                {activeTab === 'NOVA' && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Responsável identificado automaticamente: <span className="font-semibold text-purple-700">{responsavel}</span>
                  </p>
                )}
                {activeTab === 'PENDENTES' && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Conferência e recebimento de insumos com acompanhamento de entregas parciais e prazos estimados.
                  </p>
                )}
                {activeTab === 'CALENDARIO' && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Visualização mensal das faixas contínuas de entrega previstas para as faturas deste CD.
                  </p>
                )}
              </div>
            </div>

            {activeTab === 'NOVA' && (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <div className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Tipo de Movimentação *</label>
                      <div className="flex bg-zinc-100 p-1 rounded-md">
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors bg-white text-zinc-900 shadow-sm"
                        >
                          Saída
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Quantidade *</label>
                      <Input 
                        type="number" 
                        min="1"
                        required
                        placeholder="0"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value ? Number(e.target.value) : "")}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-sm font-medium text-zinc-700">Item / Material *</label>
                      <select 
                        required
                        value={item}
                        onChange={(e) => setItem(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Selecione um item...</option>
                        {uniqueInsumos.map(mat => (
                          <option key={mat.id} value={mat.item}>{mat.item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Código</label>
                      <Input 
                        disabled
                        type="text" 
                        value={codigo}
                        placeholder="Preenchido automaticamente"
                        className="w-full bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Setor Responsável *</label>
                      <select 
                        required
                        value={setor}
                        onChange={(e) => setSetor(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                      >
                        <option value="" disabled>Selecione...</option>
                        {setores.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Solicitante</label>
                      <Input 
                        disabled
                        type="text" 
                        value={solicitante}
                        className="w-full bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Justificativa / Motivo *</label>
                    <textarea 
                      required
                      className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 resize-y"
                      placeholder="Descreva o motivo desta solicitação..."
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  {userRole === 'OPERACIONAL' && userCD?.toLowerCase() !== cd.toLowerCase() ? (
                    <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm text-center border border-red-200">
                      Você só pode registrar solicitações para o seu próprio CD.
                    </div>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Registrando...' : 'Registrar Solicitação'}
                    </Button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'PENDENTES' && (
              <div className="p-0 overflow-x-auto w-full">
                <Table className="w-full bg-white/40 backdrop-blur-sm rounded-xl">
                  <TableHeader className="bg-zinc-50/80 border-b border-zinc-200">
                    <TableRow className="border-zinc-100 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">1. Documento</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">2. Data Criação</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">3. Período Estimado</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">4. Item / Insumo</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">5. Qtd Prevista</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">6. Qtd Recebida</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">7. Saldo Pendente</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">8. Usuário Criação</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">9. Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.map(m => {
                      const { meta } = extrairMetaDeObservacoes(m.observacoes);
                      const qtdPrevista = meta.quantidade_prevista ?? Number(m.quantidade);
                      const qtdRecebida = meta.quantidade_recebida ?? (m.status === 'Aprovada' || m.status === 'CONFIRMADO' ? Number(m.quantidade) : 0);
                      const saldoPendente = meta.saldo_pendente ?? (qtdPrevista - qtdRecebida);
                      const periodoTexto = formatarPeriodoEstimado(
                        meta.previsao_dias_min,
                        meta.previsao_dias_max,
                        meta.previsao_data_inicio,
                        meta.previsao_data_fim
                      );
                      const docNum = formatNumeroDocumento(m);
                      const dataCriacao = formatDataCriacao(m, meta);
                      const nomeUsuario = formatUserName(m.usuario);
                      const ultimasObsCriador = meta.observacoes_criador && meta.observacoes_criador.length > 0 
                        ? meta.observacoes_criador[meta.observacoes_criador.length - 1] 
                        : null;

                      return (
                        <TableRow key={m.id} className="border-b border-zinc-100 hover:bg-purple-50/40 transition-colors">
                          <TableCell className="font-semibold text-xs text-zinc-800 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{docNum}</span>
                              {m.status === 'PARCIAL' && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                                  Recebimento Parcial
                                </span>
                              )}
                              {m.status === 'AGUARDANDO_CONFERENCIA' && (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                                  Aguardando Conferência
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-600 text-xs whitespace-nowrap">
                            {dataCriacao}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-medium inline-block",
                              periodoTexto === 'Não informado'
                                ? "text-zinc-400 bg-zinc-100"
                                : "text-purple-700 bg-purple-50 border border-purple-200"
                            )}>
                              {periodoTexto}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-900 text-xs max-w-[220px]" style={{wordBreak: 'break-word'}}>{m.item}</span>
                              {m.codigo && m.codigo !== '-' && (
                                <span className="text-[10px] text-zinc-400 font-mono">{m.codigo}</span>
                              )}
                              {ultimasObsCriador && (
                                <div className="mt-1 text-[11px] text-blue-800 bg-blue-50/80 border border-blue-200 rounded p-1 max-w-[260px]">
                                  <span className="font-bold">Criador ({formatUserName(ultimasObsCriador.usuario)}): </span>
                                  <span>{ultimasObsCriador.texto}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium text-xs text-zinc-700">
                            {qtdPrevista}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-xs text-emerald-700">
                            {qtdRecebida}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "font-bold text-xs px-2 py-0.5",
                              saldoPendente > 0 
                                ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-100"
                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-100"
                            )}>
                              {saldoPendente}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-700 text-xs font-medium whitespace-nowrap">
                            {nomeUsuario}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {canApprove ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 shadow-xs"
                                  onClick={() => openRecebimentoModal(m)}
                                >
                                  Receber
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-2.5"
                                  onClick={() => openReprovarModal(m)}
                                >
                                  Reprovar
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic">Em acompanhamento</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {movimentacoes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-zinc-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-zinc-300" />
                            <p>Nenhuma solicitação ou recebimento pendente encontrado.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Subaba PENDÊNCIAS */}
            {activeTab === 'REPROVADAS' && (
              <div className="space-y-4">
                {/* Filtro por categoria de pendência */}
                <div className="flex flex-wrap gap-2 items-center bg-zinc-50 p-2 rounded-lg border border-zinc-200 text-xs">
                  <span className="text-zinc-500 font-medium px-2">Filtrar pendências:</span>
                  {(['TODAS', 'REPROVADA', 'PARCIAL', 'AGUARDANDO_CONFERENCIA', 'ENCERRADO'] as const).map(cat => {
                    const labelMap: Record<string, string> = {
                      TODAS: 'Todas',
                      REPROVADA: 'Reprovadas',
                      PARCIAL: 'Recebimento Parcial',
                      AGUARDANDO_CONFERENCIA: 'Aguardando Nova Conferência',
                      ENCERRADO: 'Encerradas s/ Integral'
                    };
                    return (
                      <Button
                        key={cat}
                        variant={filterPendencia === cat ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "h-7 text-xs",
                          filterPendencia === cat && "bg-purple-700 text-white"
                        )}
                        onClick={() => setFilterPendencia(cat)}
                      >
                        {labelMap[cat]}
                      </Button>
                    );
                  })}
                </div>

                <div className="p-0 overflow-x-auto w-full">
                  <Table className="w-full bg-white/40 backdrop-blur-sm rounded-xl">
                    <TableHeader className="bg-zinc-50/80 border-b border-zinc-200">
                      <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Documento</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Data Criação</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Situação</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Período Estimado</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Item / Insumo</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Qtd Prevista</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Qtd Recebida</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Saldo Pendente</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Detalhes / Histórico</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movsPendenciasCriador
                        .filter(m => {
                          if (filterPendencia === 'TODAS') return true;
                          if (filterPendencia === 'REPROVADA') return m.status === 'REPROVADO';
                          if (filterPendencia === 'PARCIAL') return m.status === 'PARCIAL';
                          if (filterPendencia === 'AGUARDANDO_CONFERENCIA') return m.status === 'AGUARDANDO_CONFERENCIA';
                          if (filterPendencia === 'ENCERRADO') return m.status === 'ENCERRADO';
                          return true;
                        })
                        .map(m => {
                          const { meta } = extrairMetaDeObservacoes(m.observacoes);
                          const qtdPrevista = meta.quantidade_prevista ?? Number(m.quantidade);
                          const qtdRecebida = meta.quantidade_recebida ?? 0;
                          const saldoPendente = meta.saldo_pendente ?? (qtdPrevista - qtdRecebida);
                          const docNum = formatNumeroDocumento(m);
                          const dataCriacao = formatDataCriacao(m, meta);
                          const periodoTexto = formatarPeriodoEstimado(
                            meta.previsao_dias_min,
                            meta.previsao_dias_max,
                            meta.previsao_data_inicio,
                            meta.previsao_data_fim
                          );
                          const ultimaReprovacao = meta.reprovacoes && meta.reprovacoes.length > 0 
                            ? meta.reprovacoes[meta.reprovacoes.length - 1] 
                            : null;

                          return (
                            <TableRow key={m.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                              <TableCell className="font-semibold text-xs text-zinc-800 whitespace-nowrap">
                                {docNum}
                              </TableCell>
                              <TableCell className="text-zinc-600 text-xs whitespace-nowrap">
                                {dataCriacao}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {m.status === 'REPROVADO' ? (
                                  <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                    Reprovada
                                  </span>
                                ) : m.status === 'PARCIAL' ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    Recebimento Parcial
                                  </span>
                                ) : m.status === 'AGUARDANDO_CONFERENCIA' ? (
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                    Aguardando Nova Conferência
                                  </span>
                                ) : m.status === 'ENCERRADO' ? (
                                  <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                                    Encerrada s/ Recebimento Integral
                                  </span>
                                ) : (
                                  <Badge variant="outline">{m.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[11px] font-medium inline-block",
                                  periodoTexto === 'Não informado'
                                    ? "text-zinc-400 bg-zinc-100"
                                    : "text-purple-700 bg-purple-50 border border-purple-200"
                                )}>
                                  {periodoTexto}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold text-zinc-900 text-xs">{m.item}</span>
                              </TableCell>
                              <TableCell className="text-center font-medium text-xs text-zinc-700">
                                {qtdPrevista}
                              </TableCell>
                              <TableCell className="text-center font-medium text-xs text-emerald-700">
                                {qtdRecebida}
                              </TableCell>
                              <TableCell className="text-center font-bold text-xs text-amber-700">
                                {saldoPendente}
                              </TableCell>
                              <TableCell className="text-xs max-w-[240px]">
                                {m.status === 'REPROVADO' && (
                                  <div className="text-red-700">
                                    <span className="font-semibold">Motivo: </span>
                                    <span>{ultimaReprovacao ? ultimaReprovacao.motivo : m.observacoes}</span>
                                  </div>
                                )}
                                {meta.entregas && meta.entregas.length > 0 && (
                                  <div className="text-[11px] text-zinc-600">
                                    <span className="font-semibold">{meta.entregas.length} entrega(s) realizada(s).</span>
                                    <span className="block text-[10px] text-zinc-400">
                                      Última: {meta.entregas[meta.entregas.length - 1].quantidade} un em {new Date(meta.entregas[meta.entregas.length - 1].data_hora).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                                {meta.encerramento && (
                                  <div className="text-[11px] text-zinc-600">
                                    <span className="font-semibold text-zinc-800">Encerrado: </span>
                                    <span>{meta.encerramento.justificativa} ({meta.encerramento.quantidade_encerrada} un)</span>
                                  </div>
                                )}
                                {meta.observacoes_criador && meta.observacoes_criador.length > 0 && (
                                  <div className="mt-1 text-[10px] text-blue-700 bg-blue-50 rounded p-1">
                                    <span className="font-bold">Sua última nota: </span>
                                    <span>{meta.observacoes_criador[meta.observacoes_criador.length - 1].texto}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                {m.status === 'REPROVADO' ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5"
                                      onClick={() => {
                                        setEditingReprovadaId(m.id);
                                        setItem(m.item);
                                        setCodigo(m.codigo || "");
                                        setQuantidade(m.quantidade || "");
                                        setSetor(m.setor || "");
                                        setJustificativa(m.observacoes || "");
                                        setActiveTab('NOVA');
                                      }}
                                    >
                                      Corrigir
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-purple-700 border-purple-200 hover:bg-purple-50 text-xs h-7 px-2.5 gap-1"
                                      onClick={() => handleReabrir(m.id)}
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Reabrir
                                    </Button>
                                  </div>
                                ) : (m.status === 'PARCIAL' || m.status === 'AGUARDANDO_CONFERENCIA') ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs h-7 px-2.5 gap-1.5"
                                    onClick={() => openEncaminharModal(m)}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Encaminhar
                                  </Button>
                                ) : (
                                  <span className="text-[11px] text-zinc-400">Encerrado</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      {movsPendenciasCriador.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-12 text-zinc-500">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <CheckCircle2 className="w-8 h-8 text-zinc-300" />
                              <p>Nenhuma pendência encontrada para este CD.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Subaba CALENDÁRIO */}
            {activeTab === 'CALENDARIO' && (
              <SolicitacoesCalendario cd={cd} />
            )}

            {activeTab === 'AJUSTE' && isAjusteAllowed && (
              <div className="flex flex-col">
                <form onSubmit={handleAjusteSubmit} className="p-6 space-y-6 border-b border-zinc-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Item *</label>
                      <select 
                        required
                        value={ajusteItem}
                        onChange={(e) => setAjusteItem(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                      >
                        <option value="" disabled>Selecione um item...</option>
                        {uniqueInsumos.map(mat => (
                          <option key={mat.id} value={mat.item}>{mat.item}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Tipo de Ajuste *</label>
                      <select
                        required
                        value={ajusteTipo}
                        onChange={(e) => setAjusteTipo(e.target.value as any)}
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                      >
                        <option value="Ajuste de Entrada">Entrada (Adicionar ao estoque)</option>
                        <option value="Ajuste de Saída">Saída (Remover do estoque)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Quantidade Ajustada *</label>
                      <Input 
                        type="number" 
                        min="1"
                        required
                        placeholder="Ex: 30"
                        value={ajusteQuantidade}
                        onChange={(e) => setAjusteQuantidade(e.target.value ? Number(e.target.value) : "")}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Motivo do Ajuste *</label>
                      <select
                        required
                        value={ajusteMotivo}
                        onChange={(e) => setAjusteMotivo(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                      >
                        <option value="" disabled>Selecione um motivo...</option>
                        <option value="Contagem física (Divergência)">Contagem física (Divergência)</option>
                        <option value="Perda / Avaria">Perda / Avaria</option>
                        <option value="Vencimento / Validade">Vencimento / Validade</option>
                        <option value="Ajuste de Sistema (Erro de lançamento)">Ajuste de Sistema (Erro de lançamento)</option>
                        <option value="Doação / Amostra / Teste">Doação / Amostra / Teste</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Observação Adicional</label>
                    <textarea 
                      className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 resize-y"
                      placeholder="Detalhes..."
                      value={ajusteObs}
                      onChange={(e) => setAjusteObs(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      {isSubmitting ? 'Salvando Ajuste...' : 'Realizar Ajuste'}
                    </Button>
                  </div>
                </form>

                <div className="p-0 overflow-x-auto">
                  <div className="p-6 bg-zinc-50 border-b border-zinc-200">
                    <h3 className="font-bold text-zinc-800">Histórico de Ajustes</h3>
                  </div>
                  <Table>
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Data</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Item</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Tipo</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-right">Qtd Ajustada</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-right">Estoque Ant.</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-right">Estoque Post.</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Motivo</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Obs</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Usuário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ajustesHistory.map(m => {
                        let parsed: any = {};
                        try {
                          parsed = JSON.parse(m.observacoes || "{}");
                        } catch(e) {}
                        
                        return (
                          <TableRow key={m.id} className="border-b border-zinc-100 hover:bg-purple-50/50 transition-colors">
                            <TableCell className="text-zinc-500 whitespace-nowrap">{new Date(m.data_hora).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="max-w-[150px] text-zinc-900 font-medium" style={{wordBreak: 'break-word'}}>{m.item}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={m.tipo === 'Ajuste de Entrada' ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-orange-700 border-orange-200 bg-orange-50'}>
                                {m.tipo.replace('Ajuste de ', '')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-zinc-800">{m.quantidade}</TableCell>
                            <TableCell className="text-right text-zinc-500">{parsed.estoque_anterior ?? '-'}</TableCell>
                            <TableCell className="text-right font-semibold text-purple-700">{parsed.estoque_posterior ?? '-'}</TableCell>
                            <TableCell>
                              <span className="text-xs text-zinc-600 block max-w-[200px]" style={{wordBreak: 'break-word'}}>{parsed.motivo || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-zinc-500 block max-w-[200px]" style={{wordBreak: 'break-word'}}>{parsed.obs || '-'}</span>
                            </TableCell>
                            <TableCell className="text-zinc-600 text-xs">{m.usuario}</TableCell>
                          </TableRow>
                        )
                      })}
                      {ajustesHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-zinc-500">
                            <p>Nenhum ajuste de estoque registrado.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === 'EXTERNA' && isExternaAllowed && (
              <div className="flex flex-col">
                <form onSubmit={handleExternaSubmit} className="p-6 space-y-6 border-b border-zinc-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Insumo *</label>
                      <select 
                        required
                        value={extItem}
                        onChange={(e) => setExtItem(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                      >
                        <option value="" disabled>Selecione um insumo...</option>
                        {uniqueInsumos.map(mat => (
                          <option key={mat.id} value={mat.item}>{mat.item}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Estoque Atual (Anterior)</label>
                      <Input 
                        type="text" 
                        disabled
                        value={extEstoqueAtual}
                        className="w-full bg-zinc-50 text-zinc-500"
                        placeholder="Automático"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Nova Quantidade Externa *</label>
                      <Input 
                        type="number" 
                        min="0"
                        required
                        placeholder="Ex: 50"
                        value={extNovaQtd}
                        onChange={(e) => setExtNovaQtd(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full font-bold text-purple-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Diferença</label>
                      <Input 
                        type="text" 
                        disabled
                        value={typeof extDiferenca === 'number' && extDiferenca > 0 ? `+${extDiferenca}` : extDiferenca}
                        className={`w-full font-bold ${typeof extDiferenca === 'number' && extDiferenca > 0 ? 'text-blue-600' : typeof extDiferenca === 'number' && extDiferenca < 0 ? 'text-orange-600' : 'text-zinc-500'}`}
                        placeholder="Automático"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                      {isSubmitting ? 'Registrando Atualização...' : 'Registrar Atualização'}
                    </Button>
                  </div>
                </form>

                <div className="p-0 overflow-x-auto">
                  <div className="p-6 bg-zinc-50 border-b border-zinc-200">
                    <h3 className="font-bold text-zinc-800">Histórico de Atualizações Externas</h3>
                  </div>
                  <Table>
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow className="border-zinc-100 hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Data</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Insumo</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Estoque Ant.</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Nova Qtd</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Diferença</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Movimentação</TableHead>
                        <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Usuário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {externaHistory.map(m => {
                        let parsed: any = {};
                        try {
                          parsed = JSON.parse(m.observacoes || "{}");
                        } catch(e) {}
                        
                        return (
                          <TableRow key={m.id} className="border-b border-zinc-100 hover:bg-purple-50/50 transition-colors">
                            <TableCell className="text-zinc-500 whitespace-nowrap">{new Date(m.data_hora).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="max-w-[180px] text-zinc-900 font-medium" style={{wordBreak: 'break-word'}}>{m.item}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-zinc-500">{parsed.estoque_anterior ?? '-'}</TableCell>
                            <TableCell className="text-center font-bold text-purple-700">{parsed.estoque_posterior ?? '-'}</TableCell>
                            <TableCell className={`text-center font-bold ${parsed.diferenca > 0 ? 'text-blue-600' : parsed.diferenca < 0 ? 'text-orange-600' : 'text-zinc-400'}`}>
                              {parsed.diferenca > 0 ? `+${parsed.diferenca}` : parsed.diferenca}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={m.tipo.includes('Entrada') ? 'text-blue-700 border-blue-200 bg-blue-50' : m.tipo.includes('Saída') ? 'text-orange-700 border-orange-200 bg-orange-50' : 'text-zinc-600 border-zinc-200 bg-zinc-50'}>
                                {m.tipo.includes('Entrada') ? 'Entrada' : m.tipo.includes('Saída') ? 'Saída' : 'Neutra'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-600 text-xs">{m.usuario}</TableCell>
                          </TableRow>
                        )
                      })}
                      {externaHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                            <p>Nenhuma atualização externa registrada.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Modal de Conferência e Recebimento de Insumo (Requirement 3 e 5) */}
            {recebimentoModal.isOpen && recebimentoModal.mov && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/80">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-zinc-900 text-sm">
                        Conferência e Recebimento de Insumo
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                      onClick={() => setRecebimentoModal(prev => ({ ...prev, isOpen: false }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                    {/* Resumo do Item */}
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Documento
                          </span>
                          <span className="font-bold text-zinc-800 text-sm">
                            {formatNumeroDocumento(recebimentoModal.mov)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Previsão Estimada
                          </span>
                          <span className="font-semibold text-purple-700">
                            {formatarPeriodoEstimado(
                              recebimentoModal.meta?.previsao_dias_min,
                              recebimentoModal.meta?.previsao_dias_max,
                              recebimentoModal.meta?.previsao_data_inicio,
                              recebimentoModal.meta?.previsao_data_fim
                            )}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Item / Insumo
                        </span>
                        <span className="font-medium text-zinc-900">
                          {recebimentoModal.mov.item}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 text-center">
                        <div className="p-2 bg-white rounded border border-zinc-100">
                          <span className="text-[10px] text-zinc-400 block">Previsto</span>
                          <span className="font-bold text-zinc-700 text-sm">
                            {recebimentoModal.meta?.quantidade_prevista ?? Number(recebimentoModal.mov.quantidade)}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-zinc-100">
                          <span className="text-[10px] text-zinc-400 block">Já Recebido</span>
                          <span className="font-bold text-emerald-700 text-sm">
                            {recebimentoModal.meta?.quantidade_recebida ?? 0}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded border border-zinc-100">
                          <span className="text-[10px] text-zinc-400 block">Saldo Pendente</span>
                          <span className="font-bold text-amber-700 text-sm">
                            {(recebimentoModal.meta?.quantidade_prevista ?? Number(recebimentoModal.mov.quantidade)) - (recebimentoModal.meta?.quantidade_recebida ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Observação do criador */}
                    {recebimentoModal.meta?.observacoes_criador && recebimentoModal.meta.observacoes_criador.length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-1.5 text-blue-900 font-semibold mb-1">
                          <MessageCircle className="w-4 h-4 text-blue-700" />
                          <span>Observação do Solicitante</span>
                        </div>
                        <div className="space-y-1">
                          {recebimentoModal.meta.observacoes_criador.map((obs: any, idx: number) => (
                            <p key={idx} className="text-blue-800 text-xs">
                              <span className="font-bold">{formatUserName(obs.usuario)} ({new Date(obs.data_hora).toLocaleDateString('pt-BR')}): </span>
                              {obs.texto}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Histórico de Entregas Anteriores */}
                    {recebimentoModal.meta?.entregas && recebimentoModal.meta.entregas.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-zinc-500" />
                          Entregas anteriores registradas
                        </span>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {recebimentoModal.meta.entregas.map((ent: any, idx: number) => (
                            <div key={idx} className="p-2 bg-zinc-50 rounded border border-zinc-200 text-[11px] flex justify-between items-center">
                              <div>
                                <span className="font-bold text-zinc-800">Entrega #{ent.entrega_numero}: </span>
                                <span className="text-emerald-700 font-semibold">{ent.quantidade} un </span>
                                <span className="text-zinc-500">em {new Date(ent.data_hora).toLocaleString('pt-BR')} por {formatUserName(ent.usuario)}</span>
                                {ent.observacao && <span className="block text-zinc-400 italic">"{ent.observacao}"</span>}
                              </div>
                              <span className="text-zinc-500 text-[10px]">Restou: {ent.saldo_restante} un</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opção de Encerramento Formal do Saldo */}
                    <div className="pt-2 border-t border-zinc-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                          checked={recebimentoModal.encerrarSaldo}
                          onChange={(e) => setRecebimentoModal(prev => ({ ...prev, encerrarSaldo: e.target.checked }))}
                        />
                        <span className="text-xs font-semibold text-zinc-800">
                          Encerrar formalmente o saldo não recebido restante
                        </span>
                      </label>
                    </div>

                    {recebimentoModal.encerrarSaldo ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                        <p className="text-[11px] text-amber-800">
                          Atenção: O saldo pendente será cancelado sem recebimento e NÃO movimentará o estoque.
                        </p>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-700">Justificativa do encerramento *</label>
                          <textarea
                            required
                            className="w-full p-2 border border-zinc-200 rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            rows={3}
                            placeholder="Informe obrigatoriamente o motivo pelo qual o saldo restante não será entregue..."
                            value={recebimentoModal.justificativaEncerramento}
                            onChange={(e) => setRecebimentoModal(prev => ({ ...prev, justificativaEncerramento: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Formulário de Confirmação da Entrega */
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-700">
                            Quantidade recebida nesta entrega *
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={(recebimentoModal.meta?.quantidade_prevista ?? Number(recebimentoModal.mov.quantidade)) - (recebimentoModal.meta?.quantidade_recebida ?? 0)}
                            value={recebimentoModal.qtdRecebidaAgora || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setRecebimentoModal(prev => ({ ...prev, qtdRecebidaAgora: val }));
                            }}
                            className="h-9 font-semibold text-emerald-700"
                          />
                          <p className="text-[10px] text-zinc-500">
                            Máximo permitido: {(recebimentoModal.meta?.quantidade_prevista ?? Number(recebimentoModal.mov.quantidade)) - (recebimentoModal.meta?.quantidade_recebida ?? 0)} unidades. Somente a quantidade desta entrega incrementará o estoque.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-zinc-700">
                            Observação da entrega (opcional)
                          </label>
                          <Input
                            type="text"
                            placeholder="Ex: 1º lote entregue pelo fornecedor"
                            value={recebimentoModal.observacao}
                            onChange={(e) => setRecebimentoModal(prev => ({ ...prev, observacao: e.target.value }))}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecebimentoModal(prev => ({ ...prev, isOpen: false }))}
                      disabled={recebimentoModal.isSubmitting}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className={cn(
                        "text-xs text-white",
                        recebimentoModal.encerrarSaldo
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      )}
                      onClick={handleConfirmarRecebimento}
                      disabled={recebimentoModal.isSubmitting}
                    >
                      {recebimentoModal.isSubmitting ? (
                        'Processando...'
                      ) : recebimentoModal.encerrarSaldo ? (
                        'Confirmar Encerramento Formal'
                      ) : (
                        'Confirmar Recebimento'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Reprovação (Requirement 2 e 6) */}
            {reprovarModal.isOpen && reprovarModal.mov && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/80">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-zinc-900 text-sm">
                        Reprovar Solicitação
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                      onClick={() => setReprovarModal(prev => ({ ...prev, isOpen: false }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-5 space-y-4 text-xs">
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                      <p><span className="font-bold text-zinc-700">Documento: </span>{formatNumeroDocumento(reprovarModal.mov)}</p>
                      <p><span className="font-bold text-zinc-700">Item: </span>{reprovarModal.mov.item}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-700">
                        Motivo da Reprovação *
                      </label>
                      <textarea
                        required
                        className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={4}
                        placeholder="Descreva detalhadamente o motivo da reprovação..."
                        value={reprovarModal.motivo}
                        onChange={(e) => setReprovarModal(prev => ({ ...prev, motivo: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReprovarModal(prev => ({ ...prev, isOpen: false }))}
                      disabled={reprovarModal.isSubmitting}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs"
                      onClick={handleReprovar}
                      disabled={reprovarModal.isSubmitting}
                    >
                      {reprovarModal.isSubmitting ? 'Reprovando...' : 'Confirmar Reprovação'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Encaminhamento do Criador (Requirement 4) */}
            {encaminharModal.isOpen && encaminharModal.mov && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/80">
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-zinc-900 text-sm">
                        Encaminhar Pendência ao Recebimento
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                      onClick={() => setEncaminharModal(prev => ({ ...prev, isOpen: false }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-5 space-y-4 text-xs">
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                      <p><span className="font-bold text-zinc-700">Documento: </span>{formatNumeroDocumento(encaminharModal.mov)}</p>
                      <p><span className="font-bold text-zinc-700">Item: </span>{encaminharModal.mov.item}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-700">
                        Observação / Previsão para o Recebedor *
                      </label>
                      <textarea
                        required
                        className="w-full p-2.5 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Ex: As 4 unidades restantes têm previsão de chegada amanhã. Favor manter a pendência em acompanhamento."
                        value={encaminharModal.texto}
                        onChange={(e) => setEncaminharModal(prev => ({ ...prev, texto: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEncaminharModal(prev => ({ ...prev, isOpen: false }))}
                      disabled={encaminharModal.isSubmitting}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                      onClick={handleEncaminhar}
                      disabled={encaminharModal.isSubmitting}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {encaminharModal.isSubmitting ? 'Encaminhando...' : 'Encaminhar ao Recebedor'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormulariosModuleClient({ cd }: { cd: string }) {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <FormulariosModuleClientInner cd={cd} />
    </Suspense>
  );
}
