import { useEffect, useState } from 'react';
import { getCoursesByTutor } from '../services/courseService';

// Obtiene los cursos del tutor autenticado. Si no se pasa tutorId, lo toma del
// usuario logueado (localStorage 'ID'); el token se lee de localStorage 'TOKEN'.
export const useTutorCourses = (tutorId = localStorage.getItem('ID')) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tutorId) {
            setLoading(false);
            setError('No se encontró el usuario autenticado.');
            return;
        }

        let activo = true;
        const token = localStorage.getItem('TOKEN');

        const fetchCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getCoursesByTutor(tutorId, token);
                if (activo) setCourses(data);
            } catch (err) {
                console.error('Error al obtener los cursos del tutor', err);
                if (activo) setError('No se pudieron cargar los cursos. Intenta nuevamente.');
            } finally {
                if (activo) setLoading(false);
            }
        };

        fetchCourses();
        return () => { activo = false; };
    }, [tutorId]);

    return { courses, loading, error };
};
