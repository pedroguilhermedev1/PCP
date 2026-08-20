"use client";

import { Box, CheckCircle2, AlertCircle, MessageCircle, MessageSquare, Settings2 } from "lucide-react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUserName } from "@/lib/utils";
import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { useInsumosMovimentacoes } from "@/hooks/useInsumos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { getUserRole, getUserCD } from "@/lib/roles";

const cd_names_map: Record<string, string> = {
  fortaleza: 'Fortaleza',
  jundiai: 'Jundiaí',
  nse: 'NSE',
  coc: 'COC',
  psd: 'PSD'
};

function FormulariosModuleClientInner({ cd }: { cd: string }) {
  
  const { insumos, refetch: refetchInsumos } = useEstoqueInsumos(cd);
  const { movimentacoes, refresh, loading } = useInsumosMovimentacoes(cd, undefined, 'PENDENTE');
  const { movimentacoes: histAprovadas, refresh: refreshAprovadas } = useInsumosMovimentacoes(cd, undefined, 'Aprovada');

  const [activeTab, setActiveTab] = useState<'NOVA' | 'PENDENTES' | 'AJUSTE' | 'EXTERNA'>('NOVA');

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
  const isAjusteAllowed = responsavelOriginal.toLowerCase() === 'pedro.queiroz' || responsavelOriginal.toLowerCase() === 'francisco.edson';
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

      if (user.toLowerCase() === 'pedro.queiroz' || user.toLowerCase() === 'francisco.edson') {
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
  const isPrivileged = responsavelOriginal.toLowerCase().startsWith('pedro.queiroz') || responsavelOriginal.toLowerCase().startsWith('francisco.edson');
  let setores = isPrivileged ? [...setoresBase, "Ajuste de Inventário"] : setoresBase;

  if (cd.toLowerCase() === 'jundiai' && responsavelOriginal.toLowerCase().startsWith('josiane.ferreira')) {
    setores = [...setoresBase, "Conferência", "Pedidos", "QG"];
  }

  useEffect(() => {
    // When item changes, set the code automatically.
    const selected = insumos.find(i => i.item === item);
    if (selected) {
      setCodigo(selected.codigo);
      setEmpresa(selected.empresa || "");
    } else {
      setCodigo("");
      setEmpresa("");
    }
  }, [item, insumos]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

        <div className="flex gap-4 border-b border-transparent">
          {!isAjusteAllowed && (
            <>
              <button 
                className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'NOVA' ? 'border-purple-600 text-purple-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                onClick={() => setActiveTab('NOVA')}
              >
                NOVA SOLICITAÇÃO
              </button>
              <button 
                className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'PENDENTES' ? 'border-purple-600 text-purple-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                onClick={() => setActiveTab('PENDENTES')}
              >
                APROVAÇÕES PENDENTES
                {movimentacoes.filter(m => m.status === 'PENDENTE').length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {movimentacoes.filter(m => m.status === 'PENDENTE').length}
                  </span>
                )}
              </button>
            </>
          )}
          {isAjusteAllowed && (
            <button 
              className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'AJUSTE' ? 'border-purple-600 text-purple-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab('AJUSTE')}
            >
              <Settings2 className="w-4 h-4" />
              AJUSTE DE ESTOQUE
            </button>
          )}
          {isExternaAllowed && (
            <button 
              className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 flex gap-2 items-center ${activeTab === 'EXTERNA' ? 'border-purple-600 text-purple-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab('EXTERNA')}
            >
              <Settings2 className="w-4 h-4" />
              ATUALIZAÇÃO EXTERNA
            </button>
          )}
        </div>
      </header>

      <div className={`flex-1 p-4 md:p-8 overflow-y-auto w-full flex justify-center items-start`}>
        <div className={`w-full mt-4 max-w-7xl`}>
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-3 border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-3 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-lg font-bold text-zinc-800">
                {activeTab === 'NOVA' ? 'NOVA SOLICITAÇÃO' : activeTab === 'PENDENTES' ? 'APROVAÇÕES PENDENTES' : 'AJUSTE DE ESTOQUE'}
              </h2>
              {activeTab === 'NOVA' && (
                <p className="text-sm text-zinc-500 mt-1">
                  Responsável identificado automaticamente: <span className="font-semibold text-purple-700">{responsavel}</span>
                </p>
              )}
            </div>

            {activeTab === 'NOVA' && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                        {insumos.map(mat => (
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
              <div className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-zinc-100 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Nota Fiscal</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Data</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">CD</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Tipo</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Item</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Setor</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-right">Qtd</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Usuário</TableHead>
                      <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Justificativa</TableHead>
                      {userRole === 'OPERACIONAL' && userCD?.toLowerCase() === cd.toLowerCase() && <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-center">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.filter(m => m.status === 'PENDENTE').map(m => (
                      <TableRow key={m.id} className="border-b border-zinc-100 hover:bg-purple-50/50 transition-colors">
                        <TableCell className="font-medium text-xs text-zinc-700">{m.identificador || 'S/ ID'}</TableCell>
                        <TableCell className="text-zinc-500 whitespace-nowrap">{new Date(m.data_hora).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-semibold text-zinc-600">{m.cd.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={m.tipo === 'Entrada' ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-orange-700 border-orange-200 bg-orange-50'}>
                            {m.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="max-w-[200px] text-zinc-900 font-medium" style={{wordBreak: 'break-word'}}>{m.item}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-600">
                          {m.setor || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-bold text-sm bg-zinc-100 text-zinc-800">
                            {m.quantidade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-600">{m.usuario}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] text-xs text-zinc-500" style={{wordBreak: 'break-word'}}>
                            {m.observacoes || '-'}
                          </div>
                        </TableCell>
                        {userRole === 'OPERACIONAL' && userCD?.toLowerCase() === cd.toLowerCase() && (
                          <TableCell className="text-center">
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/movimentacoes/${m.id}/confirmar`, { method: 'POST' });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error);
                                  setSuccessMsg(`Movimentação confirmada! Novo estoque: ${data.novo_estoque}`);
                                  setTimeout(() => setSuccessMsg(""), 5000);
                                  refresh();
                                } catch (e: any) {
                                  setErrorMsg(e.message);
                                }
                              }}
                            >
                              Aprovar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {movimentacoes.filter(m => m.status === 'PENDENTE').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={userRole === 'OPERACIONAL' ? 10 : 9} className="text-center py-12 text-zinc-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-zinc-300" />
                            <p>Nenhuma solicitação pendente encontrada.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
                        {insumos.map(mat => (
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
                      <Input 
                        type="text" 
                        required
                        placeholder="Ex: Contagem física divergente"
                        value={ajusteMotivo}
                        onChange={(e) => setAjusteMotivo(e.target.value)}
                        className="w-full"
                      />
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
                              <span className="text-xs text-zinc-600 block max-w-[120px] truncate" title={parsed.motivo || '-'}>{parsed.motivo || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-zinc-500 block max-w-[120px] truncate" title={parsed.obs || '-'}>{parsed.obs || '-'}</span>
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
                        {insumos.map(mat => (
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
