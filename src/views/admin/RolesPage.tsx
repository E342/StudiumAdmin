import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Shield, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Role, Permission, RolePermission } from '../../types/database';
import Swal from 'sweetalert2';

type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalPermissions, setModalPermissions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rolesRes, rolePermsRes, permsRes] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('role_permissions').select('*, permissions(*)'),
      supabase.from('permissions').select('*').order('category'),
    ]);

    const roleList = (rolesRes.data || []) as Role[];
    const rpList = (rolePermsRes.data || []) as (RolePermission & { permissions: Permission })[];
    const permList = (permsRes.data || []) as Permission[];

    // Build role -> permissions map
    const rolePermMap = new Map<string, Permission[]>();
    rpList.forEach((rp) => {
      if (!rolePermMap.has(rp.role_id)) rolePermMap.set(rp.role_id, []);
      rolePermMap.get(rp.role_id)!.push(rp.permissions);
    });

    const rolesWithPerms: RoleWithPermissions[] = roleList.map((r) => ({
      ...r,
      permissions: rolePermMap.get(r.id) || [],
    }));

    setRoles(rolesWithPerms);
    setAllPermissions(permList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingRole(null);
    setModalName('');
    setModalDescription('');
    setModalPermissions(new Set());
    setShowModal(true);
  };

  const openEditModal = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setModalName(role.name);
    setModalDescription(role.description);
    setModalPermissions(new Set(role.permissions.map((p) => p.id)));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!modalName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresa un nombre para el rol.',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    setSaving(true);

    try {
      let roleId = editingRole?.id;

      if (editingRole) {
        // Update role
        const { error } = await supabase
          .from('roles')
          .update({ name: modalName.trim(), description: modalDescription.trim() })
          .eq('id', editingRole.id);
        if (error) throw error;

        // Delete old permissions
        await supabase.from('role_permissions').delete().eq('role_id', editingRole.id);
      } else {
        // Create role
        const { data, error } = await supabase
          .from('roles')
          .insert({ name: modalName.trim(), description: modalDescription.trim() })
          .select()
          .maybeSingle();
        if (error) throw error;
        roleId = data?.id;
      }

      // Insert new permissions
      if (roleId && modalPermissions.size > 0) {
        const inserts = Array.from(modalPermissions).map((permId) => ({
          role_id: roleId,
          permission_id: permId,
        }));
        const { error } = await supabase.from('role_permissions').insert(inserts);
        if (error) throw error;
      }

      setShowModal(false);
      fetchData();
      Swal.fire({
        icon: 'success',
        title: editingRole ? 'Rol actualizado' : 'Rol creado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonColor: '#1d4ed8',
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo guardar el rol.',
        confirmButtonColor: '#1d4ed8',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleWithPermissions) => {
    if (role.name === 'admin') {
      Swal.fire({
        icon: 'warning',
        title: 'No permitido',
        text: 'No puedes eliminar el rol de administrador.',
        confirmButtonColor: '#1d4ed8',
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar rol',
      text: `Se eliminara el rol "${role.description || role.name}" y todos sus permisos asociados.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase.from('roles').delete().eq('id', role.id);
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el rol.',
        confirmButtonColor: '#1d4ed8',
      });
    } else {
      fetchData();
    }
  };

  const togglePermission = (permId: string) => {
    setModalPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      const cat = p.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {}
  );

  const CATEGORY_LABELS: Record<string, string> = {
    users: 'Usuarios',
    roles: 'Roles',
    system: 'Sistema',
    courses: 'Cursos',
    general: 'General',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configura los roles del sistema y sus permisos asociados
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#1D3956] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2a4f73] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo rol
        </button>
      </div>

      {/* Roles list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay roles configurados</div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1D3956] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {role.description || role.name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      {role.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">Sin permisos asignados</span>
                ) : (
                  role.permissions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      <Check className="w-3 h-3" />
                      {p.description || p.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingRole ? 'Editar rol' : 'Nuevo rol'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del rol
                  </label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="ej: moderador"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion
                  </label>
                  <input
                    type="text"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="ej: Moderador de contenido"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B2BB] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permisos
                  </label>
                  <div className="space-y-4">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {CATEGORY_LABELS[category] || category}
                        </p>
                        <div className="space-y-2">
                          {perms.map((p) => (
                            <label
                              key={p.id}
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={modalPermissions.has(p.id)}
                                onChange={() => togglePermission(p.id)}
                                className="w-4 h-4 rounded border-gray-300 text-[#1D3956] focus:ring-[#F2B2BB]"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {p.description || p.name}
                                </p>
                                <p className="text-xs text-gray-500">{p.name}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#1D3956] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#2a4f73] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
