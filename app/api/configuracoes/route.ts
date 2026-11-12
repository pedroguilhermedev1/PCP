import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  getSyncedConfig, 
  saveSyncedConfig, 
  CentroDistribuicaoRecord, 
  CategoriaInsumoRecord 
} from '@/lib/configuracoes';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'cds' or 'categorias'
    const config = await getSyncedConfig();

    if (type === 'cds') {
      const sorted = [...config.cds].sort((a, b) => a.nome.localeCompare(b.nome));
      return NextResponse.json(sorted);
    } else if (type === 'categorias') {
      const sorted = [...config.categorias].sort((a, b) => a.nome.localeCompare(b.nome));
      return NextResponse.json(sorted);
    } else {
      return NextResponse.json({
        cds: [...config.cds].sort((a, b) => a.nome.localeCompare(b.nome)),
        categorias: [...config.categorias].sort((a, b) => a.nome.localeCompare(b.nome))
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    const config = await getSyncedConfig();

    if (type === 'cds') {
      if (!data?.nome || !data?.slug) {
        return NextResponse.json({ error: 'Nome e Slug são obrigatórios.' }, { status: 400 });
      }

      const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      const cleanNome = data.nome.trim();

      const exists = config.cds.some(
        c => c.slug.toLowerCase() === cleanSlug || c.nome.toLowerCase() === cleanNome.toLowerCase()
      );
      if (exists) {
        return NextResponse.json({ error: 'Já existe um Centro de Distribuição com este nome ou slug.' }, { status: 400 });
      }

      const newCd: CentroDistribuicaoRecord = {
        id: `cd-${cleanSlug}-${Date.now()}`,
        nome: cleanNome,
        slug: cleanSlug,
        ativo: true,
        created_at: new Date().toISOString()
      };

      config.cds.push(newCd);
      await saveSyncedConfig(config);
      return NextResponse.json({ success: true, data: newCd }, { status: 201 });
    } else if (type === 'categorias') {
      if (!data?.nome) {
        return NextResponse.json({ error: 'Nome da categoria é obrigatório.' }, { status: 400 });
      }

      const cleanNome = data.nome.trim();
      const exists = config.categorias.some(
        c => c.nome.toLowerCase() === cleanNome.toLowerCase()
      );
      if (exists) {
        return NextResponse.json({ error: 'Já existe uma categoria cadastrada com este nome.' }, { status: 400 });
      }

      const cleanSlug = cleanNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
      const newCat: CategoriaInsumoRecord = {
        id: `cat-${cleanSlug}-${Date.now()}`,
        nome: cleanNome,
        ativo: true,
        created_at: new Date().toISOString()
      };

      config.categorias.push(newCat);
      await saveSyncedConfig(config);
      return NextResponse.json({ success: true, data: newCat }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, id, data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    const config = await getSyncedConfig();

    if (type === 'cds') {
      const index = config.cds.findIndex(c => c.id === id || c.slug === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Centro de Distribuição não encontrado.' }, { status: 404 });
      }

      const current = config.cds[index];
      let newSlug = current.slug;
      let newNome = current.nome;

      if (data.nome && typeof data.nome === 'string') {
        newNome = data.nome.trim();
        const conflict = config.cds.some((c, i) => i !== index && c.nome.toLowerCase() === newNome.toLowerCase());
        if (conflict) {
          return NextResponse.json({ error: 'Já existe outro Centro de Distribuição com este nome.' }, { status: 400 });
        }
      }

      if (data.slug && typeof data.slug === 'string') {
        newSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
        const conflict = config.cds.some((c, i) => i !== index && c.slug.toLowerCase() === newSlug);
        if (conflict) {
          return NextResponse.json({ error: 'Já existe outro Centro de Distribuição com este slug.' }, { status: 400 });
        }
      }

      config.cds[index] = {
        ...current,
        nome: newNome,
        slug: newSlug,
        ativo: typeof data.ativo === 'boolean' ? data.ativo : current.ativo,
        updated_at: new Date().toISOString()
      };

      await saveSyncedConfig(config);
      return NextResponse.json({ success: true, data: config.cds[index] });
    } else if (type === 'categorias') {
      const index = config.categorias.findIndex(c => c.id === id || c.nome.toLowerCase() === id.toLowerCase());
      if (index === -1) {
        return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
      }

      const current = config.categorias[index];
      let newNome = current.nome;

      if (data.nome && typeof data.nome === 'string') {
        newNome = data.nome.trim();
        const conflict = config.categorias.some((c, i) => i !== index && c.nome.toLowerCase() === newNome.toLowerCase());
        if (conflict) {
          return NextResponse.json({ error: 'Já existe outra categoria com este nome.' }, { status: 400 });
        }
      }

      config.categorias[index] = {
        ...current,
        nome: newNome,
        ativo: typeof data.ativo === 'boolean' ? data.ativo : current.ativo,
        updated_at: new Date().toISOString()
      };

      await saveSyncedConfig(config);
      return NextResponse.json({ success: true, data: config.categorias[index] });
    } else {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    const config = await getSyncedConfig();
    const supabase = getSupabase();

    if (type === 'cds') {
      const target = config.cds.find(c => c.id === id || c.slug === id);
      if (!target) {
        return NextResponse.json({ error: 'Centro de Distribuição não encontrado.' }, { status: 404 });
      }

      // Validação de dependências: verificar estoque_insumos, faturas e estoque_movimentacoes
      if (supabase) {
        const [insumosRes, faturasRes, movsRes] = await Promise.all([
          supabase.from('estoque_insumos').select('id', { count: 'exact', head: true }).or(`cd.eq.${target.slug},cd.ilike.%${target.nome}%`),
          supabase.from('faturas').select('id', { count: 'exact', head: true }).or(`cd.eq.${target.slug},cd.ilike.%${target.nome}%`),
          supabase.from('estoque_movimentacoes').select('id', { count: 'exact', head: true }).or(`cd.eq.${target.slug},cd.ilike.%${target.nome}%`)
        ]);

        const countInsumos = insumosRes.count || 0;
        const countFaturas = faturasRes.count || 0;
        const countMovs = movsRes.count || 0;
        const totalDeps = countInsumos + countFaturas + countMovs;

        if (totalDeps > 0) {
          const detalhes: string[] = [];
          if (countInsumos > 0) detalhes.push(`${countInsumos} insumo(s) em estoque`);
          if (countFaturas > 0) detalhes.push(`${countFaturas} fatura(s)`);
          if (countMovs > 0) detalhes.push(`${countMovs} movimentação(ões)`);

          return NextResponse.json({
            error: `Não é possível excluir o CD "${target.nome}": existem registros vinculados a esta unidade (${detalhes.join(', ')}). Para preservar a integridade do histórico, utilize a opção "Desativar".`
          }, { status: 400 });
        }
      }

      config.cds = config.cds.filter(c => c.id !== target.id && c.slug !== target.slug);
      await saveSyncedConfig(config);
      return NextResponse.json({ success: true, message: `Centro de Distribuição "${target.nome}" excluído com sucesso.` });
    } else if (type === 'categorias') {
      const target = config.categorias.find(c => c.id === id || c.nome.toLowerCase() === id.toLowerCase());
      if (!target) {
        return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
      }

      // Validação de dependências: verificar estoque_insumos
      if (supabase) {
        const { count } = await supabase
          .from('estoque_insumos')
          .select('id', { count: 'exact', head: true })
          .ilike('categoria', `%${target.nome}%`);

        if (count && count > 0) {
          return NextResponse.json({
            error: `Não é possível excluir a categoria "${target.nome}": existem ${count} insumo(s) cadastrados com esta categoria. Reclassifique os insumos ou desative a categoria para retirá-la de novas seleções.`
          }, { status: 400 });
        }
      }

      config.categorias = config.categorias.filter(c => c.id !== target.id && c.nome.toLowerCase() !== target.nome.toLowerCase());
      await saveSyncedConfig(config);
      return NextResponse.json({ success: true, message: `Categoria "${target.nome}" excluída com sucesso.` });
    } else {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
