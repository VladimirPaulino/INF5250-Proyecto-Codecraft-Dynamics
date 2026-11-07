function pad(n) {
  return String(n).padStart(2, '0')
}

/** Formato DATETIME MySQL en hora local del servidor (sin convertir a UTC). */
function aDatetime(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Acepta "YYYY-MM-DDTHH:mm", "YYYY-MM-DD HH:mm[:ss]" o Date.
 * Interpreta valores sin zona como hora local.
 */
function parsearFecha(valor) {
  if (!valor) return null
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor
  }
  const texto = String(valor).trim()
  const local = texto.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (local) {
    const [, y, m, d, h, min, s = '0'] = local
    const fecha = new Date(
      Number(y), Number(m) - 1, Number(d),
      Number(h), Number(min), Number(s)
    )
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

module.exports = { aDatetime, parsearFecha, pad }
