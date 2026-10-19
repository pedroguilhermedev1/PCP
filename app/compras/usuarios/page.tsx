"use client"

import { useState, useEffect, useMemo } from "react"
import { Shield, Plus, Edit2, Trash2, Users, Search, CheckCircle2, XCircle, Key, Building2, UserCheck, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Usuario {
  id: string
  username: string
  nome_completo: string | null
  role: 'SUPERADMIN' | 'ADMIN' | 'LIDERANCA' | 'OPERACIONAL' | 'REPORTS'
  cd_slug: string | null
  ativo: boolean
  created_at?: string
}

const ROLES_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN - Acesso total a Compras, Faturas, Estoque e Relatórios' },
  { value: 'SUPERADMIN', label: 'SUPERADMIN - Acesso irrestrito + Gestão de Acessos e Configurações' },
  { value: 'LIDERANCA', label: 'LIDERANCA - Visão Executiva e Painéis de Faturas / Relatórios' },
  { value: 'OPERACIONAL', label: 'OPERACIONAL - Formulários do CD e Insumos da Unidade' },
  { value: 'REPORTS', label: 'REPORTS - Acesso exclusivo a Relatórios Analíticos' }
]

const CD_OPTIONS = [
  { value: '', label: 'Global (Todas as Unidades)' },
  { value: 'fortaleza', label: 'Fortaleza' },
  { value: 'jundiai', label: 'Jundiaí' },
  { value: 'nse', label: 'NSE' },
  { value: 'psd', label: 'PSD' },
  { value: 'coc', label: 'COC' },
  { value: 'curitiba', label: 'Curitiba' },
  { value: 'raizes', label: 'Raízes' },
  { value: 'ribeirao-preto', label: 'Ribeirão Preto' }
]

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Novo Usuário
  const [formData, setFormData] = useState({
    nome_completo: '',
    username: '',
    role: 'ADMIN',
    cd_slug: ''
  })

  // Form Edição
  const [editFormData, setEditFormData] = useState({
    nome_completo: '',
    role: 'ADMIN',
    cd_slug: '',
    ativo: true
  })

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const handleOpenNewModal = () => {
    setFormData({
      nome_completo: '',
      username: '',
      role: 'ADMIN',
      cd_slug: ''
    })
    setIsNewModalOpen(true)
  }

  const handleOpenEditModal = (user: Usuario) => {
    setUserToEdit(user)
    setEditFormData({
      nome_completo: user.nome_completo || '',
      role: user.role,
      cd_slug: user.cd_slug || '',
      ativo: user.ativo
    })
    setIsEditModalOpen(true)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim()) {
      toast.error('Informe o nome de usuário (login)')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim().toLowerCase(),
          nome_completo: formData.nome_completo.trim() || null,
          role: formData.role,
          cd_slug: formData.cd_slug ? formData.cd_slug.toLowerCase() : null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário')

      toast.success(`Usuário ${formData.username.trim().toLowerCase()} criado com sucesso!`)
      setIsNewModalOpen(false)
      fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/usuarios?id=${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: editFormData.nome_completo.trim() || null,
          role: editFormData.role,
          cd_slug: editFormData.cd_slug ? editFormData.cd_slug.toLowerCase() : null,
          ativo: editFormData.ativo
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar usuário')

      toast.success('Usuário atualizado com sucesso!')
      setIsEditModalOpen(false)
      fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAtivo = async (id: string, currentAtivo: boolean) => {
    try {
      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !currentAtivo })
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      toast.success(currentAtivo ? 'Usuário inativado!' : 'Usuário ativado!')
      fetchUsuarios()
    } catch (e) {
      toast.error('Erro ao atualizar status do usuário')
    }
  }

  const handleDeleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) return

    try {
      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success(`Usuário ${username} excluído com sucesso!`)
      fetchUsuarios()
    } catch (e) {
      toast.error('Erro ao excluir usuário')
    }
  }

  // Sugerir login baseado no nome
  const handleNomeCompletoChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, nome_completo: val }
      // Sugere username se estiver vazio ou se foi sugerido antes
      if (!prev.username || prev.username === prev.nome_completo.trim().toLowerCase().replace(/\s+/g, '.')) {
        const parts = val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/)
        if (parts.length >= 2) {
          updated.username = `${parts[0]}.${parts[parts.length - 1]}`
        } else if (parts.length === 1 && parts[0]) {
          updated.username = parts[0]
        }
      }
      return updated
    })
  }

  // Filtragem
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u => {
      const matchesSearch = 
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.nome_completo && u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesRole = filterRole === 'ALL' || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [usuarios, searchTerm, filterRole])

  return (
    <div className="flex-1 overflow-auto bg-zinc-50/50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              Gestão de Acessos e Permissões
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Cadastre e gerencie os usuários do sistema, cargos e acessos às filiais sem depender de alterações no código.
            </p>
          </div>
          <Button 
            onClick={handleOpenNewModal}
            className="bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-500/20 px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              type="text"
              placeholder="Buscar por nome ou login..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-50 border-zinc-200 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-medium text-zinc-500">Filtrar Cargo:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">Todos os Cargos</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="LIDERANCA">LIDERANCA</option>
              <option value="OPERACIONAL">OPERACIONAL</option>
              <option value="REPORTS">REPORTS</option>
            </select>
            <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold">
              {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuário' : 'usuários'}
            </div>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuário / Nome</th>
                  <th className="px-6 py-4">Cargo (Role)</th>
                  <th className="px-6 py-4">CD Alocado</th>
                  <th className="px-6 py-4">Senha Padrão</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent mb-2" />
                      <div>Carregando usuários...</div>
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          {u.username}
                        </div>
                        <div className="text-xs text-zinc-500 font-normal">{u.nome_completo || 'Nome não preenchido'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'SUPERADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          u.role === 'LIDERANCA' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          u.role === 'REPORTS' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          'bg-zinc-100 text-zinc-800 border border-zinc-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap uppercase font-medium text-zinc-700">
                        {u.cd_slug ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            {u.cd_slug}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-normal">Global</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400 font-mono">
                        {u.username}@2026
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.ativo 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {u.ativo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEditModal(u)}
                          className="text-zinc-600 hover:text-purple-700 hover:bg-purple-50 h-8 px-2"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleAtivo(u.id, u.ativo)}
                          className={u.ativo ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 px-2" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2"}
                          title={u.ativo ? 'Inativar acesso' : 'Ativar acesso'}
                        >
                          {u.ativo ? 'Inativar' : 'Ativar'}
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal: Novo Usuário */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Novo Usuário</h2>
                  <p className="text-xs text-zinc-500">Cadastre um novo membro com acesso ao sistema</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Nome Completo
                </label>
                <Input 
                  type="text"
                  placeholder="Ex: Vando Sousa"
                  value={formData.nome_completo}
                  onChange={(e) => handleNomeCompletoChange(e.target.value)}
                  className="bg-zinc-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Usuário / Login (ex: vando.sousa)
                </label>
                <Input 
                  type="text"
                  placeholder="Ex: vando.sousa"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  className="bg-zinc-50 font-mono text-sm"
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Recomendado: formato <code className="text-purple-600 font-semibold">nome.sobrenome</code> sem acentos e em minúsculas.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Cargo / Nível de Acesso (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ROLES_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Centro de Distribuição Alocado (Filial)
                </label>
                <select
                  value={formData.cd_slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, cd_slug: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Usuários do operacional ficam restritos ao CD selecionado. Admins possuem visão global.
                </p>
              </div>

              {/* Informação sobre Senha Padrão */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3">
                <Key className="w-4 h-4 text-purple-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-purple-900 leading-relaxed">
                  <span className="font-semibold">Senha padrão definida: </span>
                  <code className="bg-purple-200/60 text-purple-950 px-1.5 py-0.5 rounded font-mono font-bold">
                    {formData.username.trim() ? `${formData.username.trim()}@2026` : 'login@2026'}
                  </code>
                  <p className="text-purple-700 mt-0.5">
                    O novo usuário poderá acessar o PCP Hub imediatamente usando este login e senha padrão.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-700 hover:bg-purple-800 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {isEditModalOpen && userToEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">Editar Usuário</h2>
                  <p className="text-xs text-zinc-500">Alterando dados de <span className="font-semibold text-purple-700">{userToEdit.username}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Nome Completo
                </label>
                <Input 
                  type="text"
                  placeholder="Nome Completo"
                  value={editFormData.nome_completo}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                  className="bg-zinc-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Cargo / Nível de Acesso (Role)
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ROLES_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Centro de Distribuição Alocado (Filial)
                </label>
                <select
                  value={editFormData.cd_slug}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, cd_slug: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Status da Conta
                </label>
                <select
                  value={editFormData.ativo ? 'true' : 'false'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, ativo: e.target.value === 'true' }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="true">Ativo (Acesso Liberado)</option>
                  <option value="false">Inativo (Acesso Bloqueado)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
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

    </div>
  )
}
