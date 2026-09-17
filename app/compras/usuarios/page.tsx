"use client"

import { useState, useEffect } from "react"
import { Shield, Plus, Edit2, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Omitindo a construção complexa do Modal no momento e construindo uma lista simples interativa para MVP
  // Num cenário completo teríamos modais de edição, igual em ConfiguracoesPage.

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      setUsuarios(data)
    } catch (e) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

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

  return (
    <div className="flex-1 overflow-auto bg-zinc-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-700" />
              Gestão de Acessos e Permissões
            </h1>
            <p className="text-zinc-500 mt-1">Gerencie os usuários do sistema, seus cargos e acessos a filiais.</p>
          </div>
          <Button className="bg-purple-700 hover:bg-purple-800 text-white shadow-sm" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário (Em Breve)
          </Button>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuário / Nome</th>
                  <th className="px-6 py-4">Cargo (Role)</th>
                  <th className="px-6 py-4">CD Alocado</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                      Nenhum usuário cadastrado.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{u.username}</div>
                        <div className="text-xs text-zinc-500">{u.nome_completo || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'SUPERADMIN' ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm' :
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          u.role === 'LIDERANCA' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-zinc-100 text-zinc-800 border border-zinc-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap uppercase font-medium text-zinc-700">
                        {u.cd_slug || <span className="text-zinc-400 font-normal">Global</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${u.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleAtivo(u.id, u.ativo)}
                          className={u.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}
                        >
                          {u.ativo ? 'Inativar' : 'Ativar'}
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
    </div>
  )
}
