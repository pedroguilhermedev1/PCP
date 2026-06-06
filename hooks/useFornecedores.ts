"use client";

import { useEffect, useState } from "react";

export type Fornecedor = {
  id: string;
  tipo: 'Material' | 'Serviço';
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  contato: string;
  telefone: string;
  email: string;
  categoria: string;
  observacoes: string;
  created_at: string;
};

export function useFornecedores(tipoFiltro?: 'Material' | 'Serviço') {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('fornecedores_db');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (tipoFiltro) {
          setFornecedores(parsed.filter((f: Fornecedor) => f.tipo === tipoFiltro));
        } else {
          setFornecedores(parsed);
        }
      } catch (e) {
        console.error("Failed to parse fornecedores:", e);
      }
    }
  }, [tipoFiltro]);

  const saveToStorage = (data: Fornecedor[]) => {
    // If we filtered, we need to update the main list
    const allDataRaw = localStorage.getItem('fornecedores_db');
    let allData: Fornecedor[] = allDataRaw ? JSON.parse(allDataRaw) : [];
    
    if (tipoFiltro) {
      const otherData = allData.filter(f => f.tipo !== tipoFiltro);
      const combined = [...otherData, ...data];
      localStorage.setItem('fornecedores_db', JSON.stringify(combined));
    } else {
      localStorage.setItem('fornecedores_db', JSON.stringify(data));
    }
  };

  const addFornecedor = (f: Omit<Fornecedor, 'id' | 'created_at'>) => {
    const newFornecedor: Fornecedor = {
      ...f,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    const updated = [...fornecedores, newFornecedor];
    setFornecedores(updated);
    saveToStorage(updated);
    return newFornecedor;
  };

  const deleteFornecedor = (id: string) => {
    const updated = fornecedores.filter(f => f.id !== id);
    setFornecedores(updated);
    saveToStorage(updated);
  };

  const updateFornecedor = (id: string, updates: Partial<Fornecedor>) => {
    const updated = fornecedores.map(f => f.id === id ? { ...f, ...updates } : f);
    setFornecedores(updated);
    saveToStorage(updated);
  };

  return {
    fornecedores,
    addFornecedor,
    deleteFornecedor,
    updateFornecedor
  };
}
