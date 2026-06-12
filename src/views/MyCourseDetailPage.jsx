import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CourseDetailHeader from '../components/CourseDetailHeader';
import CourseInfoPanel from '../components/CourseInfoPanel';
import CourseResourceItem from '../components/CourseResourceItem';
import CloudinaryResources from '../components/CloudinaryResources';
import { EditCourseModal } from '../components/EditCourseModal';
import { AddResourceModal } from '../components/AddResourceModal';
import { useCourseDetail } from '../hooks/useCourseDetail';

const MyCourseDetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = location.state || {};

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const { course, loading, error, refresh } = useCourseDetail(id);

    // Acceso directo por URL sin curso seleccionado → volver al listado.
    useEffect(() => {
        if (!id) navigate('/mis-cursos', { replace: true });
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="bigContainerRecursos">
                <h2 className="estado-mensaje">Cargando detalle del curso...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bigContainerRecursos">
                <h2 className="estado-mensaje estado-error">{error}</h2>
            </div>
        );
    }

    if (!course) return null;

    const recursos = Array.isArray(course.recursos) ? course.recursos : [];

    return (
        <div className="bigContainerRecursos">
            <article className="header">
                <CourseDetailHeader
                    id={course._id}
                    img={course.imagen}
                    tittle={course.nombre}
                    tutor={course.nombre_tutor}
                    descripcion={course.descripcion}
                    showJoinButton={false}
                />
            </article>
            <div className="containerTwo">
                <article className="descripcion">
                    <CourseInfoPanel
                        id={course._id}
                        descripcion={course.descripcion}
                        showDescription={false}
                        objectives={course.objetivos}
                        materia={course.materia}
                        f_inicio={course.fecha_inicio}
                        f_fin={course.fecha_fin}
                        h_inicio={course.horario}
                        h_fin={""}
                    />
                </article>
                <article className="recursos">
                    <button onClick={() => setIsEditModalOpen(true)} className='CreateRecurso'>
                        Editar Curso
                    </button>
                    <button onClick={() => setIsResourceModalOpen(true)} className='CreateRecurso'>
                        Crear nuevo recurso
                    </button>

                    {recursos.length === 0 ? (
                        <p>Este curso aún no tiene recursos.</p>
                    ) : (
                        recursos.map(r => (
                            <CourseResourceItem
                                key={r._id}
                                id={r._id}
                                titulo={r.titulo}
                                textContent={r.descripcion}
                                owner={course.id_tutor?.toString()}
                                id_curso={course._id}
                                onDeleted={refresh}
                            />
                        ))
                    )}

                    <CloudinaryResources recursos={recursos} />
                </article>
            </div>

            {isEditModalOpen && (
                <EditCourseModal
                    course={course}
                    closeModal={() => setIsEditModalOpen(false)}
                    onUpdated={refresh}
                />
            )}

            {isResourceModalOpen && (
                <AddResourceModal
                    idCurso={course._id}
                    closeModal={() => setIsResourceModalOpen(false)}
                    onSubmit={refresh}
                />
            )}
        </div>
    );
};

export default MyCourseDetailPage;
