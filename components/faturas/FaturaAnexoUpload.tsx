"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, ExternalLink, Receipt, CheckCircle2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FaturaAnexoItem } from "@/modules/compras/domain/Fatura";
import { openAnexo, formatBytes } from "@/lib/anexoUtils";

interface FaturaAnexoUploadProps {
  anexos?: FaturaAnexoItem[];
  onChange: (anexos: FaturaAnexoItem[]) => void;
  disabled?: boolean;
}

export function FaturaAnexoUpload({
  anexos = [],
  onChange,
  disabled = false
}: FaturaAnexoUploadProps) {
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingComp, setUploadingComp] = useState(false);
  const [dragOverDoc, setDragOverDoc] = useState(false);
  const [dragOverComp, setDragOverComp] = useState(false);

  const fileInputDocRef = useRef<HTMLInputElement>(null);
  const fileInputCompRef = useRef<HTMLInputElement>(null);

  const docsList = anexos.filter(a => a.categoria === 'documento');
  const compList = anexos.filter(a => a.categoria === 'comprovante');

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Erro ao ler o arquivo "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };

  const handleUploadFiles = async (files: FileList | null, categoria: 'documento' | 'comprovante') => {
    if (!files || files.length === 0) return;

    const isDoc = categoria === 'documento';
    if (isDoc) setUploadingDoc(true);
    else setUploadingComp(true);

    try {
      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
      const newUploadedItems: FaturaAnexoItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`O arquivo "${file.name}" excede 15MB e foi ignorado.`);
          continue;
        }

        const dataUrl = await readFileAsDataUrl(file);
        newUploadedItems.push({
          id: `anexo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nome: file.name,
          url: dataUrl,
          tamanho: file.size,
          tipo: file.type || 'application/pdf',
          data_upload: new Date().toISOString(),
          categoria
        });
      }

      if (newUploadedItems.length > 0) {
        const updatedList = [...anexos, ...newUploadedItems];
        onChange(updatedList);
        toast.success(
          newUploadedItems.length === 1
            ? `"${newUploadedItems[0].nome}" anexado com sucesso!`
            : `${newUploadedItems.length} arquivos anexados com sucesso!`
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao processar anexos.');
    } finally {
      if (isDoc) {
        setUploadingDoc(false);
        if (fileInputDocRef.current) fileInputDocRef.current.value = "";
      } else {
        setUploadingComp(false);
        if (fileInputCompRef.current) fileInputCompRef.current.value = "";
      }
    }
  };

  const handleRemoveAnexo = (itemToRemove: FaturaAnexoItem) => {
    const updated = anexos.filter(a => a.id !== itemToRemove.id && a.url !== itemToRemove.url);
    onChange(updated);
    toast.success(`"${itemToRemove.nome}" removido.`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ================= COLUNA 1: NOTA FISCAL & BOLETOS ================= */}
      <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-md text-purple-700">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-900 block leading-tight">
                  Nota Fiscal & Boletos
                </label>
                <span className="text-[10px] text-zinc-500">NFs, Boletos, XMLs e Pedidos</span>
              </div>
            </div>
            {docsList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-800">
                {docsList.length} {docsList.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
            )}
          </div>

          <input
            ref={fileInputDocRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.doc,.docx"
            onChange={e => handleUploadFiles(e.target.files, 'documento')}
            className="hidden"
            disabled={disabled || uploadingDoc}
          />

          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOverDoc(true); }}
            onDragLeave={() => setDragOverDoc(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOverDoc(false);
              if (!disabled && !uploadingDoc) handleUploadFiles(e.dataTransfer.files, 'documento');
            }}
            onClick={() => !disabled && !uploadingDoc && fileInputDocRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-3 text-center transition-all ${
              dragOverDoc
                ? 'border-purple-600 bg-purple-100/70 scale-[0.99]'
                : 'border-purple-300/80 bg-white hover:bg-purple-50/50 hover:border-purple-500'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {uploadingDoc ? (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-purple-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando arquivo(s)...
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-1.5">
                <div className="p-2 bg-purple-100 rounded-full text-purple-700 mb-1">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-zinc-800">
                  Clique ou arraste a Nota Fiscal / Boleto
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  PDF, Imagens (PNG, JPG) ou XML • Permite múltiplos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Documentos Anexados */}
        {docsList.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {docsList.map(item => (
              <div
                key={item.id || item.url}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors shadow-2xs text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-semibold text-zinc-800 truncate" title={item.nome}>
                      {item.nome}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatBytes(item.tamanho)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAnexo(item.url, item.nome)}
                    className="p-1 text-zinc-500 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                    title="Visualizar arquivo"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAnexo(item)}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remover arquivo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= COLUNA 2: COMPROVANTE DE PAGAMENTO ================= */}
      <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-700">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-900 block leading-tight">
                  Comprovante de Pagamento
                </label>
                <span className="text-[10px] text-zinc-500">Recibo bancário, Pix, TED ou quitação</span>
              </div>
            </div>
            {compList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                {compList.length} {compList.length === 1 ? 'comprovante' : 'comprovantes'}
              </span>
            )}
          </div>

          <input
            ref={fileInputCompRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onChange={e => handleUploadFiles(e.target.files, 'comprovante')}
            className="hidden"
            disabled={disabled || uploadingComp}
          />

          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOverComp(true); }}
            onDragLeave={() => setDragOverComp(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOverComp(false);
              if (!disabled && !uploadingComp) handleUploadFiles(e.dataTransfer.files, 'comprovante');
            }}
            onClick={() => !disabled && !uploadingComp && fileInputCompRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-3 text-center transition-all ${
              dragOverComp
                ? 'border-emerald-600 bg-emerald-100/70 scale-[0.99]'
                : 'border-emerald-300/80 bg-white hover:bg-emerald-50/50 hover:border-emerald-500'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {uploadingComp ? (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-emerald-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando comprovante(s)...
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-1.5">
                <div className="p-2 bg-emerald-100 rounded-full text-emerald-700 mb-1">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-zinc-800">
                  Clique ou arraste o Comprovante de Pagamento
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  PDF, Imagens (PNG, JPG) • Permite múltiplos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Comprovantes Anexados */}
        {compList.length > 0 && (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {compList.map(item => (
              <div
                key={item.id || item.url}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden min-w-0 pr-2">
                  <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-semibold text-zinc-800 truncate" title={item.nome}>
                      {item.nome}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatBytes(item.tamanho)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAnexo(item.url, item.nome)}
                    className="p-1 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                    title="Visualizar comprovante"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAnexo(item)}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remover comprovante"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
