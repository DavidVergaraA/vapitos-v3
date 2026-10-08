import { useState } from 'react';
import { supabase, configured } from '@/lib/supabase';
import { Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form 
        onSubmit={handleLogin} 
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-4">
            <Boxes size={32} />
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">GESTIÓN DEL NEGOCIO</p>
          <h1 className="text-2xl font-black text-slate-800">
            Vapitos <span className="text-blue-600 italic">V3</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 text-center">
            Ingresa con la cuenta de uno de los socios.
          </p>
        </div>

        {!configured && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-200">
            Falta configurar VITE_SUPABASE_ANON_KEY en .env.local.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="socio@vapitos.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={!configured || loading}
            className={cn(
              "w-full py-2.5 rounded-lg font-medium text-white transition-colors",
              !configured || loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </div>
        
        <p className="text-xs text-slate-400 text-center mt-6">
          Acceso privado · Supabase Auth
        </p>
      </form>
    </div>
  );
}
