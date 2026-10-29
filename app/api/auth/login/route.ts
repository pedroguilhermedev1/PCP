import { NextResponse } from 'next/server';
import { readLocalUsers, verifyPassword } from '@/lib/auth-users';
import { ADMIN_USERS, OPERACIONAL_USERS, getUserRole, formatUserName } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const users = readLocalUsers();
    const user = users.find(u => u.username?.toLowerCase() === cleanUsername);

    // Liderança legacy check
    const isLiderancaLegacy = (cleanUsername === 'lideranca.arco' || cleanUsername === 'liderança.arco') &&
      (password === 'lideranca.arco@2026' || password === 'liderança.arco@2026');

    if (user) {
      if (user.ativo === false) {
        return NextResponse.json({ error: 'Usuário inativo. Entre em contato com o administrador.' }, { status: 403 });
      }

      let passwordValid = false;

      // 1. Se o usuário tiver password_hash cadastrado
      if (user.password_hash) {
        passwordValid = verifyPassword(password, user.password_hash);
      } else {
        // 2. Sem hash definido ainda -> aceita senha padrão username@2026 ou liderança
        if (password === `${cleanUsername}@2026` || isLiderancaLegacy) {
          passwordValid = true;
        }
      }

      if (!passwordValid) {
        return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          nome_completo: user.nome_completo || formatUserName(user.username),
          role: user.role,
          cd_slug: user.cd_slug
        }
      }, { status: 200 });
    }

    // Caso de liderança legado fora do banco
    if (isLiderancaLegacy) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'lideranca-legacy',
          username: cleanUsername,
          nome_completo: 'Liderança Arco',
          role: 'LIDERANCA',
          cd_slug: null
        }
      }, { status: 200 });
    }

    // Fallback legado para usuários em lib/roles.ts que ainda não foram para usuarios.json
    const validUsers = [...ADMIN_USERS, ...OPERACIONAL_USERS];
    if (validUsers.includes(cleanUsername) && password === `${cleanUsername}@2026`) {
      const fallbackRole = getUserRole(cleanUsername) || 'OPERACIONAL';
      return NextResponse.json({
        success: true,
        user: {
          id: cleanUsername,
          username: cleanUsername,
          nome_completo: formatUserName(cleanUsername),
          role: fallbackRole,
          cd_slug: null
        }
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Usuário ou senha inválidos.' }, { status: 401 });
  } catch (error: any) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json({ error: 'Erro interno durante a autenticação.' }, { status: 500 });
  }
}

