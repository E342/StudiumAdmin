import { useState } from "react";
import '../assets/styles/components/_modal.scss';
import axios from "axios";
import { GLOBAL } from '../services/apiConfig';
import PropTypes from 'prop-types';
import { showSuccess, showError } from '../utils/alerts';
import { uploadFileToCloudinary, isCloudinaryConfigured, MAX_FILE_SIZE_BYTES } from '../services/cloudinary';

export const AddResourceModal = ({ idCurso, closeModal, onSubmit, defaultValue }) => {
    const API_URL = GLOBAL.map((e) => { return e.BASE_URL });
    //console.log("MODAL AGREGAR:" + idCurso);

    const [formState, setFormState] = useState(
        defaultValue || {
            titulo: "",
            descripcion: "",
            archivo: "",
        }
    );
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            showError({
                title: 'Archivo demasiado grande',
                text: 'El archivo no debe superar los 2 MB.',
            });
            e.target.value = '';
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Si se seleccionó un archivo, primero se sube a Cloudinary.
        let archivoUrl = formState.archivo || "";
        if (selectedFile) {
            if (!isCloudinaryConfigured) {
                showError({
                    title: 'Subida no disponible',
                    text: 'La carga de archivos a la nube no está configurada. Contacta al administrador.',
                });
                return;
            }
            try {
                setIsUploading(true);
                const uploadResult = await uploadFileToCloudinary(selectedFile);
                archivoUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Error al subir el archivo a Cloudinary:', uploadError);
                showError({
                    title: 'No se pudo subir el archivo',
                    text: 'Ocurrió un error al cargar el archivo. Inténtalo nuevamente.',
                });
                return;
            } finally {
                setIsUploading(false);
            }
        }

        try {
            const payload = { ...formState, archivo: archivoUrl };
            const token = localStorage.getItem('TOKEN');
            const response = await axios.post(`${API_URL}/course/resources/${idCurso}`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200 || response.status === 201) {
                console.log("Información enviada correctamente:", response.data);
                onSubmit(payload);
                await showSuccess({
                    title: 'Recurso agregado',
                    text: 'El recurso fue añadido correctamente al curso.',
                });
                closeModal();
                window.location.reload();
            } else {
                console.error("Error al enviar la información. Estado de respuesta:", response.status);
                console.error("Respuesta del servidor:", response.data);
                showError({
                    title: 'No se pudo agregar el recurso',
                    text: 'Verifica los datos e intenta nuevamente.',
                });
            }
        } catch (error) {
            if (error.response?.status === 400) {
                showError({
                    title: 'Contenido inapropiado',
                    text: 'Por favor,  mantén el contenido de tu recurso adecuado y sin lenguaje ofensivo.',
                });
            } else {
                showError({
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor. Inténtalo nuevamente más tarde.',
                });
            }
        }

    };

    const handleTextareaChange = (e) => {
        const textarea = e.target;
        textarea.style.height = "auto"; // Restablece la altura a auto para obtener la altura total
        textarea.style.height = `${textarea.scrollHeight}px`; // Establece la altura al tamaño desplazable
        setFormState((prevState) => ({
          ...prevState,
          [e.target.name]: e.target.value,
        }));
      };

    return (
        <div
            className="modal-container"
            onClick={(e) => {
                if (e.target.className === "modal-container") closeModal();
            }}
        >
            <div className="modal">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="titulo">Título:</label>
                        <input
                            required
                            type="text"
                            name="titulo"
                            onChange={handleChange}
                            value={formState.titulo}
                        />
                    </div>
                    <div className="form-group">
            <label htmlFor="descripcion">Descripción:</label>
            <textarea
              required
              name="descripcion"
              onChange={handleTextareaChange}
              value={formState.descripcion}
              className="auto-resize-textarea"
            />
          </div>
                    <div className="form-group">
                        <label htmlFor="archivo">Archivo (máx. 2 MB):</label>
                        <input
                            type="file"
                            name="archivo"
                            id="archivo"
                            onChange={handleFileChange}
                        />
                        {selectedFile && (
                            <small className="file-info">
                                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </small>
                        )}
                    </div>
                    <button type="submit" className="btn" disabled={isUploading}>
                        {isUploading ? 'Subiendo archivo...' : 'Guardar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
AddResourceModal.propTypes = {
    idCurso: PropTypes.string,
    closeModal: PropTypes.func,
    onSubmit: PropTypes.func,
    defaultValue: PropTypes.array
};