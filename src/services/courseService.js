import axios from 'axios';
import { GLOBAL } from './apiConfig';

const API_URL = GLOBAL[0].BASE_URL;

// GET {{baseUrl}}/api/course/filter/{{tutorId}} → cursos del tutor.
export const getCoursesByTutor = async (tutorId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
        const response = await axios.get(`${API_URL}/course/filter/${tutorId}`, { headers });
        return Array.isArray(response.data) ? response.data : [];
    } catch (err) {
        if (err?.response?.status === 404) return [];
        throw err;
    }
};

// GET {{baseUrl}}/api/course/:id → detalle de un curso.
// Solo requiere autenticación, por lo que devuelve el documento completo
// (incluidos `recursos`). Úsalo únicamente para metadatos no sensibles del
// curso; el contenido se obtiene con `getCourseResources`, que sí valida acceso.
export const getCourseById = async (courseId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_URL}/course/${courseId}`, { headers });
    return response.data;
};

// GET {{baseUrl}}/api/course/resources/:id → recursos del curso.
// Endpoint PROTEGIDO por el backend (middleware `canAccessResources`): responde
// 403 si el usuario no es el tutor, ni admin, ni un tutorado aprobado del curso.
// Es la fuente autoritativa para decidir si se muestra el contenido: al no ser
// aprobado, los recursos nunca llegan al cliente.
export const getCourseResources = async (courseId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_URL}/course/resources/${courseId}`, { headers });
    return Array.isArray(response.data) ? response.data : [];
};

// PUT {{baseUrl}}/api/course/:id → actualiza el curso. Solo requiere autenticación.
export const updateCourse = async (courseId, data, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(`${API_URL}/course/${courseId}`, data, { headers });
    return response.data;
};
