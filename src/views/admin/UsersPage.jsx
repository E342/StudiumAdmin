import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LuIcons from 'react-icons/lu';
import axios from 'axios';
import { GLOBAL } from '../../services/apiConfig';
import { ROLES, etiquetaRol } from '../../utils/roles';
import '../../assets/styles/admin/_usersPage.scss';

const API_URL = GLOBAL[0].BASE_URL;
const PAGE_SIZE = 12;

const ROLE_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: ROLES.ESTUDIANTE, label: 'Estudiante' },
  { value: ROLES.TUTOR, label: 'Tutor' },
  { value: ROLES.ADMIN, label: 'Administrador' },
];

export default function UsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/user`);
      let allUsers = response.data;
      allUsers = Array.isArray(allUsers) ? allUsers : allUsers.users || [];

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
        filtered = filtered.filter((u) => u.tipo === Number(roleFilter));
      }

      setTotalCount(filtered.length);

      const start = (page - 1) * PAGE_SIZE;
      setUsers(filtered.slice(start, start + PAGE_SIZE));
    } catch (error) {
      console.error('[UsersPage] Error:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="admin-users-page">
      <div className="admin-page-header">
        <h1>Usuarios</h1>
      </div>

      {/* Filtros */}
      <div className="admin-filters-card">
        <div className="admin-filters-row">
          <div className="admin-search-wrapper">
            <LuIcons.LuSearch />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="admin-search-input"
            />
          </div>
          <div className="admin-select-wrapper">
            <LuIcons.LuFilter />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="admin-select"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th>Usuario</th>
                <th className="admin-hide-sm">Rol</th>
                <th className="admin-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="admin-empty-cell">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={3} className="admin-empty-cell">No se encontraron usuarios</td></tr>
              ) : (
                users.map((user) => {
                  const nombre = user.nombre || user.email || user.correo || 'Sin nombre';
                  const email = user.email || user.correo || '';
                  const inicial = nombre.charAt(0).toUpperCase();
                  const tipo = user.tipo ?? ROLES.ESTUDIANTE;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{inicial}</div>
                          <div>
                            <p className="admin-user-name">{nombre}</p>
                            <p className="admin-user-email">{email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="admin-hide-sm">
                        <span className="admin-role-badge">{etiquetaRol(tipo)}</span>
                      </td>
                      <td className="admin-right">
                        <button
                          onClick={() => navigate(`/admin/users/${user._id}`)}
                          className="admin-view-btn"
                        >
                          <LuIcons.LuEye />
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
          <div className="admin-pagination">
            <p className="admin-pagination-info">
              {totalCount} usuario{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
            </p>
            <div className="admin-pagination-controls">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-page-btn"
              >
                <LuIcons.LuChevronLeft />
              </button>
              <span className="admin-page-info">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-page-btn"
              >
                <LuIcons.LuChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
