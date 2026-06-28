import { useCallback, useEffect, useState } from 'react';
import { getTutorEnrollments } from '../services/enrollmentService';

// Obtiene las solicitudes de inscripción de los cursos del tutor autenticado.
// `status` (PENDING | APPROVED | REJECTED) es opcional para filtrar. Expone
// `refresh` para recargar tras aprobar/rechazar una solicitud.
export const useTutorEnrollments = (status) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTutorEnrollments(status);
            setRows(data);
        } catch (err) {
            console.error('Error al obtener las solicitudes de inscripción', err);
            setError('No se pudieron cargar las solicitudes. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    return { rows, loading, error, refresh: fetchRows };
};
