'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function FormulariosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na página de solicitações:', error);
  }, [error]);

  const errorMessage = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'type' in error
      ? `Evento de erro inesperado (${(error as Event).type})`
      : String(error || 'Erro inesperado na aplicação.');

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 bg-white rounded-xl border border-zinc-200 m-6 shadow-sm">
      <div className="p-3 bg-red-50 text-red-600 rounded-full">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-900">Erro ao carregar a visualização</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-md">{errorMessage}</p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="flex items-center gap-2 text-xs">
        <RotateCcw className="w-4 h-4" /> Recarregar aba
      </Button>
    </div>
  );
}

