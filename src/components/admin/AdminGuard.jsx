import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../assets/styles/admin/AdminGuard.module.scss';

export default function AdminGuard({ children }) {
  const { isAuthenticated, isLoading, isAdmin, roles, login } = useAuth();

  // TEMP DEBUG — quitar una vez resuelto el diagnóstico
  console.log('[AdminGuard]', { isLoading, isAuthenticated, isAdmin, roles });

  if (isLoading) {
    return (
      <div className={styles.guardWrapper}>
        <div className={styles.guardInner}>
          <div className={styles.spinner} />
          <p className={styles.guardText}>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirige al flujo OIDC de Keycloak
    login();
    return (
      <div className={styles.guardWrapper}>
        <div className={styles.guardInner}>
          <div className={styles.spinner} />
          <p className={styles.guardText}>Redirigiendo a Keycloak...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.guardWrapper}>
        <div className={styles.guardInner}>
          <p className={styles.guardText}>
            No tienes el rol "administrador" asignado en Keycloak.
            <br />
            Roles detectados: {roles.length ? roles.join(', ') : '(ninguno)'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
