import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa tu correo y contrasena.',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Verify admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('No se encontro un perfil asociado a esta cuenta.');
      }

      if (profile.roles?.name !== 'admin' || !profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de administrador.');
      }

      navigate('/admin');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de acceso',
        text: err.message || 'Credenciales invalidas.',
        confirmButtonColor: '#1d4ed8',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D3956] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F2B2BB] mb-4">
            <Shield className="w-8 h-8 text-[#1D3956]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Studium Admin</h1>
          <p className="text-white/60 mt-1 text-sm">Panel de Administracion</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electronico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@studium.edu"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent transition-shadow"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent transition-shadow pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1D3956] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#2a4f73] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
