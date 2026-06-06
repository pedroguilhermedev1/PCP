import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center gap-3 bg-red-50/50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-zinc-800">Confirmação</h2>
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-zinc-600 text-sm">
            Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita.
          </p>
        </div>

        <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => {
            onConfirm();
            onClose();
          }}>
            Confirmar Exclusão
          </Button>
        </div>
      </div>
    </div>
  );
}
