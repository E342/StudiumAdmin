// Valida que una URL termine en una extensión de imagen soportada.
export const validateImageUrl = (url) => /\.(jpeg|jpg|gif|png|bmp)$/i.test(url || "");

// Convierte una fecha (ISO o Date) al formato YYYY-MM-DD que requiere <input type="date">.
export const toDateInputValue = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
