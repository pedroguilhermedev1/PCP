import { Fatura } from "../domain/Fatura";
import { FaturaRepository } from "../application/FaturaRepository";

let MOCK_FATURAS: Fatura[] = [
  {
    id: "F-001",
    categoria: "Serviço",
    marca: "IS",
    fornecedor: "THEODORO GÁS",
    cnpj: "67549717000168",
    data_emissao: "2026-02-26",
    data_recebimento: "2026-02-26",
    data_vencimento: "2026-03-13",
    numero_documento: "8142",
    valor: 374.00,
    centro_custo: "3073",
    filial: "100111",
    tipo_documento: "NFP",
    tipo_servico: "ÁGUA GALÃO",
    codigo_servico: "00010026",
    responsavel: "Financeiro",
    forma_pagamento: "PIX",
    possui_encargo: false,
    status_pagamento: "Em andamento"
  }
];

export class MockFaturaRepository implements FaturaRepository {
  async getFaturas(): Promise<Fatura[]> {
    return Promise.resolve([...MOCK_FATURAS]);
  }

  async saveFatura(fatura: Fatura): Promise<void> {
    MOCK_FATURAS.push(fatura);
    return Promise.resolve();
  }

  async updateFatura(id: string, fatura: Partial<Fatura>): Promise<void> {
    const index = MOCK_FATURAS.findIndex(f => f.id === id);
    if (index >= 0) {
      MOCK_FATURAS[index] = { ...MOCK_FATURAS[index], ...fatura };
    }
    return Promise.resolve();
  }

  async deleteFatura(id: string): Promise<void> {
    MOCK_FATURAS = MOCK_FATURAS.filter(f => f.id !== id);
    return Promise.resolve();
  }
}

export const faturaRepository = new MockFaturaRepository();


