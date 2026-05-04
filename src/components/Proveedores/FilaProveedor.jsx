import { getEstado, getBadgeClass, getEstadoLabel, formatearMoneda, formatearFecha, getDiasRestantes, getDiasHastaAviso, getGasto } from '../../utils/formatters'

function AvisoChip({ proveedor }) {
  const dias = getDiasHastaAviso(proveedor)
  if (dias === null) return null

  let texto, clase
  if (dias < 0) {
    texto = `Aviso vencido (${proveedor.plazo_aviso}m)`
    clase = 'aviso-chip aviso-chip-rojo'
  } else if (dias <= 30) {
    texto = `Avisar en ${dias}d`
    clase = 'aviso-chip aviso-chip-amarillo'
  } else {
    texto = `Aviso: ${proveedor.plazo_aviso} mes${proveedor.plazo_aviso > 1 ? 'es' : ''}`
    clase = 'aviso-chip aviso-chip-gris'
  }

  return <span className={clase}>{texto}</span>
}

function IconEditar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconEliminar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

export default function FilaProveedor({ proveedor, onEditar, onEliminar, onVerDetalle }) {
  const p = proveedor
  const estado = getEstado(p)
  const gasto = getGasto(p)

  const dias = p.vencimiento ? getDiasRestantes(p.vencimiento) : null
  const colorVenc = dias === null ? '' : dias < 0 ? 'venc-rojo' : dias <= 30 ? 'venc-rojo' : dias <= 60 ? 'venc-amarillo' : ''

  const handleEliminar = async () => {
    if (window.confirm(`¿Eliminar a "${p.nombre}"? Esta acción no se puede deshacer.`)) {
      await onEliminar(p.id)
    }
  }

  return (
    <tr>
      <td>
        <div className="tabla-nombre tabla-nombre-link" onClick={() => onVerDetalle(p)}>{p.nombre}</div>
        {p.servicio && <div className="tabla-servicio">{p.servicio}</div>}
      </td>
      <td>
        <div className="tabla-contacto">{p.contacto || '—'}</div>
        {p.telefono && <div className="tabla-telefono">{p.telefono}</div>}
        {p.email && (
          <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(p.email)}`} target="_blank" rel="noreferrer" className="tabla-email" title={p.email}>
            {p.email}
          </a>
        )}
      </td>
      <td>
        <span className="pais-chip">{p.pais === 'Chile' ? '🇨🇱' : '🇦🇷'} {p.pais}</span>
      </td>
      <td>{p.categoria || '—'}</td>
      <td>{p.tipo || '—'}</td>
      <td>
        <span className={getBadgeClass(estado)}>{getEstadoLabel(estado)}</span>
      </td>
      <td className={`tabla-vencimiento ${colorVenc}`}>
        {p.vencimiento ? formatearFecha(p.vencimiento) : '—'}
        {p.plazo_aviso && p.vencimiento && (
          <AvisoChip proveedor={p} />
        )}
      </td>
      <td className="tabla-gasto">
        {gasto > 0 ? formatearMoneda(gasto, p.pais) : '—'}
      </td>
      <td>
        <div className="acciones">
          <button className="btn btn-icon btn-secondary" onClick={() => onEditar(p)} title="Editar">
            <IconEditar />
          </button>
          <button className="btn btn-icon btn-danger" onClick={handleEliminar} title="Eliminar">
            <IconEliminar />
          </button>
        </div>
      </td>
    </tr>
  )
}
