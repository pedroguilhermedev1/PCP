import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readLocalUsers, writeLocalUsers, hashPassword, UserRecord } from '@/lib/auth-users';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

function sanitizeUser(u: UserRecord) {
  return {
    id: u.id,
    username: u.username,
    nome_completo: u.nome_completo,
    role: u.role,
    cd_slug: u.cd_slug,
    ativo: u.ativo,
    has_custom_password: !!u.password_hash,
    created_at: u.created_at,
    updated_at: u.updated_at
  };
}

export async function GET() {
  const localUsers = readLocalUsers();
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json(localUsers.map(sanitizeUser), { status: 200 });
  }

  try {
    const { data: supaUsers, error } = await supabase
      .from('usuarios_permissoes')
      .select('*')
      .order('username', { ascending: true });

    if (error || !supaUsers || supaUsers.length === 0) {
      return NextResponse.json(localUsers.map(sanitizeUser), { status: 200 });
    }

    // Mesclar: base Supabase, e os dados locais sobrescrevem para garantir persistência imediata
    const map = new Map<string, any>();
    supaUsers.forEach((u: any) => {
      if (u.username) map.set(u.username.toLowerCase(), u);
    });
    localUsers.forEach((u: UserRecord) => {
      if (u.username) {
        map.set(u.username.toLowerCase(), { ...map.get(u.username.toLowerCase()), ...u });
      }
    });

    const merged = Array.from(map.values())
      .map(sanitizeUser)
      .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

    return NextResponse.json(merged, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao consultar Supabase, usando fallback local:', error.message);
    return NextResponse.json(localUsers.map(sanitizeUser), { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, nome_completo, role, cd_slug, password } = body;

    if (!username || !role) {
      return NextResponse.json({ error: 'Username e Cargo (Role) são obrigatórios.' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '');
    const localUsers = readLocalUsers();

    if (localUsers.some(u => u.username?.toLowerCase() === cleanUsername)) {
      return NextResponse.json({ error: 'Este nome de usuário já está cadastrado.' }, { status: 400 });
    }

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      nome_completo: nome_completo ? nome_completo.trim() : null,
      role: role.toUpperCase().trim() as any,
      cd_slug: cd_slug ? cd_slug.toLowerCase().trim() : null,
      ativo: true,
      ...(password && typeof password === 'string' && password.trim().length > 0
        ? { password_hash: hashPassword(password.trim()) }
        : {}),
      created_at: new Date().toISOString()
    };

    localUsers.push(newUser);
    writeLocalUsers(localUsers);

    // Tentar persistir no Supabase (se acessível)
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
        console.warn('Supabase insert notice (salvo localmente com sucesso):', err.message);
      }
    }

    return NextResponse.json(sanitizeUser(newUser), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID ou username é obrigatório.' }, { status: 400 });
    }

    const body = await request.json();
    const localUsers = readLocalUsers();
    const index = localUsers.findIndex(u => u.id === id || u.username?.toLowerCase() === id.toLowerCase());

    if (index === -1) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const existingUser = localUsers[index];
    const oldUsername = existingUser.username;

    let targetUsername = existingUser.username;
    if (body.username && typeof body.username === 'string') {
      const cleanNewUsername = body.username.toLowerCase().trim().replace(/\s+/g, '');
      if (cleanNewUsername !== existingUser.username.toLowerCase()) {
        const usernameConflict = localUsers.some(
          (u, idx) => idx !== index && u.username?.toLowerCase() === cleanNewUsername
        );
        if (usernameConflict) {
          return NextResponse.json({ error: 'Este login já está em uso por outro usuário.' }, { status: 400 });
        }
        targetUsername = cleanNewUsername;
      }
    }

    const updatedUser: UserRecord = {
      ...existingUser,
      username: targetUsername,
      nome_completo: body.nome_completo !== undefined
        ? (body.nome_completo ? body.nome_completo.trim() : null)
        : existingUser.nome_completo,
      role: body.role ? (body.role.toUpperCase().trim() as any) : existingUser.role,
      cd_slug: body.cd_slug !== undefined
        ? (body.cd_slug ? body.cd_slug.toLowerCase().trim() : null)
        : existingUser.cd_slug,
      ativo: typeof body.ativo === 'boolean' ? body.ativo : existingUser.ativo,
      updated_at: new Date().toISOString()
    };

    if (body.password && typeof body.password === 'string' && body.password.trim().length > 0) {
      updatedUser.password_hash = hashPassword(body.password.trim());
    }

    localUsers[index] = updatedUser;
    writeLocalUsers(localUsers);

    // Tentar atualizar no Supabase por username
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('usuarios_permissoes')
          .update({
            username: updatedUser.username,
            nome_completo: updatedUser.nome_completo,
            role: updatedUser.role,
            cd_slug: updatedUser.cd_slug,
            ativo: updatedUser.ativo
          })
          .eq('username', oldUsername);
      } catch (err: any) {
        console.warn('Supabase update notice (atualizado localmente com sucesso):', err.message);
      }
    }

    return NextResponse.json(sanitizeUser(updatedUser), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID ou username é obrigatório.' }, { status: 400 });
    }

    const localUsers = readLocalUsers();
    const targetUser = localUsers.find(u => u.id === id || u.username?.toLowerCase() === id.toLowerCase());

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Regras de segurança fundamentais
    if (targetUser.username?.toLowerCase() === 'pedro.queiroz') {
      return NextResponse.json({ error: 'O Super Admin principal (pedro.queiroz) não pode ser excluído por motivos de segurança.' }, { status: 403 });
    }

    if (targetUser.role === 'SUPERADMIN') {
      const activeSuperAdmins = localUsers.filter(u => u.role === 'SUPERADMIN' && u.ativo);
      if (activeSuperAdmins.length <= 1) {
        return NextResponse.json({ error: 'Não é permitido excluir o único Super Admin ativo do sistema.' }, { status: 403 });
      }
    }

    const updatedUsers = localUsers.filter(u => u.id !== targetUser.id && u.username?.toLowerCase() !== targetUser.username.toLowerCase());
    writeLocalUsers(updatedUsers);

    // Tentar deletar no Supabase por username
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('usuarios_permissoes')
          .delete()
          .eq('username', targetUser.username);
      } catch (err: any) {
        console.warn('Supabase delete notice (removido localmente com sucesso):', err.message);
      }
    }

    return NextResponse.json({ success: true, message: `Usuário ${targetUser.username} excluído com sucesso.` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
