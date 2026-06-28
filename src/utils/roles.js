// Fuente única de verdad para los tipos de usuario del proyecto.
// El rol 3 ("docente") se conoce como "Tutor"; se conservan los identificadores
// existentes para no romper el código actual.
export const ROLES = {
  ADMIN: 1,
  ESTUDIANTE: 2,
  TUTOR: 3,
};

export const normalizarTipoUsuario = (valor) => {
  if (valor === null || valor === undefined) return '';
  const numero = Number(valor);
  if (!Number.isNaN(numero) && numero !== 0) return numero;
  const texto = String(valor).toLowerCase().trim();
  if (['admin', 'administrador', 'sysadmin', '1'].includes(texto)) return ROLES.ADMIN;
  if (['estudiante', 'alumno', 'student', 'user', 'usuario', '2'].includes(texto)) return ROLES.ESTUDIANTE;
  if (['docente', 'catedratico', 'catedrático', 'profesor', 'tutor', 'teacher', '3'].includes(texto)) return ROLES.TUTOR;
  return texto;
};

// Roles "base" que por sí solos identifican a un estudiante.
const ROLES_GENERICOS = ['user', 'usuario'];

// Resuelve el tipo de usuario (ROLES.*) a partir del arreglo `roles` que entrega
// el backend (p. ej. ["user"], ["user", "tutor"]). Un rol específico —tutor,
// admin, sysadmin— tiene prioridad sobre el genérico "user". Devuelve un valor
// de ROLES.* o '' si el arreglo no permite determinarlo.
export const resolverRolDesdeRoles = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return '';
  const normalizados = roles.map((rol) => String(rol || '').toLowerCase().trim());
  const especifico = normalizados.find((rol) => rol && !ROLES_GENERICOS.includes(rol));
  if (especifico) return normalizarTipoUsuario(especifico);
  if (normalizados.some((rol) => ROLES_GENERICOS.includes(rol))) return ROLES.ESTUDIANTE;
  return '';
};

// Lee el rol del mecanismo de autenticación actual (persistido tras el login).
export const obtenerRolActual = () => normalizarTipoUsuario(localStorage.getItem('ROL'));

// Etiqueta legible para mostrar el tipo de usuario en la interfaz.
export const etiquetaRol = (rol) => {
    switch (rol) {
        case ROLES.ADMIN:
            return 'Administrador';
        case ROLES.ESTUDIANTE:
            return 'Estudiante';
        case ROLES.TUTOR:
            return 'Tutor';
        default:
            return 'Usuario';
    }
};
