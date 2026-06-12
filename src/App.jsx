import './assets/styles/App.scss';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './views/LoginPage';
import HomePage from './views/HomePage';
import AppHeader from './components/AppHeader';
import SidebarMenu from './components/SidebarMenu';
import MessagesPage from './views/MessagesPage';
import SearchPage from './views/SearchPage';
import StudentProfilePage from './views/StudentProfilePage';
import CreateCoursePage from './views/CreateCoursePage';
import CourseResourcesPage from './views/CourseResourcesPage';
import MyCoursesPage from './views/MyCoursesPage';
import MyCourseDetailPage from './views/MyCourseDetailPage';
import EnrollmentApprovalsPage from './views/EnrollmentApprovalsPage';
import axios from "axios";
import TeacherProfilePage from './views/TeacherProfilePage';
import UserProfilePage from './views/UserProfilePage';
import { GLOBAL } from './services/apiConfig';
import { ROLES, normalizarTipoUsuario, resolverRolDesdeRoles } from './utils/roles';

const AppLayout = () => (
  <>
    <AppHeader />
    <SidebarMenu />
    <Outlet />
  </>
);

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const id = localStorage.getItem('ID');
  useEffect(() => {
    if (!id) {
      navigate('/login');
    }
  }, [id, navigate]);

  return children ? children : <Outlet />;
};

function App() {
  const [authId, setAuthId] = useState(() => localStorage.getItem('ID'));
  const [userType, setUserType] = useState(() => normalizarTipoUsuario(localStorage.getItem('ROL')));
  const API_URL = GLOBAL.map((e) => { return e.BASE_URL });

  // Mantener id y rol sincronizados con localStorage ante cambios de sesión:
  // 'auth-change' lo emite el login/logout en esta pestaña; 'storage', otras pestañas.
  // Sin esto, al cambiar de usuario (p. ej. estudiante → tutor) sin recargar, el rol
  // quedaba obsoleto y las rutas de tutor redirigían siempre a /home.
  useEffect(() => {
    const sincronizarSesion = () => {
      setAuthId(localStorage.getItem('ID'));
      setUserType(normalizarTipoUsuario(localStorage.getItem('ROL')));
    };
    window.addEventListener('auth-change', sincronizarSesion);
    window.addEventListener('storage', sincronizarSesion);
    return () => {
      window.removeEventListener('auth-change', sincronizarSesion);
      window.removeEventListener('storage', sincronizarSesion);
    };
  }, []);

  useEffect(() => {
    const id = authId;
    console.log('[App] id:', id, '| ROL en localStorage:', localStorage.getItem('ROL'), '| userType inicial:', userType);
    if (!id) return; // No hacer petición si no hay usuario logueado
    const fetchUserType = async () => {
      try {
        const response = await axios.get(`${API_URL}/user/profile/${id}`);
        console.log('[App] /user/profile response:', response.data);
        const data = response.data || {};
        const userObj = data.user || data.usuario || {};
        // El backend entrega el rol en el arreglo `roles` (p. ej. ["user","tutor"]).
        const rolesArray =
          (Array.isArray(data.roles) && data.roles) ||
          (Array.isArray(userObj.roles) && userObj.roles) ||
          [];
        let tipoNormalizado = resolverRolDesdeRoles(rolesArray);
        if (!tipoNormalizado) {
          // Compatibilidad con esquemas anteriores y respaldo local.
          const rawTipo =
            data.tipo ?? data.role ?? data.rol ?? data.tipoUsuario ??
            userObj.tipo ?? userObj.role ?? userObj.rol ?? userObj.tipoUsuario ??
            localStorage.getItem('ROL');
          tipoNormalizado = normalizarTipoUsuario(rawTipo);
        }
        console.log('[App] roles:', rolesArray, '→ tipoNormalizado:', tipoNormalizado);
        if (tipoNormalizado) {
          setUserType(tipoNormalizado);
          // Persistir para que el menú lateral (lee localStorage 'ROL') lo refleje.
          localStorage.setItem('ROL', String(tipoNormalizado));
        }
      } catch (error) {
        console.error('Error al obtener el tipo de usuario', error);
      }
    };
    fetchUserType();
  }, [authId]);

  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/perfil"
              element={
                <>
                  {userType === 2 && <StudentProfilePage />}
                  {userType === 3 && <TeacherProfilePage />}
                </>
              }
            />
            <Route path="/search/user/:id" element={<UserProfilePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recursos" element={<CourseResourcesPage />} />
            <Route path="/perfil/agregar-curso" element={<CreateCoursePage />} />
            <Route
              path="/mis-cursos"
              element={userType === ROLES.TUTOR ? <MyCoursesPage /> : <Navigate to="/home" replace />}
            />
            <Route
              path="/mis-cursos/detalle"
              element={userType === ROLES.TUTOR ? <MyCourseDetailPage /> : <Navigate to="/home" replace />}
            />
            <Route
              path="/aprobaciones"
              element={userType === ROLES.TUTOR ? <EnrollmentApprovalsPage /> : <Navigate to="/home" replace />}
            />
          </Route>
        </Route>
        <Route path="/login" index element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>

  )
}

export default App;