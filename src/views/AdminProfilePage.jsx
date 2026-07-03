import '../assets/styles/components/_perfil.scss';
import { useUserData } from '../hooks/useUserData';
import * as LuIcons from 'react-icons/lu';

function AdminProfilePage() {
    const userId = localStorage.getItem('ID');
    const { userData } = useUserData(userId);

    if (!userData) {
        return (
            <div className="perfil-vista" style={{ textAlign: 'center', paddingTop: '3rem' }}>
                <p style={{ color: '#6b7280' }}>Cargando perfil...</p>
            </div>
        );
    }

    const nombre = userData.nombre || userData.username || 'Administrador';
    const email = userData.email || userData.username || '—';
    const inicial = nombre.charAt(0).toUpperCase();

    return (
        <div className="perfil-vista">
            <div className="cabecera-vista" style={{ marginBottom: '1.5rem' }}>
                {userData.imagen ? (
                    <img
                        src={userData.imagen}
                        alt={`Foto de perfil de ${nombre}`}
                        className="admin-perfil-avatar-img"
                    />
                ) : (
                    <div className="admin-perfil-avatar-grande">{inicial}</div>
                )}
                <div className="container-datos" style={{ marginLeft: '1rem' }}>
                    <h1 className="nomP">{nombre}</h1>
                    <h3 className="corP">{email}</h3>
                </div>
            </div>

            <div className="password-card">
                <h2 style={{ color: '#1D3956', marginBottom: '1.25rem' }}>
                    Información de la cuenta
                </h2>
                <div className="admin-perfil-info-list">
                    <div className="admin-perfil-info-row">
                        <span className="admin-perfil-info-label">
                            <LuIcons.LuUser /> Nombre
                        </span>
                        <span className="admin-perfil-info-value">{nombre}</span>
                    </div>
                    <div className="admin-perfil-info-row">
                        <span className="admin-perfil-info-label">
                            <LuIcons.LuMail /> Correo
                        </span>
                        <span className="admin-perfil-info-value">{email}</span>
                    </div>
                    <div className="admin-perfil-info-row">
                        <span className="admin-perfil-info-label">
                            <LuIcons.LuShieldCheck /> Rol
                        </span>
                        <span className="admin-perfil-badge">Administrador</span>
                    </div>
                </div>
                <p className="admin-perfil-nota">
                    La contraseña se gestiona a través de Keycloak. Para cambiarla,
                    accede a tu cuenta institucional.
                </p>
            </div>
        </div>
    );
}

export default AdminProfilePage;
