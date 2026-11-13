"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, AlertCircle, Edit2, Trash2, Check, X, ShieldAlert, Download, HardDrive, FileText, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { toast } from "sonner"
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'cds' | 'categorias' | 'backup'>('cds')
  const [cds, setCds] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estatísticas e Gerenciamento de Backup
  const [backupStats, setBackupStats] = useState({ totalFiles: 0, totalBytes: 0, totalMB: '0.00', limitFiles: 500 })
  const [loadingBackup, setLoadingBackup] = useState(false)
  const [confirmDeleteBackupOpen, setConfirmDeleteBackupOpen] = useState(false)
  const [isClearingBackup, setIsClearingBackup] = useState(false)

  // Forms de criação
  const [newCd, setNewCd] = useState({ nome: '', slug: '' })
  const [newCategoria, setNewCategoria] = useState({ nome: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados de Edição
  const [editCdModal, setEditCdModal] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null })
  const [editCdData, setEditCdData] = useState({ nome: '', slug: '' })

  const [editCatModal, setEditCatModal] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null })
  const [editCatData, setEditCatData] = useState({ nome: '' })

  // Estados de Exclusão
  const [itemToDelete, setItemToDelete] = useState<{ type: 'cds' | 'categorias'; id: string; nome: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracoes')
      const data = await res.json()
      if (data.cds) setCds(data.cds)
      if (data.categorias) setCategorias(data.categorias)
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar dados de configurações.')
    } finally {
      setLoading(false)
    }
  }

  const loadBackupStats = async () => {
    setLoadingBackup(true)
    try {
      const res = await fetch('/api/faturas/anexo?action=stats')
      if (res.ok) {
        const data = await res.json()
        setBackupStats(data)
      }
    } catch (e) {
      console.error('Erro ao carregar estatísticas de backup:', e)
    } finally {
      setLoadingBackup(false)
    }
  }

  useEffect(() => {
    loadData()
    loadBackupStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'backup') {
      loadBackupStats()
    }
  }, [activeTab])

  // Limpeza total de arquivos pós-backup
  const handleClearBackup = async () => {
    setIsClearingBackup(true)
    try {
      const res = await fetch('/api/faturas/anexo?action=clear_all', {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir arquivos de anexo.')
      toast.success(data.message || 'Arquivos físicos excluídos e espaço liberado com sucesso!')
      setConfirmDeleteBackupOpen(false)
      await loadBackupStats()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao liberar espaço de anexos.')
    } finally {
      setIsClearingBackup(false)
    }
  }

  // Criar CD
  const handleAddCd = async () => {
    if (!newCd.nome.trim() || !newCd.slug.trim()) {
      toast.error('Preencha o nome e o slug do Centro de Distribuição.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cds', data: newCd })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar CD.')
      toast.success(`CD "${newCd.nome}" adicionado com sucesso!`)
      setNewCd({ nome: '', slug: '' })
      await loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar CD.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Criar Categoria
  const handleAddCategoria = async () => {
    if (!newCategoria.nome.trim()) {
      toast.error('Preencha o nome da categoria.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'categorias', data: newCategoria })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar categoria.')
      toast.success(`Categoria "${newCategoria.nome}" adicionada com sucesso!`)
      setNewCategoria({ nome: '' })
      await loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar categoria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ativar / Desativar
  const handleToggleAtivo = async (type: 'cds' | 'categorias', id: string, currentAtivo: boolean, nome: string) => {
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, data: { ativo: !currentAtivo } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar status.')
      toast.success(`${type === 'cds' ? 'CD' : 'Categoria'} "${nome}" ${!currentAtivo ? 'ativado(a)' : 'desativado(a)'} com sucesso.`)
      await loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar status.')
    }
  }

  // Abrir Modal de Edição de CD
  const handleOpenEditCd = (cd: any) => {
    setEditCdModal({ isOpen: true, item: cd })
    setEditCdData({ nome: cd.nome, slug: cd.slug })
  }

  // Salvar Edição de CD
  const handleSaveEditCd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCdModal.item) return
    if (!editCdData.nome.trim() || !editCdData.slug.trim()) {
      toast.error('Nome e Slug não podem ficar vazios.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cds',
          id: editCdModal.item.id,
          data: { nome: editCdData.nome.trim(), slug: editCdData.slug.trim() }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar CD.')
      toast.success('Centro de Distribuição atualizado com sucesso!')
      setEditCdModal({ isOpen: false, item: null })
      await loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar CD.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Abrir Modal de Edição de Categoria
  const handleOpenEditCat = (cat: any) => {
    setEditCatModal({ isOpen: true, item: cat })
    setEditCatData({ nome: cat.nome })
  }

  // Salvar Edição de Categoria
  const handleSaveEditCat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCatModal.item) return
    if (!editCatData.nome.trim()) {
      toast.error('Nome da categoria não pode ficar vazio.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'categorias',
          id: editCatModal.item.id,
          data: { nome: editCatData.nome.trim() }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar categoria.')
      toast.success('Categoria atualizada com sucesso!')
      setEditCatModal({ isOpen: false, item: null })
      await loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar categoria.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirmar Exclusão com validação de dependências
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/configuracoes?type=${itemToDelete.type}&id=${encodeURIComponent(itemToDelete.id)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir registro.')
      }
      toast.success(data.message || 'Registro excluído com sucesso.')
      setItemToDelete(null)
      await loadData()
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível excluir o registro.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['SUPERADMIN']}>
      <div className="flex flex-col h-full bg-zinc-50 overflow-hidden">
        {/* Modais de Edição */}
        {editCdModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-purple-700" />
                  <h2 className="text-base font-semibold text-zinc-800">Editar Centro de Distribuição</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditCdModal({ isOpen: false, item: null })}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditCd} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 mb-1 block">Nome de Exibição</label>
                  <Input
                    required
                    value={editCdData.nome}
                    onChange={e => setEditCdData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Jundiaí"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 mb-1 block">Slug / Identificador</label>
                  <Input
                    required
                    value={editCdData.slug}
                    onChange={e => setEditCdData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="Ex: jundiai"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditCdModal({ isOpen: false, item: null })}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editCatModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-purple-700" />
                  <h2 className="text-base font-semibold text-zinc-800">Editar Categoria de Insumos</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditCatModal({ isOpen: false, item: null })}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditCat} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 mb-1 block">Nome da Categoria</label>
                  <Input
                    required
                    value={editCatData.nome}
                    onChange={e => setEditCatData({ nome: e.target.value })}
                    placeholder="Ex: Filme Plástico"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditCatModal({ isOpen: false, item: null })}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Exclusão Segura */}
        <ConfirmDeleteModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={`Excluir ${itemToDelete?.type === 'cds' ? 'Centro de Distribuição' : 'Categoria'}`}
          description={`Tem certeza que deseja excluir "${itemToDelete?.nome}"? O sistema verificará automaticamente se existem registros vinculados antes de confirmar a exclusão.`}
        />

        {/* Modal de Confirmação para Excluir Dados do Servidor após Backup */}
        {confirmDeleteBackupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-red-50/70">
                <div className="flex items-center gap-2.5 text-red-700 font-semibold">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Excluir Anexos e Liberar Espaço</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteBackupOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-700 leading-relaxed">
                  Esta ação irá <strong className="text-red-700">excluir definitivamente todos os {backupStats.totalFiles} arquivos físicos</strong> ({backupStats.totalMB} MB) de documentos e comprovantes armazenados no servidor para liberar espaço em disco.
                </p>

                <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Você já baixou o arquivo .ZIP?
                  </p>
                  <p>
                    Certifique-se de ter clicado em <strong>&ldquo;Baixar Backup (.ZIP)&rdquo;</strong> e salvo o arquivo no seu computador antes de prosseguir. Esta ação não poderá ser desfeita.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDeleteBackupOpen(false)}
                  disabled={isClearingBackup}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleClearBackup}
                  disabled={isClearingBackup}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {isClearingBackup ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Excluindo arquivos...
                    </>
                  ) : (
                    'Sim, Excluir e Liberar Espaço'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
              <Settings className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 leading-tight">
                Configurações Globais
              </h1>
              <p className="text-sm text-zinc-500">
                Gerencie os cadastros base do sistema com autonomia administrativa.
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Tabs */}
            <div className="flex gap-4 border-b border-zinc-200">
              <button 
                onClick={() => setActiveTab('cds')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cds' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                Centros de Distribuição ({cds.length})
              </button>
              <button 
                onClick={() => setActiveTab('categorias')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'categorias' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                Categorias de Insumos ({categorias.length})
              </button>
              <button 
                onClick={() => setActiveTab('backup')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'backup' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                <Archive className="w-4 h-4" />
                Backup ({backupStats.totalFiles})
              </button>
            </div>

            {/* CD Content */}
            {activeTab === 'cds' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-800 mb-1">Novo Centro de Distribuição</h2>
                  <p className="text-xs text-zinc-500 mb-4">Adicione uma nova unidade física para controle de estoque e recebimentos.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="text-xs font-medium text-zinc-700 mb-1 block">Nome de Exibição (Ex: Jundiaí)</label>
                      <Input 
                        value={newCd.nome} 
                        onChange={e => {
                          const val = e.target.value;
                          const autoSlug = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
                          setNewCd({ nome: val, slug: autoSlug });
                        }} 
                        placeholder="Digite o nome..." 
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="text-xs font-medium text-zinc-700 mb-1 block">Slug / Rota (Ex: jundiai)</label>
                      <Input 
                        value={newCd.slug} 
                        onChange={e => setNewCd({ ...newCd, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} 
                        placeholder="slug-identificador..." 
                      />
                    </div>
                    <Button 
                      onClick={handleAddCd} 
                      disabled={isSubmitting} 
                      className="bg-purple-700 hover:bg-purple-800 text-white w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Adicionar
                    </Button>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-800 mb-3">CDs Cadastrados</h2>
                  <div className="rounded-lg border border-zinc-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                        <tr>
                          <th className="px-4 py-3">Nome</th>
                          <th className="px-4 py-3">Slug</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {loading ? (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-500">Carregando unidades...</td></tr>
                        ) : cds.length === 0 ? (
                          <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-500">Nenhum Centro de Distribuição cadastrado.</td></tr>
                        ) : cds.map(cd => (
                          <tr key={cd.id} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="px-4 py-3 font-medium text-zinc-900">{cd.nome}</td>
                            <td className="px-4 py-3 font-mono text-xs text-zinc-500">{cd.slug}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cd.ativo ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                {cd.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleOpenEditCd(cd)} 
                                  className="h-8 px-2 text-zinc-600 hover:text-purple-700 hover:bg-purple-50"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleToggleAtivo('cds', cd.id, cd.ativo, cd.nome)} 
                                  className={`h-8 px-2.5 text-xs ${cd.ativo ? 'text-zinc-600 hover:text-amber-700' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
                                >
                                  {cd.ativo ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setItemToDelete({ type: 'cds', id: cd.id, nome: cd.nome })} 
                                  className="h-8 px-2 text-zinc-400 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Categorias Content */}
            {activeTab === 'categorias' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-800 mb-1">Nova Categoria de Insumos</h2>
                  <p className="text-xs text-zinc-500 mb-4">Adicione uma nova categoria para classificação de materiais nos estoques e faturas.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="text-xs font-medium text-zinc-700 mb-1 block">Nome da Categoria</label>
                      <Input 
                        value={newCategoria.nome} 
                        onChange={e => setNewCategoria({ nome: e.target.value })} 
                        placeholder="Ex: Fita Adesiva, Filme Plástico..." 
                      />
                    </div>
                    <Button 
                      onClick={handleAddCategoria} 
                      disabled={isSubmitting} 
                      className="bg-purple-700 hover:bg-purple-800 text-white w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Adicionar
                    </Button>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-800 mb-3">Categorias Cadastradas</h2>
                  <div className="rounded-lg border border-zinc-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                        <tr>
                          <th className="px-4 py-3">Nome da Categoria</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {loading ? (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">Carregando categorias...</td></tr>
                        ) : categorias.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">Nenhuma categoria cadastrada.</td></tr>
                        ) : categorias.map(cat => (
                          <tr key={cat.id} className="hover:bg-zinc-50/70 transition-colors">
                            <td className="px-4 py-3 font-medium text-zinc-900">{cat.nome}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.ativo ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                {cat.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleOpenEditCat(cat)} 
                                  className="h-8 px-2 text-zinc-600 hover:text-purple-700 hover:bg-purple-50"
                                  title="Editar"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleToggleAtivo('categorias', cat.id, cat.ativo, cat.nome)} 
                                  className={`h-8 px-2.5 text-xs ${cat.ativo ? 'text-zinc-600 hover:text-amber-700' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
                                >
                                  {cat.ativo ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setItemToDelete({ type: 'categorias', id: cat.id, nome: cat.nome })} 
                                  className="h-8 px-2 text-zinc-400 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Content */}
            {activeTab === 'backup' && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                      <Archive className="w-5 h-5 text-purple-700" />
                      Backup e Gerenciamento de Anexos
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Baixe todos os documentos anexados (NFs, boletos e comprovantes) em um arquivo consolidado .ZIP e libere espaço com segurança.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadBackupStats}
                    disabled={loadingBackup}
                    className="text-xs text-zinc-600 hover:text-purple-700 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingBackup ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>

                {/* Card da Barra de Progresso do Limite de Armazenamento */}
                <div className="p-5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-purple-900">
                        Uso de Armazenamento Local
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-zinc-900">
                          {backupStats.totalFiles}
                        </span>
                        <span className="text-sm font-medium text-zinc-500">
                          / {backupStats.limitFiles || 500} documentos cadastrados
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs font-medium text-zinc-500 block">Tamanho Total em Disco</span>
                      <span className="text-lg font-bold text-purple-950 font-mono">
                        {backupStats.totalMB} MB
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-zinc-200/80 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (backupStats.totalFiles / (backupStats.limitFiles || 500)) >= 0.85
                            ? 'bg-rose-500'
                            : (backupStats.totalFiles / (backupStats.limitFiles || 500)) >= 0.60
                            ? 'bg-amber-500'
                            : 'bg-purple-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(backupStats.totalFiles > 0 ? 3 : 0, Math.round((backupStats.totalFiles / (backupStats.limitFiles || 500)) * 100)))}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>
                        {Math.round((backupStats.totalFiles / (backupStats.limitFiles || 500)) * 100)}% da capacidade sugerida utilizada
                      </span>
                      <span>Limite sugerido: {backupStats.limitFiles || 500} arquivos</span>
                    </div>
                  </div>

                  {/* Dica / Alerta situacional */}
                  <div className="flex items-start gap-2.5 pt-1 text-xs">
                    <div className="mt-0.5">
                      {backupStats.totalFiles === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (backupStats.totalFiles / (backupStats.limitFiles || 500)) >= 0.85 ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <HardDrive className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-zinc-600 leading-relaxed">
                      {backupStats.totalFiles === 0 ? (
                        <span>Nenhum documento armazenado no momento. Espaço 100% liberado.</span>
                      ) : (backupStats.totalFiles / (backupStats.limitFiles || 500)) >= 0.85 ? (
                        <span className="text-rose-700 font-medium">
                          Você está próximo do limite sugerido de 500 arquivos. Recomendamos baixar o arquivo .ZIP para seu computador e em seguida excluir os dados para liberar espaço.
                        </span>
                      ) : (
                        <span>
                          Recomenda-se realizar o backup periódico clicando em <strong>Baixar Backup (.ZIP)</strong>. Após salvar o arquivo compactado em seu computador, você pode utilizar o botão <strong>Excluir Dados do Servidor</strong> para manter o sistema leve.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação lado a lado */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    onClick={() => {
                      if (backupStats.totalFiles === 0) {
                        toast.error('Não há arquivos armazenados para realizar backup.');
                        return;
                      }
                      window.open('/api/faturas/anexo?action=backup_zip', '_blank');
                      toast.success('Download do backup consolidado (.ZIP) iniciado!');
                    }}
                    disabled={backupStats.totalFiles === 0}
                    className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white font-semibold flex items-center justify-center gap-2 h-10 px-5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Backup (.ZIP)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (backupStats.totalFiles === 0) {
                        toast.error('Nenhum arquivo para excluir no momento.');
                        return;
                      }
                      setConfirmDeleteBackupOpen(true);
                    }}
                    disabled={backupStats.totalFiles === 0}
                    className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-semibold flex items-center justify-center gap-2 h-10 px-5"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    Excluir Dados do Servidor
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
