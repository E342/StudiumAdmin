import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import LogoUCA from '../assets/img/LogoUCA-blanco.png';
import { useNavigate } from 'react-router-dom';
import { GLOBAL } from '../services/apiConfig';
import { useKeycloak } from '../services/KeycloakProvider';
import { showError, showSuccess, showWarning } from '../utils/alerts';

export const LoginPage = () => {
    //CREDENCIALES
    const API_URL = GLOBAL[0].BASE_URL;
    const API_TARGET = GLOBAL[0].API_TARGET;
    const DEFAULT_PASSWORD = import.meta.env.VITE_DEFAULT_PASSWORD || 'StudiumPassword';
    //KEYCLOAK (OpenID Connect)
    const { keycloak, initialized, authenticated, configured, login: keycloakLogin } = useKeycloak();
    //PARA NAVEGAR AL HOME
    const navigate = useNavigate();
    // Notifica a App que la sesión (ID/ROL en localStorage) cambió, para que
    // re-sincronice el rol sin necesidad de recargar la página.
    const notificarCambioSesion = () => {
        window.dispatchEvent(new Event('auth-change'));
    };
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

    const IMAGEN_POR_DEFECTO = 'https://i.pravatar.cc/150?img=11';

    const generarPasswordAleatoria = (longitud = 8) => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let pwd = '';
        for (let i = 0; i < longitud; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pwd;
    };

    const registrarUsuario = async ({ username, password, nombre, imagen }) => {
        const baseUrl = String(API_TARGET || '').replace(/\/+$/, '');
        const endpoint = `${baseUrl}/api/auth/register`;
        const payload = {
            username,
            password,
            nombre,
            imagen: imagen || IMAGEN_POR_DEFECTO,
            email: username,
        };

        console.log('[Keycloak] POST', endpoint);
        console.log('[Keycloak] Body register:', payload);

        const response = await axios.post(endpoint, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('[Keycloak → /api/auth/register] respuesta:', response.data);
        return response.data;
    };

    const loginConEmail = async (email) => {
        const baseUrl = String(API_TARGET || '').replace(/\/+$/, '');
        const endpoint = `${baseUrl}/api/auth/login/email`;
        const payload = { email };

        console.log('[Keycloak] POST', endpoint);
        console.log('[Keycloak] Body login/email:', payload);

        const response = await axios.post(endpoint, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('[Keycloak → /api/auth/login/email] respuesta:', response.data);
        return response;
    };

    const postUsernameLogin = async (credentials) => {
        const baseUrl = String(API_TARGET || '').replace(/\/+$/, '');
        const endpoint = `${baseUrl}/api/auth/login`;

        const response = await axios.post(endpoint, credentials, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('[Studium → /api/auth/login] respuesta completa:', response.data);
        return response;
    };

    const ROLES_GENERICOS = ['user', 'usuario'];

    const resolverRolDesdeRoles = (roles) => {
        if (!Array.isArray(roles) || roles.length === 0) return '';
        const normalizados = roles.map((rol) => String(rol || '').toLowerCase().trim());
        // Un rol específico (distinto de "user"), p. ej. "tutor", define el tipo.
        const especifico = normalizados.find((rol) => rol && !ROLES_GENERICOS.includes(rol));
        if (especifico) return especifico;
        // Solo trae el rol base "user" → es estudiante.
        if (normalizados.some((rol) => ROLES_GENERICOS.includes(rol))) return 'estudiante';
        return '';
    };

    const obtenerRolDesdeToken = (token, fallbackData = {}) => {
        let decoded = {};
        try {
            decoded = jwtDecode(token);
        } catch (error) {
            decoded = {};
        }

        const userObj = fallbackData.user || {};

        const rolDirecto =
            decoded.role ||
            decoded.rol ||
            decoded.tipo ||
            fallbackData.role ||
            fallbackData.rol ||
            fallbackData.tipo ||
            userObj.role ||
            userObj.rol ||
            userObj.tipo;

        if (rolDirecto) return String(rolDirecto).toLowerCase();

        // El backend envía los roles como arreglo:
        //   ["user"]          → estudiante
        //   ["user", "tutor"] → tutor
        const rolesArray =
            (Array.isArray(decoded.roles) && decoded.roles) ||
            (Array.isArray(fallbackData.roles) && fallbackData.roles) ||
            (Array.isArray(userObj.roles) && userObj.roles) ||
            [];

        return String(resolverRolDesdeRoles(rolesArray) || '').toLowerCase();
    };

    const obtenerUserIdDesdeToken = (token, fallbackData = {}) => {
        let decoded = {};
        try {
            decoded = jwtDecode(token);
        } catch (error) {
            decoded = {};
        }

        const fromUserObject = (obj) =>
            obj && (obj._id || obj.id || obj.userId || obj.uid);

        const rawId =
            decoded._id ||
            decoded.id ||
            decoded.uid ||
            decoded.userId ||
            decoded.sub ||
            fromUserObject(decoded.user) ||
            fallbackData._id ||
            fallbackData.id ||
            fallbackData.uid ||
            fallbackData.userId ||
            fromUserObject(fallbackData.user) ||
            '';

        return String(rawId || '').trim();
    };

    const resolverRutaPorRol = (role) => {
        const normalizado = String(role || '').toLowerCase();
        if (['1', 'admin', 'administrador'].includes(normalizado)) return '/home';
        if (['3', 'docente', 'catedratico', 'catedrático', 'profesor', 'teacher'].includes(normalizado)) return '/home';
        if (['2', 'estudiante', 'student', 'alumno'].includes(normalizado)) return '/home';
        return '/home';
    };

    const persistSessionFromToken = async (token, fallbackData = {}) => {
        let decodedToken = {};

        try {
            decodedToken = jwtDecode(token);
        } catch (error) {
            decodedToken = {};
        }

        const userObj = fallbackData.user || {};

        const email = String(
            decodedToken.email ||
            decodedToken.username ||
            fallbackData.email ||
            fallbackData.username ||
            userObj.email ||
            userObj.username ||
            ''
        ).trim();
        const name = String(
            decodedToken.name ||
            decodedToken.nombre ||
            fallbackData.name ||
            fallbackData.nombre ||
            userObj.nombre ||
            userObj.name ||
            email
        );
        const image = String(
            decodedToken.picture ||
            decodedToken.imagen ||
            fallbackData.picture ||
            fallbackData.imagen ||
            userObj.imagen ||
            userObj.picture ||
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

        //De momento no espera email, por lo que no es necesario esta apartado
        //await realizarPeticionPost(formUser);
    };

    const mostrarSesionGuardada = () => {
        console.log('[Login] Valores guardados en localStorage:', {
            ID: localStorage.getItem('ID'),
            ROL: localStorage.getItem('ROL'),
            EMAIL: localStorage.getItem('EMAIL'),
            NAME: localStorage.getItem('NAME'),
            TOKEN: localStorage.getItem('TOKEN'),
        });
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
                usern: username.trim(),
                password: password
            });

            const token = typeof response.data === 'string'
                ? response.data
                : response.data?.token || response.data?.access_token || response.data?.accessToken || response.data?.jwt;

            if (!token) {
                throw new Error('No se recibió token de autenticación');
            }

            const responseData = typeof response.data === 'object' && response.data !== null ? response.data : {};

            await persistSessionFromToken(token, {
                ...responseData,
                email: responseData.user?.email || username.trim(),
            });

            const userId = obtenerUserIdDesdeToken(token, responseData);
            if (!userId) {
                throw new Error('El servidor no devolvió un identificador de usuario.');
            }
            localStorage.setItem('ID', userId);

            const rol = obtenerRolDesdeToken(token, responseData);
            if (rol) localStorage.setItem('ROL', rol);
            mostrarSesionGuardada();
            notificarCambioSesion();
            const rutaDestino = resolverRutaPorRol(rol);

            await showSuccess({
                title: '¡Inicio de sesión exitoso!',
                text: 'Bienvenido a Studium.',
            });
            navigate(rutaDestino);
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

    const finalizarSesionConToken = async (loginResponse, { email, name }) => {
        const token = typeof loginResponse.data === 'string'
            ? loginResponse.data
            : loginResponse.data?.token ||
              loginResponse.data?.access_token ||
              loginResponse.data?.accessToken ||
              loginResponse.data?.jwt;

        if (!token) {
            showError({ title: 'No se pudo iniciar sesión', text: 'El servidor no devolvió un token.' });
            return false;
        }

        const responseData =
            typeof loginResponse.data === 'object' && loginResponse.data !== null
                ? loginResponse.data
                : {};

        await persistSessionFromToken(token, {
            ...responseData,
            email: responseData.user?.email || email,
            name: responseData.user?.nombre || name,
            nombre: responseData.user?.nombre || name,
            picture: responseData.user?.imagen || IMAGEN_POR_DEFECTO,
            imagen: responseData.user?.imagen || IMAGEN_POR_DEFECTO,
        });

        const userId = obtenerUserIdDesdeToken(token, responseData);
        if (!userId) {
            showError({
                title: 'No se pudo iniciar sesión',
                text: 'El servidor no devolvió un identificador de usuario.',
            });
            return false;
        }
        localStorage.setItem('ID', userId);

        const rol = obtenerRolDesdeToken(token, responseData);
        if (rol) localStorage.setItem('ROL', rol);
        mostrarSesionGuardada();
        notificarCambioSesion();
        const rutaDestino = resolverRutaPorRol(rol);

        await showSuccess({
            title: '¡Inicio de sesión exitoso!',
            text: 'Bienvenido a Studium.',
        });
        navigate(rutaDestino);
        return true;
    };

    const procesarCuentaKeycloak = async ({ tokenParsed }) => {
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

        console.log('[Keycloak] Datos extraídos del token →', { email, name });

        // 1) Intentar login con email (cuenta ya existente).
        try {
            const loginResponse = await loginConEmail(email);
            await finalizarSesionConToken(loginResponse, { email, name });
            return;
        } catch (error) {
            console.warn('[Keycloak] /login/email falló, se intentará registrar la cuenta.', error?.response?.status);
        }

        // 2) Login falló → registrar la cuenta.
        const passwordGenerada = generarPasswordAleatoria(8);
        console.log('[Keycloak] Password generada para el registro:', passwordGenerada);

        try {
            await registrarUsuario({
                username: email,
                password: passwordGenerada,
                nombre: name,
                imagen: IMAGEN_POR_DEFECTO,
            });
        } catch (error) {
            console.error('Error en /api/auth/register:', error);
            const mensaje =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'No se pudo registrar la cuenta en Studium.';
            showError({ title: 'Error al registrar', text: mensaje });
            return;
        }

        // 3) Reintentar login con email tras registrar.
        try {
            const loginResponse = await loginConEmail(email);
            await finalizarSesionConToken(loginResponse, { email, name });
        } catch (error) {
            console.error('Error en /api/auth/login/email tras registrar:', error);
            const mensaje =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'No se pudo iniciar sesión con la cuenta recién creada.';
            showError({ title: 'No se pudo iniciar sesión', text: mensaje });
        }
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
            notificarCambioSesion();
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
                <p className='login-subtitle'>Inicia sesión con nombre de usuario y contraseña</p>
                <form id='login' onSubmit={iniciarSesionConCredenciales}>
                    <input
                        type='text'
                        placeholder='Usuario'
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
