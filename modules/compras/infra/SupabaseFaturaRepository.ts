import { Fatura } from "../domain/Fatura";
import { FaturaRepository } from "../application/FaturaRepository";
import { supabase } from "@/lib/supabase";

export class SupabaseFaturaRepository implements FaturaRepository {
  async getFaturas(): Promise<Fatura[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('faturas')
      .select('*');
      
    if (error) {
      console.error('Error fetching faturas:', error);
      return [];
    }
    
    // Extract categoria from ID if present, otherwise fallback to 'Serviço'
    return (data as any[]).map(d => {
      let categoria = 'Serviço';
      if (typeof d.id === 'string' && d.id.includes('__CAT__')) {
        categoria = d.id.split('__CAT__')[1];
      }
      return {
        ...d,
        categoria: d.categoria || categoria
      };
    }) as Fatura[];
  }

  async saveFatura(fatura: Fatura): Promise<void> {
    if (!supabase) return;
    
    const { categoria, identificador, ...faturaData } = fatura as any;
    
    // Ensure text fields are explicitly populated to avoid not-null constraint errors
    const sanitizedData = {
      ...faturaData,
      fornecedor: faturaData.fornecedor || '',
      cnpj: faturaData.cnpj || '',
      centro_custo: faturaData.centro_custo || '',
      filial: faturaData.filial || '',
      tipo_documento: faturaData.tipo_documento || '',
      tipo_servico: faturaData.tipo_servico || '',
      codigo_servico: faturaData.codigo_servico || '',
      responsavel: faturaData.responsavel || '',
      forma_pagamento: faturaData.forma_pagamento || 'Boleto',
      numero_documento: faturaData.numero_documento || '',
      data_emissao: faturaData.data_emissao || null,
      data_recebimento: faturaData.data_recebimento || null,
      data_vencimento: faturaData.data_vencimento || null,
      valor: faturaData.valor || 0,
      conta_protheus: faturaData.conta_protheus || null,
      desc_conta_protheus: faturaData.desc_conta_protheus || null,
      insumos: faturaData.insumos || []
    };
    
    // Convert undefined to null or omit, as supabase expects certain formats
    const { error } = await supabase
      .from('faturas')
      .upsert([sanitizedData]);
      
    if (error) {
      console.error('Error saving fatura:', error);
      throw new Error(error.message);
    }
  }

  async updateFatura(id: string, fatura: Partial<Fatura>): Promise<void> {
    if (!supabase) return;
    
    const { categoria, ...faturaData } = fatura as any;

    const { error } = await supabase
      .from('faturas')
      .update({
        ...faturaData,
        ...(faturaData.cnpj === null ? { cnpj: '' } : {}),
        ...(faturaData.fornecedor === null ? { fornecedor: '' } : {})
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating fatura:', error);
      throw new Error(error.message);
    }
  }

  async deleteFatura(id: string): Promise<void> {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('faturas')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting fatura:', error);
      throw new Error(error.message);
    }
  }
}

export const faturaRepository = new SupabaseFaturaRepository();
