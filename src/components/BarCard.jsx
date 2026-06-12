import { useState } from 'react';
import PropTypes from 'prop-types';
import icon from './../assets//img/libro.png';
import axios from 'axios';
import { GLOBAL } from '../services/services';
import { ModalRecursoEditar } from './ModalRecursoEditar';
import { showConfirm, showSuccess, showError } from '../utils/alerts';

const API_URL = GLOBAL.map((e) => { return e.BASE_URL });
//FUNCION TEXT TO LINKS
function convertirTextoAHtml(texto) {
    const regexUrl = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    let nuevoTexto = texto.replace(regexUrl, `<a href="$1" target="_blank">Link</a>`);
    return `<p>${nuevoTexto}</p>`;
}

const BarCard = ({ id, titulo, textContent, owner, id_curso }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    //LOCAL STORAGE
    const id_user = localStorage.getItem('ID');
    //console.log("USER:" + id_user);
    const [show, setShow] = useState(false);
    //LINKS
    const htmlConLinks = convertirTextoAHtml(textContent);
    //ELIMINAR RECURSO
    const handleDeleteR = async () => {
        const confirmed = await showConfirm({
            title: '¿Eliminar recurso?',
            text: 'Esta acción eliminará el recurso de forma permanente.',
            icon: 'warning',
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
        });

        if (!confirmed) return;

        try {
            const response = await axios.delete(`${API_URL}/course/${id_curso}/resource/${id}`);
            console.log(response.data);
            await showSuccess({
                title: 'Recurso eliminado',
                text: 'El recurso fue eliminado correctamente.',
            });
            window.location.reload();
        } catch (error) {
            console.error("Hubo un error en la solicitud: ", error);
            showError({
                title: 'No se pudo eliminar el recurso',
                text: 'Ocurrió un error al eliminar. Intenta nuevamente.',
            });
        }
    }

    return (
        <div id={id} className="BardCard-container">
            <button onClick={() => { setShow(!show) }}><img src={icon}></img><p>{titulo}</p></button>
            {show ? <article>
                <article>
                    <div dangerouslySetInnerHTML={{ __html: htmlConLinks }}></div>
                    {owner == id_user ?
                        <span>
                            <button className='btnDEL' onClick={handleDeleteR}>Eliminar todo</button>
                            <button className='btnEDIT' onClick={() => setIsModalOpen(true)}>Editar recursos</button>
                        </span> : null
                    }
                    {isModalOpen && (
                        <ModalRecursoEditar
                            idRecurso={id}
                            idCurso={id_curso}
                            closeModal={() => setIsModalOpen(false)}
                            title={titulo}
                            content={textContent}
                            onSubmit={(formData) => {
                                console.log('Form submitted with data:', formData);
                            }}
                        />
                    )}
                </article>
            </article> : null}
        </div>
    )
}
BarCard.propTypes = {
    owner: PropTypes.string,
    id: PropTypes.string,
    titulo: PropTypes.string,
    textContent: PropTypes.string,
    id_curso: PropTypes.string
}
BarCard.defaultProps = {
    owner: "0",
    id: "0",
    titulo: "Titulo",
    textContent: "YouTube: https://www.youtube.com/watch?v=roxC8SMs7HU",
    id_curso: "0"
}

export default BarCard;

//<p>{textContent}</p>
/*
function convertirTextoAHtml(texto) {
    const regexUrl = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    return texto.split(/(\s+)/).map(parte => {
        if (regexUrl.test(parte)) {
            return `<a href="${parte}">${parte}</a>`;
        }
        return `<p>${parte}</p>`;
    }).join('');
}
*/
/*
function convertirTextoAHtml(texto) {
    const regexUrl = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
    const palabras = texto.split(/(\s+)/);
    let html = "";
    let parrafoActual = "";

    palabras.forEach(palabra => {
        if (regexUrl.test(palabra)) {
            if (parrafoActual.length > 0) {
                html += `<p>${parrafoActual.trim()}</p>`;
                parrafoActual = "";
            }
            html += `<a href="${palabra}">${palabra}</a>`;
        } else {
            parrafoActual += palabra;
        }
    });
    
    if (parrafoActual.length > 0) {
        html += `<p>${parrafoActual.trim()}</p>`;
    }
    
    return html;
}
*/