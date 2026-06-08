import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { Badge } from "@/components/ui/badge";
import { Box, RefreshCw, AlertCircle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";

function NovoInsumoModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultCd
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
  defaultCd: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cd: defaultCd,
    codigo: '',
    item: '',
    unidade: '',
    categoria: '',
    lead_time: '-',
    estoque_minimo: '0',
    estoque_real: '0',
    cmd: '10',
    dias_seguranca: '3',
    status: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar insumo.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 hover:cursor-auto text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-zinc-800">Novo Insumo</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">CD <span className="text-red-500">*</span></label>
              <Input required value={formData.cd} onChange={e => setFormData({...formData, cd: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Código <span className="text-red-500">*</span></label>
              <Input required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Item <span className="text-red-500">*</span></label>
            <Input required value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Unidade <span className="text-red-500">*</span></label>
              <Input required placeholder="Ex: UN, ROLO, RESMA" value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Categoria <span className="text-red-500">*</span></label>
              <Input required placeholder="Ex: CAIXA, ETIQUETA" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Lead Time</label>
              <Input value={formData.lead_time} onChange={e => setFormData({...formData, lead_time: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">CMD</label>
              <Input type="number" value={formData.cmd} onChange={e => setFormData({...formData, cmd: e.target.value})} title="Consumo Médio Diário" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Dias Seg.</label>
              <Input type="number" value={formData.dias_seguranca} onChange={e => setFormData({...formData, dias_seguranca: e.target.value})} title="Dias de Estoque de Segurança" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Est. Real</label>
              <Input type="number" value={formData.estoque_real} onChange={e => setFormData({...formData, estoque_real: e.target.value})} />
            </div>
          </div>

          {/* O status é calculado caso não enviado, não precisa exibir campo unless want to override */}

          <div className="mt-4 flex gap-3 justify-end border-t border-zinc-100 pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-purple-700 hover:bg-purple-800 text-white">
              {loading ? "Salvando..." : "Salvar Insumo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EstoqueInsumosTable({ 
  marca, 
  insumos, 
  loading, 
  error, 
  refetch 
}: { 
  marca: string; 
  insumos: any[]; 
  loading: boolean; 
  error: string | null; 
  refetch: () => void; 
}) {
  const cdTarget = (marca === 'sas' || marca === 'sae') ? `JDI-${marca.toUpperCase()}` : marca.toUpperCase();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mt-4 relative">
      <NovoInsumoModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={refetch}
        defaultCd={cdTarget}
      />
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Não foi possível carregar os dados de Insumos ({error}).</span>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="h-8 border-red-200 hover:bg-red-100 text-red-800">
            Tentar Novamente
          </Button>
        </div>
      )}
      
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
        <div className="text-sm text-zinc-600 font-medium">Estoque Base <span className="font-bold text-zinc-900">{cdTarget.includes('-') ? cdTarget.split('-')[0] : cdTarget}</span></div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refetch} 
            disabled={loading}
            className="text-zinc-500 hover:text-zinc-800"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Atualizar
          </Button>
          <Button 
            size="sm" 
            onClick={() => setModalOpen(true)}
            className="bg-purple-700 hover:bg-purple-800 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Novo Insumo
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold">CD</th>
              <th className="px-6 py-4 font-semibold">Código</th>
              <th className="px-6 py-4 font-semibold">Item</th>
              <th className="px-6 py-4 font-semibold text-center">Unidade</th>
              <th className="px-6 py-4 font-semibold">Categoria</th>
              <th className="px-6 py-4 font-semibold text-right">Lead Time</th>
              <th className="px-6 py-4 font-semibold text-right">Ressuprimento</th>
              <th className="px-6 py-4 font-semibold text-right">Est. Real</th>
              <th className="px-6 py-4 font-semibold text-right">Cobert. Dias</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                    <p>Carregando insumos...</p>
                  </div>
                </td>
              </tr>
            ) : insumos.length > 0 ? (
              insumos.map((item) => {
                const cmd = parseFloat(item.cmd) || 10;
                const dias = parseFloat(item.dias_seguranca) || 3;
                const lt = parseFloat(item.lead_time) || 0;
                const es = cmd * dias;
                const pr = (cmd * lt) + es;
                const ce = cmd > 0 ? (item.estoque_real / cmd).toFixed(1) : '∞';

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 border-l-[3px] border-l-transparent hover:border-purple-500">
                      {item.cd.includes('-') ? item.cd.split('-')[0] : item.cd}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                      {item.codigo}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 font-medium whitespace-nowrap">
                      {item.item}
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-500">
                      {item.unidade}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      <Badge variant="outline" className="bg-zinc-50">
                        {item.categoria || '-'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600">
                      {item.lead_time || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-700" title={`ES: ${es}`}>
                      {pr}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900">
                      {item.estoque_real}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-700">
                      {ce}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        className={cn(
                          "font-bold uppercase tracking-wider",
                          item.status.toUpperCase() === 'CRÍTICO' 
                            ? "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200" 
                            : item.status.toUpperCase() === 'ATENÇÃO'
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200"
                              : item.status.toUpperCase() === 'ADEQUADO'
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200"
                        )}
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                    <Box className="w-10 h-10 text-zinc-300 mb-2" />
                    <p className="font-medium text-zinc-900">Nenhum insumo encontrado</p>
                    <p className="text-sm">Não há registros cadastrados para a base {cdTarget.includes('-') ? cdTarget.split('-')[0] : cdTarget} no momento.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
