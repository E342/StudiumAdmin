import { useCallback, useEffect, useState } from 'react';
import { getCourseById } from '../services/courseService';

// Obtiene el detalle de un curso. Expone `refresh` para recargar los datos
// (silenciosamente, sin volver a mostrar el indicador de carga inicial).
export const useCourseDetail = (courseId) => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourse = useCallback(async ({ silent = false } = {}) => {
        if (!courseId) return;
        if (!silent) setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('TOKEN');
            const data = await getCourseById(courseId, token);
            setCourse(data);
        } catch (err) {
            console.error('Error al obtener el detalle del curso', err);
            setError('No se pudo cargar el detalle del curso. Intenta nuevamente.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    return { course, loading, error, refresh: () => fetchCourse({ silent: true }) };
};
