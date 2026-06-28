import { useEffect, useState } from 'react';
import { useTutorEnrollments } from '../hooks/useTutorEnrollments';
import { approveEnrollment, rejectEnrollment } from '../services/enrollmentService';
import { showConfirm, showSuccess, showError } from '../utils/alerts';
import '../assets/styles/components/_home.scss';
import '../assets/styles/components/_aprobaciones.scss';

const PAGE_SIZE = 8;

// Etiquetas y clases visuales para cada estado de la solicitud.
const ESTADOS = {
    PENDING: { label: 'Pendiente', cls: 'estado-pendiente' },
    APPROVED: { label: 'Aprobada', cls: 'estado-aprobada' },
    REJECTED: { label: 'Rechazada', cls: 'estado-rechazada' },
};

const FILTROS = [
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobadas' },
    { value: 'REJECTED', label: 'Rechazadas' },
];

const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? '—'
        : d.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const renderEstado = (status) => {
    const estado = ESTADOS[status] || { label: status || '—', cls: '' };
    return <span className={`estado-badge ${estado.cls}`}>{estado.label}</span>;
};

function EnrollmentApprovalsPage() {
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [currentPage, setCurrentPage] = useState(1);
    const [processingId, setProcessingId] = useState(null);

    const { rows, loading, error, refresh } = useTutorEnrollments(statusFilter);

    // Volver a la primera página al cambiar el filtro.
    useEffect(() => { setCurrentPage(1); }, [statusFilter]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

    // Si la lista se encoge (p. ej. tras aprobar), no quedarse en una página vacía.
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleActionError = (err) => {
        const status = err?.response?.status;
        const backendMsg = err?.response?.data?.error || '';
        if (status === 409) {
            // La solicitud ya fue resuelta por otro proceso: refrescar la tabla.
            showError({
                title: 'La solicitud ya fue procesada',
                text: backendMsg || 'Esta solicitud ya fue aprobada o rechazada. Actualizando la lista...',
            });
            refresh();
        } else if (status === 403) {
            showError({ title: 'Sin permiso', text: 'No tienes permiso para gestionar esta solicitud.' });
        } else if (status === 404) {
            showError({ title: 'Solicitud no encontrada', text: 'La solicitud ya no existe.' });
            refresh();
        } else {
            showError({
                title: 'No se pudo completar la acción',
                text: backendMsg || 'Ocurrió un error en el servidor. Intenta nuevamente.',
            });
        }
    };

    const handleApprove = async (row) => {
        const confirmed = await showConfirm({
            title: 'Aprobar solicitud',
            text: `¿Aprobar la solicitud de ${row.studentName} para "${row.courseName}"?`,
            icon: 'question',
            confirmButtonText: 'Aprobar',
            cancelButtonText: 'Cancelar',
        });
        if (!confirmed) return;

        setProcessingId(row.id);
        try {
            await approveEnrollment(row.id);
            await showSuccess({
                title: 'Solicitud aprobada',
                text: `${row.studentName} ya puede acceder al contenido de "${row.courseName}".`,
            });
            refresh();
        } catch (err) {
            handleActionError(err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (row) => {
        const confirmed = await showConfirm({
            title: 'Rechazar solicitud',
            text: `¿Rechazar la solicitud de ${row.studentName} para "${row.courseName}"?`,
            icon: 'warning',
            confirmButtonText: 'Rechazar',
            cancelButtonText: 'Cancelar',
        });
        if (!confirmed) return;

        setProcessingId(row.id);
        try {
            await rejectEnrollment(row.id);
            await showSuccess({
                title: 'Solicitud rechazada',
                text: `La solicitud de ${row.studentName} fue rechazada.`,
            });
            refresh();
        } catch (err) {
            handleActionError(err);
        } finally {
            setProcessingId(null);
        }
    };

    const renderContent = () => {
        if (loading) {
            return <h2 className='estado-mensaje'>Cargando solicitudes...</h2>;
        }
        if (error) {
            return <h2 className='estado-mensaje estado-error'>{error}</h2>;
        }
        if (rows.length === 0) {
            return <h2 className='estado-mensaje'>No hay solicitudes para mostrar.</h2>;
        }

        return (
            <>
                <div className='aprobaciones-table-wrapper'>
                    <table className='aprobaciones-table'>
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Correo electrónico</th>
                                <th>Curso solicitado</th>
                                <th>Fecha de solicitud</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.map((row) => (
                                <tr key={row.id}>
                                    <td data-label='Estudiante'>{row.studentName}</td>
                                    <td data-label='Correo electrónico'>{row.studentEmail}</td>
                                    <td data-label='Curso solicitado'>{row.courseName}</td>
                                    <td data-label='Fecha de solicitud'>{formatDate(row.createdAt)}</td>
                                    <td data-label='Estado'>{renderEstado(row.status)}</td>
                                    <td data-label='Acciones'>
                                        {row.status === 'PENDING' ? (
                                            <div className='aprobaciones-acciones'>
                                                <button
                                                    className='btn-aprobar'
                                                    onClick={() => handleApprove(row)}
                                                    disabled={processingId === row.id}
                                                >
                                                    Aprobar
                                                </button>
                                                <button
                                                    className='btn-rechazar'
                                                    onClick={() => handleReject(row)}
                                                    disabled={processingId === row.id}
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        ) : (
                                            <span className='sin-acciones'>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className='pagination'>
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            Anterior
                        </button>
                        <span>Página {currentPage} de {totalPages}</span>
                        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            Siguiente
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className='center'>
            <h1>APROBACIONES</h1>
            <div className='aprobaciones-filtro'>
                <label htmlFor='filtro-estado'>Estado:</label>
                <select
                    id='filtro-estado'
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {FILTROS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                </select>
            </div>
            {renderContent()}
        </div>
    );
}

export default EnrollmentApprovalsPage;
