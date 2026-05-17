import { useEffect, useState } from 'react';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRoles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, activeRes, inactiveRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('roles').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: profilesRes.count ?? 0,
        activeUsers: activeRes.count ?? 0,
        inactiveUsers: inactiveRes.count ?? 0,
        totalRoles: rolesRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Usuarios Activos',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Usuarios Inactivos',
      value: stats.inactiveUsers,
      icon: UserX,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Roles',
      value: stats.totalRoles,
      icon: Shield,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen general del sistema Studium
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.color} rounded-xl p-5 transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rapidas</h2>
          <div className="space-y-3">
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700"
            >
              <Users className="w-5 h-5 text-[#1D3956]" />
              <span>Gestionar usuarios</span>
            </a>
            <a
              href="/admin/roles"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700"
            >
              <Shield className="w-5 h-5 text-[#1D3956]" />
              <span>Configurar roles y permisos</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion del sistema</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Plataforma</dt>
              <dd className="font-medium text-gray-900">Studium</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Autenticacion</dt>
              <dd className="font-medium text-gray-900">Supabase Auth</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Base de datos</dt>
              <dd className="font-medium text-gray-900">Supabase PostgreSQL</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
