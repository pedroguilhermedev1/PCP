import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-purple-50/30 to-zinc-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/20 blur-3xl" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-2xl shadow-xl border border-white z-10">
        <div>
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold bg-gradient-to-r from-purple-800 to-indigo-600 bg-clip-text text-transparent pb-1 tracking-tight">
            PCP Compras
          </h2>
          <p className="mt-2 text-center text-sm font-medium text-zinc-500">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
