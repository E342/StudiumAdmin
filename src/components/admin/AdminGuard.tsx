import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ProfileWithRole } from '../../types/database';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('id', session.user.id)
        .maybeSingle();

      const prof = profile as ProfileWithRole | null;
      setIsAllowed(prof?.roles?.name === 'admin' && prof?.is_active === true);
      setChecking(false);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1D3956] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
