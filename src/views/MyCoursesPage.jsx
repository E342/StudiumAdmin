import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useTutorCourses } from '../hooks/useTutorCourses';
import '../assets/styles/components/_home.scss';

function MyCoursesPage() {
    const { courses, loading, error } = useTutorCourses();

    const renderContent = () => {
        if (loading) {
            return (
                <div className='cards-container'>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className='Home-card course-skeleton' aria-hidden='true'>
                            <div className='skeleton-img' />
                            <div className='skeleton-line' />
                            <div className='skeleton-line short' />
                        </div>
                    ))}
                </div>
            );
        }

        if (error) {
            return <h2 className='estado-mensaje estado-error'>{error}</h2>;
        }

        if (courses.length === 0) {
            return <h2 className='estado-mensaje'>No tienes cursos disponibles</h2>;
        }

        return (
            <div className='cards-container'>
                {courses.map(curso => (
                    <CourseCard
                        key={curso._id}
                        id={curso._id}
                        titulo={curso.nombre}
                        tutor={curso.nombre_tutor}
                        f_inicio={curso.fecha_inicio}
                        f_fin={curso.fecha_fin}
                        img={curso.imagen}
                        h_inicio={curso.horario}
                        h_fin={""}
                        materia={curso.materia}
                        detailRoute="/mis-cursos/detalle"
                    />
                ))}
            </div>
        );
    };

    return (
        <div className='center'>
            <h1>MIS CURSOS</h1>
            <div className='agregar-curso-wrapper'>
                <Link to='/perfil/agregar-curso'>
                    <button className='agregar-curso-btn'>Agregar curso</button>
                </Link>
            </div>
            {renderContent()}
        </div>
    );
}

export default MyCoursesPage;
