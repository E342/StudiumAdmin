import { useState } from 'react';
import PropTypes from 'prop-types';
import * as LuIcons from "react-icons/lu";
import { requestEnrollment } from '../services/enrollmentService';
import { showSuccess, showInfo, showError } from '../utils/alerts';
import cursoGenerico from '../assets/img/curso-generico.svg';

// Estados del botón de solicitud de acceso.
const REQUEST = {
  IDLE: 'idle',       // se puede enviar la solicitud
  SENDING: 'sending', // envío en curso (evita doble clic)
  PENDING: 'pending', // solicitud ya enviada / pendiente de aprobación
  ENROLLED: 'enrolled', // el usuario ya es miembro del curso
};

// Clave de persistencia local para recordar el estado de la solicitud por
// usuario y curso, de modo que el botón permanezca deshabilitado tras recargar.
const storageKey = (courseId) => `enrollment:${localStorage.getItem('ID')}:${courseId}`;

const CourseDetailHeader = ({ id, img, tittle, tutor, descripcion, showJoinButton }) => {
  // Inicializa el estado desde localStorage para evitar reenvíos tras recargar.
  const [requestState, setRequestState] = useState(() => {
    if (!id) return REQUEST.IDLE;
    const saved = localStorage.getItem(storageKey(id));
    return saved === REQUEST.PENDING || saved === REQUEST.ENROLLED ? saved : REQUEST.IDLE;
  });

  const persist = (state) => {
    if (id) localStorage.setItem(storageKey(id), state);
  };

  const handleRequestAccess = async () => {
    // UX: evitar múltiples envíos de la misma solicitud.
    if (requestState !== REQUEST.IDLE) return;

    setRequestState(REQUEST.SENDING);
    try {
      await requestEnrollment(id);
      setRequestState(REQUEST.PENDING);
      persist(REQUEST.PENDING);
      showSuccess({
        title: 'Solicitud enviada',
        text: 'Tu solicitud fue enviada al tutor del curso. Debes esperar su aprobación antes de acceder al contenido.',
      });
    } catch (error) {
      const status = error?.response?.status;
      const backendMsg = error?.response?.data?.error || '';

      if (status === 409 && /inscrito/i.test(backendMsg)) {
        // El usuario ya es miembro del curso.
        setRequestState(REQUEST.ENROLLED);
        persist(REQUEST.ENROLLED);
        showInfo({
          title: 'Ya estás inscrito',
          text: 'Ya formas parte de este curso. Recarga la página para acceder al contenido.',
        });
      } else if (status === 409) {
        // Solicitud duplicada: ya existe una solicitud pendiente.
        setRequestState(REQUEST.PENDING);
        persist(REQUEST.PENDING);
        showInfo({
          title: 'Solicitud pendiente',
          text: backendMsg || 'Ya tienes una solicitud pendiente para este curso. Espera la aprobación del tutor.',
        });
      } else if (status === 400 && /propio curso/i.test(backendMsg)) {
        // No aplica para estudiantes; salvaguarda por si el tutor ve el botón.
        setRequestState(REQUEST.IDLE);
        showInfo({
          title: 'Es tu propio curso',
          text: 'No puedes solicitar acceso a un curso que tú impartes.',
        });
      } else {
        // Error del servidor u otros: permitir reintento.
        setRequestState(REQUEST.IDLE);
        showError({
          title: 'No se pudo enviar la solicitud',
          text: backendMsg || 'Ocurrió un error en el servidor. Intenta nuevamente más tarde.',
        });
      }
    }
  };

  const renderJoinButton = () => {
    if (!showJoinButton) return null;

    if (requestState === REQUEST.PENDING) {
      return (
        <button type="button" className="solicitud-pendiente" disabled>
          <LuIcons.LuClock /> Solicitud pendiente
        </button>
      );
    }

    if (requestState === REQUEST.ENROLLED) {
      return (
        <button type="button" className="solicitud-pendiente" disabled>
          <LuIcons.LuCheck /> Ya inscrito
        </button>
      );
    }

    const sending = requestState === REQUEST.SENDING;
    return (
      <button type="button" onClick={handleRequestAccess} disabled={sending}>
        <LuIcons.LuMail /> {sending ? 'Enviando...' : 'Solicitar acceso'}
      </button>
    );
  };

  return (
    <div className="HeaderRecursos" id={id}>
      <img
        src={img || cursoGenerico}
        alt='Curso-img'
        onError={(e) => {
          if (e.target.dataset.fallback) return;
          e.target.dataset.fallback = 'true';
          e.target.src = cursoGenerico;
        }}
      ></img>
      <article>
        <h1>{tittle}</h1>
        <p style={{ color: 'black' }}>Nombre Tutor: {tutor}</p>
        {descripcion && <p style={{ color: 'black' }}>Descripción: {descripcion}</p>}
        {renderJoinButton()}
      </article>
    </div>
  );
};

CourseDetailHeader.propTypes = {
  id: PropTypes.string,
  tittle: PropTypes.string,
  img: PropTypes.string,
  tutor: PropTypes.string,
  descripcion: PropTypes.string,
  showJoinButton: PropTypes.bool,
};

CourseDetailHeader.defaultProps = {
  id: "0",
  img: "https://vilmanunez.com/wp-content/uploads/2016/03/herramientas-y-recursos-para-crear-curso-online.png",
  tittle: "Titulo del curso",
  tutor: "Nombre del tutor",
  showJoinButton: true,
};

export default CourseDetailHeader;
