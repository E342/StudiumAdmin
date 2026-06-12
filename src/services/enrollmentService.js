import axios from 'axios';
import { GLOBAL } from './apiConfig';

const API_URL = GLOBAL[0].BASE_URL;

/**
 * POST {{baseUrl}}/api/enrollment/:courseId
 *
 * Crea una solicitud de inscripción del estudiante actual (rol "user") al curso.
 * No lleva body: el backend toma al estudiante del token y el curso de la URL.
 *
 * Respuestas relevantes del backend:
 *   201 → solicitud creada con `status: "PENDING"`.
 *   400 → id inválido | "No puedes solicitar acceso a tu propio curso".
 *   401 → sin token / token inválido.
 *   403 → el usuario no tiene rol "user".
 *   404 → "Curso no encontrado".
 *   409 → "Ya estás inscrito en este curso" (ya es miembro).
 *   409 → "Ya tienes una solicitud pendiente para este curso" (duplicada).
 *   500 → error del servidor.
 *
 * El token de autenticación lo adjunta automáticamente el interceptor global de
 * axios (ver `main.jsx`).
 */
export const requestEnrollment = async (courseId) => {
    const response = await axios.post(`${API_URL}/enrollment/${courseId}`);
    return response.data;
};

/**
 * GET {{baseUrl}}/api/enrollment/tutor?status=PENDING|APPROVED|REJECTED
 *
 * Lista las solicitudes de inscripción de los cursos del tutor autenticado.
 * `status` es opcional (sin él, devuelve todas). El backend ya proyecta las
 * filas para la tabla: `{ id, studentName, studentEmail, courseName, status, createdAt }`.
 * Requiere rol "tutor"; el backend filtra por el `tutorId` del token.
 */
export const getTutorEnrollments = async (status) => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/enrollment/tutor`, { params });
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * PATCH {{baseUrl}}/api/enrollment/:id/approve
 * Aprueba una solicitud. Efecto secundario en el backend: agrega al estudiante a
 * `course.tutorados`, con lo que ya puede acceder a los recursos. Sin body.
 */
export const approveEnrollment = async (id) => {
    const response = await axios.patch(`${API_URL}/enrollment/${id}/approve`);
    return response.data;
};

/**
 * PATCH {{baseUrl}}/api/enrollment/:id/reject
 * Rechaza una solicitud (status REJECTED). No modifica `tutorados`. Sin body.
 */
export const rejectEnrollment = async (id) => {
    const response = await axios.patch(`${API_URL}/enrollment/${id}/reject`);
    return response.data;
};
