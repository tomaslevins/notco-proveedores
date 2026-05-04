import { getEstado, getBadgeClass, getEstadoLabel, formatearMoneda, formatearFecha, getDiasRestantes, getDiasHastaAviso, getFechaAviso, getGasto } from '../../utils/formatters'

function Campo({ label, valor, sub }) {
  if (!valor && !sub) return null
  return (
    <div className="detalle-campo">
      <div className="detalle-campo-label">{label}</div>
      {valor && <div className="detalle-campo-valor">{valor}</div>}
      {sub && <div className="detalle-campo-sub">{sub}</div>}
    </div>
  )
}

export default function DetalleProveedor({ proveedor: p, onCerrar, onEditar }) {
  const estado = getEstado(p)
  const gasto = getGasto(p)
  const diasVenc = p.vencimiento ? getDiasRestantes(p.vencimiento) : null
  const diasAviso = getDiasHastaAviso(p)
  const fechaAviso = getFechaAviso(p)

  const diasVencTexto = diasVenc === null ? null
    : diasVenc < 0 ? `Venció hace ${Math.abs(diasVenc)} días`
    : diasVenc === 0 ? 'Vence hoy'
    : `Vence en ${diasVenc} días`

  const diasAvisoTexto = diasAviso === null ? null
    : diasAviso < 0 ? `Plazo venció hace ${Math.abs(diasAviso)} días`
    : diasAviso === 0 ? 'Avisar hoy'
    : `En ${diasAviso} días`

  return (
    <>
      <div className="detalle-overlay" onClick={onCerrar} />
      <div className="detalle-panel">
        <div className="detalle-header">
          <div className="detalle-header-info">
            <div className="detalle-nombre">{p.nombre}</div>
            <div className="detalle-meta">
              {p.pais === 'Chile' ? '🇨🇱' : '🇦🇷'} {p.pais}
              {p.categoria ? ` · ${p.categoria}` : ''}
            </div>
          </div>
          <button className="detalle-cerrar" onClick={onCerrar} title="Cerrar">✕</button>
        </div>

        <div className="detalle-body">
          <div className="detalle-estado-row">
            <span className={getBadgeClass(estado)}>{getEstadoLabel(estado)}</span>
          </div>

          {p.servicio && <Campo label="Servicio" valor={p.servicio} />}

          <div className="detalle-divider" />

          <div className="detalle-campo">
            <div className="detalle-campo-label">Contacto</div>
            {p.contacto && <div className="detalle-campo-valor">{p.contacto}</div>}
            {p.telefono && <div className="detalle-campo-sub">{p.telefono}</div>}
            {p.email && (
              <a
                href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(p.email)}`}
                target="_blank"
                rel="noreferrer"
                className="detalle-email"
              >
                {p.email}
              </a>
            )}
            {!p.contacto && !p.telefono && !p.email && <div className="detalle-campo-sub">—</div>}
          </div>

          <div className="detalle-divider" />

          <Campo label="Tipo de contrato" valor={p.tipo || '—'} />

          {p.vencimiento && (
            <div className="detalle-campo">
              <div className="detalle-campo-label">Vencimiento</div>
              <div className="detalle-campo-valor">{formatearFecha(p.vencimiento)}</div>
              {diasVencTexto && (
                <div className={`detalle-campo-sub ${diasVenc !== null && diasVenc <= 60 ? 'detalle-alerta' : ''}`}>
                  {diasVencTexto}
                </div>
              )}
            </div>
          )}

          {p.plazo_aviso && fechaAviso && (
            <div className="detalle-campo">
              <div className="detalle-campo-label">Plazo de aviso</div>
              <div className="detalle-campo-valor">{p.plazo_aviso} {p.plazo_aviso === 1 ? 'mes' : 'meses'} antes del vencimiento</div>
              <div className="detalle-campo-sub">Fecha límite para avisar: {formatearFecha(fechaAviso)}</div>
              {diasAvisoTexto && (
                <div className={`detalle-campo-sub ${diasAviso !== null && diasAviso <= 30 ? 'detalle-alerta' : ''}`}>
                  {diasAvisoTexto}
                </div>
              )}
            </div>
          )}

          {(gasto > 0 || p.frecuencia || p.ocs || p.rango_facturacion) && (
            <>
              <div className="detalle-divider" />
              {gasto > 0 && <Campo label="Gasto anual" valor={formatearMoneda(gasto, p.pais)} />}
              {p.frecuencia && <Campo label="Frecuencia de pago" valor={p.frecuencia} />}
              {p.ocs > 0 && <Campo label="OCs emitidas" valor={`${p.ocs} órdenes`} />}
              {p.rango_facturacion && <Campo label="Rango de facturación" valor={p.rango_facturacion} />}
            </>
          )}

          {p.notas && (
            <>
              <div className="detalle-divider" />
              <div className="detalle-campo">
                <div className="detalle-campo-label">Notas</div>
                <div className="detalle-campo-valor detalle-notas">{p.notas}</div>
              </div>
            </>
          )}
        </div>

        <div className="detalle-footer">
          <button className="btn btn-primary" onClick={() => { onCerrar(); onEditar(p) }}>Editar proveedor</button>
          <button className="btn btn-secondary" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </>
  )
}
