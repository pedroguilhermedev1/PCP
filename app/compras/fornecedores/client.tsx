"use client";

import { Box, Plus, Briefcase, Trash2, Edit, X, Search, Building2, Handshake } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFornecedores } from "@/hooks/useFornecedores";
import { formatCNPJ } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function FornecedorModal({ 
  isOpen, 
  onClose, 
  tipo,
  editItem,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void;
  tipo: 'Material' | 'Serviço';
  editItem?: any | null;
  onSave: (fornecedor: any, isEdit: boolean) => Promise<void>;
}) {

  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [contato, setContato] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [categoria, setCategoria] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [codigoFornecedor, setCodigoFornecedor] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setCnpj(editItem.cnpj || "");
        setRazaoSocial(editItem.razao_social || "");
        setNomeFantasia(editItem.nome_fantasia || "");
        setContato(editItem.contato || "");
        setTelefone(editItem.telefone || "");
        setEmail(editItem.email || "");
        setCategoria(editItem.categoria || "");
        setObservacoes(editItem.observacoes || "");
        setCodigoFornecedor(editItem.codigo_fornecedor || "");
      } else {
        setCnpj("");
        setRazaoSocial("");
        setNomeFantasia("");
        setContato("");
        setTelefone("");
        setEmail("");
        setCategoria("");
        setObservacoes("");
        setCodigoFornecedor("");
      }
    }
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      cnpj,
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      contato,
      telefone,
      email,
      categoria,
      observacoes,
      tipo,
      codigo_fornecedor: codigoFornecedor
    };

    try {
      if (editItem) {
        await onSave({ ...payload, id: editItem.id }, true);
        toast.success("Registro atualizado com sucesso.");
      } else {
        await onSave(payload, false);
        toast.success("Registro salvo com sucesso.");
      }
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar fornecedor.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-zinc-800">{editItem ? 'Editar' : 'Novo'} Fornecedor - {tipo}</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">CNPJ <span className="text-red-500">*</span></label>
              <Input required value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Razão Social <span className="text-red-500">*</span></label>
              <Input required value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Nome Fantasia</label>
              <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Tipo de Serviço</label>
              <Input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ex: Limpeza, Gráfica, TI..." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Cód. Fornecedor</label>
              <Input value={codigoFornecedor} onChange={e => setCodigoFornecedor(e.target.value)} placeholder="Ex: 000100" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Nome do Contato</label>
              <Input value={contato} onChange={e => setContato(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Telefone / WhatsApp</label>
              <Input value={telefone} onChange={e => setTelefone(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">E-mail</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Observações</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 resize-y"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Detalhes adicionais, forma de pagamento preferida..."
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3 justify-end border-t border-zinc-100 pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white">
              Salvar Fornecedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FornecedoresClient({ tipo }: { tipo: 'Material' | 'Serviço' }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { fornecedores, deleteFornecedor, addFornecedor, updateFornecedor } = useFornecedores(tipo);
  
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson') || currentUser.startsWith('debora.mota');

  const filteredFornecedores = useMemo(() => {
    if (!searchTerm) {
      return [...fornecedores].sort((a, b) => a.razao_social.localeCompare(b.razao_social));
    }
    const lowerSearch = searchTerm.toLowerCase();
    const list = fornecedores.filter(f => 
      f.razao_social.toLowerCase().includes(lowerSearch) ||
      f.nome_fantasia?.toLowerCase().includes(lowerSearch) ||
      f.cnpj.includes(searchTerm)
    );
    return list.sort((a, b) => {
      const aStartsWith = a.razao_social.toLowerCase().startsWith(lowerSearch) || a.nome_fantasia?.toLowerCase().startsWith(lowerSearch);
      const bStartsWith = b.razao_social.toLowerCase().startsWith(lowerSearch) || b.nome_fantasia?.toLowerCase().startsWith(lowerSearch);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return a.razao_social.localeCompare(b.razao_social);
    });
  }, [fornecedores, searchTerm]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteFornecedor(itemToDelete);
            toast.success("Fornecedor excluído com sucesso.");
          }
        }}
      />
      <FornecedorModal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }} 
        tipo={tipo} 
        editItem={editItem}
        onSave={async (fornecedor, isEdit) => {
          if (isEdit) {
            await updateFornecedor(fornecedor.id, fornecedor);
          } else {
            const isDuplicate = fornecedores.some(f => 
              f.cnpj === fornecedor.cnpj && 
              f.razao_social.toLowerCase() === fornecedor.razao_social.toLowerCase()
            );
            if (isDuplicate) {
              toast.error("Fornecedor já cadastrado com os mesmos dados exatos (CNPJ e Razão Social).");
              throw new Error("Duplicate");
            }
            await addFornecedor(fornecedor);
          }
        }}
      />
      
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <Handshake className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Fornecedores - {tipo === 'Material' ? 'Materiais' : 'Serviços'}</h1>
            <p className="text-sm text-zinc-500">Gestão do cadastro de fornecedores.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <div className="w-full min-h-[400px]">
          <div className="pb-4 mb-4 border-b border-zinc-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                placeholder="Buscar por razão social, nome fantasia ou CNPJ..." 
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              className="bg-purple-700 hover:bg-purple-800 text-white"
              onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              NOVO FORNECEDOR
            </Button>
          </div>

          <div className="overflow-x-auto w-full">
            <Table className="w-full bg-white/40 backdrop-blur-sm rounded-xl">
              <TableHeader className="bg-zinc-50/80 border-b border-zinc-200">
                <TableRow className="border-zinc-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Empresa</TableHead>
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Contato</TableHead>
                  <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Tipo de Serviço</TableHead>
                  {canEditOrDelete && (
                    <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12 text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFornecedores.length > 0 ? (
                  filteredFornecedores.map((forn) => (
                    <TableRow key={forn.id} className="border-b border-zinc-100 hover:bg-purple-50/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-zinc-900">{forn.nome_fantasia || forn.razao_social}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{forn.cnpj}</div>
                        {forn.nome_fantasia && (
                          <div className="text-xs text-zinc-400 mt-0.5">{forn.razao_social}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {forn.contato && <div className="font-medium">{forn.contato}</div>}
                        {forn.telefone && <div className="text-xs">{forn.telefone}</div>}
                        {forn.email && <div className="text-xs">{forn.email}</div>}
                        {!forn.contato && !forn.telefone && !forn.email && <span className="text-zinc-400">-</span>}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {forn.categoria || '-'}
                      </TableCell>
                      {canEditOrDelete && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                              onClick={() => {
                                setEditItem(forn);
                                setModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                              onClick={() => setItemToDelete(forn.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canEditOrDelete ? 4 : 3} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                        <Building2 className="w-10 h-10 text-zinc-300 mb-2" />
                        <p className="font-medium text-zinc-900">Nenhum fornecedor encontrado</p>
                        <p className="text-sm">Cadastre novos fornecedores de {tipo.toLowerCase()} para visualizar os registros aqui.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
