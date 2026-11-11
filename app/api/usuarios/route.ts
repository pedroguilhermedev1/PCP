import { NextResponse } from 'next/server';
import { 
  getSyncedUsers, 
  saveSyncedUsers, 
  hashPassword, 
  UserRecord 
} from '@/lib/auth-users';

export const dynamic = 'force-dynamic';

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
  try {
    const { users, deleted } = await getSyncedUsers();
    const deletedLower = deleted.map(d => d.toLowerCase());
    const validUsers = users
      .filter(u => u.username && !deletedLower.includes(u.username.toLowerCase()))
      .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

    return NextResponse.json(validUsers.map(sanitizeUser), { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const { users, deleted } = await getSyncedUsers();

    if (users.some(u => u.username?.toLowerCase() === cleanUsername)) {
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

    const updatedDeleted = deleted.filter(d => d.toLowerCase() !== cleanUsername);
    const updatedUsers = [...users, newUser];

    await saveSyncedUsers(updatedUsers, updatedDeleted);

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
    const { users, deleted } = await getSyncedUsers();
    const index = users.findIndex(u => u.id === id || u.username?.toLowerCase() === id.toLowerCase());

    if (index === -1) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const existingUser = users[index];
    let targetUsername = existingUser.username;

    if (body.username && typeof body.username === 'string') {
      const cleanNewUsername = body.username.toLowerCase().trim().replace(/\s+/g, '');
      if (cleanNewUsername !== existingUser.username.toLowerCase()) {
        const usernameConflict = users.some(
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

    const newUsersList = [...users];
    newUsersList[index] = updatedUser;

    await saveSyncedUsers(newUsersList, deleted);

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

    const { users, deleted } = await getSyncedUsers();
    const targetUser = users.find(u => u.id === id || u.username?.toLowerCase() === id.toLowerCase());

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Regras de segurança fundamentais
    if (targetUser.username?.toLowerCase() === 'pedro.queiroz') {
      return NextResponse.json({ error: 'O Super Admin principal (pedro.queiroz) não pode ser excluído por motivos de segurança.' }, { status: 403 });
    }

    if (targetUser.role === 'SUPERADMIN') {
      const activeSuperAdmins = users.filter(u => u.role === 'SUPERADMIN' && u.ativo);
      if (activeSuperAdmins.length <= 1) {
        return NextResponse.json({ error: 'Não é permitido excluir o único Super Admin ativo do sistema.' }, { status: 403 });
      }
    }

    const cleanUsername = targetUser.username.toLowerCase();
    const updatedUsers = users.filter(u => u.id !== targetUser.id && u.username?.toLowerCase() !== cleanUsername);
    const updatedDeleted = Array.from(new Set([...deleted, cleanUsername]));

    await saveSyncedUsers(updatedUsers, updatedDeleted);

    return NextResponse.json({ success: true, message: `Usuário ${targetUser.username} excluído com sucesso.` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
