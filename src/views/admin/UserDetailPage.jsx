import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Calendar, ArrowUpCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';
import { TIPO_LABELS, ROLE_TO_TIPO, ROLES } from '../../constants/roles';
import { GLOBAL } from '../../services/apiConfig';
import { isMockEnabled, mockFetchUserById, mockPatchUser } from '../../mocks/mockApi';
import styles from '../../assets/styles/admin/UserDetailPage.module.scss';

const API_URL = GLOBAL[0].BASE_URL;

// Los únicos tipos que permiten el ascenso según el nuevo alcance
const TIPO_ESTUDIANTE = ROLE_TO_TIPO[ROLES.ESTUDIANTE]; // 2
const TIPO_TUTOR = ROLE_TO_TIPO[ROLES.TUTOR];           // 3

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { keycloak } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  const getAuthHeaders = () => {
    const token = keycloak?.token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  const fetchProfile = async () => {
    try {
      let data;
      if (isMockEnabled) {
        data = await mockFetchUserById(id);
      } else {
        const res = await fetch(`${API_URL}/user/profile/${id}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('No encontrado');
        data = await res.json();
      }
      setProfile(data);
    } catch (err) {
      console.error('[UserDetailPage] Error:', err);
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
    if (!profile || profile.tipo !== TIPO_ESTUDIANTE) return;

    const nombre = profile.nombre || profile.email || profile.correo || 'este usuario';

    const result = await Swal.fire({
      icon: 'question',
      title: 'Ascender a Tutor',
      html: `
        <p style="font-size:0.9375rem;line-height:1.6">
          ¿Deseas ascender a <strong>${nombre}</strong> de
          <em>Estudiante</em> a <em>Tutor</em>?
        </p>
        <p style="font-size:0.8125rem;color:#6b7280;margin-top:0.5rem">
          Esta acción cambia el campo <code>tipo</code> de 2 a 3. No puede deshacerse desde este panel.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, ascender',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1D3956',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    setPromoting(true);
    try {
      if (isMockEnabled) {
        await mockPatchUser(id, { tipo: TIPO_TUTOR });
      } else {
        const res = await fetch(`${API_URL}/user/${id}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ tipo: TIPO_TUTOR }),
        });

        if (!res.ok) throw new Error('Error al actualizar');
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Usuario ascendido!',
        text: `${nombre} ahora es Tutor.`,
        confirmButtonColor: '#1D3956',
      });

      // Recargar el perfil para reflejar el cambio
      setLoading(true);
      await fetchProfile();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el rol del usuario.',
        confirmButtonColor: '#1D3956',
      });
    } finally {
      setPromoting(false);
    }
  };

  /* ---- Renderizado ---- */

  if (loading) {
    return <div className={styles.centerMsg}>Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className={styles.centerMsg}>Usuario no encontrado</div>;
  }

  const nombre = profile.nombre || profile.email || profile.correo || 'Sin nombre';
  const email = profile.email || profile.correo || '';
  const inicial = nombre.charAt(0).toUpperCase();
  const tipo = profile.tipo ?? 2;
  const rolLabel = TIPO_LABELS[tipo] || 'Desconocido';
  const fechaRegistro = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-SV')
    : '—';

  const canPromote = tipo === TIPO_ESTUDIANTE;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/users')}>
        <ArrowLeft />
        Volver a usuarios
      </button>

      <div className={styles.formWrapper}>
        {/* Cabecera de perfil */}
        <div className={styles.profileCard}>
          <div className={styles.profileTop}>
            <div className={styles.profileAvatar}>{inicial}</div>
            <div>
              <h1 className={styles.profileName}>{nombre}</h1>
              <p className={styles.profileEmail}>{email}</p>
            </div>
          </div>

          <div className={styles.profileMeta}>
            <div className={styles.profileMetaItem}>
              <Calendar />
              <span>Registrado: {fechaRegistro}</span>
            </div>
            <div className={styles.profileMetaItem}>
              <Mail />
              <span>{email || '—'}</span>
            </div>
            <div className={styles.profileMetaItem}>
              <Shield />
              <span>
                Rol actual:{' '}
                <strong className={styles.rolHighlight}>{rolLabel}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Acción de ascenso */}
        <div className={styles.actionCard}>
          <h2 className={styles.actionTitle}>Gestión de rol</h2>

          {canPromote ? (
            <div className={styles.promoteBox}>
              <div className={styles.promoteInfo}>
                <ArrowUpCircle className={styles.promoteIcon} />
                <div>
                  <p className={styles.promoteLabel}>Ascender a Tutor</p>
                  <p className={styles.promoteDesc}>
                    Este usuario es actualmente <strong>Estudiante</strong>. Puedes
                    ascenderlo a <strong>Tutor</strong> si corresponde.
                  </p>
                </div>
              </div>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className={styles.promoteBtn}
              >
                {promoting ? 'Procesando...' : 'Ascender a Tutor'}
              </button>
            </div>
          ) : (
            <p className={styles.noActionMsg}>
              {tipo === TIPO_TUTOR
                ? 'Este usuario ya es Tutor. No hay ascenso disponible.'
                : 'El ascenso Estudiante → Tutor solo aplica a usuarios con rol Estudiante.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
