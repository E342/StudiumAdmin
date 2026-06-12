import './assets/styles/App.scss';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

import LoginPage from './views/LoginPage';
import HomePage from './views/HomePage';
import MessagesPage from './views/MessagesPage';
import SearchPage from './views/SearchPage';
import StudentProfilePage from './views/StudentProfilePage';
import TeacherProfilePage from './views/TeacherProfilePage';
import UserProfilePage from './views/UserProfilePage';
import CreateCoursePage from './views/CreateCoursePage';
import CourseResourcesPage from './views/CourseResourcesPage';

import AppHeader from './components/AppHeader';
import SidebarMenu from './components/SidebarMenu';

import AdminLayout from './components/admin/AdminLayout';
import AdminGuard from './components/admin/AdminGuard';
import AdminLogin from './views/admin/AdminLogin';
import AdminDashboard from './views/admin/AdminDashboard';
import UsersPage from './views/admin/UsersPage';
import UserDetailPage from './views/admin/UserDetailPage';

import { GLOBAL } from './services/apiConfig';

const API_URL = GLOBAL[0].BASE_URL; // antes era .map(...), devolvía un array

// Layout para zona de usuario autenticado
const AppLayout = () => (
  <>
    <AppHeader />
    <SidebarMenu />
    <Outlet />
  </>
);

// Guard de sesión de usuario
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const id = typeof window !== 'undefined' ? localStorage.getItem('ID') : null;

  useEffect(() => {
    if (!id) navigate('/login', { replace: true });
  }, [id, navigate]);

  return children ?? <Outlet />;
};

// Página de perfil que decide qué perfil mostrar según el tipo de usuario
const ProfilePage = ({ userType }) => {
  if (userType === 2) return <StudentProfilePage />;
  if (userType === 3) return <TeacherProfilePage />;
  return null;
};

function App() {
  const id = typeof window !== 'undefined' ? localStorage.getItem('ID') : null;
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchUserType = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/user/profile/${id}`);
        setUserType(data.tipo);
      } catch (error) {
        console.error('Error al obtener el tipo de usuario', error);
      }
    };
    fetchUserType();
  }, [id]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Zona usuario autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/search/user/:id" element={<UserProfilePage />} />
            <Route path="/recursos" element={<CourseResourcesPage />} />
            <Route path="/perfil" element={<ProfilePage userType={userType} />} />
            <Route path="/perfil/agregar-curso" element={<CreateCoursePage />} />
          </Route>
        </Route>

        {/* Zona admin */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;