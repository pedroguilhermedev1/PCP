"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/roles';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/compras/dashboard');
  }, [router]);

  return <div className="p-8 text-center text-zinc-500">Redirecionando...</div>;
}
