import { UserCircle, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../assets/styles/admin/AdminProfilePage.module.scss';

export default function AdminProfilePage() {
  const { user, roles } = useAuth();

  const nombre = user?.name || user?.username || 'Administrador';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mi Perfil</h1>
        <p className={styles.pageSubtitle}>Información de tu cuenta de administrador</p>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <div className={styles.profileAvatar}>{inicial}</div>
          <div>
            <h2 className={styles.profileName}>{nombre}</h2>
            <p className={styles.profileEmail}>{user?.email || 'Sin correo registrado'}</p>
          </div>
        </div>

        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>
              <UserCircle />
              <span>Nombre</span>
            </div>
            <span className={styles.infoValue}>{nombre}</span>
          </div>

          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>
              <Mail />
              <span>Correo</span>
            </div>
            <span className={styles.infoValue}>{user?.email || '—'}</span>
          </div>

          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>
              <ShieldCheck />
              <span>Rol</span>
            </div>
            <span className={styles.roleBadge}>
              {roles.length ? roles.join(', ') : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
