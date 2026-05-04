import { useState } from 'react'
import { getAlertas, formatearFecha, getDiasRestantes, getDiasHastaAviso, getFechaAviso } from '../../utils/formatters'

function AlertaItem({ p, tipo }) {
  const dias = getDiasRestantes(p.vencimiento)
  const colorDias = tipo === 'vencido' ? 'rojo' : tipo === '30' ? 'rojo' : 'amarillo'

  let diasTexto = ''
  if (tipo === 'vencido') diasTexto = dias !== null ? `Venció hace ${Math.abs(dias)} días` : 'Vencido'
  else if (dias === null) diasTexto = 'Sin fecha'
  else if (dias === 0) diasTexto = 'Vence hoy'
  else diasTexto = `Vence en ${dias} días`

  return (
    <li className="alerta-item">
      <div className="alerta-item-left">
        <span className="alerta-nombre">{p.nombre}</span>
        <span className="alerta-meta">
          {p.pais} · {p.categoria} · {p.vencimiento ? formatearFecha(p.vencimiento) : 'Sin fecha'}
        </span>
      </div>
      <span className={`alerta-dias ${colorDias}`}>{diasTexto}</span>
    </li>
  )
}

function AlertaAvisoItem({ p, tipo }) {
  const diasAviso = getDiasHastaAviso(p)
  const fechaAviso = getFechaAviso(p)
  const colorDias = tipo === 'aviso-vencido' ? 'rojo' : 'amarillo'

  let diasTexto = ''
  if (tipo === 'aviso-vencido') {
    diasTexto = diasAviso !== null ? `Plazo venció hace ${Math.abs(diasAviso)} días` : 'Plazo vencido'
  } else {
    diasTexto = diasAviso === 0 ? 'Avisar hoy' : `Avisar en ${diasAviso} días`
  }

  return (
    <li className="alerta-item">
      <div className="alerta-item-left">
        <span className="alerta-nombre">{p.nombre}</span>
        <span className="alerta-meta">
          {p.pais} · Aviso: {p.plazo_aviso} {p.plazo_aviso === 1 ? 'mes' : 'meses'} antes
          {fechaAviso ? ` · Fecha límite: ${formatearFecha(fechaAviso)}` : ''}
        </span>
      </div>
      <span className={`alerta-dias ${colorDias}`}>{diasTexto}</span>
    </li>
  )
}

function AlertaGrupo({ titulo, items, colorHeader, tipo, colapsable }) {
  const [abierto, setAbierto] = useState(!colapsable)
  if (items.length === 0) return null
  const esAviso = tipo === 'aviso-vencido' || tipo === 'aviso-pronto'

  return (
    <div className="alerta-card">
      <div className={`alerta-header ${colorHeader}`} onClick={colapsable ? () => setAbierto(v => !v) : undefined} style={colapsable ? { cursor: 'pointer' } : {}}>
        <span>{titulo}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>{items.length}</span>
          {colapsable && <span style={{ fontSize: 11 }}>{abierto ? '▲' : '▼'}</span>}
        </span>
      </div>
      {abierto && (
        <ul className="alerta-lista">
          {items.map(p =>
            esAviso
              ? <AlertaAvisoItem key={p.id} p={p} tipo={tipo} />
              : <AlertaItem key={p.id} p={p} tipo={tipo} />
          )}
        </ul>
      )}
    </div>
  )
}

export default function AlertasVencimiento({ proveedores }) {
  const { vencenEn30, vencenEn60, vencidos, sinContrato, avisoVencido, avisoPorVencer } = getAlertas(proveedores)
  const total = vencenEn30.length + vencenEn60.length + vencidos.length + sinContrato.length + avisoVencido.length + avisoPorVencer.length

  return (
    <div className="alertas-section">
      <h2 className="dashboard-section-title">Alertas</h2>

      {total === 0 ? (
        <div className="sin-alertas">Sin alertas pendientes. Todo en orden.</div>
      ) : (
        <>
          <AlertaGrupo titulo="Contratos vencidos" items={vencidos} colorHeader="rojo" tipo="vencido" />
          <AlertaGrupo titulo="Plazo de aviso ya vencido — hay que actuar ahora" items={avisoVencido} colorHeader="rojo" tipo="aviso-vencido" />
          <AlertaGrupo titulo="Vencen en menos de 30 días" items={vencenEn30} colorHeader="rojo" tipo="30" />
          <AlertaGrupo titulo="Plazo de aviso vence en menos de 30 días" items={avisoPorVencer} colorHeader="amarillo" tipo="aviso-pronto" />
          <AlertaGrupo titulo="Vencen entre 30 y 60 días" items={vencenEn60} colorHeader="amarillo" tipo="60" />
          <AlertaGrupo titulo="Sin contrato formal" items={sinContrato} colorHeader="gris" tipo="sin" colapsable />
        </>
      )}
    </div>
  )
}
