import { useMemo } from 'react';
import { useKeycloak } from '../services/KeycloakProvider';
import { ROLES } from '../constants/roles';

/**
 * Hook centralizado de autenticación.
 * Única fuente de verdad para sesión y roles en toda la aplicación.
 *
 * Retorna:
 *  - user          → claims básicos del token (sub, name, email, etc.)
 *  - roles         → array de roles de Keycloak del usuario actual
 *  - isAuthenticated → booleano
 *  - isLoading     → true mientras Keycloak inicializa
 *  - isAdmin       → true si el usuario tiene el rol "administrador"
 *  - hasRole(role) → función para verificar un rol específico
 *  - login()       → redirige al flujo OIDC de Keycloak
 *  - logout()      → invalida sesión en Keycloak y limpia estado local
 */
export function useAuth() {
  const { keycloak, initialized, authenticated, login, logout } = useKeycloak();

  const user = useMemo(() => {
    if (!authenticated || !keycloak?.tokenParsed) return null;

    const parsed = keycloak.tokenParsed;
    return {
      id: parsed.sub,
      name: parsed.name || parsed.preferred_username || '',
      email: parsed.email || '',
      username: parsed.preferred_username || '',
    };
  }, [authenticated, keycloak?.tokenParsed]);

  const roles = useMemo(() => {
    if (!authenticated || !keycloak) return [];

    // Realm roles (fuente principal)
    const realmRoles = keycloak.tokenParsed?.realm_access?.roles || [];
    // Client roles (fuente alternativa si se usan client roles)
    const clientId = keycloak.clientId;
    const clientRoles =
      clientId && keycloak.tokenParsed?.resource_access?.[clientId]?.roles
        ? keycloak.tokenParsed.resource_access[clientId].roles
        : [];

    const allRoles = [...new Set([...realmRoles, ...clientRoles])];

    // Filtrar solo los roles conocidos del sistema
    const knownRoles = Object.values(ROLES);
    return allRoles.filter((r) => knownRoles.includes(r));
  }, [authenticated, keycloak]);

  const hasRole = (role) => roles.includes(role);

  const isAdmin = hasRole(ROLES.ADMINISTRADOR);

  const handleLogout = () => {
    // Invalida sesión en Keycloak y limpia cualquier estado local
    localStorage.removeItem('ID');
    sessionStorage.clear();
    return logout({ redirectUri: window.location.origin + '/login' });
  };

  return {
    user,
    roles,
    isAuthenticated: authenticated,
    isLoading: !initialized,
    isAdmin,
    hasRole,
    login,
    logout: handleLogout,
  };
}
