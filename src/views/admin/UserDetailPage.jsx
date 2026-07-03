import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as LuIcons from 'react-icons/lu';
import axios from 'axios';
import { GLOBAL } from '../../services/apiConfig';
import { ROLES, etiquetaRol, resolverRolDesdeRoles } from '../../utils/roles';
import { showConfirm, showSuccess, showError } from '../../utils/alerts';
import '../../assets/styles/admin/_userDetailPage.scss';

const API_URL = GLOBAL[0].BASE_URL;

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/profile/${id}`);
      const data = response.data;
      const rolesArr = Array.isArray(data.roles) ? data.roles : [];
      const tipo = resolverRolDesdeRoles(rolesArr) || ROLES.ESTUDIANTE;
      setProfile({ ...data, tipo });
    } catch (error) {
      console.error('[UserDetailPage] Error al cargar perfil:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Acción genérica de cambio de rol: assign (ascender) o revoke (revertir)
  const handleRoleChange = async (action) => {
    if (!profile) return;

    const nombre = profile.nombre || profile.email || 'este usuario';
    const esAscenso = action === 'assign';

    const confirmed = await showConfirm({
      title: esAscenso ? 'Ascender a Tutor' : 'Revertir a Estudiante',
      text: esAscenso
        ? `¿Deseas ascender a ${nombre} de Estudiante a Tutor?`
        : `¿Deseas revertir a ${nombre} de Tutor a Estudiante?`,
      icon: 'question',
      confirmButtonText: esAscenso ? 'Sí, ascender' : 'Sí, revertir',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmed) return;

    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/user/${id}/role`, { role: 'tutor', action });

      await showSuccess({
        title: esAscenso ? '¡Usuario ascendido!' : '¡Rol revertido!',
        text: esAscenso
          ? `${nombre} ahora es Tutor.`
          : `${nombre} ahora es Estudiante.`,
      });

      // Recargar el perfil SIN pasar por setLoading(true): así el
      // componente no se desmonta/remonta y el badge de "Rol actual"
      // se actualiza directamente al terminar el fetch.
      await fetchProfile();
    } catch (error) {
      console.error('[UserDetailPage] Error al cambiar rol:', error);
      showError({
        title: 'No se pudo actualizar',
        text: error?.response?.data?.error || 'No se pudo actualizar el rol del usuario.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-center-msg">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="admin-center-msg">Usuario no encontrado</div>;
  }

  const nombre = profile.nombre || profile.email || profile.correo || 'Sin nombre';
  const email = profile.email || profile.correo || '';
  const inicial = nombre.charAt(0).toUpperCase();
  const tipo = profile.tipo;
  const fechaRegistro = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-SV')
    : '—';

  const esEstudiante = tipo === ROLES.ESTUDIANTE;
  const esTutor = tipo === ROLES.TUTOR;

  return (
    <div className="admin-user-detail-page">
      <button className="admin-back-btn" onClick={() => navigate('/admin/users')}>
        <LuIcons.LuArrowLeft />
        Volver a usuarios
      </button>

      <div className="admin-detail-wrapper">

        {/* Tarjeta de perfil */}
        <div className="admin-profile-card">
          <div className="admin-profile-top">
              <div className="admin-profile-avatar">{inicial}</div>
            <div className="admin-profile-info">
              <h1>{nombre}</h1>
              <p>{email}</p>
            </div>
          </div>

          <div className="admin-profile-meta">
            <div className="admin-profile-meta-item">
              <LuIcons.LuCalendar />
              <span>Registrado: {fechaRegistro}</span>
            </div>
            <div className="admin-profile-meta-item">
              <LuIcons.LuMail />
              <span>{email || '—'}</span>
            </div>
            <div className="admin-profile-meta-item">
              <LuIcons.LuShield />
              <span>
                Rol actual:{' '}
                <strong className="admin-rol-highlight">{etiquetaRol(tipo)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de gestión de rol */}
        <div className="admin-action-card">
          <h2>Gestión de rol</h2>

          {esEstudiante && (
            <div className="admin-promote-box">
              <div className="admin-promote-info">
                <LuIcons.LuArrowUpCircle className="admin-promote-icon" />
                <div>
                  <p className="admin-promote-label">Ascender a Tutor</p>
                  <p className="admin-promote-desc">
                    Este usuario es actualmente <strong>Estudiante</strong>. Puedes
                    ascenderlo a <strong>Tutor</strong> si corresponde.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRoleChange('assign')}
                disabled={actionLoading}
                className="admin-promote-btn"
              >
                {actionLoading ? 'Procesando...' : 'Ascender a Tutor'}
              </button>
            </div>
          )}

          {esTutor && (
            <div className="admin-revoke-box">
              <div className="admin-promote-info">
                <LuIcons.LuArrowDownCircle className="admin-revoke-icon" />
                <div>
                  <p className="admin-promote-label">Revertir a Estudiante</p>
                  <p className="admin-promote-desc">
                    Este usuario es actualmente <strong>Tutor</strong>. Puedes
                    revertir su rol a <strong>Estudiante</strong> si corresponde.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRoleChange('revoke')}
                disabled={actionLoading}
                className="admin-revoke-btn"
              >
                {actionLoading ? 'Procesando...' : 'Revertir a Estudiante'}
              </button>
            </div>
          )}

          {!esEstudiante && !esTutor && (
            <p className="admin-no-action-msg">
              Este usuario es Administrador. No se puede cambiar su rol desde este panel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
