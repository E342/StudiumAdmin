import React from 'react';
import PropTypes from 'prop-types';
import * as LuIcons from "react-icons/lu";
import { GLOBAL } from '../services/apiConfig';
import axios from 'axios';
import { showSuccess, showInfo } from '../utils/alerts';

const CourseDetailHeader = ({ id, img, tittle, tutor }) => {
  // LOCAL STORAGE
  const mail = localStorage.getItem('EMAIL');
  const name = localStorage.getItem('NAME');
  const API_URL = GLOBAL.map((e) => { return e.BASE_URL });

  const handleAddMail = async () => {
    const formData = {
      username: mail,
      nombre: name,
    };
    try {
      const response = await axios.post(`${API_URL}/tutoring/${id}`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      showSuccess({
        title: '¡Ahora eres miembro de este curso!',
        text: 'Has sido inscrito correctamente. ¡Disfruta del contenido!',
      });
      return response.data;
    } catch (error) {
      showInfo({
        title: 'Ya estás inscrito',
        text: 'Usted ya forma parte de este curso.',
      });
      throw error;
    }
  };

  return (
    <div className="HeaderRecursos" id={id}>
      <img src={img} alt='Curso-img'></img>
      <article>
        <h1>{tittle}</h1>
        <p>{tutor}</p>
        <button onClick={handleAddMail}><LuIcons.LuMail />Unirse</button>
      </article>
    </div>
  );
};

CourseDetailHeader.propTypes = {
  id: PropTypes.string,
  tittle: PropTypes.string,
  img: PropTypes.string,
  tutor: PropTypes.string,
};

CourseDetailHeader.defaultProps = {
  id: "0",
  img: "https://vilmanunez.com/wp-content/uploads/2016/03/herramientas-y-recursos-para-crear-curso-online.png",
  tittle: "Titulo del curso",
  tutor: "Nombre del tutor",
};

export default CourseDetailHeader;
