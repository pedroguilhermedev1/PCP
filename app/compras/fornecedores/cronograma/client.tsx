"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, MapPin, Truck, CheckCircle, XCircle, Calendar as CalendarIcon, Clock, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { useCronogramaFornecedores, Entrega, EntregaStatus } from "@/hooks/useCronogramaFornecedores";

type Entrega = {
  id: string;
  data: string;
  fornecedor: string;
  produto: string;
  quantidade: string;
  status: EntregaStatus;
  observacao: string;
  responsavel: string;
};

export function CronogramaClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { entregas, loading, addEntrega, updateEntrega, deleteEntrega } = useCronogramaFornecedores();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Entrega | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) setCurrentUser(user);
  }, []);

  const [formData, setFormData] = useState({
    data: format(new Date(), "yyyy-MM-dd"),
    fornecedor: "",
    produto: "",
    quantidade: "",
    status: "Programada" as EntregaStatus,
    observacao: ""
  });

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson');

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getEntregasOnDay = (date: Date) => {
    return entregas.filter(e => isSameDay(new Date(e.data + 'T12:00:00Z'), date) || isSameDay(new Date(e.data.replace(/-/g, '/')), date));
  };

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const openModal = (date?: Date, item?: Entrega) => {
    if (item) {
      setEditItem(item);
      setFormData({
        data: item.data,
        fornecedor: item.fornecedor,
        produto: item.produto,
        quantidade: item.quantidade,
        status: item.status,
        observacao: item.observacao || ""
      });
    } else {
      setEditItem(null);
      setFormData({
        data: format(date || new Date(), "yyyy-MM-dd"),
        fornecedor: "",
        produto: "",
        quantidade: "",
        status: "Programada",
        observacao: ""
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data || !formData.fornecedor || !formData.produto) return;

    if (editItem) {
      const success = await updateEntrega(editItem.id, formData);
      if (success) toast.success("Entrega atualizada com sucesso.");
      else toast.error("Erro ao atualizar entrega.");
    } else {
      const nova = {
        ...formData,
        responsavel: currentUser || "Indefinido"
      };
      const success = await addEntrega(nova);
      if (success) toast.success("Entrega agendada com sucesso.");
      else toast.error("Erro ao agendar entrega.");
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      const success = await deleteEntrega(itemToDelete);
      if (success) toast.success("Entrega excluída com sucesso.");
      else toast.error("Erro ao excluir entrega.");
    }
  };

  const getStatusColor = (status: EntregaStatus) => {
    switch (status) {
      case 'Programada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Em Trânsito': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Recebida': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  const getStatusIcon = (status: EntregaStatus) => {
    switch (status) {
      case 'Programada': return <CalendarIcon className="w-4 h-4" />;
      case 'Em Trânsito': return <Truck className="w-4 h-4 text-orange-600" />;
      case 'Recebida': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelada': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-white relative">
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
      />

      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-zinc-900 leading-tight">Cronograma de Fornecedores</h1>
          <p className="text-sm text-zinc-500">Planejamento e acompanhamento de entregas programadas.</p>
        </div>
        <div className="flex gap-2">
          {canEditOrDelete && (
            <button 
              onClick={() => openModal()}
              className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Entrega
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-800 flex items-center capitalize gap-3">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-100 rounded-full transition text-zinc-500">
              <ChevronLeft className="w-6 h-6" />
            </button>
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-100 rounded-full transition text-zinc-500">
              <ChevronRight className="w-6 h-6" />
            </button>
          </h2>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm text-purple-700 font-medium hover:underline">
            Ir para hoje
          </button>
        </div>

        {/* CALENDAR GRID */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden max-w-7xl mx-auto">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider border-r border-zinc-200 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {Array.from({ length: getDay(startOfMonth(currentDate)) }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] bg-zinc-50 border-r border-b border-zinc-200"></div>
            ))}
            
            {daysInMonth.map((day, i) => {
              const dayEntregas = entregas.filter(e => e.data === format(day, "yyyy-MM-dd"));
              const today = isSameDay(day, new Date());
              return (
                <div 
                  key={day.toISOString()} 
                  className={`min-h-[120px] p-2 border-r border-b border-zinc-200 relative group transition hover:bg-purple-50/10 ${today ? 'bg-purple-50/30' : ''}`}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-purple-700 text-white' : 'text-zinc-600'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1.5 mt-2">
                    {dayEntregas.slice(0, 3).map(ent => (
                      <div 
                        key={ent.id} 
                        onClick={() => openModal(undefined, ent)}
                        className={`text-[10px] sm:text-xs px-2 py-1.5 rounded-md border text-left cursor-pointer transition-all hover:opacity-80 truncate shadow-sm flex items-center gap-1 ${getStatusColor(ent.status)}`}
                        title={ent.fornecedor + ' - ' + ent.produto}
                      >
                         <span className="flex-shrink-0">{getStatusIcon(ent.status)}</span>
                         <span className="truncate flex-1 font-medium">{ent.fornecedor}</span>
                      </div>
                    ))}
                    {dayEntregas.length > 3 && (
                      <div className="text-[10px] text-zinc-400 font-medium text-center hover:text-zinc-600 cursor-pointer" onClick={() => openModal(day)}>
                        + {dayEntregas.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900">{editItem ? 'Editar Entrega' : 'Nova Entrega'}</h2>
                <button type="button" onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <XCircle className="w-6 h-6" />
                </button>
             </div>

             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Data Prevista</label>
                    <input 
                      type="date"
                      required
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      value={formData.data}
                      onChange={e => setFormData({ ...formData, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Status</label>
                    <select 
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as EntregaStatus })}
                    >
                      <option>Programada</option>
                      <option>Em Trânsito</option>
                      <option>Recebida</option>
                      <option>Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Fornecedor</label>
                  <input 
                    required
                    type="text"
                    placeholder="Nome da empresa"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Material/Produto</label>
                    <input 
                      required
                      type="text"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      value={formData.produto}
                      onChange={e => setFormData({ ...formData, produto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Quantidade Prevista</label>
                    <input 
                      required
                      type="text"
                      placeholder="Ex: 50 rolos"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                      value={formData.quantidade}
                      onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Observações adicionais</label>
                  <textarea 
                    className="w-full py-2 px-3 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none min-h-[80px]"
                    value={formData.observacao}
                    placeholder="Período da manhã, entregar nota junta..."
                    onChange={e => setFormData({ ...formData, observacao: e.target.value })}
                  />
                </div>
                
                {editItem && (
                  <div className="text-xs text-zinc-500 bg-zinc-50 p-3 flex rounded-md">
                     <Clock className="w-4 h-4 mr-2" /> Cadastrado/Editado por: {editItem.responsavel}
                  </div>
                )}
             </div>

             <div className="mt-6 flex gap-3 justify-end pt-5 border-t border-zinc-100">
               {editItem && canEditOrDelete && (
                 <button 
                  type="button" 
                  onClick={() => {
                    setItemToDelete(editItem.id);
                    setModalOpen(false);
                  }} 
                  className="mr-auto px-4 py-2 hover:bg-red-50 text-red-600 font-medium text-sm rounded-lg flex items-center transition"
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Excluir
                 </button>
               )}
               <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-sm rounded-lg">
                 Cancelar
               </button>
               {canEditOrDelete && (
                 <button type="submit" className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm rounded-lg flex items-center shadow-sm">
                   <CheckCircle className="w-4 h-4 mr-2" />
                   Salvar Entrega
                 </button>
               )}
             </div>
           </form>
        </div>
      )}
    </div>
  );
}
