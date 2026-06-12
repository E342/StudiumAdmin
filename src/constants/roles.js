/**
 * Roles válidos en Keycloak para el sistema Studium.
 * Estos son los nombres exactos que deben estar configurados
 * como realm roles o client roles en el servidor Keycloak.
 */
export const ROLES = {
  ESTUDIANTE: 'estudiante',
  TUTOR: 'tutor',
  ADMINISTRADOR: 'administrador',
};

/**
 * Mapeo entre roles de Keycloak y el campo numérico `tipo`
 * del modelo User en StudiumServer (MongoDB).
 *
 * tipo: 1 → administrador
 * tipo: 2 → estudiante  (default en backend)
 * tipo: 3 → tutor
 */
export const ROLE_TO_TIPO = {
  [ROLES.ADMINISTRADOR]: 1,
  [ROLES.ESTUDIANTE]: 2,
  [ROLES.TUTOR]: 3,
};

export const TIPO_TO_ROLE = {
  1: ROLES.ADMINISTRADOR,
  2: ROLES.ESTUDIANTE,
  3: ROLES.TUTOR,
};

export const TIPO_LABELS = {
  1: 'Administrador',
  2: 'Estudiante',
  3: 'Tutor',
};
