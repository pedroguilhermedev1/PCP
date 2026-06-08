"use client";

import { useState, useEffect } from "react";
import { Box, Download, FileSpreadsheet, Search, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type ReportType = 'fornecedores' | 'produtos' | 'movimentacoes' | 'faturas';

export function RelatoriosClient() {
  const [activeTab, setActiveTab] = useState<ReportType>('fornecedores');
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    // Reset data when tab changes
    setData([]);
    setPage(1);
  }, [activeTab]);

  const handleSearch = async () => {
    if (!dataInicial || !dataFinal) {
      toast.error("Selecione a data inicial e final.");
      return;
    }
    
    setLoading(true);
    setPage(1);
    
    try {
      let query;
      const start = `${dataInicial}T00:00:00`;
      const end = `${dataFinal}T23:59:59`;

      if (!supabase) throw new Error("Supabase não inicializado.");

      if (activeTab === 'fornecedores') {
        query = supabase.from('fornecedores')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at', { ascending: false });
      } else if (activeTab === 'produtos') {
        query = supabase.from('estoque_insumos')
          .select('*')
          .gte('data_cadastro', dataInicial)
          .lte('data_cadastro', dataFinal)
          .order('data_cadastro', { ascending: false });
      } else if (activeTab === 'movimentacoes') {
        query = supabase.from('estoque_movimentacoes')
          .select('*')
          .gte('data_hora', start)
          .lte('data_hora', end)
          .order('data_hora', { ascending: false });
      } else if (activeTab === 'faturas') {
        query = supabase.from('faturas')
          .select('*')
          .gte('data_emissao', dataInicial)
          .lte('data_emissao', dataFinal)
          .order('data_emissao', { ascending: false });
      }

      if (query) {
        const { data: result, error } = await query;
        if (error) throw new Error(error.message);
        setData(result || []);
        if (result?.length === 0) {
          toast.info("Nenhum dado encontrado para o período.");
        }
      }
    } catch (err: any) {
      toast.error(`Erro ao buscar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.warning("Não há dados para exportar.");
      return;
    }
    
    let exportData: any[] = [];
    
    if (activeTab === 'fornecedores') {
      exportData = data.map(d => ({
        "Nome": d.nome,
        "CNPJ": d.cnpj,
        "Contato": d.contato,
        "Data Cadastro": new Date(d.created_at).toLocaleDateString('pt-BR'),
        "Status": d.status
      }));
    } else if (activeTab === 'produtos') {
      exportData = data.map(d => ({
        "Código": d.codigo,
        "Descrição": d.item,
        "Categoria": d.categoria || 'Geral',
        "Estoque Atual": d.estoque_real,
        "Estoque Mínimo": d.estoque_minimo,
        "Data Cadastro": new Date(d.data_cadastro).toLocaleDateString('pt-BR')
      }));
    } else if (activeTab === 'movimentacoes') {
      exportData = data.map(d => ({
        "ID": d.identificador,
        "Data": new Date(d.data_hora).toLocaleDateString('pt-BR'),
        "Tipo": d.tipo,
        "Produto": d.item,
        "Quantidade": d.quantidade,
        "Usuário Responsável": d.usuario,
        "Observações": d.observacoes || '-'
      }));
    } else if (activeTab === 'faturas') {
      exportData = data.map(d => ({
        "Número da Fatura": d.numero_documento,
        "Fornecedor": d.fornecedor,
        "Data de Emissão": d.data_emissao,
        "Data de Vencimento": d.data_vencimento,
        "Valor": d.valor,
        "Status": d.status_pagamento
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, `Relatorio_${activeTab}_${dataInicial}_${dataFinal}.xlsx`);
  };

  // Paginacao
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/30">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-purple-200 p-2 rounded-lg text-purple-900">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 leading-tight">Relatórios Gerenciais</h1>
            <p className="text-sm text-zinc-500">Extração e análise de dados consolidados</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
          
          <div className="border-b border-zinc-200 px-4 py-2 flex flex-wrap gap-2 bg-zinc-50/50 rounded-t-xl">
            {['fornecedores', 'produtos', 'movimentacoes', 'faturas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as ReportType)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white shadow-sm border border-zinc-200 text-purple-700'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Data Inicial</label>
                <Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className="w-[160px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Data Final</label>
                <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className="w-[160px]" />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="bg-purple-700 hover:bg-purple-800 text-white gap-2">
                {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Gerar Relatório
              </Button>
              <div className="flex-1" />
              <Button onClick={handleExport} variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50" disabled={data.length === 0}>
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
            </div>

            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    {activeTab === 'fornecedores' && (
                      <>
                        <TableHead>Nome</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {activeTab === 'produtos' && (
                      <>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                      </>
                    )}
                    {activeTab === 'movimentacoes' && (
                      <>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Observações</TableHead>
                      </>
                    )}
                    {activeTab === 'faturas' && (
                      <>
                        <TableHead>Nº Fatura</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Dt Emissão</TableHead>
                        <TableHead>Dt Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                        <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : currentData.length > 0 ? (
                    currentData.map((d, i) => (
                      <TableRow key={i}>
                        {activeTab === 'fornecedores' && (
                          <>
                            <TableCell className="font-medium">{d.nome}</TableCell>
                            <TableCell>{d.cnpj}</TableCell>
                            <TableCell>{d.contato}</TableCell>
                            <TableCell>{new Date(d.created_at).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{d.status}</TableCell>
                          </>
                        )}
                        {activeTab === 'produtos' && (
                          <>
                            <TableCell className="font-medium font-mono">{d.codigo}</TableCell>
                            <TableCell>{d.item}</TableCell>
                            <TableCell>{d.categoria || 'Geral'}</TableCell>
                            <TableCell className="font-bold">{d.estoque_real}</TableCell>
                            <TableCell>{d.estoque_minimo}</TableCell>
                            <TableCell>{new Date(d.data_cadastro).toLocaleDateString('pt-BR')}</TableCell>
                          </>
                        )}
                        {activeTab === 'movimentacoes' && (
                          <>
                            <TableCell>{new Date(d.data_hora).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-bold rounded-md ${d.tipo === 'Entrada' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                {d.tipo}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{d.item}</TableCell>
                            <TableCell className="font-bold">{d.quantidade}</TableCell>
                            <TableCell>{d.usuario}</TableCell>
                            <TableCell className="text-zinc-500 text-xs truncate max-w-[150px]">{d.observacoes || '-'}</TableCell>
                          </>
                        )}
                        {activeTab === 'faturas' && (
                          <>
                            <TableCell className="font-medium">{d.numero_documento}</TableCell>
                            <TableCell>{d.fornecedor}</TableCell>
                            <TableCell>{new Date(d.data_emissao).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{new Date(d.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>R$ {d.valor?.toFixed(2)}</TableCell>
                            <TableCell>{d.status_pagamento}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                        Nenhum dado encontrado ou gere o relatório.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 border-t border-zinc-100 pt-4">
                <span className="text-sm text-zinc-500">
                  Mostrando {(page - 1) * itemsPerPage + 1} até {Math.min(page * itemsPerPage, data.length)} de {data.length} resultados
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <span className="text-sm font-medium px-4">
                    Página {page} de {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Próxima <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
