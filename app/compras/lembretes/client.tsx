"use client";

import { useState, useEffect } from "react";
import { useLembretes, Lembrete } from "@/components/lembretes/LembretesContext";
import { Bell, Check, Clock, Plus, Trash2, Edit2, CheckCircle2, Circle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

export function LembretesClient() {
  const { lembretes, addLembrete, updateLembrete, deleteLembrete, markAsCompleted } = useLembretes();
  const [filter, setFilter] = useState<"todos" | "pendentes" | "concluidos">("pendentes");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ text: "", scheduledFor: "" });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const canEditOrDelete = !currentUser || currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('francisco.edson');

  const filteredLembretes = lembretes
    .filter(l => {
      if (filter === "pendentes") return !l.isCompleted;
      if (filter === "concluidos") return l.isCompleted;
      return true;
    })
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  const openNewModal = () => {
    setFormData({ text: "", scheduledFor: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (l: Lembrete) => {
    setFormData({ text: l.text, scheduledFor: l.scheduledFor.slice(0, 16) });
    setEditingId(l.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text || !formData.scheduledFor) return;

    if (editingId) {
      updateLembrete(editingId, { 
        text: formData.text, 
        scheduledFor: new Date(formData.scheduledFor).toISOString(),
        notified: false // reset notification on edit
      });
      toast.success("Registro atualizado com sucesso.");
    } else {
      addLembrete({
        text: formData.text,
        scheduledFor: new Date(formData.scheduledFor).toISOString(),
        isCompleted: false,
      });
      toast.success("Registro salvo com sucesso.");
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteLembrete(deletingId);
      toast.success("Registro excluído com sucesso.");
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-3 rounded-xl text-purple-900">
            <Bell className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Lembretes</h1>
            <p className="text-sm text-zinc-500">Agende notificações e acompanhe tarefas.</p>
          </div>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-purple-800 hover:bg-purple-900 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Lembrete
        </button>
      </header>

      <div className="flex-1 p-6 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
            {[
              { id: "pendentes", label: "Pendentes" },
              { id: "concluidos", label: "Concluídos" },
              { id: "todos", label: "Todos" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-t-lg font-medium text-sm transition-colors border-b-2 -mb-[9px]",
                  filter === tab.id 
                    ? "border-purple-800 text-purple-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredLembretes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-zinc-300">
                <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-zinc-900 font-medium mb-1">Nenhum lembrete encontrado</h3>
                <p className="text-zinc-500 text-sm">
                  {filter === 'pendentes' ? 'Você não tem tarefas pendentes.' : 'A lista está vazia para este filtro.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredLembretes.map(l => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={l.id}
                      className={cn(
                        "bg-white rounded-xl border p-4 shadow-sm flex flex-col gap-3 transition-colors",
                        l.isCompleted ? "border-zinc-200 opacity-60 bg-zinc-50" : (l.notified ? "border-red-200 bg-red-50/30" : "border-zinc-200")
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button 
                          onClick={() => !l.isCompleted && markAsCompleted(l.id)}
                          className={cn(
                            "mt-0.5 flex-shrink-0 transition-colors",
                            l.isCompleted ? "text-green-600" : "text-zinc-300 hover:text-purple-800"
                          )}
                          disabled={l.isCompleted}
                        >
                          {l.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        
                        <p className={cn(
                          "flex-1 text-sm font-medium whitespace-pre-wrap leading-relaxed",
                          l.isCompleted ? "text-zinc-500 line-through" : "text-zinc-900"
                        )}>
                          {l.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-zinc-100">
                        <div className={cn(
                          "flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md",
                          l.isCompleted 
                            ? "bg-zinc-100 text-zinc-500" 
                            : (l.notified ? "bg-red-100 text-red-700" : "bg-purple-200 text-purple-900")
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(l.scheduledFor), "dd/MM/yyyy • HH:mm")}
                        </div>
                        
                        {canEditOrDelete && !l.isCompleted && (
                          <div className="flex gap-1 ml-auto">
                            <button 
                              onClick={() => openEditModal(l)}
                              className="p-1.5 text-zinc-400 hover:text-purple-800 hover:bg-purple-200 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeletingId(l.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {canEditOrDelete && l.isCompleted && (
                          <button 
                            onClick={() => setDeletingId(l.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
          >
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirmação</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 font-medium text-sm text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 font-medium text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-900">
                {editingId ? 'Editar Lembrete' : 'Novo Lembrete'}
              </h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">
                  Descrição
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.text}
                  onChange={e => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Escreva sobre o que você quer ser lembrado..."
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-2000 focus:ring-1 focus:ring-purple-2000 outline-none resize-none transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">
                  Data e Hora do Aviso
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledFor}
                  onChange={e => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-2000 focus:ring-1 focus:ring-purple-2000 outline-none transition-shadow"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-100">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 font-medium text-sm text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 font-medium text-sm text-white bg-purple-800 hover:bg-purple-900 rounded-md transition-colors shadow-sm"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Lembrete'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
