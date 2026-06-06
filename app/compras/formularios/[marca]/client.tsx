"use client";

import { Box, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInsumosMovimentacoes } from "@/hooks/useInsumos";
import { useEstoqueInsumos } from "@/hooks/useEstoqueInsumos";

export function FormulariosModuleClient({ marca }: { marca: string }) {
  const cdTarget = (marca === 'sas' || marca === 'sae') ? `JDI-${marca.toUpperCase()}` : marca.toUpperCase();
  const { insumos } = useEstoqueInsumos(cdTarget);

  const [responsavel, setResponsavel] = useState("");
  const [tipo, setTipo] = useState<'Entrada' | 'Saída'>('Entrada');
  const [codigo, setCodigo] = useState("");
  const [item, setItem] = useState("");
  const [quantidade, setQuantidade] = useState<number | "">("");
  const [setor, setSetor] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [justificativa, setJustificativa] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const { addMovimentacao } = useInsumosMovimentacoes();

  const formalMarca = marca === 'raizes' ? 'Raízes' : marca.toUpperCase();

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (user) {
      setResponsavel(user);
    } else {
      setResponsavel("Usuário não identificado");
    }
  }, []);

  useEffect(() => {
    setSolicitante(responsavel);
  }, [responsavel]);

  const setoresBase = ["Expedição", "CIQ", "Estoque", "Recebimento", "PMM"];
  const isPrivileged = responsavel.startsWith('pedro.queiroz') || responsavel.startsWith('francisco.edson');
  const setores = isPrivileged ? [...setoresBase, "Ajuste de Inventário"] : setoresBase;

  useEffect(() => {
    // When item changes, set the code automatically.
    const selected = insumos.find(i => i.item === item);
    if (selected) {
      setCodigo(selected.codigo);
    } else {
      setCodigo("");
    }
  }, [item, insumos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!item || !quantidade || !tipo) {
      setErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    if (tipo === 'Saída' && (!setor || !justificativa || !solicitante)) {
      setErrorMsg("Para saídas, preencha setor responsável, solicitante e justificativa.");
      return;
    }

    addMovimentacao({
      responsavel,
      marca,
      tipo,
      item,
      codigo,
      quantidade: Number(quantidade),
      setor: tipo === 'Saída' ? setor : undefined,
      solicitante: tipo === 'Saída' ? solicitante : undefined,
      justificativa: tipo === 'Saída' ? justificativa : undefined
    });

    setSuccessMsg(`Solicitação de ${tipo.toLowerCase()} registrada com sucesso em ${formalMarca}!`);
    setTimeout(() => setSuccessMsg(""), 5000);

    // Reset form
    setItem("");
    setCodigo("");
    setQuantidade("");
    setSetor("");
    setSolicitante("");
    setJustificativa("");
    setTipo("Entrada");
  };


  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-2 rounded-lg text-purple-900">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Formulários - {formalMarca}</h1>
            <p className="text-sm text-zinc-500">Solicitação de Entrada e Saída de Insumos.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full flex justify-center items-start">
        <div className="w-full max-w-2xl mt-4">
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-3 border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-3 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-lg font-bold text-zinc-800">Nova Solicitação</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Responsável identificado automaticamente: <span className="font-semibold text-purple-700">{responsavel}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Tipo de Movimentação *</label>
                    <div className="flex bg-zinc-100 p-1 rounded-md">
                      <button
                        type="button"
                        onClick={() => setTipo('Entrada')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                          tipo === 'Entrada' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipo('Saída')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                          tipo === 'Saída' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Saída
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Quantidade *</label>
                    <Input 
                      type="number" 
                      min="1"
                      required
                      placeholder="0"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value ? Number(e.target.value) : "")}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Item / Material *</label>
                    <select 
                      required
                      value={item}
                      onChange={(e) => setItem(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Selecione um item...</option>
                      {insumos.map(mat => (
                        <option key={mat.id} value={mat.item}>{mat.item}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Código</label>
                    <Input 
                      disabled
                      type="text" 
                      value={codigo}
                      placeholder="Preenchido automaticamente"
                      className="w-full bg-zinc-50"
                    />
                  </div>
                </div>

                {tipo === 'Saída' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Setor Responsável *</label>
                        <select 
                          required
                          value={setor}
                          onChange={(e) => setSetor(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2"
                        >
                          <option value="" disabled>Selecione...</option>
                          {setores.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Solicitante</label>
                        <Input 
                          disabled
                          type="text" 
                          value={solicitante}
                          className="w-full bg-zinc-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Justificativa / Motivo *</label>
                      <textarea 
                        required
                        className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 resize-y"
                        placeholder="Descreva o motivo desta solicitação..."
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                      />
                    </div>
                  </>
                )}

              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  Registrar Solicitação
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
