//import React from 'react'
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

export const CourseCard = ({ id, img, titulo, h_inicio, h_fin, f_inicio, f_fin, tutor, materia }) => {
  const navigate = useNavigate();
  const redirectToOtraPagina = () => {
    navigate('/recursos', { state: { id } });
  };
  function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses comienzan desde 0
    const año = date.getFullYear().toString().substr(-2); // Obtiene los últimos 2 dígitos del año

    return `${dia}/${mes}/${año}`;
}
  return (
    <div className="Home-card" id={id}>
      <article className='img-conteiner' >
        <img src={img} alt='card-img' onClick={redirectToOtraPagina}></img>
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
  materia: PropTypes.string
}

CourseCard.defaultProps = {
  key: "0",
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