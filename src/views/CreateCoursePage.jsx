import React, { useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import '../assets/styles/components/_formCurso.scss';
import { GLOBAL } from '../services/apiConfig';
import { useUserData } from '../hooks/useUserData';
import { showSuccess, showError, showWarning } from '../utils/alerts';

const CreateCoursePage = ({ onSubmit = () => { }, defaultValue }) => {
    const API_URL = GLOBAL.map((e) => { return e.BASE_URL });
    const userId = localStorage.getItem("ID");
    const { userData } = useUserData(userId);
    const imagenInputRef = useRef(null);

    const name_user = userData ? userData.nombre : "";
    const [formState, setFormState] = useState(
        defaultValue || {
            id_tutor: `${userId}`,
            materia: "",
            nombre_tutor: name_user,
            nombre: "",
            horario: "",
            fecha_inicio: "",
            fecha_fin: "",
            imagen: "",
            objetivos: "",
            descripcion: "",
        }
    );

    const validateImageUrl = (url) => {
        const regex = /\.(jpeg|jpg|gif|png|bmp)$/;
        return regex.test(url);
    };

    // Funcion para validar el formulario
    const validateForm = (formData) => {
        const errors = [];
        if (formData.materia === materiaOpc[0]) {
            errors.push("Por favor seleccionar materia.");
        }

        if (formData.nombre_tutor < 10) {
            errors.push("Por favor ingrese su nombre completo");
        }


        // Validación del nombre del curso
        if (formData.nombre.length < 8) {
            errors.push("Por favor ingresar un nombre válido para el curso");
        }

        // Validación de la fecha de inicio no debe ser después de la fecha de finalización
        const fechaInicio = new Date(formData.fecha_inicio);
        const fechaFin = new Date(formData.fecha_fin);

        if (fechaInicio > fechaFin) {
            errors.push("La fecha de inicio no debe ser posterior a la fecha de finalización.");
        }

        // Validación de la fecha de inicio
        if (!formData.fecha_inicio) {
            errors.push("Por favor seleccionar la fecha de inicio del curso");
        }

        // Validación de la fecha de finalización
        if (!formData.fecha_fin) {
            errors.push("Por favor seleccionar la fecha de finalización del curso");
        }

        // Validación de la URL de la imagen
        if (!validateImageUrl(formData.imagen)) {
            errors.push('Por favor ingrese una URL válida, debe contener una de las siguientes terminaciones: jpeg, jpg o png');
        }

        // Validación de la objetivos
        if (formData.objetivos.length < 10) {
            errors.push("Por favor ingresar objetivos válidos para el curso");
        }

        // Validación de la descripcion
        if (formData.descripcion.length < 10) {
            errors.push("Por favor ingresar una descripción válida del curso");
        }

        return errors;
    };

    const handleChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm(formState);

        if (validationErrors.length > 0) {
            showWarning({
                title: 'Revisa el formulario',
                text: validationErrors.join(", "),
            });
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/course`, formState, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                onSubmit(formState);
                showSuccess({
                    title: '¡Curso creado exitosamente!',
                    text: 'El curso se registró correctamente y ya está disponible.',
                });

                setFormState({
                    id_tutor: `${userId}`,
                    materia: "",
                    nombre_tutor: name_user,
                    nombre: "",
                    horario: "",
                    fecha_inicio: "",
                    fecha_fin: "",
                    imagen: "",
                    objetivos: "",
                    descripcion: "",
                });
            } else {
                console.error("Error al enviar la información. Estado de respuesta:", response.status);
                console.error("Respuesta del servidor:", response.data);
                showError({
                    title: 'No se pudo crear el curso',
                    text: 'El servidor respondió con un estado inesperado. Intenta nuevamente.',
                });
            }
        } catch (error) {
            console.error("Error al enviar la información:", error);
            showError({
                title: 'Error al crear el curso',
                text: 'No se pudo conectar con el servidor. Inténtalo más tarde.',
            });
        }
    };

    const materiaOpc = [
        "Seleccione una materia",
        "Precálculo",
        "Elementos para el estudio de la ciencia y la tecnología",
        "Matemática discreta I",
        "Fundamentos de programación",
        "Álgebra vectorial y matrices",
        "Cálculo I",
        "Programación de estructuras dinámicas",
        "Matemática discreta II",
        "Física I",
        "Cálculo II",
        "Programación orientada a objetos",
        "Bases de datos",
        "Electricidad y magnetismo",
        "Cálculo III",
        "Programación web",
        "Administración de bases de datos",
        "Optativa humanístico-social I",
        "Análisis numérico",
        "Redes de computadoras",
        "Programación de dispositivos móviles",
        "Análisis de sistemas",
        "Física II",
        "Optativa humanístico-social II",
        "Análisis de algoritmos",
        "Programación de artefactos",
        "Probabilidad y estadística",
        "Seguridad en entornos de desarrollo",
        "Arquitectura de computadoras",
        "Técnicas de simulación de computadoras",
        "Programación N-capas",
        "Fundamentos de inteligencia de negocios",
        "Optativa humanístico-social III",
        "Sistemas operativos",
        "Programación declarativa",
        "Ingeniería de software",
        "Formulación y evaluación de proyectos",
        "Optativa humanístico-social IV",
        "Optativa técnica I",
        "Aplicaciones código abierto",
        "Práctica profesional I",
        "Optativa técnica II",
        "Teoría de lenguaje de programación",
        "Optativa humanístico-social V",
        "Práctica profesional II",
    ];

    return (
        <main className="main_formCurso">
            <div className="bg-titulo">
                <h2 className="h2_formCurso">Crear nuevo <span className="h2_formCurso_span">Curso</span></h2>
            </div>
            <form onSubmit={handleSubmit} className="formCurso">
                <div className="form-group-curso">
                    <label htmlFor="materia" className="label-formCurso">Materia:</label>
                    <select
                        id="materia"
                        name="materia"
                        value={formState.materia}
                        onChange={handleChange}
                        className="select-formCurso"
                    >
                        {materiaOpc.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group-curso">
                    <label htmlFor="nombre_tutor" className="label-formCurso">Nombre del tutor:</label>
                    <input
                        id="nombre_tutor"
                        name="nombre_tutor"
                        placeholder="Ingresar nombre completo"
                        type="text"
                        value={formState.nombre_tutor}
                        onChange={handleChange}
                        className="input-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="nombre" className="label-formCurso">Nombre del curso:</label>
                    <input
                        id="nombre"
                        name="nombre"
                        placeholder="Ingresar nombre del curso"
                        type="text"
                        value={formState.nombre}
                        onChange={handleChange}
                        className="input-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="horario" className="label-formCurso">Horario: </label>
                    <textarea
                        id="horario"
                        name="horario"
                        placeholder="Ingrese el horario"
                        type="text"
                        rows={2}
                        value={formState.horario}
                        onChange={handleChange}
                        className="textarea-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="fecha_inicio" className="label-formCurso">Fecha de inicio:</label>
                    <input
                        id="fecha_inicio"
                        name="fecha_inicio"
                        type="date"
                        value={formState.fecha_inicio}
                        onChange={handleChange}
                        className="input-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="fecha_fin" className="label-formCurso">Fecha de finalización:</label>
                    <input
                        id="fecha_fin"
                        name="fecha_fin"
                        type="date"
                        value={formState.fecha_fin}
                        onChange={handleChange}
                        className="input-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="fecha_fin" className="label-formCurso">Imagen:</label>
                    <input
                        id="imagen"
                        name="imagen"
                        type="text"
                        placeholder="Ingrese URL de la imagen representativa del curso"
                        ref={imagenInputRef}
                        value={formState.imagen}
                        onChange={handleChange}
                        className="textarea-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="objetivos" className="label-formCurso">Objetivos:</label>
                    <textarea
                        id="objetivos"
                        name="objetivos"
                        placeholder="Ingrese objetivos del curso"
                        type="text"
                        rows={5}
                        value={formState.objetivos}
                        onChange={handleChange}
                        className="textarea-formCurso"
                    />
                </div>
                <div className="form-group-curso">
                    <label htmlFor="descripcion" className="label-formCurso">Descripción:</label>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        placeholder="Ingrese la descripción del curso"
                        type="text"
                        rows={5}
                        value={formState.descripcion}
                        onChange={handleChange}
                        className="textarea-formCurso"
                    />
                </div>

                <div className="form-curso-btn-container">
                    <button type="submit" className="btn" onClick={handleSubmit}>
                        Guardar
                    </button>
                    <Link to='/perfil'>
                        <button className="button-return-formCurso">
                            Regresar
                        </button>
                    </Link>
                </div>
            </form>
        </main>

    );
}

export default CreateCoursePage;