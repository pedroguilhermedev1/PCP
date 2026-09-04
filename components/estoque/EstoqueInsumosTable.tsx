import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";
import { Badge } from "@/components/ui/badge";
import { Box, RefreshCw, AlertCircle, Plus, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
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
    item_adm: '',
    item: '',
    unidade: '',
    categoria: '',
    lead_time: '5',
    estoque_minimo: '50',
    estoque_real: '0',
    cmd: '10',
    status: ''
  });

  const [manualFields, setManualFields] = useState<string[]>(['lead_time', 'cmd']);

  const handleCalcChange = (field: 'lead_time' | 'cmd' | 'estoque_minimo', value: string) => {
    let newManual = [...manualFields];
    if (!newManual.includes(field)) {
      newManual = [newManual[1], field];
      setManualFields(newManual);
    }
    
    let lt = field === 'lead_time' ? parseFloat(value) : parseFloat(formData.lead_time);
    let cmd = field === 'cmd' ? parseFloat(value) : parseFloat(formData.cmd);
    let min = field === 'estoque_minimo' ? parseFloat(value) : parseFloat(formData.estoque_minimo);
    
    lt = isNaN(lt) ? 0 : lt;
    cmd = isNaN(cmd) ? 0 : cmd;
    min = isNaN(min) ? 0 : min;

    let updates: any = { [field]: value };

    if (!newManual.includes('estoque_minimo')) {
      updates.estoque_minimo = (lt * cmd).toString();
    } else if (!newManual.includes('cmd')) {
      updates.cmd = lt > 0 ? (min / lt).toFixed(1) : '0';
    } else if (!newManual.includes('lead_time')) {
      updates.lead_time = cmd > 0 ? Math.ceil(min / cmd).toString() : '0';
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

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
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
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
              <label className="text-sm font-medium text-zinc-700">Código</label>
              <Input value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Item ADM</label>
            <Input value={formData.item_adm} onChange={e => setFormData({...formData, item_adm: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Item OP <span className="text-red-500">*</span></label>
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

          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex flex-col gap-3 relative">
            <div className="text-xs text-zinc-500 mb-1 flex items-center justify-between">
              <span>Cálculo Automático Ativo</span>
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Os 2 últimos editados ditam o outro</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-medium text-zinc-700 flex justify-between">
                  Lead Time {!manualFields.includes('lead_time') && <span className="text-purple-600 font-bold">(Auto)</span>}
                </label>
                <Input className={!manualFields.includes('lead_time') ? 'bg-purple-50 border-purple-200 font-medium text-purple-900' : ''} value={formData.lead_time} onChange={e => handleCalcChange('lead_time', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-medium text-zinc-700 flex justify-between">
                  CMD {!manualFields.includes('cmd') && <span className="text-purple-600 font-bold">(Auto)</span>}
                </label>
                <Input type="number" step="0.1" className={!manualFields.includes('cmd') ? 'bg-purple-50 border-purple-200 font-medium text-purple-900' : ''} value={formData.cmd} onChange={e => handleCalcChange('cmd', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-medium text-zinc-700 flex justify-between">
                  Estoque Mín. {!manualFields.includes('estoque_minimo') && <span className="text-purple-600 font-bold">(Auto)</span>}
                </label>
                <Input type="number" className={!manualFields.includes('estoque_minimo') ? 'bg-purple-50 border-purple-200 font-medium text-purple-900' : ''} value={formData.estoque_minimo} onChange={e => handleCalcChange('estoque_minimo', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Estoque Real</label>
            <Input type="number" value={formData.estoque_real} onChange={e => setFormData({...formData, estoque_real: e.target.value})} />
          </div>

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

function EditarInsumoModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  itemData
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
  itemData: any;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    cd: '',
    codigo: '',
    item_adm: '',
    item: '',
    unidade: '',
    categoria: '',
    lead_time: '5',
    estoque_minimo: '50',
    cmd: '10',
    estoque_real: 0,
    status: ''
  });

  const [manualFields, setManualFields] = useState<string[]>(['lead_time', 'cmd']);

  const handleCalcChange = (field: 'lead_time' | 'cmd' | 'estoque_minimo', value: string) => {
    let newManual = [...manualFields];
    if (!newManual.includes(field)) {
      newManual = [newManual[1], field];
      setManualFields(newManual);
    }
    
    let lt = field === 'lead_time' ? parseFloat(value) : parseFloat(formData.lead_time);
    let cmd = field === 'cmd' ? parseFloat(value) : parseFloat(formData.cmd);
    let min = field === 'estoque_minimo' ? parseFloat(value) : parseFloat(formData.estoque_minimo);
    
    lt = isNaN(lt) ? 0 : lt;
    cmd = isNaN(cmd) ? 0 : cmd;
    min = isNaN(min) ? 0 : min;

    let updates: any = { [field]: value };

    if (!newManual.includes('estoque_minimo')) {
      updates.estoque_minimo = (lt * cmd).toString();
    } else if (!newManual.includes('cmd')) {
      updates.cmd = lt > 0 ? (min / lt).toFixed(1) : '0';
    } else if (!newManual.includes('lead_time')) {
      updates.lead_time = cmd > 0 ? Math.ceil(min / cmd).toString() : '0';
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Keep a copy to preserve existing fields not in the form
  const [fullItem, setFullItem] = useState<any>(null);

  if (isOpen && itemData && formData.id !== itemData.id) {
    setFullItem(itemData);
    
    // Calculate initial estoque minimo properly since it's not saved explicitly if it's dynamic
    const initialCmd = itemData.cmd ? parseFloat(itemData.cmd) : 10;
    const initialLt = itemData.lead_time ? parseFloat(itemData.lead_time) : 0;
    const initialMin = itemData.estoque_minimo ? parseFloat(itemData.estoque_minimo) : (initialCmd * initialLt);

    setFormData({
      id: itemData.id,
      cd: itemData.cd,
      codigo: itemData.codigo || '',
      item_adm: itemData.item_adm || '',
      item: itemData.item || '',
      unidade: itemData.unidade || '',
      categoria: itemData.categoria || '',
      lead_time: itemData.lead_time || '-',
      estoque_minimo: initialMin.toString(),
      cmd: initialCmd.toString(),
      estoque_real: itemData.estoque_real,
      status: itemData.status
    });
    setManualFields(['lead_time', 'cmd']);
    setError(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...fullItem,
        ...formData
      };
      const res = await fetch('/api/estoque', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao editar insumo.');
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
          <h2 className="text-lg font-semibold text-zinc-800">Editar Insumo</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Código</label>
            <Input value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Item ADM</label>
            <Input value={formData.item_adm} onChange={e => setFormData({...formData, item_adm: e.target.value})} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Item OP <span className="text-red-500">*</span></label>
            <Input required value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Unidade <span className="text-red-500">*</span></label>
              <Input required placeholder="Ex: UN, ROLO" value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Categoria <span className="text-red-500">*</span></label>
              <Input required placeholder="Ex: CAIXA, ETIQUETA" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg flex flex-col gap-3 relative">
            <div className="text-xs text-zinc-500 mb-1 flex items-center justify-between">
              <span>Cálculo Automático Ativo</span>
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Os 2 últimos editados ditam o outro</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-medium text-zinc-700 flex justify-between">
                  Lead Time {!manualFields.includes('lead_time') && <span className="text-purple-600 font-bold">(Auto)</span>}
                </label>
                <Input className={!manualFields.includes('lead_time') ? 'bg-purple-50 border-purple-200 font-medium text-purple-900' : ''} value={formData.lead_time} onChange={e => handleCalcChange('lead_time', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-medium text-zinc-700 flex justify-between">
                  CMD {!manualFields.includes('cmd') && <span className="text-purple-600 font-bold">(Auto)</span>}
                </label>
                <Input type="number" step="0.1" className={!manualFields.includes('cmd') ? 'bg-purple-50 border-purple-200 font-medium text-purple-900' : ''} value={formData.cmd} onChange={e => handleCalcChange('cmd', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-medium text-zinc-700 flex justify-between">
                  Estoque Mín. {!manualFields.includes('estoque_minimo') && <span className="text-purple-600 font-bold">(Auto)</span>}
                </label>
                <Input type="number" className={!manualFields.includes('estoque_minimo') ? 'bg-purple-50 border-purple-200 font-medium text-purple-900' : ''} value={formData.estoque_minimo} onChange={e => handleCalcChange('estoque_minimo', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 justify-end border-t border-zinc-100 pt-5">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-purple-700 hover:bg-purple-800 text-white">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExcluirInsumoModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  itemData,
  loading
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onConfirm: () => void;
  itemData: any;
  loading: boolean;
}) {
  if (!isOpen || !itemData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 hover:cursor-auto text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Excluir Insumo
          </h2>
          <button type="button" onClick={onClose} disabled={loading} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-zinc-700">Tem certeza que deseja excluir o insumo <strong>{itemData.item}</strong>?</p>
          <p className="text-sm text-zinc-500 mt-2">Esta ação não poderá ser desfeita.</p>
        </div>

        <div className="px-6 py-4 flex gap-3 justify-end border-t border-zinc-100 bg-zinc-50">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="button" onClick={onConfirm} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Excluindo..." : "Excluir Insumo"}
          </Button>
        </div>
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'Todos');
  const [searchTerm, setSearchTerm] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const user = localStorage.getItem('pcp_user') || '';
    const admin = ['pedro.queiroz', 'felipe.castro', 'debora.mota', 'francisco.edson'].some(a => user.startsWith(a));
    setIsAdmin(admin);
  }, []);

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/estoque?codigo=${itemToDelete.codigo || ''}&cd=${itemToDelete.cd}&id=${itemToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir insumo.');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredInsumos = useMemo(() => {
    return insumos.filter(item => {
      // Filtro por status
      if (statusFilter !== 'Todos') {
        const cmd = parseFloat(item.cmd) || 10;
        const lt = parseFloat(item.lead_time) || 0;
        const coberturaNum = cmd > 0 ? (item.estoque_real / cmd) : Infinity;
        
        let dynamicStatus = 'CONFORTÁVEL';
        if (coberturaNum <= lt) dynamicStatus = 'CRÍTICO';
        else if (coberturaNum > lt && coberturaNum <= (lt + 3)) dynamicStatus = 'ALERTA';
        
        if (dynamicStatus !== statusFilter) return false;
      }

      // Filtro por termo de busca (apenas no início da palavra)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchItem = item.item?.toLowerCase().startsWith(term);
        const matchItemAdm = item.item_adm?.toLowerCase().startsWith(term);
        const matchCodigo = item.codigo?.toLowerCase().startsWith(term);
        if (!matchItem && !matchItemAdm && !matchCodigo) return false;
      }
      
      return true;
    });
  }, [insumos, statusFilter, searchTerm]);

  return (
    <div className="w-full mt-4 relative">
      <NovoInsumoModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={refetch}
        defaultCd={cdTarget}
      />
      <EditarInsumoModal 
        isOpen={editModalOpen} 
        onClose={() => { setEditModalOpen(false); setItemToEdit(null); }} 
        onSuccess={refetch}
        itemData={itemToEdit}
      />
      <ExcluirInsumoModal
        isOpen={deleteModalOpen}
        onClose={() => { if(!isDeleting) { setDeleteModalOpen(false); setItemToDelete(null); } }}
        onConfirm={confirmDelete}
        itemData={itemToDelete}
        loading={isDeleting}
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
      
      <div className="pb-4 mb-4 border-b border-zinc-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-sm text-zinc-600 font-medium whitespace-nowrap hidden lg:block">Estoque Base <span className="font-bold text-zinc-900">{cdTarget}</span></div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Buscar insumo, código..." 
              className="pl-9 h-9 w-full bg-white/60 focus:bg-white transition-colors border-zinc-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="overflow-auto w-full max-h-[calc(100vh-280px)] custom-scrollbar bg-white/40 backdrop-blur-sm rounded-xl">
        <table className="w-full text-sm text-left relative border-collapse">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/80 backdrop-blur-sm sticky top-0 z-20 shadow-[0_1px_0_0_#e4e4e7]">
            <tr>
              <th className="w-12 text-center px-6 py-4 font-semibold bg-zinc-50">ID</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">CD</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Código</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Item ADM</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Item OP</th>
              <th className="px-6 py-4 font-semibold text-center bg-zinc-50">Unidade</th>
              <th className="px-6 py-4 font-semibold bg-zinc-50">Categoria</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">CMD</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Lead Time</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Est. Mín</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Est. Real</th>
              <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Cobert. Dias</th>
              <th className="px-6 py-4 font-semibold text-center bg-zinc-50">Status</th>
              {isAdmin && <th className="px-6 py-4 font-semibold text-right bg-zinc-50">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 14 : 13} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                    <p>Carregando insumos...</p>
                  </div>
                </td>
              </tr>
            ) : filteredInsumos.length > 0 ? (
              filteredInsumos.map((item, index) => {
                const cmd = parseFloat(item.cmd) || 10;
                const lt = parseFloat(item.lead_time) || 0;
                const em = Math.ceil(cmd * lt);
                
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
                    coc: 'COC',
                    psd: 'PSD',
                    curitiba: 'Curitiba',
                    'ribeirao-preto': 'Ribeirão Preto',
                    raizes: 'Raízes'
                  };
                  return map[cdStr.toLowerCase()] || cdStr.toUpperCase();
                };

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-zinc-400 text-xs">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 border-l-[3px] border-l-transparent hover:border-purple-500">
                      {formatCd(rawCd)}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                      {item.codigo || '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 font-medium whitespace-nowrap">
                      {item.item_adm || '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 font-medium whitespace-nowrap">
                      {item.item}
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-500">
                      {item.unidade}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {item.categoria || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600">
                      {item.cmd || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-600">
                      {item.lead_time || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-700">
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
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setItemToEdit(item); setEditModalOpen(true); }}
                            className="text-zinc-500 hover:text-purple-700 hover:bg-purple-50"
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteClick(item)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isAdmin ? 13 : 12} className="px-6 py-12 text-center text-zinc-500">
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
