import { useEffect, useState } from 'react';
import { Users, Shield, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GLOBAL } from '../../services/apiConfig';
import styles from '../../assets/styles/admin/AdminDashboard.module.scss';

const API_URL = GLOBAL[0].BASE_URL;

export default function AdminDashboard() {
  const { keycloak } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRoles: 3, // estudiante, tutor, administrador
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = keycloak?.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/user`, { headers });
        if (!res.ok) throw new Error('Error al obtener usuarios');

        const users = await res.json();
        const usersArr = Array.isArray(users) ? users : users.users || [];

        setStats({
          totalUsers: usersArr.length,
          activeUsers: usersArr.filter((u) => u.activo !== false).length,
          inactiveUsers: usersArr.filter((u) => u.activo === false).length,
          totalRoles: 3,
        });
      } catch (err) {
        console.error('[AdminDashboard] Error al cargar estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [keycloak]);

  const cards = [
    {
      label: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      variant: 'blue',
    },
    {
      label: 'Usuarios Activos',
      value: stats.activeUsers,
      icon: UserCheck,
      variant: 'green',
    },
    {
      label: 'Usuarios Inactivos',
      value: stats.inactiveUsers,
      icon: UserX,
      variant: 'red',
    },
    {
      label: 'Roles',
      value: stats.totalRoles,
      icon: Shield,
      variant: 'amber',
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSubtitle}>Resumen general del sistema Studium</p>
      </div>

      <div className={styles.statsGrid}>
        {cards.map((card) => (
          <div key={card.label} className={`${styles.statCard} ${styles[card.variant]}`}>
            <div>
              <p className={styles.statLabel}>{card.label}</p>
              <p className={styles.statValue}>{loading ? '...' : card.value}</p>
            </div>
            <div className={styles.statIconWrapper}>
              <card.icon />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.infoCard}>
          <h2 className={styles.infoCardTitle}>Acciones rápidas</h2>
          <div className={styles.quickActions}>
            <a href="/admin/users" className={styles.quickActionLink}>
              <Users />
              <span>Gestionar usuarios</span>
            </a>
            <a href="/admin/roles" className={styles.quickActionLink}>
              <Shield />
              <span>Ver roles del sistema</span>
            </a>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h2 className={styles.infoCardTitle}>Información del sistema</h2>
          <dl className={styles.sysInfoList}>
            <div className={styles.sysInfoRow}>
              <dt className={styles.sysInfoKey}>Plataforma</dt>
              <dd className={styles.sysInfoVal}>Studium</dd>
            </div>
            <div className={styles.sysInfoRow}>
              <dt className={styles.sysInfoKey}>Autenticación</dt>
              <dd className={styles.sysInfoVal}>Keycloak (OIDC)</dd>
            </div>
            <div className={styles.sysInfoRow}>
              <dt className={styles.sysInfoKey}>Base de datos</dt>
              <dd className={styles.sysInfoVal}>MongoDB (StudiumServer)</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
