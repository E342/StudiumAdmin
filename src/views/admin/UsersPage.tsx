import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserCheck, UserX, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ProfileWithRole, Role } from '../../types/database';
import Swal from 'sweetalert2';

const USER_TYPE_LABELS: Record<number, string> = {
  1: 'Admin',
  2: 'Estudiante',
  3: 'Catedratico',
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  const fetchRoles = useCallback(async () => {
    const { data } = await supabase.from('roles').select('*').order('name');
    setRoles(data || []);
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*, roles(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (searchTerm) {
      query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
    }
    if (roleFilter) {
      query = query.eq('role_id', roleFilter);
    }
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data, count, error } = await query;
    if (!error) {
      setProfiles((data as ProfileWithRole[]) || []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [searchTerm, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const toggleUserStatus = async (profile: ProfileWithRole) => {
    const newStatus = !profile.is_active;
    const result = await Swal.fire({
      icon: 'question',
      title: newStatus ? 'Activar usuario' : 'Desactivar usuario',
      text: newStatus
        ? `Se activara la cuenta de ${profile.full_name || profile.email}.`
        : `Se desactivara la cuenta de ${profile.full_name || profile.email}.`,
      showCancelButton: true,
      confirmButtonText: newStatus ? 'Activar' : 'Desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del usuario.',
        confirmButtonColor: '#1d4ed8',
      });
    } else {
      fetchProfiles();
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de Usuarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra los perfiles, roles y estados de los usuarios
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent appearance-none bg-white"
              >
                <option value="">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.description || r.name}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F2B2BB] flex items-center justify-center text-[#1D3956] font-bold text-xs flex-shrink-0">
                          {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {profile.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {profile.roles?.description || profile.roles?.name || 'Sin rol'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600">
                        {USER_TYPE_LABELS[profile.user_type] || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserStatus(profile)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          profile.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {profile.is_active ? (
                          <><UserCheck className="w-3 h-3" /> Activo</>
                        ) : (
                          <><UserX className="w-3 h-3" /> Inactivo</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/users/${profile.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1D3956] bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {totalCount} usuario{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
