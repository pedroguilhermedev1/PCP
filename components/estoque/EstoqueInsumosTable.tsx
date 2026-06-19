import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { Badge } from "@/components/ui/badge";
import { Box, RefreshCw, AlertCircle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
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

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Lead Time</label>
              <Input value={formData.lead_time} onChange={e => setFormData({...formData, lead_time: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">CMD</label>
              <Input type="number" value={formData.cmd} onChange={e => setFormData({...formData, cmd: e.target.value})} title="Consumo Médio Diário" />
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
  cd, 
  insumos, 
  loading, 
  error, 
  refetch,
  initialStatusFilter
}: { 
  cd: string; 
  insumos: any[]; 
  loading: boolean; 
  error: string | null; 
  refetch: () => void; 
  initialStatusFilter?: string;
}) {
  const cdTarget = cd.toUpperCase();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'Todos');

  const filteredInsumos = useMemo(() => {
    return insumos.filter(item => {
      if (statusFilter === 'Todos') return true;
      const cmd = parseFloat(item.cmd) || 10;
      const lt = parseFloat(item.lead_time) || 0;
      const coberturaNum = cmd > 0 ? (item.estoque_real / cmd) : Infinity;
      
      let dynamicStatus = 'CONFORTÁVEL';
      if (coberturaNum <= lt) dynamicStatus = 'CRÍTICO';
      else if (coberturaNum > lt && coberturaNum <= (lt + 3)) dynamicStatus = 'ALERTA';
      
      return dynamicStatus === statusFilter;
    });
  }, [insumos, statusFilter]);

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
        <div className="text-sm text-zinc-600 font-medium">Estoque Base <span className="font-bold text-zinc-900">{cdTarget}</span></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 h-9 px-3 py-1 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Todos">Todos</option>
              <option value="CONFORTÁVEL">Confortável</option>
              <option value="ALERTA">Alerta</option>
              <option value="CRÍTICO">Crítico</option>
            </select>
          </div>
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

      <div className="overflow-auto w-full max-h-[calc(100vh-280px)] border-t border-zinc-200 custom-scrollbar">
        <table className="w-full text-sm text-left relative border-collapse">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 sticky top-0 z-20 shadow-[0_1px_0_0_#e4e4e7]">
            <tr>
              <th className="px-6 py-4 font-semibold bg-zinc-50">CD</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Código</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Item</th>
              <th className="px-6 py-4 font-semibold text-center bg-zinc-50">Unidade</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Categoria</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Lead Time</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Est. Mín</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Est. Real</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Cobert. Dias</th>
              <th className="px-6 py-4 font-semibold text-center bg-zinc-50">Status</th>
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
            ) : filteredInsumos.length > 0 ? (
              filteredInsumos.map((item) => {
                const cmd = parseFloat(item.cmd) || 10;
                const lt = parseFloat(item.lead_time) || 0;
                const em = cmd * lt;
                
                const coberturaNum = cmd > 0 ? (item.estoque_real / cmd) : Infinity;
                const ce = cmd > 0 ? coberturaNum.toFixed(1) : '∞';

                let dynamicStatus = 'OK';
                if (coberturaNum <= lt) dynamicStatus = 'CRÍTICO';
                else if (coberturaNum > lt && coberturaNum <= (lt + 3)) dynamicStatus = 'ALERTA';
                else dynamicStatus = 'CONFORTÁVEL';

                const rawCd = item.cd.includes('-') ? item.cd.split('-')[0] : item.cd;
                const formatCd = (cdStr: string) => {
                  const map: Record<string, string> = {
                    fortaleza: 'Fortaleza',
                    jundiai: 'Jundiaí',
                    nse: 'NSE',
                    curitiba: 'Curitiba',
                    'ribeirao-preto': 'Ribeirão Preto',
                    raizes: 'Raízes'
                  };
                  return map[cdStr.toLowerCase()] || cdStr.toUpperCase();
                };

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 border-l-[3px] border-l-transparent hover:border-purple-500">
                      {formatCd(rawCd)}
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
                    <td className="px-6 py-4 text-right text-zinc-700" title={`EM: ${em}`}>
                      {em}
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
                          dynamicStatus === 'CRÍTICO' 
                            ? "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200" 
                            : dynamicStatus === 'ALERTA'
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200"
                        )}
                      >
                        {dynamicStatus}
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
