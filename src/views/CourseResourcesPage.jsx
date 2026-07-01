import CourseResourceItem from '../components/CourseResourceItem';
import CloudinaryResources from '../components/CloudinaryResources';
import CourseDetailHeader from '../components/CourseDetailHeader';
import CourseInfoPanel from '../components/CourseInfoPanel';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { GLOBAL } from '../services/apiConfig';
import { AddResourceModal } from '../components/AddResourceModal';
import { BsFillTrashFill } from "react-icons/bs";
import { showConfirm, showSuccess, showError } from '../utils/alerts';
import { useCourseAccess, ACCESS } from '../hooks/useCourseAccess';

const CourseResourcesPage = () => {
  const API_URL = GLOBAL.map((e) => { return e.BASE_URL });

  const location = useLocation();
  const navigate = useNavigate();
  const { id } = location.state || {};

  const [isModalOpen, setIsModalOpen] = useState(false);

  // El acceso al contenido lo decide el backend (endpoint protegido de recursos).
  const { course, resources, accessState, isOwner, error, refresh } = useCourseAccess(id);

  // Acceso directo a /recursos por URL sin curso seleccionado → volver al home.
  useEffect(() => {
    if (!id) navigate('/home', { replace: true });
  }, [id, navigate]);

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Confirmar eliminación',
      text: '¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('TOKEN');
      const response = await axios.delete(`${API_URL}/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Elemento eliminado:', response.data);
      await showSuccess({
        title: 'Curso eliminado',
        text: 'El curso fue eliminado correctamente.',
      });
      navigate('/home');
    } catch (error) {
      console.error('Hubo un error al eliminar:', error);
      showError({
        title: 'No se pudo eliminar el curso',
        text: 'Ocurrió un error durante la eliminación. Intenta nuevamente.',
      });
    }
  };

  if (!id) return null;

  if (accessState === ACCESS.LOADING) {
    return (
      <div className="bigContainerRecursos">
        <h2 className="estado-mensaje">Cargando curso...</h2>
      </div>
    );
  }

  if (accessState === ACCESS.ERROR) {
    return (
      <div className="bigContainerRecursos">
        <h2 className="estado-mensaje estado-error">{error}</h2>
      </div>
    );
  }

  // Estudiante no aprobado: se muestra la cabecera con datos públicos del curso
  // (nombre, tutor, imagen) y un aviso, pero NUNCA el contenido del curso.
  if (accessState === ACCESS.DENIED) {
    return (
      <div className="bigContainerRecursos">
        <article className="header">
          <CourseDetailHeader
            id={course?._id}
            img={course?.imagen}
            tittle={course?.nombre}
            tutor={course?.nombre_tutor}
            showJoinButton={true}
          />
        </article>
        <div className="acceso-denegado">
          <h2>Acceso restringido</h2>
          <p>Debes ser aprobado por el tutor antes de acceder al contenido de este curso.</p>
        </div>
      </div>
    );
  }

  // Acceso concedido: dueño del curso o estudiante aprobado.
  return (
    <div className="bigContainerRecursos">
      <article className="header">
        <CourseDetailHeader
          key={course?._id}
          img={course?.imagen}
          id={course?._id}
          tittle={course?.nombre}
          tutor={course?.nombre_tutor}
          showJoinButton={false}
        />
      </article>
      <div className='containerTwo'>
        <article className="descripcion">
          <CourseInfoPanel
            descripcion={course?.descripcion}
            objectives={course?.objetivos}
            id={course?._id}
            key={course?._id}
            materia={course?.materia}
            f_inicio={course?.fecha_inicio}
            f_fin={course?.fecha_fin}
            h_inicio={course?.horario}
            h_fin={""}
          />
        </article>
        <article className="recursos">
          {isOwner && (
            <>
              <button onClick={() => setIsModalOpen(true)} className='CreateRecurso'>
                Crear nuevo recurso
              </button>
              <button onClick={handleDelete} className='CreateRecurso-D'>
                <BsFillTrashFill />
              </button>
            </>
          )}

          {resources.length === 0 ? (
            <p>Este curso aún no tiene recursos.</p>
          ) : (
            resources.map(r => (
              <CourseResourceItem
                key={r._id}
                id={r._id}
                textContent={r.descripcion}
                titulo={r.titulo}
                owner={course?.id_tutor?.toString()}
                id_curso={course?._id}
              />
            ))
          )}

          <CloudinaryResources recursos={resources} />

          {isModalOpen && (
            <AddResourceModal
              idCurso={course?._id}
              closeModal={() => setIsModalOpen(false)}
              onSubmit={refresh}
            />
          )}
        </article>
      </div>
    </div>
  );
};

export default CourseResourcesPage;
