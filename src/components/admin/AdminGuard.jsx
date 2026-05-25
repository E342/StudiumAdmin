import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../assets/styles/admin/AdminGuard.module.scss';

export default function AdminGuard({ children }) {
  const { isAuthenticated, isLoading, isAdmin, login } = useAuth();

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
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
