import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

const JSON_FILE_PATH = path.join(process.cwd(), 'data', 'usuarios.json');

const readLocalUsers = (): any[] => {
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      const dir = path.dirname(JSON_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('Erro ao ler usuarios.json:', err);
    return [];
  }
};

const writeLocalUsers = (users: any[]) => {
  try {
    const dir = path.dirname(JSON_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar usuarios.json:', err);
  }
};

export async function GET() {
  const localUsers = readLocalUsers();
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json(localUsers, { status: 200 });
  }

  try {
    const { data: supaUsers, error } = await supabase
      .from('usuarios_permissoes')
      .select('*')
      .order('username', { ascending: true });

    if (error || !supaUsers || supaUsers.length === 0) {
      // Retorna localUsers caso o Supabase esteja vazio ou com restrição de RLS
      return NextResponse.json(localUsers, { status: 200 });
    }

    // Mesclar usuários do Supabase com os locais (dando prioridade para os mais recentes)
    const map = new Map<string, any>();
    localUsers.forEach(u => map.set(u.username?.toLowerCase(), u));
    supaUsers.forEach((u: any) => map.set(u.username?.toLowerCase(), { ...map.get(u.username?.toLowerCase()), ...u }));

    const merged = Array.from(map.values()).sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    return NextResponse.json(merged, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao consultar Supabase, usando fallback local:', error.message);
    return NextResponse.json(localUsers, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, nome_completo, role, cd_slug } = body;

    if (!username || !role) {
      return NextResponse.json({ error: 'Username e Cargo (Role) são obrigatórios' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const localUsers = readLocalUsers();

    if (localUsers.some(u => u.username?.toLowerCase() === cleanUsername)) {
      return NextResponse.json({ error: 'Este nome de usuário já está cadastrado' }, { status: 400 });
    }

    const newUser = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      nome_completo: nome_completo ? nome_completo.trim() : null,
      role: role.toUpperCase().trim(),
      cd_slug: cd_slug ? cd_slug.toLowerCase().trim() : null,
      ativo: true,
      created_at: new Date().toISOString()
    };

    localUsers.push(newUser);
    writeLocalUsers(localUsers);

    // Tentar persistir no Supabase (se habilitado)
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('usuarios_permissoes')
          .insert([{
            username: newUser.username,
            nome_completo: newUser.nome_completo,
            role: newUser.role,
            cd_slug: newUser.cd_slug,
            ativo: newUser.ativo
          }]);
      } catch (err: any) {
        console.warn('Supabase insert notice (salvo localmente):', err.message);
      }
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const localUsers = readLocalUsers();
    const index = localUsers.findIndex(u => u.id === id || u.username === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updatedUser = {
      ...localUsers[index],
      ...body
    };

    localUsers[index] = updatedUser;
    writeLocalUsers(localUsers);

    // Tentar atualizar no Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('usuarios_permissoes')
          .update(body)
          .eq('id', id);
      } catch (err: any) {
        console.warn('Supabase update notice (atualizado localmente):', err.message);
      }
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    let localUsers = readLocalUsers();
    localUsers = localUsers.filter(u => u.id !== id && u.username !== id);
    writeLocalUsers(localUsers);

    // Tentar deletar no Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('usuarios_permissoes')
          .delete()
          .eq('id', id);
      } catch (err: any) {
        console.warn('Supabase delete notice (removido localmente):', err.message);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
