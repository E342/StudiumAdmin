import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import LogoUCA from '../assets/img/LogoUCA-blanco.png';
import { useNavigate } from 'react-router-dom';
import { GLOBAL } from '../services/apiConfig';
import { useKeycloak } from '../services/KeycloakProvider';
import { showError, showWarning } from '../utils/alerts';

export const LoginPage = () => {
    //CREDENCIALES
    const API_URL = GLOBAL[0].BASE_URL;
    const DEFAULT_PASSWORD = import.meta.env.VITE_DEFAULT_PASSWORD || 'StudiumPassword';
    //KEYCLOAK (OpenID Connect)
    const { keycloak, initialized, authenticated, configured, login: keycloakLogin } = useKeycloak();
    //PARA NAVEGAR AL HOME
    const navigate = useNavigate();
    const redirectHome = () => {
        navigate('/home');
    };
    //DOMINIOS VALIDOS
    const dominiosValidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'uca.edu.sv'];

    const validarDominioCorreo = (email) => {
        const dominio = email.split('@')[1]?.toLowerCase();
        return dominio && dominiosValidos.includes(dominio);
    };

    //EXPRESIONES REGULARES
    const validarEstudiante = (email) => {
        const regex = /^[0-9]{8}/;
        return regex.test(email);
    }

    const realizarPeticionPost = async (data) => {
        try {
            const payload = {
                password: DEFAULT_PASSWORD,
                ...data,
            };

            const response = await axios.post(`${API_URL}/auth/register`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            //console.log("ID MONGO USER:", response.data); //ID DE MONGO
            localStorage.setItem("ID", response.data); //GUARDA EN Local Storage EL ID
            return response.data;
        } catch (error) {
            console.error('Error en la petición:', error);
            throw error;
        }
    }

    const postUsernameLogin = async (credentials) => {
        const normalizedBaseUrl = API_URL.replace(/\/+$/, '');
        const apiRootUrl = normalizedBaseUrl.endsWith('/api')
            ? normalizedBaseUrl.slice(0, -4)
            : normalizedBaseUrl;

        const endpoints = [
            `${apiRootUrl}/api/auth/login`,
            `${apiRootUrl}/api/auth/login/username`,
            `${normalizedBaseUrl}/auth/login`,
            `${normalizedBaseUrl}/auth/login/username`,
        ];

        let lastError;
        for (const endpoint of [...new Set(endpoints)]) {
            try {
                console.log('Ruta de login enviada:', endpoint);
                console.log('Credenciales enviadas:', credentials);
                return await axios.post(endpoint, credentials, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
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

    const persistSessionFromToken = async (token, fallbackData = {}) => {
        let decodedToken = {};

        try {
            decodedToken = jwtDecode(token);
        } catch (error) {
            decodedToken = {};
        }

        const email = String(
            decodedToken.email ||
            decodedToken.username ||
            fallbackData.email ||
            fallbackData.username ||
            ''
        ).trim();
        const name = String(
            decodedToken.name ||
            decodedToken.nombre ||
            fallbackData.name ||
            fallbackData.nombre ||
            email
        );
        const image = String(
            decodedToken.picture ||
            decodedToken.imagen ||
            fallbackData.picture ||
            fallbackData.imagen ||
            ''
        );

        if (!email) {
            throw new Error('Token inválido: no contiene correo');
        }

        localStorage.setItem("TOKEN", token);
        localStorage.setItem("EMAIL", email);
        localStorage.setItem("NAME", name);

        const formUser = {
            username: email,
            nombre: name,
            tipo: validarEstudiante(email) ? 2 : 3,
            imagen: image
        };

        await realizarPeticionPost(formUser);
    };

    const iniciarSesionConCredenciales = async (event) => {
        event.preventDefault();

        if (!username.trim() || !password.trim()) {
            showWarning({
                title: 'Campos incompletos',
                text: 'Por favor completa tu correo y contraseña antes de continuar.',
            });
            return;
        }

        setCargandoCredenciales(true);

        try {
            const response = await postUsernameLogin({
                username: username.trim(),
                email: username.trim(),
                password
            });

            const token = typeof response.data === 'string'
                ? response.data
                : response.data?.token || response.data?.access_token || response.data?.accessToken || response.data?.jwt;

            if (!token) {
                throw new Error('No se recibió token de autenticación');
            }

            const responseData = typeof response.data === 'object' && response.data !== null ? response.data : {};

            await persistSessionFromToken(token, {
                email: username.trim(),
                username: responseData.username,
                name: responseData.name,
                nombre: responseData.nombre,
                picture: responseData.picture,
                imagen: responseData.imagen,
            });
            redirectHome();
        } catch (error) {
            console.error('Error al iniciar sesión con correo y contraseña:', error);
            const mensajeError =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.response?.data?.msg ||
                'Correo o contraseña inválidos';
            showError({
                title: 'No se pudo iniciar sesión',
                text: mensajeError,
            });
        } finally {
            setCargandoCredenciales(false);
        }
    };

    /**
     * TODO (pendiente de integración): obtener la fotografía de perfil del
     * usuario desde Keycloak.
     *
     * Microsoft exponía la foto vía Graph (`/me/photo/$value`). Keycloak no
     * provee un endpoint equivalente por defecto: la foto puede llegar como
     * un *claim* personalizado (ej.: `picture`) si el administrador agrega
     * un atributo de usuario y un *protocol mapper* que lo incluya en el
     * id_token. Mientras eso no esté configurado en el realm, dejamos esta
     * función como punto de extensión y devolvemos cadena vacía: el
     * componente `UserProfileCard` ya hace fallback a una imagen genérica
     * (gravatar `mp`).
     *
     * Para habilitarla:
     *   1. En el realm de Keycloak: Users → Attributes → añade "picture".
     *   2. Clients → <client> → Client scopes → dedicated → Mappers →
     *      "User Attribute" mapper que mapee "picture" al id_token.
     *   3. Sustituye este return por la lectura de `tokenParsed.picture`.
     */
    const obtenerFotoPerfilKeycloak = (tokenParsed) => {
        if (!tokenParsed) return '';
        return String(tokenParsed.picture || tokenParsed.imagen || '');
    };

    const procesarCuentaKeycloak = async ({ tokenParsed, idToken }) => {
        const email = String(
            tokenParsed?.email ||
            tokenParsed?.preferred_username ||
            ''
        ).trim();

        if (!email) {
            throw new Error('La cuenta de Keycloak no tiene un correo asociado.');
        }

        if (!validarDominioCorreo(email)) {
            showWarning({
                title: 'Correo no permitido',
                text: 'Inicia sesión con un correo válido (Gmail, Hotmail, Outlook, Yahoo, iCloud o UCA).',
            });
            return;
        }

        const name = String(
            tokenParsed?.name ||
            (`${tokenParsed?.given_name || ''} ${tokenParsed?.family_name || ''}`).trim() ||
            email
        );
        const imagen = obtenerFotoPerfilKeycloak(tokenParsed);

        localStorage.setItem('EMAIL', email);
        localStorage.setItem('NAME', name);
        if (idToken) localStorage.setItem('TOKEN', idToken);

        const formUser = {
            username: email,
            nombre: name,
            tipo: validarEstudiante(email) ? 2 : 3, // 2 → estudiante, 3 → catedrático
            imagen,
        };

        try {
            await realizarPeticionPost(formUser);
        } catch (error) {
            console.error('Error al enviar los datos del usuario:', error);
            showError({
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Intenta más tarde.',
            });
            return;
        }

        redirectHome();
    };

    const iniciarSesionConKeycloak = async () => {
        if (!configured) {
            showWarning({
                title: 'Keycloak no configurado',
                text:
                    'El inicio de sesión con Keycloak está pendiente de configuración. ' +
                    'Solicita al administrador completar las variables ' +
                    'VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM y VITE_KEYCLOAK_CLIENT_ID.',
            });
            return;
        }

        if (!initialized) {
            showWarning({
                title: 'Cargando',
                text: 'Estamos preparando la conexión con Keycloak, intenta nuevamente en unos segundos.',
            });
            return;
        }

        setCargandoKeycloak(true);
        try {
            const redirectUri =
                (typeof window !== 'undefined'
                    ? `${window.location.origin}/login`
                    : undefined);
            await keycloakLogin({ redirectUri });
        } catch (error) {
            console.error('Error al iniciar sesión con Keycloak:', error);
            showError({
                title: 'No se pudo iniciar sesión con Keycloak',
                text:
                    error?.message ||
                    'Intenta nuevamente o usa correo y contraseña.',
            });
        } finally {
            setCargandoKeycloak(false);
        }
    };

    //MENSAJES DE ERROR
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargandoCredenciales, setCargandoCredenciales] = useState(false);
    const [cargandoKeycloak, setCargandoKeycloak] = useState(false);

    // Tras un redirect-login exitoso, Keycloak deja al usuario en /login con
    // tokens ya disponibles. Detectamos esa transición y disparamos el mismo
    // procesamiento de la cuenta (validación de dominio + alta en backend).
    const processedRedirectRef = useRef(false);

    useEffect(() => {
        if (!initialized || !authenticated || !keycloak) return;
        if (processedRedirectRef.current) return;
        if (localStorage.getItem('ID')) {
            // Sesión ya estaba persistida; navega al home.
            processedRedirectRef.current = true;
            redirectHome();
            return;
        }

        processedRedirectRef.current = true;
        procesarCuentaKeycloak({
            tokenParsed: keycloak.tokenParsed,
            idToken: keycloak.idToken || keycloak.token,
        }).catch((error) => {
            console.error('Error procesando la sesión de Keycloak:', error);
            showError({
                title: 'No se pudo iniciar sesión con Keycloak',
                text: error?.message || 'Intenta nuevamente o usa correo y contraseña.',
            });
        });
        // procesarCuentaKeycloak y redirectHome dependen de estado/cierres estables;
        // los efectos de auth solo deben dispararse por cambios de sesión.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized, authenticated, keycloak]);

    //RENDER
    return (
        <div className='login'>
            <h1><b><span className='h1-rosa'>Bienvenidos a </span><span className='h1-azul'>Studium</span></b></h1>
            <article>
                <img src={LogoUCA} alt="Logo-UCA"></img>
                <p className='login-subtitle'>Inicia sesión con correo y contraseña</p>
                <form id='login' onSubmit={iniciarSesionConCredenciales}>
                    <input
                        type='email'
                        placeholder='Correo'
                        autoComplete='username'
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                    <div className='password-input-wrapper'>
                        <input
                            type={mostrarPassword ? 'text' : 'password'}
                            placeholder='Contraseña'
                            autoComplete='current-password'
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <button
                            type='button'
                            className='toggle-password-btn'
                            onClick={() => setMostrarPassword((prev) => !prev)}
                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    <button className='btn-login-admin' type='submit' disabled={cargandoCredenciales}>
                        {cargandoCredenciales ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>
                <p className='login-subtitle'>O continúa con tu cuenta institucional</p>
                <div className='keycloakbtn'>
                    <button
                        type='button'
                        className='btn-login-keycloak'
                        onClick={iniciarSesionConKeycloak}
                        disabled={cargandoKeycloak || !initialized}
                        aria-label='Iniciar sesión con Keycloak'
                    >
                        <FaKey aria-hidden='true' />
                        <span>
                            {cargandoKeycloak ? 'Conectando...' : 'Iniciar sesión con Keycloak'}
                        </span>
                    </button>
                </div>
            </article>
        </div>
    )
}

export default LoginPage;
