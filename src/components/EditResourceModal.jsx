import { useState } from "react";
import '../assets/styles/components/_modal.scss';
import axios from "axios";
import { GLOBAL } from '../services/apiConfig';
import PropTypes from 'prop-types';
import { showSuccess, showError } from '../utils/alerts';

export const EditResourceModal = ({ idRecurso, idCurso, closeModal, onSubmit, title, content, defaultValue }) => {
    const API_URL = GLOBAL.map((e) => { return e.BASE_URL });
    const [formState, setFormState] = useState(
        defaultValue || {
            titulo: title,
            descripcion: content
        }
    );
/*
const validateForm = () => {
    // FALTAN VALIDACIONES AYUDAAAA
    return true;
};
*/

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.patch(`${API_URL}/course/${idCurso}/resource/${idRecurso}`, formState);

            console.log("Response from server:", response);

            if (response.status === 200 || response.status === 201) {
                console.log("Información enviada correctamente:", response.data);
                onSubmit(formState);
                await showSuccess({
                    title: 'Recurso actualizado',
                    text: 'Los cambios se guardaron correctamente.',
                });
                closeModal();
                window.location.reload();
            } else {
                console.error("Error al enviar la información. Estado de respuesta:", response.status);
                console.error("Respuesta del servidor:", response.data);
                showError({
                    title: 'No se pudo actualizar el recurso',
                    text: 'Verifica los datos e intenta nuevamente.',
                });
            }
        } catch (error) {
            console.error("Error al enviar la información:", error);
            showError({
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Inténtalo nuevamente más tarde.',
            });
        }
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
                        />
                    </div>
                    <button type="submit" className="btn">
                        Guardar
                    </button>
                </form>
            </div>
        </div>
    );
    
};
EditResourceModal.propTypes = {
    idRecurso: PropTypes.string,
    idCurso: PropTypes.string,
    closeModal: PropTypes.func,
    onSubmit: PropTypes.func,
    title: PropTypes.string,
    content: PropTypes.string,
    defaultValue: PropTypes.array
};
