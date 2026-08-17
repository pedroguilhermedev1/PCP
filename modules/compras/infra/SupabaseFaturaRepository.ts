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
        if (categoria === 'Servico') categoria = 'Serviço';
      }
      return {
        ...d,
        categoria: d.categoria || categoria,
        codigo_fatura: d.tipo_documento,
        tipo_documento: undefined,
        pc_nexa_concluido: d.nexa_pc_concluido,
        numero_pc_nexa: d.nexa_pc_numero,
        data_pc_nexa: d.nexa_pc_data,
        usuario_pc_nexa: d.nexa_pc_usuario,
        nexa_pc_concluido: undefined,
        nexa_pc_numero: undefined,
        nexa_pc_data: undefined,
        nexa_pc_usuario: undefined
      };
    }) as Fatura[];
  }

  async saveFatura(fatura: Fatura): Promise<void> {
    if (!supabase) return;
    
    const { categoria, identificador, cd, codigo_fornecedor, status, data_pagamento_ideal, etapa, tipo_servico, codigo_fatura, ...faturaData } = fatura as any;

    let nextCodigoFatura = codigo_fatura;
    if (!nextCodigoFatura && !faturaData.id?.includes('FAT-') && !faturaData.id?.match(/^[a-zA-Z0-9-]+$/)) {
      // It's a new fatura, let's generate FAT-XXXXXX
      const { data: lastFatura } = await supabase
        .from('faturas')
        .select('tipo_documento')
        .ilike('tipo_documento', 'FAT-%')
        .order('tipo_documento', { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (lastFatura && lastFatura.length > 0 && lastFatura[0].tipo_documento) {
        const match = lastFatura[0].tipo_documento.match(/FAT-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
      nextCodigoFatura = `FAT-${String(nextNum).padStart(6, '0')}`;
    }
    
    // Ensure text fields are explicitly populated to avoid not-null constraint errors
    const sanitizedData = {
      ...faturaData,
      fornecedor: faturaData.fornecedor || '',
      cnpj: faturaData.cnpj || '',
      centro_custo: faturaData.centro_custo || '',
      filial: faturaData.filial || '',
      tipo_documento: nextCodigoFatura || '',
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
      conta_contabil: faturaData.conta_contabil || null,
      descricao_contabil: faturaData.descricao_contabil || null,
      is_sap: faturaData.is_sap || false,
      insumos: faturaData.insumos || [],
      motivo_desvio: faturaData.motivo_desvio || null,
      acao_corretiva: faturaData.acao_corretiva || null,
      acao_responsavel: faturaData.acao_responsavel || null,
      acao_status: faturaData.acao_status || null,
      fluxo_iniciado_por: faturaData.fluxo_iniciado_por || 'SAP',
      nexa_pc_concluido: faturaData.pc_nexa_concluido || false,
      nexa_pc_numero: faturaData.numero_pc_nexa || null,
      nexa_pc_data: faturaData.data_pc_nexa || null,
      nexa_pc_usuario: faturaData.usuario_pc_nexa || null,
      nexa_lancamento_concluido: faturaData.nexa_lancamento_concluido || false,
      nexa_data_conclusao_lancamento: faturaData.nexa_data_conclusao_lancamento || null,
      nexa_pagamento_programado: faturaData.nexa_pagamento_programado || false,
      nexa_data_prevista_pagamento: faturaData.nexa_data_prevista_pagamento || null,
      nexa_pagamento_realizado: faturaData.nexa_pagamento_realizado || false
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
    const { categoria, identificador, cd, codigo_fornecedor, status, data_pagamento_ideal, etapa, tipo_servico, ...faturaData } = fatura as any;

    const mappedData = { ...faturaData };
    if ('pc_nexa_concluido' in mappedData) { mappedData.nexa_pc_concluido = mappedData.pc_nexa_concluido; delete mappedData.pc_nexa_concluido; }
    if ('numero_pc_nexa' in mappedData) { mappedData.nexa_pc_numero = mappedData.numero_pc_nexa; delete mappedData.numero_pc_nexa; }
    if ('data_pc_nexa' in mappedData) { mappedData.nexa_pc_data = mappedData.data_pc_nexa; delete mappedData.data_pc_nexa; }
    if ('usuario_pc_nexa' in mappedData) { mappedData.nexa_pc_usuario = mappedData.usuario_pc_nexa; delete mappedData.usuario_pc_nexa; }
    
    delete mappedData.usuario_nexa_lancamento;
    delete mappedData.usuario_nexa_programacao;
    delete mappedData.usuario_nexa_pagamento;

    const { error } = await supabase
      .from('faturas')
      .update({
        ...mappedData,
        ...(mappedData.cnpj === null ? { cnpj: '' } : {}),
        ...(mappedData.fornecedor === null ? { fornecedor: '' } : {})
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
