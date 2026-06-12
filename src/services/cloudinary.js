/**
 * Servicio de subida de archivos a Cloudinary mediante "unsigned upload".
 *
 * --------------------------------------------------------------------------
 * REQUISITOS DE CONFIGURACIÓN EXTERNA (Cuenta de Cloudinary)
 * --------------------------------------------------------------------------
 *   1. Crea una cuenta gratuita en https://cloudinary.com/.
 *   2. En el Dashboard copia el "Cloud name" → VITE_CLOUDINARY_CLOUD_NAME.
 *   3. Settings → Upload → "Add upload preset":
 *        - Signing Mode: "Unsigned" (permite subir desde el frontend sin API secret).
 *        - Guarda el nombre del preset → VITE_CLOUDINARY_UPLOAD_PRESET.
 *   4. (Opcional) En el preset puedes limitar formatos y tamaño máximo.
 *
 * Mientras estas variables queden vacías, `isCloudinaryConfigured` es `false`
 * y la subida muestra un mensaje informando que la configuración está pendiente.
 * --------------------------------------------------------------------------
 */

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

// Tamaño máximo permitido para los archivos: 2 MB.
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

// Indica si la integración con Cloudinary está completamente configurada.
export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

/**
 * Sube un archivo a Cloudinary y devuelve la información de la subida.
 * Usa el endpoint `auto/upload` para aceptar imágenes, PDFs, documentos, etc.
 *
 * Se usa `fetch` (y no axios) a propósito: el interceptor global de axios
 * añade el header `Authorization` a todas las peticiones, y Cloudinary lo
 * rechaza en el preflight CORS. `fetch` evita ese header.
 *
 * @param {File} file Archivo a subir (debe pesar <= MAX_FILE_SIZE_BYTES).
 * @returns {Promise<object>} Respuesta de Cloudinary (incluye `secure_url`).
 */
export const uploadFileToCloudinary = async (file) => {
    if (!isCloudinaryConfigured) {
        throw new Error(
            'Cloudinary no está configurado. Define VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.'
        );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Error al subir el archivo a Cloudinary');
    }

    return response.json();
};
