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
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedUsername = username.trim().toLowerCase();
    const role = getUserRole(parsedUsername);
    const validUsers = [...ADMIN_USERS, ...OPERACIONAL_USERS];
    
    // allow the specific string 'debora.mota' to match 'debora.mora' as there is a typo seen in previous codes
    if ((validUsers.includes(parsedUsername) || parsedUsername === 'debora.mota') && password === '123@456') {
      localStorage.setItem('pcp_user', parsedUsername);
      toast.success('Login efetuado com sucesso!');
      router.push('/compras/dashboard');
    } else {
      setError('Usuário ou senha inválidos.');
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
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </div>
    </form>
  );
}
