import { Fatura, parseObservacoes, buildObservacoes } from "../domain/Fatura";
import { FaturaRepository } from "../application/FaturaRepository";
import { supabase } from "@/lib/supabase";

export class SupabaseFaturaRepository implements FaturaRepository {
  async getFaturas(): Promise<Fatura[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('faturas')
      .select('*')
      .or('excluido.is.null,excluido.eq.false');
      
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
      const parsedObs = parseObservacoes(d.observacoes);
      return {
        ...d,
        fiscal_observacao: parsedObs.fiscal_observacao,
        pagamento_observacao: parsedObs.pagamento_observacao,
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
        nexa_pc_usuario: undefined,
        is_backlog: !!d.motivo_desvio || !!d.acao_corretiva,
        pendencias: typeof d.pendencias === 'string' ? JSON.parse(d.pendencias) : (d.pendencias || []),
        ocorrencias: typeof d.ocorrencias === 'string' ? JSON.parse(d.ocorrencias) : (d.ocorrencias || []),
        historico_passagens: typeof d.historico_passagens === 'string' ? JSON.parse(d.historico_passagens) : (d.historico_passagens || {}),
        nexa_possui_rc: d.nexa_possui_rc || false,
        nexa_rc_numero: d.nexa_rc_numero || null,
        nexa_rc_data: d.nexa_rc_data || null,
        previsao_recebimento_dias_min: (() => {
          if (d.previsao_recebimento_dias_min) return d.previsao_recebimento_dias_min;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta && i.previsao_recebimento);
          return meta?.previsao_recebimento?.dias_min || undefined;
        })(),
        previsao_recebimento_dias_max: (() => {
          if (d.previsao_recebimento_dias_max) return d.previsao_recebimento_dias_max;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta && i.previsao_recebimento);
          return meta?.previsao_recebimento?.dias_max || undefined;
        })(),
        previsao_recebimento_data_inicio: (() => {
          if (d.previsao_recebimento_data_inicio) return d.previsao_recebimento_data_inicio;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta && i.previsao_recebimento);
          return meta?.previsao_recebimento?.data_inicio || undefined;
        })(),
        previsao_recebimento_data_fim: (() => {
          if (d.previsao_recebimento_data_fim) return d.previsao_recebimento_data_fim;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta && i.previsao_recebimento);
          return meta?.previsao_recebimento?.data_fim || undefined;
        })(),
        historico_previsao: (() => {
          if (d.historico_previsao) return d.historico_previsao;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta && i.previsao_recebimento);
          return meta?.previsao_recebimento?.historico || [];
        })(),
        categorias: (() => {
          if (Array.isArray(d.categorias) && d.categorias.length > 0) return d.categorias;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.categorias || [];
        })(),
        data_solicitacao: (() => {
          if (d.data_solicitacao) return d.data_solicitacao;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.data_solicitacao || meta?.previsao_recebimento?.data_criacao_original || d.data_recebimento || d.data_emissao || undefined;
        })(),
        anexos: (() => {
          if (Array.isArray(d.anexos)) return d.anexos;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          if (meta?.anexos && Array.isArray(meta.anexos)) return meta.anexos;
          const legacyUrl = d.anexo_url || meta?.anexo_url;
          if (legacyUrl) {
            return [{
              id: 'legacy-1',
              nome: d.anexo_nome || meta?.anexo_nome || 'documento.pdf',
              url: legacyUrl,
              tamanho: d.anexo_tamanho || meta?.anexo_tamanho,
              tipo: d.anexo_tipo || meta?.anexo_tipo,
              data_upload: d.anexo_data_upload || meta?.anexo_data_upload,
              categoria: 'documento' as const
            }];
          }
          return [];
        })(),
        anexo_nome: (() => {
          if (d.anexo_nome) return d.anexo_nome;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.anexo_nome || undefined;
        })(),
        anexo_url: (() => {
          if (d.anexo_url) return d.anexo_url;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.anexo_url || undefined;
        })(),
        anexo_tamanho: (() => {
          if (d.anexo_tamanho) return d.anexo_tamanho;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.anexo_tamanho || undefined;
        })(),
        anexo_tipo: (() => {
          if (d.anexo_tipo) return d.anexo_tipo;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.anexo_tipo || undefined;
        })(),
        anexo_data_upload: (() => {
          if (d.anexo_data_upload) return d.anexo_data_upload;
          const meta = (Array.isArray(d.insumos) ? d.insumos : []).find((i: any) => i && i._meta);
          return meta?.anexo_data_upload || undefined;
        })(),
      };
    }) as Fatura[];
  }

  async saveFatura(fatura: Fatura): Promise<void> {
    if (!supabase) return;
    
    const { categoria, identificador, codigo_fornecedor, status, data_pagamento_ideal, etapa, tipo_servico, codigo_fatura, anexos, ...faturaData } = fatura as any;

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
    
    const combinedObs = buildObservacoes(faturaData.fiscal_observacao, faturaData.pagamento_observacao, faturaData.observacoes);
    // Ensure text fields are explicitly populated to avoid not-null constraint errors
    const sanitizedData = {
      ...faturaData,
      observacoes: combinedObs || faturaData.observacoes || null,
      fornecedor: faturaData.fornecedor || '',
      cnpj: faturaData.cnpj || '',
      centro_custo: faturaData.centro_custo || '',
      filial: faturaData.filial || '',
      cd: faturaData.cd || null,
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
      origem: faturaData.origem || (faturaData.is_sap ? 'SAP' : 'Nexa'),
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
      nexa_pagamento_realizado: faturaData.nexa_pagamento_realizado || false,
      pendencias: faturaData.pendencias || [],
      ocorrencias: faturaData.ocorrencias || [],
      historico_passagens: faturaData.historico_passagens || {},
      nexa_possui_rc: faturaData.nexa_possui_rc || false,
      nexa_rc_numero: faturaData.nexa_rc_numero || null,
      nexa_rc_data: faturaData.nexa_rc_data || null
    };
    
    // Empacotar previsao_recebimento, categorias e data_solicitacao dentro de insumos (_meta) para garantir persistência sem quebrar caso coluna SQL não exista
    const cleanInsumos = (sanitizedData.insumos || []).filter((i: any) => !(i && i._meta));
    const existingMeta: any = (Array.isArray(fatura.insumos) ? fatura.insumos : []).find((i: any) => i && i._meta) || {};
    
    // Data da solicitação: registrada automaticamente na criação/primeiro salvamento e preservada nas edições posteriores
    const dataSolicitacaoGravada = faturaData.data_solicitacao 
      || existingMeta.data_solicitacao 
      || existingMeta.previsao_recebimento?.data_criacao_original 
      || (faturaData.id && !String(faturaData.id).startsWith('F-') ? undefined : new Date().toISOString());

    const metaObj: any = {
      _meta: true,
      cd: faturaData.cd || existingMeta.cd,
      codigo_fornecedor: faturaData.codigo_fornecedor || existingMeta.codigo_fornecedor,
      categorias: Array.isArray(faturaData.categorias) ? faturaData.categorias : (existingMeta.categorias || []),
      data_solicitacao: dataSolicitacaoGravada || new Date().toISOString(),
      anexos: anexos !== undefined ? anexos : (existingMeta.anexos || []),
      anexo_nome: faturaData.anexo_nome !== undefined ? faturaData.anexo_nome : existingMeta.anexo_nome,
      anexo_url: faturaData.anexo_url !== undefined ? faturaData.anexo_url : existingMeta.anexo_url,
      anexo_tamanho: faturaData.anexo_tamanho !== undefined ? faturaData.anexo_tamanho : existingMeta.anexo_tamanho,
      anexo_tipo: faturaData.anexo_tipo !== undefined ? faturaData.anexo_tipo : existingMeta.anexo_tipo,
      anexo_data_upload: faturaData.anexo_data_upload !== undefined ? faturaData.anexo_data_upload : existingMeta.anexo_data_upload
    };

    if (faturaData.previsao_recebimento_dias_min && faturaData.previsao_recebimento_dias_max) {
      metaObj.previsao_recebimento = {
        dias_min: faturaData.previsao_recebimento_dias_min,
        dias_max: faturaData.previsao_recebimento_dias_max,
        data_inicio: faturaData.previsao_recebimento_data_inicio,
        data_fim: faturaData.previsao_recebimento_data_fim,
        historico: faturaData.historico_previsao || existingMeta.previsao_recebimento?.historico || []
      };
      metaObj.previsao_recebimento_dias_min = faturaData.previsao_recebimento_dias_min;
      metaObj.previsao_recebimento_dias_max = faturaData.previsao_recebimento_dias_max;
      metaObj.previsao_recebimento_data_inicio = faturaData.previsao_recebimento_data_inicio;
      metaObj.previsao_recebimento_data_fim = faturaData.previsao_recebimento_data_fim;
      metaObj.historico_previsao = faturaData.historico_previsao || [];
    } else if (existingMeta.previsao_recebimento) {
      metaObj.previsao_recebimento = existingMeta.previsao_recebimento;
    }

    cleanInsumos.push(metaObj);
    sanitizedData.insumos = cleanInsumos;

    // Convert undefined to null or omit, as supabase expects certain formats
    delete sanitizedData.categorias;
    delete sanitizedData.data_solicitacao;
    delete sanitizedData.pc_nexa_concluido;
    delete sanitizedData.numero_pc_nexa;
    delete sanitizedData.data_pc_nexa;
    delete sanitizedData.usuario_pc_nexa;
    delete sanitizedData.fiscal_observacao;
    delete sanitizedData.pagamento_observacao;
    delete sanitizedData.previsao_recebimento_dias_min;
    delete sanitizedData.previsao_recebimento_dias_max;
    delete sanitizedData.previsao_recebimento_data_inicio;
    delete sanitizedData.previsao_recebimento_data_fim;
    delete sanitizedData.historico_previsao;
    delete sanitizedData.anexos;
    delete sanitizedData.anexo_nome;
    delete sanitizedData.anexo_url;
    delete sanitizedData.anexo_tamanho;
    delete sanitizedData.anexo_tipo;
    delete sanitizedData.anexo_data_upload;
    // delete sanitizedData.usuario_nexa_lancamento;
    // delete sanitizedData.usuario_nexa_programacao;
    // delete sanitizedData.usuario_nexa_pagamento;

    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === "" && (key.includes('data') || key.endsWith('_em') || key.includes('inicio') || key.includes('fim'))) {
        sanitizedData[key] = null;
      }
    });

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
    
    // delete mappedData.usuario_nexa_lancamento;
    // delete mappedData.usuario_nexa_programacao;
    // delete mappedData.usuario_nexa_pagamento;

    Object.keys(mappedData).forEach(key => {
      if (mappedData[key] === "" && (key.includes('data') || key.endsWith('_em') || key.includes('inicio') || key.includes('fim'))) {
        mappedData[key] = null;
      }
    });

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
      .update({ excluido: true, excluido_em: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting fatura:', error);
      throw new Error(error.message);
    }
  }
}

export const faturaRepository = new SupabaseFaturaRepository();
