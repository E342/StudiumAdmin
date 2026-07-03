import React, { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../assets/styles/components/_perfil.scss';
import axios from "axios";
import { GLOBAL } from '../services/apiConfig';
import { useUserData } from '../hooks/useUserData';
import { showSuccess, showError, showWarning } from '../utils/alerts';

function AdminProfilePage() {
    const API_URL = GLOBAL[0].BASE_URL;
    const userId = localStorage.getItem("ID");
    const { userData } = useUserData(userId);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const postUsernameLogin = async (credentials) => {
        const normalizedBaseUrl = API_URL.replace(/\/+$/, '');
        const baseUrlWithoutApi = normalizedBaseUrl.replace(/\/api$/, '');
        const endpoints = [
            `${normalizedBaseUrl}/api/auth/login/username`,
            `${normalizedBaseUrl}/auth/login/username`,
            `${normalizedBaseUrl}/api/auth/login`,
            `${normalizedBaseUrl}/auth/login`,
            `${baseUrlWithoutApi}/api/auth/login/username`,
            `${baseUrlWithoutApi}/auth/login/username`,
            `${baseUrlWithoutApi}/api/auth/login`,
            `${baseUrlWithoutApi}/auth/login`,
        ];

        let lastError;
        for (const endpoint of [...new Set(endpoints)]) {
            try {
                console.log('Ruta de verificación de contraseña enviada:', endpoint);
                console.log('Body de verificación enviado:', credentials);
                return await axios.post(endpoint, credentials);
            } catch (error) {
                const status = error?.response?.status;
                if (status !== 404 && status !== 401) {
                    throw error;
                }
                lastError = error;
            }
        }

        throw lastError;
    };

    const handleUpdatePassword = async (event) => {
        event.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showWarning({
                title: 'Campos incompletos',
                text: 'Completa todos los campos de contraseña antes de continuar.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            showWarning({
                title: 'Contraseñas no coinciden',
                text: 'La nueva contraseña y su confirmación no coinciden.',
            });
            return;
        }

        if (newPassword.length < 8) {
            showWarning({
                title: 'Contraseña demasiado corta',
                text: 'La nueva contraseña debe tener al menos 8 caracteres.',
            });
            return;
        }

        try {
            setIsUpdatingPassword(true);

            const updateRoute = `${API_URL}/user/profile/${userId}`;
            const updateBody = {
                password: newPassword,
            };

            await postUsernameLogin({
                username: userData.username,
                email: userData.username,
                password: currentPassword,
            });

            console.log('Ruta de actualización de contraseña enviada:', updateRoute);
            console.log('Body de actualización enviado:', updateBody);

            await axios.patch(updateRoute, updateBody);

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showSuccess({
                title: 'Contraseña actualizada',
                text: 'Tu contraseña se actualizó correctamente.',
            });
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            const mensajeError = error?.response?.data?.message || 'No se pudo actualizar la contraseña';
            showError({
                title: 'No se pudo actualizar',
                text: mensajeError,
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="perfil-vista">
            <div className="cabecera-vista">
                {userData && (<img className='imagen' src={userData.imagen} alt="Imagen de perfil del usuario" />)}
                <div className="container-datos">
                    {userData && (
                        <div>
                            <h1 className="nomP">{userData.nombre}</h1>
                            <h3 className="corP">{userData.username}</h3>
                        </div>
                    )}
                </div>
            </div>

            <div className="password-card">
                <h2>Actualizar contraseña</h2>
                <form className="password-form" onSubmit={handleUpdatePassword}>
                    <div className="password-input-wrapper">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Clave actual"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            aria-label={showCurrentPassword ? 'Ocultar clave actual' : 'Mostrar clave actual'}
                        >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <div className="password-input-wrapper">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nueva clave"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            aria-label={showNewPassword ? 'Ocultar nueva clave' : 'Mostrar nueva clave'}
                        >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <div className="password-input-wrapper">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar nueva clave"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            aria-label={showConfirmPassword ? 'Ocultar confirmación de clave' : 'Mostrar confirmación de clave'}
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <button type="submit" className="boton-password" disabled={isUpdatingPassword || !userData}>
                        {isUpdatingPassword ? 'Actualizando...' : 'Actualizar clave'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminProfilePage;