import { Fatura } from "../domain/Fatura";

export interface FaturaRepository {
  getFaturas(): Promise<Fatura[]>;
  saveFatura(fatura: Fatura): Promise<void>;
  updateFatura(id: string, fatura: Partial<Fatura>): Promise<void>;
  deleteFatura(id: string): Promise<void>;
}
