import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GLOBAL } from '../../services/apiConfig';
import styles from '../../assets/styles/admin/AdminDashboard.module.scss';

const API_URL = GLOBAL[0].BASE_URL;

export default function AdminDashboard() {
  const { keycloak } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    tutors: 0,
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
          // tipo 2 → estudiante, tipo 3 → tutor
          students: usersArr.filter((u) => u.tipo === 2).length,
          tutors: usersArr.filter((u) => u.tipo === 3).length,
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
    { label: 'Total Usuarios', value: stats.totalUsers, icon: Users, variant: 'blue' },
    { label: 'Estudiantes', value: stats.students, icon: UserCheck, variant: 'green' },
    { label: 'Tutores', value: stats.tutors, icon: UserX, variant: 'amber' },
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

      <div className={styles.infoCard}>
        <h2 className={styles.infoCardTitle}>Acciones rápidas</h2>
        <div className={styles.quickActions}>
          <a href="/admin/users" className={styles.quickActionLink}>
            <Users />
            <span>Ver lista de usuarios</span>
          </a>
        </div>
      </div>
    </div>
  );
}
