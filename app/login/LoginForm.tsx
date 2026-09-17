'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserRole, ADMIN_USERS, OPERACIONAL_USERS } from '@/lib/roles';
import { toast } from 'sonner';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const parsedUsername = username.trim().toLowerCase();
      
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Erro ao verificar usuários.');
      const usuarios = await res.json();
      
      const user = usuarios.find((u: any) => u.username === parsedUsername && u.ativo);
      
      // Fallbacks para liderança ou legado
      const isLiderancaLegacy = (parsedUsername === 'lideranca.arco' || parsedUsername === 'liderança.arco') && 
                          (password === 'lideranca.arco@2026' || password === 'liderança.arco@2026');

      if (user) {
        // Se a senha for nome@2026 ou se for a senha legacy de liderança
        if (password === `${parsedUsername}@2026` || isLiderancaLegacy) {
          localStorage.setItem('pcp_user', parsedUsername);
          localStorage.setItem('pcp_role', user.role);
          if (user.nome_completo) localStorage.setItem('pcp_name', user.nome_completo);
          if (user.cd_slug) localStorage.setItem('pcp_cd', user.cd_slug);
          
          toast.success('Login efetuado com sucesso!');
          router.push('/compras/dashboard');
          return;
        }
      } else if (isLiderancaLegacy) {
        // Fallback legado caso a tabela falhe
        localStorage.setItem('pcp_user', parsedUsername);
        localStorage.setItem('pcp_role', 'LIDERANCA');
        toast.success('Login efetuado (legado)!');
        router.push('/compras/dashboard');
        return;
      }
      
      // Fallback para hardcoded original se não achar no banco e bater a senha
      const validUsers = [...ADMIN_USERS, ...OPERACIONAL_USERS];
      if (validUsers.includes(parsedUsername) && password === `${parsedUsername}@2026`) {
        localStorage.setItem('pcp_user', parsedUsername);
        const fallbackRole = getUserRole(parsedUsername);
        if (fallbackRole) localStorage.setItem('pcp_role', fallbackRole);
        toast.success('Login efetuado com sucesso!');
        router.push('/compras/dashboard');
        return;
      }

      setError('Usuário ou senha inválidos, ou usuário inativo.');
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <label htmlFor="username" className="text-sm font-medium text-zinc-700">Usuário</label>
          <Input
            id="username"
            name="username"
            type="text"
            required
            className="mt-1"
            placeholder="nome.sobrenome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">Senha</label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

      <div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </div>
    </form>
  );
}
