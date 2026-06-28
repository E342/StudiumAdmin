import { useCallback, useEffect, useState } from 'react';
import { getCourseById, getCourseResources } from '../services/courseService';

// Estados posibles de acceso al contenido (recursos) de un curso.
export const ACCESS = {
    LOADING: 'loading',
    GRANTED: 'granted', // dueño del curso o estudiante aprobado
    DENIED: 'denied',   // estudiante no aprobado por el tutor
    ERROR: 'error',
};

/**
 * Determina si el usuario actual puede ver el contenido de un curso y, en caso
 * afirmativo, expone los recursos.
 *
 * La decisión combina dos validaciones, tal como exige el requerimiento:
 *
 *  1. A nivel de interfaz: se identifica al dueño del curso comparando
 *     `id_tutor` con el `ID` guardado en `localStorage`. El dueño siempre tiene
 *     acceso a su propio curso.
 *
 *  2. Consumiendo el backend (autoritativa): los recursos se piden al endpoint
 *     PROTEGIDO `GET /course/resources/:id`. El backend solo responde 200 si el
 *     usuario es el tutor, un administrador o un tutorado APROBADO (presente en
 *     `course.tutorados`). Si no lo es, responde 403 y el contenido sensible
 *     nunca llega al cliente.
 *
 * Para los metadatos no sensibles (nombre, tutor, imagen) se usa
 * `getCourseById`; el contenido del curso proviene exclusivamente del endpoint
 * protegido.
 */
export const useCourseAccess = (courseId) => {
    const [course, setCourse] = useState(null);
    const [resources, setResources] = useState([]);
    const [accessState, setAccessState] = useState(ACCESS.LOADING);
    const [isOwner, setIsOwner] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!courseId) return;
        if (!silent) setAccessState(ACCESS.LOADING);
        setError(null);

        const token = localStorage.getItem('TOKEN');
        const userId = localStorage.getItem('ID');

        try {
            // Metadatos no sensibles del curso (cabecera).
            const courseData = await getCourseById(courseId, token);
            setCourse(courseData);
            setIsOwner(String(courseData?.id_tutor) === String(userId));

            // Validación autoritativa: el backend decide si entrega los recursos.
            try {
                const data = await getCourseResources(courseId, token);
                setResources(data);
                setAccessState(ACCESS.GRANTED);
            } catch (err) {
                if (err?.response?.status === 403) {
                    setResources([]);
                    setAccessState(ACCESS.DENIED);
                } else {
                    throw err;
                }
            }
        } catch (err) {
            console.error('Error al cargar el acceso al curso', err);
            setResources([]);
            setError('No se pudo cargar el curso. Intenta nuevamente.');
            setAccessState(ACCESS.ERROR);
        }
    }, [courseId]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        course,
        resources,
        accessState,
        isOwner,
        error,
        refresh: () => load({ silent: true }),
    };
};
