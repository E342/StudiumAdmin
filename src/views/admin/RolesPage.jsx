import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield, Check, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { ROLES, TIPO_LABELS, ROLE_TO_TIPO } from '../../constants/roles';
import styles from '../../assets/styles/admin/RolesPage.module.scss';

/**
 * RolesPage muestra los roles del sistema definidos en Keycloak.
 *
 * Los roles válidos son: estudiante, tutor, administrador (ver constants/roles.js).
 * La gestión real de roles y asignaciones se hace en la consola de Keycloak;
 * esta vista los muestra informativamente junto al mapeo con el campo `tipo`
 * del modelo User de StudiumServer (MongoDB).
 *
 * Si en el futuro se conecta un endpoint de administración de Keycloak
 * (Keycloak Admin REST API), esta página puede extenderse para CRUD real.
 */

const SYSTEM_ROLES = [
  {
    id: ROLES.ADMINISTRADOR,
    name: ROLES.ADMINISTRADOR,
    description: 'Administrador',
    tipo: ROLE_TO_TIPO[ROLES.ADMINISTRADOR],
    permissions: [
      'Acceso total al panel de administración',
      'Gestión de usuarios',
      'Visualización de estadísticas',
    ],
  },
  {
    id: ROLES.TUTOR,
    name: ROLES.TUTOR,
    description: 'Tutor / Catedrático',
    tipo: ROLE_TO_TIPO[ROLES.TUTOR],
    permissions: [
      'Gestión de cursos propios',
      'Publicación de recursos',
      'Vista de perfil de estudiantes',
    ],
  },
  {
    id: ROLES.ESTUDIANTE,
    name: ROLES.ESTUDIANTE,
    description: 'Estudiante',
    tipo: ROLE_TO_TIPO[ROLES.ESTUDIANTE],
    permissions: [
      'Acceso a cursos inscritos',
      'Descarga de recursos',
      'Vista de perfil propio',
    ],
  },
];

export default function RolesPage() {
  const [expandedRole, setExpandedRole] = useState(null);

  const handleInfo = () => {
    Swal.fire({
      icon: 'info',
      title: 'Gestión de roles',
      html: `
        <p style="text-align:left;font-size:0.9rem;line-height:1.6">
          Los roles del sistema se gestionan desde la consola de administración de
          <strong>Keycloak</strong>. Para crear, editar o eliminar roles, accede al
          panel de Keycloak → Realm → Roles.<br/><br/>
          La asignación de roles a usuarios también se realiza desde Keycloak.
          El campo <code>tipo</code> en MongoDB se sincroniza al momento del registro.
        </p>
      `,
      confirmButtonColor: '#1D3956',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageTop}>
        <div>
          <h1 className={styles.pageTitle}>Roles del Sistema</h1>
          <p className={styles.pageSubtitle}>
            Roles definidos en Keycloak y su mapeo con StudiumServer
          </p>
        </div>
        <button className={styles.newRoleBtn} onClick={handleInfo}>
          <Plus />
          Agregar rol
        </button>
      </div>

      <div className={styles.roleList}>
        {SYSTEM_ROLES.map((role) => (
          <div key={role.id} className={styles.roleCard}>
            <div className={styles.roleCardTop}>
              <div className={styles.roleInfo}>
                <div className={styles.roleIconWrapper}>
                  <Shield />
                </div>
                <div>
                  <p className={styles.roleName}>{role.description}</p>
                  <p className={styles.roleSlug}>
                    Keycloak: <strong>{role.name}</strong> · tipo MongoDB: <strong>{role.tipo}</strong>
                    {' · '}label: <strong>{TIPO_LABELS[role.tipo]}</strong>
                  </p>
                </div>
              </div>
              <div className={styles.roleActions}>
                <button
                  className={`${styles.iconBtn} ${styles.edit}`}
                  onClick={() =>
                    setExpandedRole(expandedRole === role.id ? null : role.id)
                  }
                  title="Ver permisos"
                >
                  <Pencil />
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.delete}`}
                  onClick={handleInfo}
                  title="Gestionar en Keycloak"
                >
                  <Trash2 />
                </button>
              </div>
            </div>

            <div className={styles.permissionsList}>
              {expandedRole === role.id ? (
                role.permissions.map((p) => (
                  <span key={p} className={styles.permBadge}>
                    <Check />
                    {p}
                  </span>
                ))
              ) : (
                <span className={styles.noPerms}>
                  {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''} — haz clic en editar para ver
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #bfdbfe', fontSize: '0.875rem', color: '#1e40af' }}>
        <strong>Nota:</strong> La creación y edición de roles se realiza desde la consola de Keycloak.
        Para gestionar roles de usuario, accede a <em>Keycloak Admin → Realm → Roles</em> o usa la Keycloak Admin REST API.
      </div>
    </div>
  );
}
