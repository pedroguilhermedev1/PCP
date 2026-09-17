"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, AlertCircle, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'cds' | 'categorias'>('cds')
  const [cds, setCds] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [newCd, setNewCd] = useState({ nome: '', slug: '' })
  const [newCategoria, setNewCategoria] = useState({ nome: '' })
  
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/configuracoes')
      const data = await res.json()
      if (data.cds) setCds(data.cds)
      if (data.categorias) setCategorias(data.categorias)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddCd = async () => {
    if (!newCd.nome || !newCd.slug) return
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cds', data: newCd })
      })
      setNewCd({ nome: '', slug: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddCategoria = async () => {
    if (!newCategoria.nome) return
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'categorias', data: newCategoria })
      })
      setNewCategoria({ nome: '' })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleAtivo = async (type: 'cds' | 'categorias', id: string, currentAtivo: boolean) => {
    try {
      await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, data: { ativo: !currentAtivo } })
      })
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 overflow-hidden">
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Configurações Globais
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerencie os cadastros base do sistema.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-4 border-b border-zinc-200">
            <button 
              onClick={() => setActiveTab('cds')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cds' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
              Centros de Distribuição
            </button>
            <button 
              onClick={() => setActiveTab('categorias')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'categorias' ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
              Categorias de Insumos
            </button>
          </div>

          {/* CD Content */}
          {activeTab === 'cds' && (
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Novo Centro de Distribuição</h2>
              <div className="flex gap-4 items-end mb-8">
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-700 mb-1 block">Nome de Exibição (Ex: Jundiaí)</label>
                  <Input 
                    value={newCd.nome} 
                    onChange={e => {
                      const val = e.target.value;
                      // Auto-generate slug
                      const autoSlug = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                      setNewCd({ nome: val, slug: autoSlug });
                    }} 
                    placeholder="Digite o nome..." 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-700 mb-1 block">Slug / Rota (Ex: jundiai)</label>
                  <Input value={newCd.slug} onChange={e => setNewCd({ ...newCd, slug: e.target.value })} placeholder="URL amigável..." />
                </div>
                <Button onClick={handleAddCd} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>

              <h2 className="text-lg font-semibold text-zinc-800 mb-4">CDs Cadastrados</h2>
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
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-zinc-500">Carregando...</td></tr>
                    ) : cds.map(cd => (
                      <tr key={cd.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{cd.nome}</td>
                        <td className="px-4 py-3 text-zinc-500">{cd.slug}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cd.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {cd.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => handleToggleAtivo('cds', cd.id, cd.ativo)} className="text-xs">
                            {cd.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categorias Content */}
          {activeTab === 'categorias' && (
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Nova Categoria de Insumos</h2>
              <div className="flex gap-4 items-end mb-8">
                <div className="flex-1">
                  <label className="text-xs font-medium text-zinc-700 mb-1 block">Nome da Categoria</label>
                  <Input 
                    value={newCategoria.nome} 
                    onChange={e => setNewCategoria({ nome: e.target.value })} 
                    placeholder="Ex: Material de Escritório" 
                  />
                </div>
                <Button onClick={handleAddCategoria} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>

              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Categorias Cadastradas</h2>
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {loading ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-zinc-500">Carregando...</td></tr>
                    ) : categorias.map(cat => (
                      <tr key={cat.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{cat.nome}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {cat.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => handleToggleAtivo('categorias', cat.id, cat.ativo)} className="text-xs">
                            {cat.ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
