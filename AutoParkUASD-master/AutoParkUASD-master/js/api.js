// Configuración de la URL del servidor
const API_URL = "http://localhost:3000/api";

// Función para enviar datos al backend (Node.js)
async function peticionBackend(endpoint, metodo, datos) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: datos ? JSON.stringify(datos) : null
        });

        return await response.json();
    } catch (error) {
        console.error("Error de conexión:", error);
        return { error: "No se pudo conectar con el servidor" };
    }
}