//import React from 'react'
import PropTypes from 'prop-types';
import { useState } from 'react';

const CourseInfoPanel = ({ id, descripcion, objectives, h_inicio, h_fin, materia, f_inicio, f_fin }) => {
  const [show, setShow] = useState(true);
  function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 porque los meses comienzan desde 0
    const año = date.getFullYear().toString().substr(-2); // Obtiene los últimos 2 dígitos del año
    return `${dia}/${mes}/${año}`;
  }
  return (
    <div className="ContentRecursos" id={id}>
      <button onClick={() => { setShow(!show) }}>TOGGLE</button>
      {
        show ? <article>
          <h1 className="RecurosH1">Descripción</h1>
          <p>{descripcion}</p>
          <h1 className="RecurosH1">Objetivos</h1>
          <p>{objectives}</p>
          <h1 className="RecurosH1">Materia</h1>
          <p>{materia}</p>
          <span>
            <h3>Horario: {h_inicio} {h_fin}</h3>
          </span>
          <h3>Fecha inicio: {formatearFecha(f_inicio)}</h3>
          <h3>Fecha fin: {formatearFecha(f_fin)}</h3>
        </article> : null
      }
    </div>
  )
}

CourseInfoPanel.propTypes = {
  id: PropTypes.string,
  descripcion: PropTypes.string,
  objectives: PropTypes.string,
  h_inicio: PropTypes.string,
  h_fin: PropTypes.string,
  materia: PropTypes.string,
  f_inicio: PropTypes.string,
  f_fin: PropTypes.string,
}

CourseInfoPanel.defaultProps = {
  id: "0",
  descripcion: "Descripción del curso",
  objectives: "Objetivos del curso",
  h_inicio: "1:00 PM",
  h_fin: "2:00 PM",
  materia: "Nombre de la materia",
  f_inicio: "25/Sept/2023",
  f_fin: "26/Sept/2023",
}
export default CourseInfoPanel;