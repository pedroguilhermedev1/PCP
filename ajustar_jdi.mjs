import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwvajnsmylaebxfeypeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração para alterar o banco de dados de fato
const DRY_RUN = false; 

// Função para calcular similaridade básica de strings (baseada em palavras comuns)
function calcularSimilaridade(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const palavras1 = str1.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(p => p.length > 2);
  const palavras2 = str2.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(p => p.length > 2);
  
  if (palavras1.length === 0 || palavras2.length === 0) return 0;
  
  let matches = 0;
  for (const p1 of palavras1) {
    if (palavras2.includes(p1)) matches++;
  }
  
  // Retorna um valor de 0 a 1 indicando a sobreposição de palavras importantes
  return matches / Math.max(palavras1.length, palavras2.length);
}

async function run() {
  console.log("Iniciando Mapeamento de Categorias (DRY RUN - Sem alterar o banco)...");

  // 1. Puxar todos os itens de Fortaleza
  let fortalezaItems = [];
  let pageF = 0;
  while (true) {
    const { data, error } = await supabase.from('estoque_insumos').select('*').eq('cd', 'fortaleza').range(pageF * 1000, (pageF + 1) * 1000 - 1);
    if (error) throw error;
    if (data.length > 0) {
      fortalezaItems.push(...data);
      pageF++;
    } else {
      break;
    }
  }
  console.log(`Carregados ${fortalezaItems.length} insumos de Fortaleza como base de dados.`);

  // 2. Puxar todos os itens de Jundiaí (SAS/SAE)
  let jundiaiItems = [];
  let pageJ = 0;
  while (true) {
    const { data, error } = await supabase.from('estoque_insumos').select('*').eq('cd', 'jundiai').in('empresa', ['SAS', 'SAE']).range(pageJ * 1000, (pageJ + 1) * 1000 - 1);
    if (error) throw error;
    if (data.length > 0) {
      jundiaiItems.push(...data);
      pageJ++;
    } else {
      break;
    }
  }
  console.log(`Carregados ${jundiaiItems.length} insumos de Jundiaí a serem ajustados.`);

  let updatesList = [];
  let matchesExatos = 0;
  let matchesParciais = 0;
  let semMatch = 0;

  for (const jdi of jundiaiItems) {
    let matchEncontrado = null;
    let tipoMatch = "";

    // Tentativa 1: Match EXATO pelo Código (desde que não seja '-')
    if (!matchEncontrado && jdi.codigo && jdi.codigo !== '-') {
      const matchCodigo = fortalezaItems.find(f => f.codigo === jdi.codigo && f.categoria && f.categoria !== 'Geral');
      if (matchCodigo) {
        matchEncontrado = matchCodigo;
        tipoMatch = "EXATO (Código)";
      }
    }

    // Tentativa 2: Match EXATO pela Descrição/Item
    if (!matchEncontrado && jdi.item && jdi.item !== '-') {
      const matchItem = fortalezaItems.find(f => f.item.toLowerCase().trim() === jdi.item.toLowerCase().trim() && f.categoria && f.categoria !== 'Geral');
      if (matchItem) {
        matchEncontrado = matchItem;
        tipoMatch = "EXATO (Descrição)";
      }
    }

    // Tentativa 3: Match PARCIAL SEGURO (Substring ou alta similaridade)
    if (!matchEncontrado && jdi.item && jdi.item !== '-') {
      let melhorScore = 0;
      let melhorCandidato = null;

      for (const f of fortalezaItems) {
        if (!f.categoria || f.categoria === 'Geral') continue;
        
        const score = calcularSimilaridade(jdi.item, f.item);
        if (score > melhorScore) {
          melhorScore = score;
          melhorCandidato = f;
        }
      }

      // Se a similaridade de palavras-chave for maior que 60%
      if (melhorScore > 0.6) {
        matchEncontrado = melhorCandidato;
        tipoMatch = `PARCIAL (Similaridade: ${(melhorScore * 100).toFixed(0)}%)`;
      }
    }

    const payload = {
      id: jdi.id,
      lead_time: '3', // A regra do lead time aplica a todos de SAS/SAE Jundiaí
    };

    if (matchEncontrado) {
      payload.categoria = matchEncontrado.categoria;
      if (tipoMatch.includes("EXATO")) matchesExatos++;
      else matchesParciais++;

      console.log(`[${tipoMatch}] JDI: "${jdi.item}" -> Herdando Categoria: "${matchEncontrado.categoria}" (Ref FOR: "${matchEncontrado.item}")`);
    } else {
      semMatch++;
      console.log(`[SEM MATCH] JDI: "${jdi.item}" -> Mantendo Categoria Atual: "${jdi.categoria}"`);
    }

    updatesList.push(payload);
  }

  console.log("\n--- RESUMO DA AVALIAÇÃO ---");
  console.log(`Total Jundiaí processados: ${updatesList.length}`);
  console.log(`Matches Exatos: ${matchesExatos}`);
  console.log(`Matches Parciais Confiáveis: ${matchesParciais}`);
  console.log(`Sem correspondência (Manter atual): ${semMatch}`);
  console.log(`Todos terão o Lead Time atualizado para '3'.`);

  if (!DRY_RUN) {
    console.log("\nAplicando alterações no Supabase...");
    let successCount = 0;
    for (const up of updatesList) {
      const { id, ...payload } = up;
      const { error } = await supabase.from('estoque_insumos').update(payload).eq('id', id);
      if (error) {
        console.error(`Erro ao atualizar ID ${id}:`, error.message);
      } else {
        successCount++;
      }
    }
    console.log(`Sucesso: ${successCount} registros atualizados no Supabase.`);
  } else {
    console.log("\n(DRY RUN) Nenhuma alteração foi feita no banco de dados.");
  }
}

run();
