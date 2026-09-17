import { useState } from "react";
import { X, AlertCircle, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export function ImportarInsumosModal({ 
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
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string>("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          throw new Error("A planilha está vazia.");
        }

        const parsedData = data.map((row: any) => ({
          codigo: row['Código'] || '-',
          item: row['Descrição'] || row['Item'] || '',
          categoria: row['Categoria'] || 'Geral',
          unidade: row['UN de medida'] || row['Unidade'] || 'UN',
          estoque_real: row['Estoque Atual'] !== undefined ? row['Estoque Atual'] : 0,
          estoque_minimo: row['Estoque Mínimo'] !== undefined ? row['Estoque Mínimo'] : 0,
        })).filter((row) => row.item); // Remove empty rows

        if (parsedData.length === 0) {
          throw new Error("Nenhum item válido encontrado. Verifique os nomes das colunas (Descrição, Estoque Atual, etc).");
        }

        setPreviewData(parsedData);
      } catch (err: any) {
        setError(err.message || "Erro ao processar a planilha.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/estoque/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cd: defaultCd,
          items: previewData
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Erro ao importar dados.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPreviewData(null);
    setFileName("");
    setError(null);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Código": "78910",
        "Descrição": "Etiqueta Zebra 10x15",
        "Categoria": "Etiquetas",
        "UN de medida": "CX",
        "Estoque Atual": 150,
        "Estoque Mínimo": 50
      },
      {
        "Código": "-",
        "Descrição": "Fita Adesiva Transparente",
        "Categoria": "Fita Adesiva",
        "UN de medida": "UN",
        "Estoque Atual": 30,
        "Estoque Mínimo": 10
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo_Insumos");
    XLSX.writeFile(wb, "PCP_Modelo_Importacao_Insumos.xlsx");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-zinc-200">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Importar Insumos via Excel
          </h2>
          <button type="button" onClick={onClose} disabled={loading} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          
          {!previewData ? (
            <div className="flex flex-col gap-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                <p className="font-semibold mb-2">Instruções para Importação:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Não altere o nome das colunas do modelo.</li>
                  <li>A coluna <strong>Descrição</strong> é obrigatória.</li>
                  <li>Se o item não tiver Código, deixe em branco (ou use `-`).</li>
                  <li>O estoque atual enviado <strong>sobrescreverá</strong> o estoque atual no sistema.</li>
                </ul>
                <Button 
                  onClick={handleDownloadTemplate} 
                  variant="outline" 
                  size="sm"
                  className="mt-3 bg-white text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                >
                  <Download className="w-4 h-4 mr-2" /> Baixar Planilha Modelo
                </Button>
              </div>

              <label className="cursor-pointer border-2 border-dashed border-zinc-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                <Upload className="w-8 h-8 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-700">Clique para selecionar a planilha</p>
                  <p className="text-xs text-zinc-500 mt-1">Formatos aceitos: .xlsx, .csv</p>
                </div>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden"
                  onChange={handleFileUpload}
                  title=""
                />
              </label>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col items-center text-center">
              <p className="text-sm font-medium text-purple-900 mb-1">
                Planilha processada com sucesso!
              </p>
              <p className="text-xs text-purple-700">
                Arquivo: <strong>{fileName}</strong>
              </p>
              <div className="mt-4 bg-white px-4 py-3 rounded-lg border border-purple-100 w-full">
                <p className="text-2xl font-bold text-purple-700">{previewData.length}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Itens encontrados</p>
              </div>
              <p className="text-xs text-zinc-500 mt-4 max-w-sm">
                Atenção: Itens que já existem no CD ({defaultCd}) terão seu estoque atualizado (sobrescrito). Novos itens serão inseridos.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex gap-3 justify-end border-t border-zinc-100 bg-zinc-50">
          <Button type="button" variant="outline" onClick={() => { previewData ? resetState() : onClose() }} disabled={loading}>
            {previewData ? "Cancelar Arquivo" : "Cancelar"}
          </Button>
          <Button 
            type="button" 
            onClick={handleImport} 
            disabled={!previewData || loading} 
            className="bg-purple-700 hover:bg-purple-800 text-white"
          >
            {loading ? "Importando..." : "Confirmar e Importar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
