import { useState, useEffect } from 'react';
import CourseCard from '../components/CourseCard';
import '../assets/styles/components/_home.scss';
import axios from 'axios';
import { GLOBAL } from '../services/apiConfig';

function HomePage() {
    const API_URL = GLOBAL.map((e) => e.BASE_URL)[0]; 
    const [courses, setCourses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 8; // Límite de cursos por página

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/course/pagination?page=${currentPage}&limit=${limit}`);
                setCourses(response.data);
            } catch (error) {
                console.error('Error al obtener los datos', error);
            }
        };
        fetchData();
    }, [currentPage]); 

    const handlePrevPage = () => {
        setCurrentPage(prev => prev > 1 ? prev - 1 : prev);
    };

    const handleNextPage = () => {
        setCurrentPage(prev => (courses.hasNextPage ? prev + 1 : prev));
    };

    return (
        <div className='center'>
            <h1>CIRCULOS DE ESTUDIO</h1>
            <div className='cards-container'>
                {courses.courses && courses.courses.map(curso => (
                    <CourseCard key={curso._id} titulo={curso.nombre} tutor={curso.nombre_tutor} id={curso._id} f_fin={curso.fecha_fin} f_inicio={curso.fecha_inicio} img={curso.imagen} h_inicio={curso.horario} h_fin={""} materia={curso.materia}></CourseCard>
                ))}
            </div>
            <div className="pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 1}>Anterior</button>
                <span>Página {currentPage}</span>
                <button onClick={handleNextPage} disabled={!courses.hasNextPage}>Siguiente</button>
            </div>
        </div>
    );
}

export default HomePage;
