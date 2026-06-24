"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  getDay,
  isToday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  MapPin,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useCronograma, CronogramaEvento } from "@/hooks/useCronograma";
import { ADMIN_USERS } from "@/lib/roles";

const CD_OPTIONS = ["Fortaleza", "Jundiaí", "NSE"];

const CD_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Fortaleza: { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500" },
  Jundiaí:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  NSE:       { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",   dot: "bg-rose-500" },
};

function getCdColor(cd: string) {
  return CD_COLORS[cd] || { bg: "bg-zinc-50", text: "text-zinc-700", border: "border-zinc-200", dot: "bg-zinc-500" };
}

export function CronogramaClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { eventos, loading, addEvento, updateEvento, deleteEvento } = useCronograma();

  const [currentUser, setCurrentUser] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CronogramaEvento | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Day detail panel
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    time: "08:00",
    description: "",
    cd: "Fortaleza",
  });

  useEffect(() => {
    const user = localStorage.getItem("pcp_user");
    if (user) {
      setCurrentUser(user);
      setIsAdmin(ADMIN_USERS.includes(user.trim().toLowerCase()));
    }
  }, []);

  // Calendar computation
  const daysInMonth = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      }),
    [currentDate]
  );

  const startDayOfWeek = getDay(startOfMonth(currentDate));

  const getEventosOnDay = (date: Date) =>
    eventos.filter((e) => e.date === format(date, "yyyy-MM-dd"));

  const selectedDayEventos = selectedDay ? getEventosOnDay(selectedDay) : [];

  // Navigation
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  // Modal handlers
  const openCreateModal = (date?: Date) => {
    setEditItem(null);
    setFormData({
      date: format(date || new Date(), "yyyy-MM-dd"),
      time: "08:00",
      description: "",
      cd: "Fortaleza",
    });
    setModalOpen(true);
  };

  const openEditModal = (evento: CronogramaEvento) => {
    setEditItem(evento);
    setFormData({
      date: evento.date,
      time: evento.time,
      description: evento.description,
      cd: evento.cd,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.description || !formData.cd) return;

    setSaving(true);
    try {
      if (editItem) {
        const success = await updateEvento(editItem.id, {
          date: formData.date,
          time: formData.time,
          description: formData.description,
          cd: formData.cd,
        });
        if (success) toast.success("Evento atualizado com sucesso.");
        else toast.error("Erro ao atualizar evento.");
      } else {
        const success = await addEvento({
          date: formData.date,
          time: formData.time,
          description: formData.description,
          cd: formData.cd,
          created_by: currentUser || "Indefinido",
        });
        if (success) toast.success("Evento criado com sucesso.");
        else toast.error("Erro ao criar evento.");
      }
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    const success = await deleteEvento(deleteConfirmId);
    if (success) toast.success("Evento excluído com sucesso.");
    else toast.error("Erro ao excluir evento.");
    setDeleteConfirmId(null);
  };

  // Month summary
  const monthEventCount = eventos.filter(
    (e) => e.date.startsWith(format(currentDate, "yyyy-MM"))
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-white relative">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2.5 rounded-xl text-purple-800">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">
              Cronograma de Entregas
            </h1>
            <p className="text-sm text-zinc-500">
              Controle de entregas de insumos por data e centro de distribuição.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
          )}
          {isAdmin && (
            <button
              onClick={() => openCreateModal()}
              className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Novo Evento
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 py-6 pb-24 max-w-[1400px] mx-auto w-full">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-zinc-100 rounded-xl p-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-600 hover:text-zinc-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-zinc-800 capitalize px-4 min-w-[200px] text-center">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-600 hover:text-zinc-900"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleToday}
                className="text-sm text-purple-700 font-semibold hover:text-purple-900 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Hoje
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="text-sm text-zinc-500">
                <span className="font-semibold text-zinc-700">{monthEventCount}</span>{" "}
                {monthEventCount === 1 ? "entrega" : "entregas"} neste mês
              </div>
              {/* CD Legend */}
              <div className="flex items-center gap-2 ml-2">
                {CD_OPTIONS.map((cd) => {
                  const c = getCdColor(cd);
                  return (
                    <div key={cd} className="flex items-center gap-1" title={cd}>
                      <span className={cn("w-2.5 h-2.5 rounded-full", c.dot)} />
                      <span className="text-[11px] text-zinc-500 font-medium">{cd}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider border-r border-zinc-100 last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[130px] bg-zinc-50/40 border-r border-b border-zinc-100"
                />
              ))}

              {daysInMonth.map((day) => {
                const dayEventos = getEventosOnDay(day);
                const todayFlag = isToday(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const hasEvents = dayEventos.length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "min-h-[130px] p-2 border-r border-b border-zinc-100 relative group cursor-pointer transition-all duration-200",
                      todayFlag && "bg-purple-50/40",
                      isSelected && "bg-purple-50/70 ring-2 ring-inset ring-purple-300",
                      !todayFlag && !isSelected && "hover:bg-zinc-50/80"
                    )}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={cn(
                          "text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                          todayFlag
                            ? "bg-purple-700 text-white shadow-sm"
                            : isSelected
                            ? "bg-purple-200 text-purple-800"
                            : "text-zinc-600"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      {/* Quick add button for admins */}
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(day);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-purple-100 rounded-md transition-all text-purple-600"
                          title="Adicionar evento"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Event badges */}
                    <div className="space-y-1">
                      {dayEventos.slice(0, 3).map((evt) => {
                        const c = getCdColor(evt.cd);
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(evt);
                            }}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium truncate transition-all border",
                              c.bg,
                              c.text,
                              c.border,
                              "hover:shadow-sm"
                            )}
                            title={`${evt.cd} • ${evt.time} — ${evt.description}`}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
                            <span className="font-bold">{evt.cd}</span>
                            <span className="text-[10px] opacity-70">{evt.time}</span>
                          </div>
                        );
                      })}
                      {dayEventos.length > 3 && (
                        <div className="text-[10px] text-zinc-400 font-medium text-center py-0.5 hover:text-purple-600 transition-colors">
                          +{dayEventos.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail Panel */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="mt-6"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 capitalize">
                          {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {selectedDayEventos.length === 0
                            ? "Nenhuma entrega programada"
                            : `${selectedDayEventos.length} ${selectedDayEventos.length === 1 ? "entrega" : "entregas"}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => openCreateModal(selectedDay)}
                          className="flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:text-purple-900 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    {selectedDayEventos.length === 0 ? (
                      <div className="text-center py-10 text-zinc-400">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium text-zinc-500">Sem entregas neste dia</p>
                        {isAdmin && (
                          <button
                            onClick={() => openCreateModal(selectedDay)}
                            className="mt-3 text-sm text-purple-700 font-medium hover:underline"
                          >
                            + Agendar uma entrega
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedDayEventos
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((evt) => {
                            const c = getCdColor(evt.cd);
                            return (
                              <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={evt.id}
                                className={cn(
                                  "rounded-xl border p-4 transition-all hover:shadow-md",
                                  c.bg,
                                  c.border
                                )}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold",
                                        c.bg,
                                        c.text,
                                        "border",
                                        c.border
                                      )}
                                    >
                                      <MapPin className="w-3 h-3" />
                                      {evt.cd}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-white/80 text-zinc-600 border border-zinc-200">
                                      <Clock className="w-3 h-3" />
                                      {evt.time}
                                    </span>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={() => openEditModal(evt)}
                                        className="p-1.5 text-zinc-400 hover:text-purple-700 hover:bg-white/80 rounded-lg transition-colors"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(evt.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white/80 rounded-lg transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                                  {evt.description}
                                </p>

                                <div className="mt-3 pt-3 border-t border-zinc-200/50 flex items-center gap-1.5 text-[11px] text-zinc-400">
                                  <span>Criado por</span>
                                  <span className="font-semibold text-zinc-500">{evt.created_by}</span>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                    {editItem ? (!isAdmin ? <CalendarIcon className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />) : <Plus className="w-4 h-4" />}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {editItem ? (!isAdmin ? "Detalhes do Evento" : "Editar Evento") : "Novo Evento"}
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      readOnly={!isAdmin}
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all disabled:opacity-70 read-only:bg-zinc-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700">
                      Horário
                    </label>
                    <input
                      type="time"
                      required
                      readOnly={!isAdmin}
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="w-full h-11 px-3 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all disabled:opacity-70 read-only:bg-zinc-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Centro de Distribuição
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CD_OPTIONS.map((cd) => {
                      const c = getCdColor(cd);
                      const isSelected = formData.cd === cd;
                      return (
                        <button
                          key={cd}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => setFormData({ ...formData, cd })}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5",
                            isSelected
                              ? cn(c.bg, c.text, c.border, "shadow-sm ring-1 ring-offset-1", c.border.replace("border-", "ring-"))
                              : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50",
                            !isAdmin && "cursor-default hover:border-zinc-200 hover:bg-white"
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", isSelected ? c.dot : "bg-zinc-300")} />
                          {cd}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">
                    Descrição do evento
                  </label>
                  <textarea
                    required
                    rows={3}
                    readOnly={!isAdmin}
                    placeholder="Ex: Insumos X, Y chegando no CD SAS..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full py-3 px-3 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-300 outline-none transition-all resize-none disabled:opacity-70 read-only:bg-zinc-50"
                  />
                </div>

                {editItem && (
                  <div className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-xl flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    Criado por: <span className="font-semibold">{editItem.created_by}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 justify-end pt-4 border-t border-zinc-100">
                  {editItem && isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmId(editItem.id);
                        setModalOpen(false);
                      }}
                      className="mr-auto flex items-center gap-1.5 px-4 py-2.5 text-red-600 hover:bg-red-50 font-medium text-sm rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-sm rounded-xl transition-colors"
                  >
                    {isAdmin ? "Cancelar" : "Fechar"}
                  </button>
                  {isAdmin && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {editItem ? "Salvar Alterações" : "Criar Evento"}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-zinc-200 bg-red-50/50 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Confirmação</h3>
              </div>
              <div className="p-6">
                <p className="text-zinc-600 text-sm">
                  Tem certeza que deseja excluir este evento? Esta ação não poderá ser desfeita.
                </p>
              </div>
              <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2.5 font-medium text-sm text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 font-medium text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
