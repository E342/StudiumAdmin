import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Shield, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ProfileWithRole, Role } from '../../types/database';
import Swal from 'sweetalert2';

const USER_TYPE_OPTIONS = [
  { value: 1, label: 'Admin' },
  { value: 2, label: 'Estudiante' },
  { value: 3, label: 'Catedratico' },
];

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileWithRole | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [userType, setUserType] = useState(2);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*, roles(*)').eq('id', id).maybeSingle(),
        supabase.from('roles').select('*').order('name'),
      ]);

      if (profileRes.data) {
        const p = profileRes.data as ProfileWithRole;
        setProfile(p);
        setFullName(p.full_name);
        setRoleId(p.role_id || '');
        setUserType(p.user_type);
        setIsActive(p.is_active);
      }
      setRoles(rolesRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role_id: roleId || null,
        user_type: userType,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    setSaving(false);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: 'No se pudieron actualizar los datos del usuario.',
        confirmButtonColor: '#1d4ed8',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonColor: '#1d4ed8',
      });
      navigate('/admin/users');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a usuarios
      </button>

      <div className="max-w-2xl">
        {/* Profile header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F2B2BB] flex items-center justify-center text-[#1D3956] font-bold text-xl">
              {(profile.full_name || profile.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.full_name || 'Sin nombre'}
              </h1>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Registrado: {new Date(profile.created_at).toLocaleDateString('es-SV')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Rol actual: {profile.roles?.description || profile.roles?.name || 'Sin rol'}</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar perfil</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Correo electronico
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Shield className="w-4 h-4 inline mr-1" />
                Rol
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent appearance-none bg-white"
              >
                <option value="">Sin rol asignado</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.description || r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de usuario
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent appearance-none bg-white"
              >
                {USER_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Estado de la cuenta</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-[#1D3956] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2a4f73] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
