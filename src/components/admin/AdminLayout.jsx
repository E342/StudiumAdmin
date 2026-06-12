import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../assets/styles/admin/AdminLayout.module.scss';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/roles', icon: Shield, label: 'Roles y Permisos' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const userName = user?.name || 'Administrador';

  return (
    <div className={styles.adminLayout}>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <Shield />
            <span>Studium Admin</span>
          </div>
          <button
            className={styles.sidebarCloseBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className={styles.mainContent}>
        {/* Barra superior */}
        <header className={styles.topBar}>
          <button
            className={styles.menuToggleBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>
          <div className={styles.topBarSpacer} />
          <div className={styles.userBadge}>
            <div className={styles.userAvatar}>{userInitial}</div>
            <span className={styles.userName}>{userName}</span>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
