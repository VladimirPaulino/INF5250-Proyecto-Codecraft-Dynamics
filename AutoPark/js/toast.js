class ToastManager {
  constructor() {
    this.colors = {
      success: { bg: '#2ecc71', icon: '✅' },
      error: { bg: '#e74c3c', icon: '❌' },
      warning: { bg: '#f39c12', icon: '⚠️' },
      info: { bg: '#3498db', icon: 'ℹ️' }
    }
  }

  getContainer() {
    let container = document.getElementById('toast-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toast-container'
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `
      document.body.appendChild(container)
    }
    return container
  }

  ensureStyles() {
    if (document.getElementById('toast-styles')) return

    const style = document.createElement('style')
    style.id = 'toast-styles'
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(100px); }
      }
    `
    document.head.appendChild(style)
  }

  remove(toast) {
    toast.style.animation = 'slideOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }

  show(message, type = 'info', duration = 3500) {
    const container = this.getContainer()
    const { bg, icon } = this.colors[type] || this.colors.info

    this.ensureStyles()

    const toast = document.createElement('div')
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
    `

    toast.innerHTML = `<span style="font-size:18px">${icon}</span><span>${message}</span>`
    toast.addEventListener('click', () => this.remove(toast))
    container.appendChild(toast)
    setTimeout(() => this.remove(toast), duration)
  }

  success(msg) {
    this.show(msg, 'success')
  }

  error(msg) {
    this.show(msg, 'error')
  }

  warning(msg) {
    this.show(msg, 'warning')
  }

  info(msg) {
    this.show(msg, 'info')
  }
}

const toastManager = new ToastManager()

// Compatibilidad con páginas existentes
function getToastContainer() {
  return toastManager.getContainer()
}

function showToast(message, type = 'info', duration = 3500) {
  toastManager.show(message, type, duration)
}

function removeToast(toast) {
  toastManager.remove(toast)
}

const toast = {
  success: (msg) => toastManager.success(msg),
  error: (msg) => toastManager.error(msg),
  warning: (msg) => toastManager.warning(msg),
  info: (msg) => toastManager.info(msg)
}
