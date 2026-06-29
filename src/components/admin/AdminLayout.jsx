import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import StudiumLogo from '../../assets/img/StudiumLogo.png';
import salida from '../../assets/img/salida.png';
import { showConfirm } from '../../utils/alerts';
import styles from '../../assets/styles/admin/AdminLayout.module.scss';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/perfil', icon: UserCircle, label: 'Perfil' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión actual se cerrará y volverás a la pantalla de inicio.',
      icon: 'question',
      confirmButtonText: 'Cerrar sesión',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmed) return;
    logout();
  };

  const handleLogoClick = () => navigate('/admin');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeSidebar();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.adminLayout}>
      {/* Navbar superior azul */}
      <header className={styles.topBar}>
        <Menu className={styles.hamburguer} onClick={toggleSidebar} />
        <img
          className={styles.logo}
          src={StudiumLogo}
          alt="Logo de marca Studium"
          onClick={handleLogoClick}
        />
        <div className={styles.fondoSalida}>
          <img
            className={styles.salida}
            src={salida}
            alt="Botón para cerrar sesión"
            onClick={handleLogout}
          />
        </div>
      </header>

      {/* Sidebar rosado deslizable */}
      {sidebarOpen && (
        <div className={styles.sidebarWrapper} ref={sidebarRef}>
          <nav className={`${styles.navMenu} ${sidebarOpen ? styles.active : ''}`}>
            <ul className={styles.navMenuItems}>
              <li className={styles.navbarToggle}>
                <button className={styles.closeBtn} onClick={closeSidebar} aria-label="Cerrar menú">
                  <X />
                </button>
              </li>
              {navItems.map((item) => (
                <li key={item.to} className={styles.navText}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      isActive ? styles.navLinkActive : styles.navLink
                    }
                  >
                    <div className={styles.icon}>
                      <item.icon />
                    </div>
                    <span className={styles.opc}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Contenido principal */}
      <main className={styles.pageContent}>
        <Outlet />
      </main>
    </div>
  );
}
