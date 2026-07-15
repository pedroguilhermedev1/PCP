"use client";

import { Box, CheckCircle2, AlertCircle, MessageCircle, MessageSquare } from "lucide-react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUserName } from "@/lib/utils";
import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { useInsumosMovimentacoes } from "@/hooks/useInsumos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { getUserRole } from "@/lib/roles";

const cd_names_map: Record<string, string> = {
  fortaleza: 'Fortaleza',
  jundiai: 'Jundiaí',
  nse: 'NSE',
  coc: 'COC',
  psd: 'PSD'
};

function FormulariosModuleClientInner({ cd }: { cd: string }) {
  
  const { insumos } = useEstoqueInsumos(cd);
  const { movimentacoes, refresh, loading } = useInsumosMovimentacoes(cd);

  const [activeTab, setActiveTab] = useState<'NOVA' | 'PENDENTES'>('NOVA');

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
  const tipo = 'Saída';
  const [codigo, setCodigo] = useState("");
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

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      const formatted = formatUserName(user);
      setResponsavel(formatted);
      setResponsavelOriginal(user);
      setUserRole(getUserRole(user));
    } else {
      setResponsavel("Usuário não identificado");
    }
  }, []);

  useEffect(() => {
    setSolicitante(responsavel);
  }, [responsavel]);

  const setoresBase = ["Expedição", "CIQ", "Estoque", "Recebimento", "PMM"];
  const isPrivileged = responsavelOriginal.startsWith('pedro.queiroz') || responsavelOriginal.startsWith('francisco.edson');
  const setores = isPrivileged ? [...setoresBase, "Ajuste de Inventário"] : setoresBase;

  useEffect(() => {
    // When item changes, set the code automatically.
    const selected = insumos.find(i => i.item === item);
    if (selected) {
      setCodigo(selected.codigo);
    } else {
      setCodigo("");
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

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          codigo,
          item,
          cd,
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

      setSuccessMsg(`Solicitação de ${tipo.toLowerCase()} enviada para aprovação com sucesso!`);
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

  const filteredMovs = useMemo(() => {
    let list = movimentacoes;
    const allowedCodigos = new Set(insumos.map(i => i.codigo));
    list = list.filter(m => allowedCodigos.has(m.codigo));
    return list;
  }, [movimentacoes, insumos]);

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

        {/* Navegação Superior Removida */}
        
        <div className="flex gap-4 border-b border-transparent">
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
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full flex justify-center items-start">
        <div className="w-full max-w-4xl mt-4">
          
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
                NOVA SOLICITAÇÃO
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Responsável identificado automaticamente: <span className="font-semibold text-purple-700">{responsavel}</span>
              </p>
            </div>

            {activeTab === 'NOVA' ? (
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

                  {/* Entrada fields removed */}

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
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Registrando...' : 'Registrar Solicitação'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-0 overflow-x-auto">

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nota Fiscal</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>CD</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Justificativa</TableHead>
                      {userRole === 'OPERACIONAL' && <TableHead className="text-center">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.filter(m => m.status === 'PENDENTE').map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.identificador || 'S/ ID'}</TableCell>
                        <TableCell>{new Date(m.data_hora).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{m.cd.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={m.tipo === 'Entrada' ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-orange-700 border-orange-200 bg-orange-50'}>
                            {m.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="max-w-[200px]" style={{wordBreak: 'break-word'}}>{m.item}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {m.setor || '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">{m.quantidade}</TableCell>
                        <TableCell>{m.usuario}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] text-xs text-zinc-600" style={{wordBreak: 'break-word'}}>
                            {m.observacoes || '-'}
                          </div>
                        </TableCell>
                        {userRole === 'OPERACIONAL' && (
                          <TableCell className="text-center">
                            <Button 
                              size="sm" 
                              variant="default"
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
                        <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                          Nenhuma solicitação pendente encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
