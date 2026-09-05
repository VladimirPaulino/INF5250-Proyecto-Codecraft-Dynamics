// =====================
// SISTEMA DE TOASTS
// =====================

// Crear contenedor de toasts si no existe
function getToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    return container;
}

// Mostrar toast
function showToast(message, type = "info", duration = 3500) {
    const container = getToastContainer();

    const colors = {
        success: { bg: "#2ecc71", icon: "✅" },
        error: { bg: "#e74c3c", icon: "❌" },
        warning: { bg: "#f39c12", icon: "⚠️" },
        info: { bg: "#3498db", icon: "ℹ️" }
    };

    const { bg, icon } = colors[type] || colors.info;

    const toast = document.createElement("div");
    toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 14px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 280px;
        max-width: 380px;
        animation: slideIn 0.3s ease;
        cursor: pointer;
        font-family: sans-serif;
    `;

    toast.innerHTML = `<span style="font-size:18px">${icon}</span><span>${message}</span>`;

    // Cerrar al hacer clic
    toast.addEventListener("click", () => removeToast(toast));

    container.appendChild(toast);

    // Agregar animación CSS si no existe
    if (!document.getElementById("toast-styles")) {
        const style = document.createElement("style");
        style.id = "toast-styles";
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(100px); }
                to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to   { opacity: 0; transform: translateX(100px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-cerrar
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    toast.style.animation = "slideOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
}

// Atajos
const toast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warning: (msg) => showToast(msg, "warning"),
    info: (msg) => showToast(msg, "info")
};