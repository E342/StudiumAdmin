import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Shield, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../hooks/useAuth';
import { TIPO_LABELS, ROLES, ROLE_TO_TIPO } from '../../constants/roles';
import { GLOBAL } from '../../services/apiConfig';
import styles from '../../assets/styles/admin/UserDetailPage.module.scss';

const API_URL = GLOBAL[0].BASE_URL;

const TIPO_OPTIONS = [
  { value: ROLE_TO_TIPO[ROLES.ADMINISTRADOR], label: 'Administrador' },
  { value: ROLE_TO_TIPO[ROLES.ESTUDIANTE], label: 'Estudiante' },
  { value: ROLE_TO_TIPO[ROLES.TUTOR], label: 'Tutor' },
];

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { keycloak } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campos editables
  const [fullName, setFullName] = useState('');
  const [tipo, setTipo] = useState(2);
  const [activo, setActivo] = useState(true);

  const getAuthHeaders = () => {
    const token = keycloak?.token;
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/user/profile/${id}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('No encontrado');

        const data = await res.json();
        setProfile(data);
        setFullName(data.nombre || '');
        setTipo(data.tipo ?? 2);
        setActivo(data.activo !== false);
      } catch (err) {
        console.error('[UserDetailPage] Error:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/user/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nombre: fullName, tipo, activo }),
      });

      if (!res.ok) throw new Error('Error al guardar');

      Swal.fire({
        icon: 'success',
        title: 'Perfil actualizado',
        text: 'Los cambios se guardaron correctamente.',
        confirmButtonColor: '#1D3956',
      });
      navigate('/admin/users');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: 'No se pudieron actualizar los datos del usuario.',
        confirmButtonColor: '#1D3956',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.centerMsg}>Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className={styles.centerMsg}>Usuario no encontrado</div>;
  }

  const nombre = profile.nombre || profile.email || profile.correo || 'Sin nombre';
  const email = profile.email || profile.correo || '';
  const inicial = nombre.charAt(0).toUpperCase();
  const rolLabel = TIPO_LABELS[profile.tipo] || 'Desconocido';
  const fechaRegistro = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-SV')
    : '—';

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
              <Shield />
              <span>Rol actual: {rolLabel}</span>
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        <div className={styles.editCard}>
          <h2 className={styles.editTitle}>Editar perfil</h2>

          <div className={styles.formFields}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <User />
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Mail />
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                disabled
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Shield />
                Tipo de usuario
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(Number(e.target.value))}
                className={styles.select}
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>Estado de la cuenta</span>
              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`${styles.toggle} ${activo ? styles.on : styles.off}`}
              >
                <span className={styles.toggleKnob} />
              </button>
              <span className={styles.toggleStatusText}>
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className={styles.formFooter}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.saveBtn}
              >
                <Save />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
