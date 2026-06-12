import React, { useState } from "react";
import * as AiIcons from "react-icons/ai";
import { Link } from "react-router-dom";
import { sidebarMenuItems } from "./SidebarMenuItems"
import { IconContext } from "react-icons";
import '../assets/styles/components/_navbar.scss'

function SidebarMenu() {
    const [sidebar, setSidebar] = useState(false);

    const showSidebar = () => setSidebar(!sidebar);
    

    return (
        <>  
            <IconContext.Provider value={{ color: "undefined" }}>
                <nav className={sidebar ? "nav-menu active" : "nav-menu"}>
                    <ul className="nav-menu-items" onClick={showSidebar}>
                        <li className="navbar-toggle">
                            <Link to="#" className="close">
                                <AiIcons.AiOutlineClose />
                            </Link>
                        </li>
                        {sidebarMenuItems.map((item, index) => {
                            return (
                                <li key={index} className={item.cName}>
                                    <Link to={item.path}>
                                        <div className="icon"> {item.icon} </div>
                                        <span className="opc">{item.title}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </IconContext.Provider>
        </>
    );
}

export default SidebarMenu;