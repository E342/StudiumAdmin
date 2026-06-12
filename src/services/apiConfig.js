/**
 * Configuración global consumida por el resto de la aplicación.
 *
 * El proveedor de autenticación migró de Microsoft Entra ID (MSAL) a Keycloak
 * (OpenID Connect), por lo que ahora se exponen las variables necesarias
 * para inicializar el cliente Keycloak desde el frontend.
 *
 * Variables de entorno esperadas (ver `.env.example`):
 *   - VITE_API_URL                   → URL base del backend
 *   - VITE_KEYCLOAK_URL              → URL base del servidor Keycloak
 *   - VITE_KEYCLOAK_REALM            → Realm donde vive el cliente
 *   - VITE_KEYCLOAK_CLIENT_ID        → Client ID público (PKCE)
 *   - VITE_KEYCLOAK_MIN_VALIDITY     → Segundos mínimos antes de renovar token
 */
export const GLOBAL = [
    {
        BASE_URL: import.meta.env.VITE_API_URL,
        KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL || '',
        KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM || '',
        KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '',
        KEYCLOAK_MIN_VALIDITY: import.meta.env.VITE_KEYCLOAK_MIN_VALIDITY || '60',
    },
];
