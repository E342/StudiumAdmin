import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as LuIcons from 'react-icons/lu';
import axios from 'axios';
import { GLOBAL } from '../../services/apiConfig';
import { ROLES, etiquetaRol } from '../../utils/roles';
import { showConfirm, showSuccess, showError } from '../../utils/alerts';
import '../../assets/styles/admin/_userDetailPage.scss';

const API_URL = GLOBAL[0].BASE_URL;

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('TOKEN');
      const response = await axios.get(`${API_URL}/user/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      // El backend no usa el campo `tipo` — el rol viene en el array `roles`.
      // Derivamos tipo localmente igual que lo hace App.jsx con resolverRolDesdeRoles.
      const rolesArr = Array.isArray(data.roles) ? data.roles : [];
      const GENERICOS = ['user', 'usuario'];
      const especifico = rolesArr.find((r) => !GENERICOS.includes(r));
      let tipoDerivado;
      if (especifico === 'tutor') tipoDerivado = ROLES.TUTOR;
      else if (especifico === 'admin' || especifico === 'sysadmin') tipoDerivado = ROLES.ADMIN;
      else tipoDerivado = ROLES.ESTUDIANTE;

      setProfile({ ...data, tipo: tipoDerivado });
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

  const handlePromote = async () => {
    if (!profile || Number(profile.tipo) !== ROLES.ESTUDIANTE) return;

    const nombre = profile.nombre || profile.email || profile.correo || 'este usuario';

    const confirmed = await showConfirm({
      title: 'Ascender a Tutor',
      text: `¿Deseas ascender a ${nombre} de Estudiante a Tutor? Esta acción no puede deshacerse desde este panel.`,
      icon: 'question',
      confirmButtonText: 'Sí, ascender',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmed) return;

    setPromoting(true);
    try {
      // Ruta real del backend: PATCH /api/user/:userId/role
      // Requiere token del backend (localStorage TOKEN) + rol admin
      const token = localStorage.getItem('TOKEN');
      await axios.patch(
        `${API_URL}/user/${id}/role`,
        { role: 'tutor', action: 'assign' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await showSuccess({
        title: '¡Usuario ascendido!',
        text: `${nombre} ahora es Tutor.`,
      });

      setLoading(true);
      await fetchProfile();
    } catch (error) {
      console.error('[UserDetailPage] Error al ascender:', error);
      showError({
        title: 'No se pudo actualizar',
        text: error?.response?.data?.error || 'No se pudo actualizar el rol del usuario.',
      });
    } finally {
      setPromoting(false);
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
  const tipo = Number(profile.tipo ?? ROLES.ESTUDIANTE);
  const fechaRegistro = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-SV')
    : '—';

  const canPromote = tipo === ROLES.ESTUDIANTE;

  return (
    <div className="admin-user-detail-page">
      <button className="admin-back-btn" onClick={() => navigate('/admin/users')}>
        <LuIcons.LuArrowLeft />
        Volver a usuarios
      </button>

      <div className="admin-detail-wrapper">

        {/* Tarjeta de perfil — ocupa todo el ancho */}
        <div className="admin-profile-card">
          <div className="admin-profile-top">
            <div className="admin-profile-avatar">{inicial}</div>
            <div className="admin-profile-info">
              <h1>{nombre}</h1>
              <p>{email}</p>
            </div>
            {/* Botón de ascenso en la esquina superior derecha */}
            {canPromote && (
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="admin-promote-btn-corner"
              >
                <LuIcons.LuArrowUpCircle />
                {promoting ? 'Procesando...' : 'Ascender a Tutor'}
              </button>
            )}
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
          {canPromote ? (
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
                onClick={handlePromote}
                disabled={promoting}
                className="admin-promote-btn"
              >
                {promoting ? 'Procesando...' : 'Ascender a Tutor'}
              </button>
            </div>
          ) : (
            <p className="admin-no-action-msg">
              {tipo === ROLES.TUTOR
                ? 'Este usuario ya es Tutor. No hay ascenso disponible.'
                : 'El ascenso Estudiante → Tutor solo aplica a usuarios con rol Estudiante.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
