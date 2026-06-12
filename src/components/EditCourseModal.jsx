import { useState } from "react";
import PropTypes from 'prop-types';
import { materiaOpc } from '../utils/materias';
import { updateCourse } from '../services/courseService';
import { validateImageUrl, toDateInputValue } from '../utils/validators';
import { showSuccess, showError } from '../utils/alerts';
import '../assets/styles/components/_modal.scss';

export const EditCourseModal = ({ course, closeModal, onUpdated }) => {
    const [formState, setFormState] = useState({
        materia: course.materia || materiaOpc[0],
        nombre_tutor: course.nombre_tutor || "",
        nombre: course.nombre || "",
        horario: course.horario || "",
        fecha_inicio: toDateInputValue(course.fecha_inicio),
        fecha_fin: toDateInputValue(course.fecha_fin),
        imagen: course.imagen || "",
        objetivos: course.objetivos || "",
        descripcion: course.descripcion || "",
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = (data) => {
        const newErrors = {};

        if (!data.materia || data.materia === materiaOpc[0]) {
            newErrors.materia = "Por favor selecciona una materia.";
        }
        if ((data.nombre_tutor || "").trim().length < 10) {
            newErrors.nombre_tutor = "Ingresa el nombre completo del tutor (mínimo 10 caracteres).";
        }
        if ((data.nombre || "").trim().length < 8) {
            newErrors.nombre = "El nombre del curso debe tener al menos 8 caracteres.";
        }
        if (!(data.horario || "").trim()) {
            newErrors.horario = "Ingresa el horario del curso.";
        }
        if (!data.fecha_inicio) {
            newErrors.fecha_inicio = "Selecciona la fecha de inicio.";
        }
        if (!data.fecha_fin) {
            newErrors.fecha_fin = "Selecciona la fecha de finalización.";
        }
        if (data.fecha_inicio && data.fecha_fin && new Date(data.fecha_inicio) > new Date(data.fecha_fin)) {
            newErrors.fecha_fin = "La fecha de inicio no puede ser posterior a la de finalización.";
        }
        if (!validateImageUrl(data.imagen)) {
            newErrors.imagen = "Ingresa una URL válida (jpeg, jpg, gif, png o bmp).";
        }
        if ((data.objetivos || "").trim().length < 10) {
            newErrors.objetivos = "Ingresa objetivos válidos (mínimo 10 caracteres).";
        }
        if ((data.descripcion || "").trim().length < 10) {
            newErrors.descripcion = "Ingresa una descripción válida (mínimo 10 caracteres).";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formState);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('TOKEN');
            await updateCourse(course._id, formState, token);
            await showSuccess({
                title: 'Curso actualizado',
                text: 'Los cambios se guardaron correctamente.',
            });
            onUpdated();
            closeModal();
        } catch (error) {
            console.error('Error al actualizar el curso', error);
            const mensaje =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'No se pudo actualizar el curso. Intenta nuevamente.';
            showError({
                title: 'No se pudo actualizar',
                text: mensaje,
            });
            // Se mantiene el modal abierto para que el usuario reintente.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="modal-container"
            onClick={(e) => {
                if (e.target.className === "modal-container" && !isSaving) closeModal();
            }}
        >
            <div className="modal modal-scroll">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="materia">Materia:</label>
                        <select id="materia" name="materia" value={formState.materia} onChange={handleChange}>
                            {materiaOpc.map((opcion) => (
                                <option key={opcion} value={opcion}>{opcion}</option>
                            ))}
                        </select>
                        {errors.materia && <span className="error">{errors.materia}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="nombre_tutor">Nombre del tutor:</label>
                        <input id="nombre_tutor" name="nombre_tutor" type="text" value={formState.nombre_tutor} onChange={handleChange} />
                        {errors.nombre_tutor && <span className="error">{errors.nombre_tutor}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="nombre">Nombre del curso:</label>
                        <input id="nombre" name="nombre" type="text" value={formState.nombre} onChange={handleChange} />
                        {errors.nombre && <span className="error">{errors.nombre}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="horario">Horario:</label>
                        <textarea id="horario" name="horario" rows={2} value={formState.horario} onChange={handleChange} />
                        {errors.horario && <span className="error">{errors.horario}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="fecha_inicio">Fecha de inicio:</label>
                        <input id="fecha_inicio" name="fecha_inicio" type="date" value={formState.fecha_inicio} onChange={handleChange} />
                        {errors.fecha_inicio && <span className="error">{errors.fecha_inicio}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="fecha_fin">Fecha de finalización:</label>
                        <input id="fecha_fin" name="fecha_fin" type="date" value={formState.fecha_fin} onChange={handleChange} />
                        {errors.fecha_fin && <span className="error">{errors.fecha_fin}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="imagen">Imagen:</label>
                        <input id="imagen" name="imagen" type="text" value={formState.imagen} onChange={handleChange} />
                        {errors.imagen && <span className="error">{errors.imagen}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="objetivos">Objetivos:</label>
                        <textarea id="objetivos" name="objetivos" rows={4} value={formState.objetivos} onChange={handleChange} />
                        {errors.objetivos && <span className="error">{errors.objetivos}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="descripcion">Descripción:</label>
                        <textarea id="descripcion" name="descripcion" rows={4} value={formState.descripcion} onChange={handleChange} />
                        {errors.descripcion && <span className="error">{errors.descripcion}</span>}
                    </div>

                    <button type="submit" className="btn" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
};

EditCourseModal.propTypes = {
    course: PropTypes.object.isRequired,
    closeModal: PropTypes.func.isRequired,
    onUpdated: PropTypes.func,
};

EditCourseModal.defaultProps = {
    onUpdated: () => {},
};

export default EditCourseModal;
