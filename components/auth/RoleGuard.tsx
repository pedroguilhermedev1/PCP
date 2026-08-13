'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, getUserCD } from '@/lib/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredCD?: string; // se presente, o usuário deve ser ADMIN ou o CD do usuário deve corresponder (case insensitive)
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredCD
}: RoleGuardProps) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (!user) {
      router.push('/login');
      return;
    }

    const role = getUserRole(user);

    if (allowedRoles && allowedRoles.length > 0) {
      if (!role || !allowedRoles.includes(role)) {
        setIsAllowed(false);
        return;
      }
    }

    if (requiredCD && role === 'OPERACIONAL') {
      const userCD = getUserCD(user);
      if (!userCD || userCD.toLowerCase() !== requiredCD.toLowerCase()) {
        setIsAllowed(false);
        return;
      }
    }
    
    setIsAllowed(true);
  }, [allowedRoles, requiredCD, router]);

  if (isAllowed === null) return null; // loading state

  if (isAllowed === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-4">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-zinc-600">Você não tem permissão para acessar esta página.</p>
        <button 
          onClick={() => router.push('/compras/dashboard')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
