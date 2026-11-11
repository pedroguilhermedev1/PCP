"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Package, 
  Truck, 
  Calendar as CalendarIcon, 
  FileText, 
  User, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  PlusCircle, 
  ArrowRight,
  Hash,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstoqueInsumo } from "@/hooks/useEstoqueInsumos";
import { useFornecedores } from "@/hooks/useFornecedores";
import { extrairMetaDeObservacoes } from "@/lib/previsaoRecebimento";
import { cn } from "@/lib/utils";

interface RecebimentoTabProps {
  cd: string;
  cdName: string;
  insumos: EstoqueInsumo[];
  responsavel: string;
  onSuccess?: () => void;
}

export function RecebimentoTab({
  cd,
  cdName,
  insumos,
  responsavel,
  onSuccess
}: RecebimentoTabProps) {
  const { fornecedores } = useFornecedores();

  // Estados do formulário
  const [selectedInsumo, setSelectedInsumo] = useState<EstoqueInsumo | null>(null);
  const [insumoSearch, setInsumoSearch] = useState("");
  const [isSearchingInsumo, setIsSearchingInsumo] = useState(false);

  const [quantidade, setQuantidade] = useState<number | "">("");
  const [dataRecebimento, setDataRecebimento] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [documento, setDocumento] = useState("");
  const [pessoaRecebeu, setPessoaRecebeu] = useState("");

  const [selectedFornecedor, setSelectedFornecedor] = useState<string>("");
  const [fornecedorSearch, setFornecedorSearch] = useState("");
  const [isSearchingFornecedor, setIsSearchingFornecedor] = useState(false);

  // Estados de feedback e submissão
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Histórico de recebimentos
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const insumoDropdownRef = useRef<HTMLDivElement>(null);
  const fornecedorDropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (insumoDropdownRef.current && !insumoDropdownRef.current.contains(e.target as Node)) {
        setIsSearchingInsumo(false);
      }
      if (fornecedorDropdownRef.current && !fornecedorDropdownRef.current.contains(e.target as Node)) {
        setIsSearchingFornecedor(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carregar histórico de recebimentos do CD
  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const res = await fetch(`/api/recebimento?cd=${encodeURIComponent(cd)}&limit=30`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setHistorico(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de recebimentos:", err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [cd]);

  // Lista de insumos filtrada
  const filteredInsumos = useMemo(() => {
    if (!insumoSearch.trim()) return insumos.slice(0, 30);
    const term = insumoSearch.toLowerCase();
    return insumos.filter(
      (i) =>
        (i.codigo && i.codigo.toLowerCase().includes(term)) ||
        (i.item && i.item.toLowerCase().includes(term))
    ).slice(0, 30);
  }, [insumos, insumoSearch]);

  // Lista de fornecedores filtrada
  const filteredFornecedores = useMemo(() => {
    const list = fornecedores.map(f => f.nome_fantasia || f.razao_social).filter(Boolean);
    const unique = Array.from(new Set(list));
    if (!fornecedorSearch.trim()) return unique.slice(0, 30);
    const term = fornecedorSearch.toLowerCase();
    return unique.filter(f => f.toLowerCase().includes(term)).slice(0, 30);
  }, [fornecedores, fornecedorSearch]);

  // Submeter recebimento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!selectedInsumo) {
      setErrorMsg("Por favor, selecione um insumo.");
      return;
    }

    const qtdNum = Number(quantidade);
    if (!qtdNum || qtdNum <= 0) {
      setErrorMsg("Por favor, informe uma quantidade válida maior que zero.");
      return;
    }

    if (!dataRecebimento) {
      setErrorMsg("Por favor, selecione a data de recebimento.");
      return;
    }

    if (!documento.trim()) {
      setErrorMsg("Por favor, informe o documento fiscal ou identificador (NF).");
      return;
    }

    if (!pessoaRecebeu.trim()) {
      setErrorMsg("Por favor, informe a pessoa que recebeu fisicamente o material.");
      return;
    }

    if (!selectedFornecedor.trim()) {
      setErrorMsg("Por favor, selecione ou informe o fornecedor.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        cd,
        codigo: selectedInsumo.codigo,
        item: selectedInsumo.item,
        quantidade: qtdNum,
        data_recebimento: dataRecebimento,
        documento: documento.trim(),
        pessoa_recebeu: pessoaRecebeu.trim(),
        fornecedor: selectedFornecedor.trim(),
        usuario: responsavel || "Usuário do Recebimento"
      };

      const res = await fetch("/api/recebimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Erro ao registrar o recebimento.");
      }

      setSuccessMsg(result.mensagem || "Recebimento registrado com sucesso no estoque!");

      // Limpar formulário mantendo a data e recarregar
      setSelectedInsumo(null);
      setInsumoSearch("");
      setQuantidade("");
      setDocumento("");
      setPessoaRecebeu("");
      setSelectedFornecedor("");
      setFornecedorSearch("");

      if (onSuccess) onSuccess();
      carregarHistorico();

    } catch (err: any) {
      setErrorMsg(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatBrDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
    const parts = clean.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Banner explicativo */}
      <div className="bg-purple-900 text-white rounded-2xl p-6 shadow-md border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-800/80 text-purple-200 text-xs font-semibold mb-1">
            <Truck className="w-3.5 h-3.5" />
            Entrada Física Direta de Materiais
          </div>
          <h2 className="text-xl font-bold tracking-tight">Recebimento de Insumos — CD {cdName}</h2>
          <p className="text-sm text-purple-200 max-w-2xl">
            Registre diretamente os materiais recebidos fisicamente na unidade. A quantidade informada
            é incorporada imediatamente ao saldo do estoque deste Centro de Distribuição.
          </p>
        </div>

        <div className="bg-purple-950/60 border border-purple-700/50 rounded-xl p-3.5 text-xs text-purple-200 shrink-0 flex items-center gap-3">
          <div className="p-2 bg-purple-700/60 rounded-lg text-white">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-300 block">Usuário Responsável</span>
            <span className="font-semibold text-white">{responsavel || "Não identificado"}</span>
          </div>
        </div>
      </div>

      {/* Alertas de Sucesso / Erro */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-3 border border-emerald-200 shadow-xs animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl flex items-center gap-3 border border-red-200 shadow-xs animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Formulário de Registro de Recebimento */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base leading-tight">Novo Registro de Recebimento</h3>
              <p className="text-xs text-zinc-500">Preencha os campos abaixo com os dados físicos da entrega.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Insumo (Seleção com pesquisa) */}
            <div className="space-y-1.5 relative" ref={insumoDropdownRef}>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-600" />
                1. Insumo <span className="text-red-500">*</span>
              </label>

              {selectedInsumo ? (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-purple-950 truncate">{selectedInsumo.item}</p>
                    <p className="text-[11px] text-purple-700">
                      Código: <span className="font-mono font-semibold">{selectedInsumo.codigo}</span> · Saldo atual: <span className="font-bold">{selectedInsumo.estoque_real ?? 0} {selectedInsumo.unidade || 'un'}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-100 shrink-0"
                    onClick={() => {
                      setSelectedInsumo(null);
                      setInsumoSearch("");
                    }}
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Pesquisar por código ou descrição..."
                    value={insumoSearch}
                    onChange={(e) => {
                      setInsumoSearch(e.target.value);
                      setIsSearchingInsumo(true);
                    }}
                    onFocus={() => setIsSearchingInsumo(true)}
                    className="pl-9 h-11 rounded-xl text-sm border-zinc-200 focus:ring-purple-500"
                  />

                  {isSearchingInsumo && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                      {filteredInsumos.length > 0 ? (
                        filteredInsumos.map((ins) => (
                          <div
                            key={ins.id || ins.codigo}
                            onClick={() => {
                              setSelectedInsumo(ins);
                              setIsSearchingInsumo(false);
                            }}
                            className="p-3 hover:bg-purple-50/80 cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="truncate mr-3">
                              <p className="font-bold text-zinc-900 truncate">{ins.item}</p>
                              <p className="text-zinc-500 font-mono text-[11px]">Cód: {ins.codigo}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded shrink-0">
                              Saldo: {ins.estoque_real ?? 0} {ins.unidade || 'un'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          Nenhum insumo encontrado para este CD.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Quantidade Recebida */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-600" />
                2. Quantidade Recebida <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0.01"
                step="any"
                placeholder="Ex: 50"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value === "" ? "" : Number(e.target.value))}
                className="h-11 rounded-xl text-sm border-zinc-200 focus:ring-purple-500 font-semibold"
                required
              />
              <span className="text-[11px] text-zinc-400">
                Quantidade física que será adicionada ao estoque.
              </span>
            </div>

            {/* 3. Data de Recebimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
                3. Data de Recebimento <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={dataRecebimento}
                onChange={(e) => setDataRecebimento(e.target.value)}
                className="h-11 rounded-xl text-sm border-zinc-200 focus:ring-purple-500"
                required
              />
              <span className="text-[11px] text-zinc-400">
                Data em que a entrega física foi realizada.
              </span>
            </div>

            {/* 4. Fornecedor (Seleção com pesquisa) */}
            <div className="space-y-1.5 relative" ref={fornecedorDropdownRef}>
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                4. Fornecedor <span className="text-red-500">*</span>
              </label>

              {selectedFornecedor ? (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="text-xs font-bold text-purple-950 truncate">{selectedFornecedor}</p>
                    <p className="text-[11px] text-purple-700">Fornecedor selecionado</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-100 shrink-0"
                    onClick={() => {
                      setSelectedFornecedor("");
                      setFornecedorSearch("");
                    }}
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Pesquisar ou digitar fornecedor..."
                    value={fornecedorSearch}
                    onChange={(e) => {
                      setFornecedorSearch(e.target.value);
                      setIsSearchingFornecedor(true);
                    }}
                    onFocus={() => setIsSearchingFornecedor(true)}
                    className="pl-9 h-11 rounded-xl text-sm border-zinc-200 focus:ring-purple-500"
                  />

                  {isSearchingFornecedor && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-30 divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-100">
                      {filteredFornecedores.length > 0 ? (
                        filteredFornecedores.map((forn, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedFornecedor(forn);
                              setIsSearchingFornecedor(false);
                            }}
                            className="p-3 hover:bg-purple-50/80 cursor-pointer transition-colors text-xs font-medium text-zinc-800"
                          >
                            {forn}
                          </div>
                        ))
                      ) : (
                        fornecedorSearch.trim() && (
                          <div
                            onClick={() => {
                              setSelectedFornecedor(fornecedorSearch.trim());
                              setIsSearchingFornecedor(false);
                            }}
                            className="p-3 hover:bg-purple-50 text-xs text-purple-700 font-semibold cursor-pointer"
                          >
                            Usar &ldquo;{fornecedorSearch.trim()}&rdquo; como novo fornecedor
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Documento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                5. Documento <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: NF 145920"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="h-11 rounded-xl text-sm border-zinc-200 focus:ring-purple-500"
                required
              />
              <span className="text-[11px] text-zinc-400">
                Número do documento fiscal ou identificação da entrega.
              </span>
            </div>

            {/* 6. Pessoa que Recebeu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                6. Pessoa que Recebeu <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: Carlos Eduardo (Equipe CD)"
                value={pessoaRecebeu}
                onChange={(e) => setPessoaRecebeu(e.target.value)}
                className="h-11 rounded-xl text-sm border-zinc-200 focus:ring-purple-500"
                required
              />
              <span className="text-[11px] text-zinc-400">
                Pessoa que realizou a conferência física do material.
              </span>
            </div>

          </div>

          {/* Rodapé do Formulário */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>O registro incrementa imediatamente o saldo em estoque deste CD.</span>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold h-11 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 self-end sm:self-auto"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando no Estoque...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Registrar Recebimento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Histórico Recente de Recebimentos do CD (Padrão Visual Alinhado a Faturas) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8">
          <div>
            <h2 className="text-lg font-semibold text-purple-900">Histórico de Recebimentos Realizados</h2>
            <p className="text-xs text-zinc-500">Materiais recebidos fisicamente e incorporados ao estoque do CD {cdName}.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarHistorico}
            disabled={loadingHistorico}
            className="text-xs bg-white border-zinc-200 shadow-2xs hover:bg-zinc-50 h-9"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
            {loadingHistorico ? "Atualizando..." : "Atualizar Histórico"}
          </Button>
        </div>

        <div className="w-full overflow-x-auto bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <Table className="w-full">
            <TableHeader className="bg-zinc-50/80 border-b border-zinc-200">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="w-12 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">#</TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Data Recebimento</TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Insumo / Material</TableHead>
                <TableHead className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Qtd Recebida</TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Documento</TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Fornecedor</TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Recebido Por</TableHead>
                <TableHead className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Lançado Por</TableHead>
                <TableHead className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider h-12">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 py-6">
                      <Package className="w-8 h-8 text-zinc-300 stroke-1" />
                      <p className="text-sm font-semibold text-zinc-600">Nenhum recebimento registrado neste CD ainda</p>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        Os materiais recebidos fisicamente e cadastrados no formulário acima aparecerão aqui em tempo real.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                historico.map((h, index) => {
                  const { meta } = extrairMetaDeObservacoes(h.observacoes);
                  const metaAny = meta as any;
                  const doc = metaAny?.documento || h.identificador || "-";
                  const pessoa = metaAny?.pessoa_recebeu || "-";
                  const forn = metaAny?.fornecedor || "-";
                  const dataRec = metaAny?.data_recebimento ? formatBrDate(metaAny.data_recebimento) : formatBrDate(h.data_hora);

                  return (
                    <TableRow key={h.id} className="border-b border-zinc-100 hover:bg-purple-50/40 transition-colors h-14">
                      <TableCell className="text-center font-medium text-zinc-400 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-800 text-xs whitespace-nowrap">
                        {dataRec}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-zinc-900 text-xs leading-tight">{h.item}</span>
                          <span className="font-mono text-zinc-500 font-medium text-[11px]">
                            {h.codigo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-purple-50 text-purple-900 border border-purple-200/60 font-mono">
                          +{h.quantidade}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-zinc-700 font-medium text-xs bg-zinc-50 px-2 py-1 rounded border border-zinc-200/60">
                          {doc}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-zinc-800 text-xs">
                        {forn}
                      </TableCell>
                      <TableCell className="text-zinc-600 text-xs">
                        {pessoa}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">
                        {h.usuario || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          No Estoque
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
