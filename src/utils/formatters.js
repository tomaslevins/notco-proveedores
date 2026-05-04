// Parsea fecha string "YYYY-MM-DD" a objeto Date local (evita desfase UTC)
export const parsearFecha = (fechaStr) => {
  if (!fechaStr) return null
  const [year, month, day] = fechaStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—'
  const d = parsearFecha(fechaStr)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatearMoneda = (valor, pais) => {
  if (valor === null || valor === undefined || valor === '') return '—'
  const locale = pais === 'Chile' ? 'es-CL' : 'es-AR'
  const currency = pais === 'Chile' ? 'CLP' : 'ARS'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(valor)
}

export const formatearMonedaCorta = (valor) => {
  if (!valor) return '$0'
  if (valor >= 1_000_000_000) return `$${(valor / 1_000_000_000).toFixed(1)}B`
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `$${(valor / 1_000).toFixed(0)}K`
  return `$${valor}`
}

export const getDiasRestantes = (vencimiento) => {
  if (!vencimiento) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = parsearFecha(vencimiento)
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

const TIPOS_ESPORADICO = ['Esporádico', 'Ppto por evento']
const TIPOS_FORMALES = ['Fijo', 'Prestación de servicios']

export const getEstado = (proveedor) => {
  const { tipo, vencimiento } = proveedor
  if (!tipo || tipo === 'Sin contrato') return 'Sin contrato'
  if (TIPOS_ESPORADICO.includes(tipo)) return 'Esporádico'

  if (vencimiento) {
    const dias = getDiasRestantes(vencimiento)
    if (dias < 0) return 'Vencido'
    if (dias <= 60) return 'En revision'
  }

  return 'Firmado'
}

export const getBadgeClass = (estado) => {
  switch (estado) {
    case 'Firmado': return 'badge badge-firmado'
    case 'En revision': return 'badge badge-revision'
    case 'Vencido': return 'badge badge-vencido'
    case 'Esporádico': return 'badge badge-esporadico'
    default: return 'badge badge-sin-contrato'
  }
}

export const getEstadoLabel = (estado) => {
  if (estado === 'En revision') return 'En revisión'
  return estado
}

// Días hasta que vence el plazo de aviso (vencimiento - plazo_aviso meses)
export const getDiasHastaAviso = (proveedor) => {
  if (!proveedor.vencimiento || !proveedor.plazo_aviso) return null
  const venc = parsearFecha(proveedor.vencimiento)
  const fechaAviso = new Date(venc)
  fechaAviso.setMonth(fechaAviso.getMonth() - Number(proveedor.plazo_aviso))
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.ceil((fechaAviso - hoy) / (1000 * 60 * 60 * 24))
}

export const getFechaAviso = (proveedor) => {
  if (!proveedor.vencimiento || !proveedor.plazo_aviso) return null
  const venc = parsearFecha(proveedor.vencimiento)
  const fechaAviso = new Date(venc)
  fechaAviso.setMonth(fechaAviso.getMonth() - Number(proveedor.plazo_aviso))
  return fechaAviso.toISOString().slice(0, 10)
}

// Devuelve grupos de alertas para el dashboard
export const getAlertas = (proveedores) => {
  const vencenEn30 = []
  const vencenEn60 = []
  const vencidos = []
  const sinContrato = []
  const avisoVencido = []   // plazo de aviso ya pasó, contrato aún activo
  const avisoPorVencer = [] // plazo de aviso vence en <= 30 días

  proveedores.forEach((p) => {
    if (!p.tipo || p.tipo === 'Sin contrato' || TIPOS_ESPORADICO.includes(p.tipo)) {
      sinContrato.push(p)
      return
    }
    if (!p.vencimiento) return

    const diasContrato = getDiasRestantes(p.vencimiento)

    // Alertas de vencimiento del contrato
    if (diasContrato < 0) vencidos.push(p)
    else if (diasContrato <= 30) vencenEn30.push(p)
    else if (diasContrato <= 60) vencenEn60.push(p)

    // Alertas de plazo de aviso (solo si contrato aún vigente)
    if (p.plazo_aviso && diasContrato >= 0) {
      const diasAviso = getDiasHastaAviso(p)
      if (diasAviso !== null) {
        if (diasAviso < 0) avisoVencido.push(p)
        else if (diasAviso <= 30) avisoPorVencer.push(p)
      }
    }
  })

  return { vencenEn30, vencenEn60, vencidos, sinContrato, avisoVencido, avisoPorVencer }
}

export const getGasto = (p) => p.gasto_anual || p.valor || 0
