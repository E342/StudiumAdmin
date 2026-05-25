import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserCheck, UserX, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';
import { TIPO_LABELS, ROLES, ROLE_TO_TIPO } from '../../constants/roles';
import { GLOBAL } from '../../services/apiConfig';
import styles from '../../assets/styles/admin/UsersPage.module.scss';

const API_URL = GLOBAL[0].BASE_URL;
const PAGE_SIZE = 12;

// Roles disponibles en el sistema para filtro
const ROLE_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: ROLES.ESTUDIANTE, label: 'Estudiante' },
  { value: ROLES.TUTOR, label: 'Tutor' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador' },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const { keycloak } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const getAuthHeaders = useCallback(() => {
    const token = keycloak?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [keycloak]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Error al obtener usuarios');

      let allUsers = await res.json();
      allUsers = Array.isArray(allUsers) ? allUsers : allUsers.users || [];

      // Filtros en cliente (ya que el backend no los soporta aún)
      let filtered = allUsers;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.nombre?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            u.correo?.toLowerCase().includes(term)
        );
      }

      if (roleFilter) {
        const tipoTarget = ROLE_TO_TIPO[roleFilter];
        filtered = filtered.filter((u) => u.tipo === tipoTarget);
      }

      if (statusFilter === 'active') {
        filtered = filtered.filter((u) => u.activo !== false);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((u) => u.activo === false);
      }

      setTotalCount(filtered.length);

      // Paginación en cliente
      const start = (page - 1) * PAGE_SIZE;
      setUsers(filtered.slice(start, start + PAGE_SIZE));
    } catch (err) {
      console.error('[UsersPage] Error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, page, getAuthHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (user) => {
    const newStatus = !user.activo;
    const nombreUsuario = user.nombre || user.email || user.correo || 'usuario';

    const result = await Swal.fire({
      icon: 'question',
      title: newStatus ? 'Activar usuario' : 'Desactivar usuario',
      text: newStatus
        ? `Se activará la cuenta de ${nombreUsuario}.`
        : `Se desactivará la cuenta de ${nombreUsuario}.`,
      showCancelButton: true,
      confirmButtonText: newStatus ? 'Activar' : 'Desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1D3956',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/user/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ activo: newStatus }),
      });

      if (!res.ok) throw new Error('Error al actualizar estado');
      fetchUsers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del usuario.',
        confirmButtonColor: '#1D3956',
      });
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
        <p className={styles.pageSubtitle}>
          Administra los perfiles, roles y estados de los usuarios
        </p>
      </div>

      {/* Filtros */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <div className={styles.searchWrapper}>
            <Search />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filtersGroup}>
            <div className={styles.selectWrapper}>
              <Filter />
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className={styles.select}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={styles.selectSimple}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Usuario</th>
                <th className={styles.hiddenSm}>Rol</th>
                <th className={styles.hiddenMd}>Tipo</th>
                <th>Estado</th>
                <th className={styles.right}>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>Cargando...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>No se encontraron usuarios</td>
                </tr>
              ) : (
                users.map((user) => {
                  const nombre = user.nombre || user.email || user.correo || 'Sin nombre';
                  const email = user.email || user.correo || '';
                  const inicial = nombre.charAt(0).toUpperCase();
                  const tipo = user.tipo ?? 2;
                  const rolLabel = TIPO_LABELS[tipo] || 'Desconocido';
                  const activo = user.activo !== false;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>{inicial}</div>
                          <div>
                            <p className={styles.userName}>{nombre}</p>
                            <p className={styles.userEmail}>{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.hiddenSm}>
                        <span className={styles.roleBadge}>{rolLabel}</span>
                      </td>
                      <td className={styles.hiddenMd}>{tipo}</td>
                      <td>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`${styles.statusBadge} ${activo ? styles.active : styles.inactive}`}
                        >
                          {activo
                            ? <><UserCheck /> Activo</>
                            : <><UserX /> Inactivo</>
                          }
                        </button>
                      </td>
                      <td className={styles.right}>
                        <button
                          onClick={() => navigate(`/admin/users/${user._id}`)}
                          className={styles.viewBtn}
                        >
                          <Eye />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <p className={styles.paginationInfo}>
              {totalCount} usuario{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
            </p>
            <div className={styles.paginationControls}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={styles.pageBtn}
              >
                <ChevronLeft />
              </button>
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={styles.pageBtn}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
