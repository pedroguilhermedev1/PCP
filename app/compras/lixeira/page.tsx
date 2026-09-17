"use client"

import { useState, useEffect } from "react"
import { Trash2, RotateCcw, AlertTriangle, Box, FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/auth/RoleGuard"

export default function LixeiraPage() {
  const [data, setData] = useState({ insumos: [], faturas: [] })
  const [loading, setLoading] = useState(true)

  const fetchLixeira = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lixeira')
      const result = await res.json()
      setData(result)
    } catch (e) {
      toast.error('Erro ao carregar lixeira')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLixeira()
  }, [])

  const handleRestore = async (id: string, type: string) => {
    try {
      const res = await fetch('/api/lixeira', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      })
      if (!res.ok) throw new Error('Erro ao restaurar')
      toast.success('Item restaurado com sucesso!')
      fetchLixeira()
    } catch (e) {
      toast.error('Erro ao restaurar item')
    }
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Tem certeza que deseja excluir DEFNITIVAMENTE? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/lixeira?type=${type}&id=${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Erro ao excluir permanentemente')
      toast.success('Item excluído para sempre!')
      fetchLixeira()
    } catch (e) {
      toast.error('Erro ao excluir permanentemente')
    }
  }

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="flex-1 overflow-auto bg-zinc-50/50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-600" />
                Lixeira de Registros
              </h1>
              <p className="text-zinc-500 mt-1">Gerencie itens que foram apagados do sistema. Eles podem ser restaurados ou excluídos permanentemente.</p>
            </div>
          </div>

          <div className="grid gap-6">
            
            {/* INSUMOS APAGADOS */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 flex gap-2 items-center">
                <Box className="w-5 h-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-800">Insumos Excluídos</h3>
                <span className="bg-zinc-200 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-medium ml-2">{data.insumos?.length || 0}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Item (Insumo)</th>
                      <th className="px-6 py-4">Centro de Distribuição</th>
                      <th className="px-6 py-4">Data de Exclusão</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">Buscando itens na lixeira...</td></tr>
                    ) : !data.insumos || data.insumos.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">Nenhum insumo excluído.</td></tr>
                    ) : (
                      (data.insumos || []).map((i: any) => (
                        <tr key={i.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900">{i.item}</td>
                          <td className="px-6 py-4 whitespace-nowrap uppercase text-zinc-600 font-semibold">{i.cd}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(i.excluido_em).toLocaleString('pt-BR')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleRestore(i.id, 'insumo')} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              <RotateCcw className="w-4 h-4 mr-1.5" /> Restaurar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(i.id, 'insumo')} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                              Excluir
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FATURAS APAGADAS */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 flex gap-2 items-center">
                <FileText className="w-5 h-5 text-zinc-500" />
                <h3 className="font-semibold text-zinc-800">Faturas Excluídas</h3>
                <span className="bg-zinc-200 text-zinc-700 text-xs px-2 py-0.5 rounded-full font-medium ml-2">{data.faturas?.length || 0}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nota Fiscal / Doc</th>
                      <th className="px-6 py-4">Fornecedor</th>
                      <th className="px-6 py-4">Data de Exclusão</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">Buscando itens na lixeira...</td></tr>
                    ) : !data.faturas || data.faturas.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">Nenhuma fatura excluída.</td></tr>
                    ) : (
                      (data.faturas || []).map((f: any) => (
                        <tr key={f.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900">{f.numero_documento || 'S/N'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-600">{f.fornecedor || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(f.excluido_em).toLocaleString('pt-BR')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleRestore(f.id, 'fatura')} className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              <RotateCcw className="w-4 h-4 mr-1.5" /> Restaurar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id, 'fatura')} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                              Excluir
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
      </div>
    </RoleGuard>
  )
}
