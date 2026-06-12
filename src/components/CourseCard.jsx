//import React from 'react'
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import cursoGenerico from '../assets/img/curso-generico.svg';

export const CourseCard = ({ id, img, titulo, h_inicio, h_fin, f_inicio, f_fin, tutor, materia, detailRoute }) => {
  const navigate = useNavigate();
  const redirectToOtraPagina = () => {
    navigate(detailRoute, { state: { id } });
  };
  function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses comienzan desde 0
    const año = date.getFullYear().toString().substr(-2); // Obtiene los últimos 2 dígitos del año

    return `${dia}/${mes}/${año}`;
}
  return (
    <div className="Home-card" id={id} onClick={redirectToOtraPagina} style={{ cursor: 'pointer' }}>
      <article className='img-conteiner' >
        <img
          src={img || cursoGenerico}
          alt='card-img'
          onError={(e) => {
            // Si la imagen del curso no existe o no carga, mostrar una genérica.
            if (e.target.dataset.fallback) return; // evita bucle si la genérica fallara
            e.target.dataset.fallback = 'true';
            e.target.src = cursoGenerico;
          }}
        ></img>
      </article>
      <p>{titulo}</p>
      <p><span>{h_inicio}</span>  <span>{h_fin}</span></p>
      <p><span>{formatearFecha(f_inicio)}</span> - <span>{formatearFecha(f_fin)}</span></p>
      <p>{materia}</p>
      <p className='Rosa'>{tutor}</p>
    </div>
  )
}
CourseCard.propTypes = {
  id: PropTypes.any,
  img: PropTypes.string,
  titulo: PropTypes.string,
  h_inicio: PropTypes.string,
  h_fin: PropTypes.string,
  f_inicio: PropTypes.string,
  f_fin: PropTypes.string,
  tutor: PropTypes.string,
  materia: PropTypes.string,
  detailRoute: PropTypes.string
}

CourseCard.defaultProps = {
  key: "0",
  detailRoute: "/recursos",
  img: "https://en.idei.club/uploads/posts/2023-06/thumbs/1686950122_en-idei-club-p-classroom-bg-dizain-instagram-1.jpg",
  titulo: "Tutoria Calculo II",
  h_inicio: "9 AM",
  h_fin: "10 AM",
  f_inicio: "1 feb 2023 ",
  f_fin: "1 ago 2023",
  tutor: "Nombre del tutor",
  materia: "Nombre de la materia"
}

export default CourseCard;