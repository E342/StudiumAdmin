import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import StudiumLogo from '../assets/img/StudiumLogo.png';
import salida from '../assets/img/salida.png';
import '../assets/styles/components/_header.scss';
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as GiIcons from "react-icons/gi";
import { sidebarMenuItems } from "./SidebarMenuItems"
import { showConfirm } from '../utils/alerts';
import { useKeycloak } from '../services/KeycloakProvider';

function AppHeader() {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const sidebarRef = useRef(null);

    const navigate = useNavigate();
    const { keycloak, authenticated } = useKeycloak();
    const handleLogout = async () => {
        const confirmed = await showConfirm({
            title: '¿Cerrar sesión?',
            text: 'Tu sesión actual se cerrará y volverás a la pantalla de inicio.',
            icon: 'question',
            confirmButtonText: 'Cerrar sesión',
            cancelButtonText: 'Cancelar',
        });

        if (!confirmed) return;

        localStorage.clear();

        // Cuando la sesión se abrió vía Keycloak también debemos invalidarla
        // en el servidor de identidad: el adaptador hace la redirección al
        // endpoint de logout y luego nos devuelve al login.
        if (keycloak && authenticated) {
            const redirectUri =
                typeof window !== 'undefined'
                    ? `${window.location.origin}/login`
                    : undefined;
            try {
                await keycloak.logout({ redirectUri });
                return;
            } catch (error) {
                console.error('[Keycloak] Error cerrando sesión:', error);
            }
        }

        navigate('/login');
    };
    const redirectLogo = () => {
        navigate('/home');
    };

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const closeSidebar = () => {
        setSidebarVisible(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                closeSidebar();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className='container'>
            < GiIcons.GiHamburgerMenu className="hamburguer" onClick={toggleSidebar} />
            <img className='logo' src={StudiumLogo} alt="Logo de marca Studium" onClick={redirectLogo} />
            <div className='fondo-salida'>
                <img className='salida' src={salida} alt="Botón para cerrar sesión" onClick={handleLogout} />
            </div>

            {sidebarVisible && (
                <div className='sidebar' ref={sidebarRef}>
                    <div className='navbar'>
                        <Link to="#" className="abrir">
                            <FaIcons.FaBars onClick={toggleSidebar} />
                        </Link>
                    </div>
                    <nav className={sidebarVisible ? "nav-menu active" : "nav-menu"}>
                        <ul className="nav-menu-items" onClick={toggleSidebar}>
                            <li className="navbar-toggle">
                                <Link to="#" className="close">
                                    <AiIcons.AiOutlineClose />
                                </Link>
                            </li>
                            {sidebarMenuItems.map((item, index) => (
                                <li key={index} className={item.cName}>
                                    <Link to={item.path}>
                                        <div className="icon">{item.icon}</div>
                                        <span className="opc">{item.title}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}

export default AppHeader;
