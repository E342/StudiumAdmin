import PropTypes from 'prop-types';

// Detecta si la URL apunta a una imagen por su extensión.
const esImagen = (url) => /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url);

/**
 * Sección que muestra los archivos subidos a Cloudinary asociados a los
 * recursos de un curso (campo `archivo`). Las imágenes se muestran como
 * miniatura y el resto de archivos con un ícono. Si ningún recurso tiene
 * archivo, no se renderiza nada.
 */
const CloudinaryResources = ({ recursos }) => {
    const lista = Array.isArray(recursos) ? recursos.filter(r => r.archivo) : [];

    if (lista.length === 0) return null;

    return (
        <section className="recursos-cloudinary">
            <h2 className="recursos-cloudinary-title">Archivos adjuntos</h2>
            <div className="recursos-cloudinary-grid">
                {lista.map(r => (
                    <a
                        key={r._id}
                        href={r.archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="recursos-cloudinary-item"
                    >
                        {esImagen(r.archivo) ? (
                            <img src={r.archivo} alt={r.titulo} />
                        ) : (
                            <span className="recursos-cloudinary-file">📄</span>
                        )}
                        <span className="recursos-cloudinary-name">{r.titulo || 'Ver archivo'}</span>
                    </a>
                ))}
            </div>
        </section>
    );
};

CloudinaryResources.propTypes = {
    recursos: PropTypes.array,
};

export default CloudinaryResources;
