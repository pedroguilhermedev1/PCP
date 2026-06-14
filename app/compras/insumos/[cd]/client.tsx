"use client";

import { Box, Plus, LogIn, LogOut, Trash2, Edit, X, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInsumosMovimentacoes } from "@/hooks/useInsumos";
import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EstoqueInsumosTable } from "@/components/estoque/EstoqueInsumosTable";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

const cd_marcas_map: Record<string, string[]> = {
  fortaleza: ['SAS', 'SAE', 'IS'],
  jundiai: ['SAS', 'SAE', 'IS'],
  nse: ['EI', 'Pleno', 'MM', 'GF'],
  curitiba: ['PSD', 'Positivo'],
  'ribeirao-preto': ['COC'],
  raizes: ['Geekie', 'Nave']
};

const cd_names_map: Record<string, string> = {
  fortaleza: 'Fortaleza',
  jundiai: 'Jundiaí',
  nse: 'NSE',
  curitiba: 'Curitiba',
  'ribeirao-preto': 'Ribeirão Preto',
  raizes: 'Raízes'
};

function NovaMovimentacaoModal({ 
  isOpen, 
  onClose, 
  tipo,
  marca,
  cd,
  responsavel,
  editItem,
  insumos,
  refetch,
  refreshMovs
}: { 
  isOpen: boolean; 
  onClose: () => void;
  tipo: 'Entrada' | 'Saída';
  marca: string;
  cd: string;
  responsavel: string;
  editItem?: any | null;
  insumos: any[];
  refetch: () => void;
  refreshMovs: () => void;
  tipoEnvio: string;
}) {

  const [item, setItem] = useState("");
  const [codigo, setCodigo] = useState("");
  const [quantidade, setQuantidade] = useState<number | "">("");
  const [setor, setSetor] = useState("");
  const [solicitante, setSolicitante] = useState(responsavel);
  const [justificativa, setJustificativa] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setItem(editItem.item || "");
        setCodigo(editItem.codigo || "");
        setQuantidade(editItem.quantidade || "");
        setSetor(editItem.setor || "");
        setSolicitante(editItem.solicitante || responsavel);
        setJustificativa(editItem.justificativa || "");
      } else {
        setItem("");
        setCodigo("");
        setQuantidade("");
        setSetor("");
        setSolicitante(responsavel);
        setJustificativa("");
      }
      setErrorMsg("");
    }
  }, [isOpen, editItem, responsavel]);

  const setoresBase = ["Expedição", "CIQ", "Estoque", "Recebimento", "PMM"];
  const isPrivileged = responsavel.startsWith('pedro.queiroz') || responsavel.startsWith('francisco.edson');
  const setores = isPrivileged ? [...setoresBase, "Ajuste de Inventário"] : setoresBase;

  useEffect(() => {
    if (editItem && item === editItem.item && codigo === editItem.codigo) return;
    const selected = insumos.find(i => i.item === item);
    if (selected) {
      setCodigo(selected.codigo);
    } else {
      setCodigo("");
    }
  }, [item, insumos, editItem, codigo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg("");
    setIsSubmitting(true);
    
    if (!item || !quantidade) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    const selectedItemData = insumos.find(i => i.item === item);
    const estoqueReal = selectedItemData ? selectedItemData.estoque_real : 0;

    if (tipo === 'Saída' && Number(quantidade) > estoqueReal) {
      setErrorMsg(`Quantidade indisponível. O estoque atual é de apenas ${estoqueReal} unidade(s).`);
      setIsSubmitting(false);
      return;
    }

    if (tipo === 'Saída' && (!setor || !justificativa || !solicitante)) {
      setErrorMsg("Para saídas, preencha setor responsável, solicitante e justificativa.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          codigo,
          item,
          cd,
          empresa: marca,
          quantidade: Number(quantidade),
          usuario: responsavel,
          setor: tipo === 'Saída' ? setor : undefined,
          observacoes: tipo === 'Saída' ? justificativa : undefined,
          tipo_envio: tipoEnvio
        })
      });

      if (!res.ok) throw new Error("Erro da API");

      toast.success("Solicitação enviada para aprovação.");

      if (refetch) refetch();
      if (refreshMovs) refreshMovs();

      setItem("");
      setCodigo("");
      setQuantidade("");
      setSetor("");
      setSolicitante("");
      setJustificativa("");
      
      onClose();
    } catch (e) {
      setErrorMsg("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-zinc-800">{editItem ? 'Editar' : 'Nova'} {tipo} - {marca.toUpperCase()}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-sm font-medium text-zinc-700">Item / Material <span className="text-red-500">*</span></label>
              <select 
                required
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="" disabled>Selecione um item...</option>
                {insumos.map(mat => (
                  <option key={mat.id} value={mat.item}>{mat.item}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Código</label>
              <Input disabled value={codigo} placeholder="Automático" className="bg-zinc-50" />
            </div>

            {tipo === 'Saída' && (
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-sm font-medium text-zinc-700">Estoque Atual</label>
                <div className="flex h-10 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500 items-center font-bold">
                  {item ? (insumos.find(i => i.item === item)?.estoque_real || 0) : "-"}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-zinc-700">Quantidade <span className="text-red-500">*</span></label>
              <Input required type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value ? Number(e.target.value) : "")} />
            </div>
          </div>

          {tipo === 'Saída' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">Setor Responsável <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    value={setor} 
                    onChange={e => setSetor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="" disabled>Selecione...</option>
                    {setores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700">Solicitante</label>
                  <Input disabled value={solicitante} className="bg-zinc-50" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">Justificativa <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 resize-y"
                  value={justificativa}
                  onChange={e => setJustificativa(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="mt-4 flex gap-3 justify-end border-t border-zinc-100 pt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : `Registrar ${tipo}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InsumosModuleClient({ cd }: { cd: string }) {
  const marcas = cd_marcas_map[cd] || [];
  const [activeMarca, setActiveMarca] = useState(marcas[0] || '');
  const [activeTab, setActiveTab] = useState<'insumos' | 'entradas' | 'saidas'>('insumos');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'Entrada' | 'Saída'>('Entrada');
  const [editItem, setEditItem] = useState<any | null>(null);
  const [activeTipoEnvio, setActiveTipoEnvio] = useState<'Principal' | 'Complementar'>('Principal');
  
  const { movimentacoes, refresh } = useInsumosMovimentacoes(cd, activeTipoEnvio);
  // Movimentacoes right now are fetched just by cd. We need to filter them by marca (empresa) locally if we want, or adjust useInsumosMovimentacoes.
  // Actually, we can just filter by insumos list below.
  
  const { insumos, loading, error, refetch } = useEstoqueInsumos(cd, activeMarca, activeTipoEnvio);
  
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson');

  const cdName = cd_names_map[cd] || cd.toUpperCase();

  const filteredMovs = useMemo(() => {
    let list = movimentacoes;
    // Filter by marca matching the insumos currently listed for this marca
    const allowedCodigos = new Set(insumos.map(i => i.codigo));
    list = list.filter(m => allowedCodigos.has(m.codigo));

    if (activeTab === 'entradas') return list.filter(m => m.tipo === 'Entrada').reverse();
    if (activeTab === 'saidas') return list.filter(m => m.tipo === 'Saída').reverse();
    return list;
  }, [movimentacoes, activeTab, insumos]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <NovaMovimentacaoModal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }} 
        tipo={modalTipo} 
        marca={activeMarca} 
        cd={cd}
        responsavel={currentUser || 'Usuário Indefinido'} 
        editItem={editItem}
        insumos={insumos}
        refetch={refetch}
        refreshMovs={refresh}
        tipoEnvio={activeTipoEnvio}
      />
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-2 rounded-lg text-purple-900">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Insumos - CD {cdName}</h1>
            <p className="text-sm text-zinc-500">Gestão de materiais e insumos gerais.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {/* Navegação Superior de Marcas */}
        {marcas.length > 0 && (
          <div className="mb-6 flex gap-2">
            {marcas.map(marca => (
              <Button 
                key={marca}
                variant={activeMarca === marca ? "default" : "outline"}
                className={activeMarca === marca ? "bg-purple-700 hover:bg-purple-800 text-white" : "text-zinc-600 hover:text-purple-700 border-zinc-200"}
                onClick={() => setActiveMarca(marca)}
              >
                {marca.toUpperCase()}
              </Button>
            ))}
          </div>
        )}

        {/* Filtro Principal vs Complementar e Tabs Internas */}
        <div className="mb-6 border-b border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('insumos')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'insumos'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                Insumos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('entradas')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'entradas'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Entradas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('saidas')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'saidas'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Saídas
              </div>
            </button>
            </div>

            {/* Filtro Tipo de Envio */}
            <div className="flex bg-zinc-100 p-1 rounded-lg self-start sm:mb-2">
              <button
                onClick={() => setActiveTipoEnvio('Principal')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTipoEnvio === 'Principal' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Principal
              </button>
              <button
                onClick={() => setActiveTipoEnvio('Complementar')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTipoEnvio === 'Complementar' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Complementar
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo de cada Tab */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900">
            {activeTab === 'insumos' && `Insumos em Estoque - ${activeMarca}`}
            {activeTab === 'entradas' && `Registro de Entradas - ${activeMarca}`}
            {activeTab === 'saidas' && `Registro de Saídas - ${activeMarca}`}
          </h2>
          {activeTab !== 'insumos' && (
            <Button onClick={() => {
              setModalTipo(activeTab === 'entradas' ? 'Entrada' : 'Saída');
              setModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'entradas' && 'Nova Entrada'}
              {activeTab === 'saidas' && 'Nova Saída'}
            </Button>
          )}
        </div>
        
        {activeTab === 'insumos' ? (
          <EstoqueInsumosTable marca={activeMarca.toLowerCase()} insumos={insumos} loading={loading} error={error} refetch={refetch} />
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-4">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID Mov.</th>
                    <th className="px-6 py-4 font-semibold">Data / Hora</th>
                    <th className="px-6 py-4 font-semibold">Código</th>
                    <th className="px-6 py-4 font-semibold">Item</th>
                    <th className="px-6 py-4 font-semibold text-center">Qtd</th>
                    {activeTab === 'saidas' && (
                      <th className="px-6 py-4 font-semibold">Setor</th>
                    )}
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Responsável</th>
                    {activeTab === 'saidas' && (
                      <>
                        <th className="px-6 py-4 font-semibold">Solicitante</th>
                        <th className="px-6 py-4 font-semibold">Justificativa</th>
                      </>
                    )}
                    {canEditOrDelete && (
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredMovs.length > 0 ? (
                    filteredMovs.map(mov => (
                      <tr key={mov.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-zinc-700">
                          {mov.codigo_movimentacao || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                          {format(new Date(mov.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-600">
                          {mov.codigo || '-'}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">
                          {mov.item}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="secondary" className="font-bold text-sm bg-zinc-100 text-zinc-800">
                            {mov.quantidade}
                          </Badge>
                        </td>
                        {activeTab === 'saidas' && (
                          <td className="px-6 py-4 text-zinc-600">
                            {mov.setor}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <Badge className={
                            mov.status === 'CONFIRMADO' ? 'bg-green-600' :
                            mov.status === 'REJEITADO' ? 'bg-red-600' : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }>
                            {mov.status || 'CONFIRMADO'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          {mov.usuario}
                        </td>
                        {activeTab === 'saidas' && (
                          <>
                            <td className="px-6 py-4 text-zinc-600">
                              {'-'}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 max-w-[150px] truncate" title={mov.observacoes}>
                              {mov.observacoes || '-'}
                            </td>
                          </>
                        )}
                        {canEditOrDelete && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Não permite editar nem excluir registros imutáveis */}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeTab === 'entradas' ? (canEditOrDelete ? 7 : 6) : (canEditOrDelete ? 10 : 9)} className="px-6 py-12 text-center text-zinc-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {activeTab === 'entradas' ? <LogIn className="w-8 h-8 text-zinc-300" /> : <LogOut className="w-8 h-8 text-zinc-300" />}
                          <p>Nenhum registro de {activeTab} encontrado.</p>
                          <p className="text-xs">As solicitações feitas na aba Formulários aparecerão aqui.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
