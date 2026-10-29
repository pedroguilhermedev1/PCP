"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Users,
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Building2, 
  UserCheck, 
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock
} from "lucide-react"
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
  has_custom_password?: boolean
  created_at?: string
  updated_at?: string
}

const ROLES_OPTIONS = [
  { value: 'ADMIN', label: 'Admin - Acesso a Compras, Faturas, Estoque e Relatórios' },
  { value: 'SUPERADMIN', label: 'Super Admin - Acesso irrestrito + Gestão de Acessos e Configurações' },
  { value: 'LIDERANCA', label: 'Liderança Operacional - Visão Executiva e Painéis de Faturas / Relatórios' },
  { value: 'OPERACIONAL', label: 'Operacional - Formulários do CD e Insumos da Unidade' },
  { value: 'REPORTS', label: 'Reports - Acesso exclusivo a Relatórios Analíticos' }
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
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Controle de visibilidade de senha
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)

  // Form Novo Usuário
  const [formData, setFormData] = useState({
    nome_completo: '',
    username: '',
    password: '',
    role: 'ADMIN',
    cd_slug: ''
  })

  // Form Edição
  const [editFormData, setEditFormData] = useState({
    nome_completo: '',
    username: '',
    password: '',
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
      password: '',
      role: 'ADMIN',
      cd_slug: ''
    })
    setShowNewPassword(false)
    setIsNewModalOpen(true)
  }

  const handleOpenEditModal = (user: Usuario) => {
    setUserToEdit(user)
    setEditFormData({
      nome_completo: user.nome_completo || '',
      username: user.username,
      password: '',
      role: user.role,
      cd_slug: user.cd_slug || '',
      ativo: user.ativo
    })
    setShowEditPassword(false)
    setIsEditModalOpen(true)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim()) {
      toast.error('Informe o login de acesso')
      return
    }
    if (!formData.password.trim()) {
      toast.error('Informe a senha inicial do usuário')
      return
    }
    if (formData.password.trim().length < 4) {
      toast.error('A senha deve ter no mínimo 4 caracteres')
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
          password: formData.password.trim(),
          role: formData.role,
          cd_slug: formData.cd_slug ? formData.cd_slug.toLowerCase() : null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário')

      toast.success(`Usuário ${formData.username.trim().toLowerCase()} criado com sucesso!`)
      setIsNewModalOpen(false)
      await fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return

    if (!editFormData.username.trim()) {
      toast.error('O login de acesso não pode ficar vazio')
      return
    }

    if (editFormData.password.trim() && editFormData.password.trim().length < 4) {
      toast.error('A nova senha deve ter no mínimo 4 caracteres')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        nome_completo: editFormData.nome_completo.trim() || null,
        username: editFormData.username.trim().toLowerCase(),
        role: editFormData.role,
        cd_slug: editFormData.cd_slug ? editFormData.cd_slug.toLowerCase() : null,
        ativo: editFormData.ativo
      }

      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim()
      }

      const res = await fetch(`/api/usuarios?id=${encodeURIComponent(userToEdit.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar usuário')

      // Se o usuário logado editou a própria conta, atualiza localStorage
      const currentUser = typeof window !== 'undefined' ? localStorage.getItem('pcp_user') : null
      if (currentUser && currentUser.toLowerCase() === userToEdit.username.toLowerCase()) {
        localStorage.setItem('pcp_user', payload.username)
        localStorage.setItem('pcp_role', payload.role)
        if (payload.nome_completo) localStorage.setItem('pcp_name', payload.nome_completo)
        if (payload.cd_slug) localStorage.setItem('pcp_cd', payload.cd_slug)
      }

      toast.success('Usuário atualizado com sucesso!')
      setIsEditModalOpen(false)
      await fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAtivo = async (user: Usuario) => {
    const currentUser = typeof window !== 'undefined' ? localStorage.getItem('pcp_user') : null
    if (currentUser && currentUser.toLowerCase() === user.username.toLowerCase()) {
      toast.error('Você não pode inativar seu próprio usuário.')
      return
    }
    if (user.username.toLowerCase() === 'pedro.queiroz') {
      toast.error('O Super Admin principal não pode ser inativado.')
      return
    }

    try {
      const res = await fetch(`/api/usuarios?id=${encodeURIComponent(user.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !user.ativo })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar status')

      toast.success(user.ativo ? `Usuário ${user.username} inativado com sucesso!` : `Usuário ${user.username} ativado com sucesso!`)
      await fetchUsuarios()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar status do usuário')
    }
  }

  const handleOpenDeleteModal = (user: Usuario) => {
    const currentUser = typeof window !== 'undefined' ? localStorage.getItem('pcp_user') : null
    if (currentUser && currentUser.toLowerCase() === user.username.toLowerCase()) {
      toast.error('Você não pode excluir seu próprio usuário.')
      return
    }
    if (user.username.toLowerCase() === 'pedro.queiroz') {
      toast.error('O Super Admin principal (pedro.queiroz) não pode ser excluído por motivos de segurança.')
      return
    }
    setUserToDelete(user)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/usuarios?id=${encodeURIComponent(userToDelete.id)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir usuário')

      toast.success(`Usuário ${userToDelete.username} excluído com sucesso!`)
      setUserToDelete(null)
      await fetchUsuarios()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao excluir usuário')
    } finally {
      setIsDeleting(false)
    }
  }

  // Sugerir login baseado no nome no cadastro de novos usuários
  const handleNomeCompletoChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, nome_completo: val }
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Super Admin</span>
      case 'ADMIN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Admin</span>
      case 'LIDERANCA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Liderança Operacional</span>
      case 'REPORTS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Reports</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">Operacional</span>
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <Users className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Gestão de Acessos</h1>
            <p className="text-sm text-zinc-500">
              Cadastre e gerencie os usuários, credenciais, cargos e filiais com persistência e segurança.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full space-y-6">
        {/* Barra de Filtros, Busca e Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm w-full">
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

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">Filtrar Cargo:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="ALL">Todos os Cargos</option>
                <option value="SUPERADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="LIDERANCA">Liderança Operacional</option>
                <option value="OPERACIONAL">Operacional</option>
                <option value="REPORTS">Reports</option>
              </select>
            </div>
            
            <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold whitespace-nowrap">
              {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuário' : 'usuários'}
            </div>

            <Button 
              onClick={handleOpenNewModal}
              className="bg-purple-700 hover:bg-purple-800 text-white shadow-sm px-4 py-2 h-9 rounded-lg flex items-center gap-2 cursor-pointer transition-all ml-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuário / Login</th>
                  <th className="px-6 py-4">Nome Completo</th>
                  <th className="px-6 py-4">Nível de Acesso</th>
                  <th className="px-6 py-4">CD Alocado</th>
                  <th className="px-6 py-4">Senha / Acesso</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent mb-2" />
                      <div>Carregando usuários...</div>
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                      Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-zinc-900 font-mono text-xs bg-zinc-100 px-2 py-1 rounded-md">
                          {u.username}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-800 font-medium">
                        {u.nome_completo || <span className="text-zinc-400 italic font-normal">Não informado</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap uppercase font-medium text-zinc-700">
                        {u.cd_slug ? (
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            {u.cd_slug}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-normal text-xs">Global</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {u.has_custom_password ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-medium border border-purple-100">
                            <Lock className="w-3 h-3" />
                            Personalizada
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono">
                            {u.username}@2026
                          </span>
                        )}
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
                          className="text-zinc-600 hover:text-purple-700 hover:bg-purple-50 h-8 px-2.5 cursor-pointer"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleAtivo(u)}
                          className={u.ativo ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 px-2.5 cursor-pointer" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2.5 cursor-pointer"}
                          title={u.ativo ? 'Inativar acesso' : 'Ativar acesso'}
                        >
                          {u.ativo ? 'Inativar' : 'Ativar'}
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDeleteModal(u)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 cursor-pointer"
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
                  <p className="text-xs text-zinc-500">Cadastre um novo usuário informando nome, login e senha</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg cursor-pointer"
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
                  placeholder="Ex: Paul Araruna"
                  value={formData.nome_completo}
                  onChange={(e) => handleNomeCompletoChange(e.target.value)}
                  className="bg-zinc-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Login de Acesso (Username)
                </label>
                <Input 
                  type="text"
                  placeholder="Ex: paul.araruna"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  className="bg-zinc-50 font-mono text-sm"
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Formato recomendado: <code className="text-purple-600 font-semibold">nome.sobrenome</code> em minúsculas e sem acentos.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Senha Inicial
                </label>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Digite a senha de acesso (mínimo 4 dígitos)"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-zinc-50 pr-10 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  A senha é armazenada com criptografia e hash seguro (sem texto puro).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Nível de Acesso (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {CD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Usuários operacionais ficam restritos ao CD selecionado. Admins possuem visão global.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewModalOpen(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
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
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg cursor-pointer"
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
                  Login de Acesso (Username)
                </label>
                <Input 
                  type="text"
                  placeholder="Login de acesso"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  className="bg-zinc-50 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Nova Senha (opcional)
                </label>
                <div className="relative">
                  <Input 
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Deixe em branco para manter a senha atual"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-zinc-50 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Preencha apenas caso queira alterar a senha de acesso deste usuário.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Nível de Acesso (Role)
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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
                  className="w-full h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="true">Ativo (Acesso Liberado)</option>
                  <option value="false">Inativo (Acesso Bloqueado)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Excluir Usuário</h3>
                  <p className="text-xs text-zinc-500">Esta ação não poderá ser desfeita</p>
                </div>
              </div>

              <p className="text-sm text-zinc-600 leading-relaxed">
                Tem certeza que deseja excluir permanentemente o cadastro de{" "}
                <span className="font-semibold text-zinc-900">
                  {userToDelete.nome_completo || userToDelete.username}
                </span>{" "}
                (login: <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-xs">{userToDelete.username}</code>)?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
