'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Avoid synchronous state updates by deferring
    const checkAuth = async () => {
      const user = localStorage.getItem('pcp_user');
      
      if (user) {
        setIsAuthenticated(true);
        if (pathname === '/login' || pathname === '/') {
          router.push('/compras/faturas/servicos');
        }
      } else {
        setIsAuthenticated(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    };
    
    checkAuth();
  }, [pathname, router]);

  return (
    <>
      <div className={isAuthenticated === true || (isAuthenticated === false && pathname === '/login') ? 'contents' : 'hidden'}>
        {children}
      </div>
      {(isAuthenticated === null || (!isAuthenticated && pathname !== '/login')) && (
        <div className="fixed inset-0 z-50 bg-zinc-50 flex items-center justify-center">
          {isAuthenticated === null ? 'Carregando...' : 'Redirecionando...'}
        </div>
      )}
    </>
  );
}
