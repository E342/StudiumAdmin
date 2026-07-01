import * as TbIcons from "react-icons/tb";
import * as LuIcons from "react-icons/lu";
import * as BiIcons from "react-icons/bi";
/* 
Para mas icons:
import * as Io5Icons from "react-icons/io5";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as BsIcons from "react-icons/bs";
import * as PiIcons from "react-icons/pi";
import * as LiaIcons from "react-icons/lia";
import * as Fa6Icons from "react-icons/fa6";
import * as CiIcons from "react-icons/ci";
*/
export const SidebarData = [
    {
        title: "Inicio",
        path: "/home",
        icon: <BiIcons.BiHomeAlt />,
        cName: "nav-text",
    },
    {
        title: "Perfil",
        path: "/perfil",
        icon: <LuIcons.LuUserCircle2 />,
        cName: "nav-text",
    },
    {
        title: "Correo",
        path: "/messages",
        icon: <LuIcons.LuMail />,
        cName: "nav-text",
    },
    {
        title: "Búsqueda",
        path: "/search",
        icon: <TbIcons.TbInputSearch />,
        cName: "nav-text",
    },
];