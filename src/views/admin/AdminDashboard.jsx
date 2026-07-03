import { useEffect, useState } from 'react';
import * as LuIcons from 'react-icons/lu';
import axios from 'axios';
import { GLOBAL } from '../../services/apiConfig';
import { ROLES, resolverRolDesdeRoles } from '../../utils/roles';
import '../../assets/styles/admin/_dashboard.scss';

const API_URL = GLOBAL[0].BASE_URL;

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, students: 0, tutors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/user`);
        const data = response.data;
        const usersArr = Array.isArray(data) ? data : data.users || [];

        // El backend entrega el rol en el arreglo `roles` (p. ej. ["user","tutor"]),
        // no en un campo `tipo` plano. Lo resolvemos aquí para que las tarjetas
        // reflejen el conteo real y actualizado tras ascender/revertir un rol.
        const tipos = usersArr.map(
          (u) => resolverRolDesdeRoles(Array.isArray(u.roles) ? u.roles : []) || ROLES.ESTUDIANTE
        );

        setStats({
          totalUsers: usersArr.length,
          students: tipos.filter((t) => t === ROLES.ESTUDIANTE).length,
          tutors: tipos.filter((t) => t === ROLES.TUTOR).length,
        });
      } catch (error) {
        console.error('[AdminDashboard] Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Usuarios', value: stats.totalUsers, icon: <LuIcons.LuUsers /> },
    { label: 'Estudiantes', value: stats.students, icon: <LuIcons.LuUserCheck /> },
    { label: 'Tutores', value: stats.tutors, icon: <LuIcons.LuGraduationCap /> },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Panel Administrador</h1>
        <p>Resumen general del sistema Studium</p>
      </div>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <div>
              <p className="admin-stat-label">{card.label}</p>
              <p className="admin-stat-value">{loading ? '...' : card.value}</p>
            </div>
            <div className="admin-stat-icon">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-info-card">
        <h2>Acciones rápidas</h2>
        <div className="admin-quick-actions">
          <a href="/admin/users" className="admin-quick-action-link">
            <LuIcons.LuUsers />
            <span>Ver lista de usuarios</span>
          </a>
        </div>
      </div>
    </div>
  );
}
