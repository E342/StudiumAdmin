import { Shield, LogIn, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useKeycloak } from '../../services/KeycloakProvider';
import styles from '../../assets/styles/admin/AdminLogin.module.scss';

export default function AdminLogin() {
  const { login, isLoading } = useAuth();
  const { configured } = useKeycloak();

  const handleLogin = () => {
    login();
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <div className={styles.loginIconWrapper}>
            <Shield />
          </div>
          <h1 className={styles.loginTitle}>Studium Admin</h1>
          <p className={styles.loginSubtitle}>Panel de Administración</p>
        </div>

        <div className={styles.loginCard}>
          {!configured ? (
            <div className={styles.keycloakNotice}>
              <div className={styles.configWarning}>
                <AlertTriangle />
                <p>
                  La autenticación con Keycloak no está configurada. Completa las
                  variables de entorno <code>VITE_KEYCLOAK_URL</code>,{' '}
                  <code>VITE_KEYCLOAK_REALM</code> y{' '}
                  <code>VITE_KEYCLOAK_CLIENT_ID</code> para habilitar el acceso.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.keycloakNotice}>
              <p className={styles.keycloakNoticeText}>
                El acceso al panel de administración requiere autenticación a
                través de Keycloak. Serás redirigido al proveedor de identidad.
              </p>
              <button
                className={styles.loginBtn}
                onClick={handleLogin}
                disabled={isLoading}
              >
                <LogIn />
                {isLoading ? 'Redirigiendo...' : 'Iniciar sesión con Keycloak'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
