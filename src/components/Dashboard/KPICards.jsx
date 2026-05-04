import { getEstado, getGasto, formatearMonedaCorta } from '../../utils/formatters'

export default function KPICards({ proveedores }) {
  const total = proveedores.length
  const chileProvs = proveedores.filter(p => p.pais === 'Chile')
  const argProvs = proveedores.filter(p => p.pais === 'Argentina')

  const gastoChile = chileProvs.reduce((sum, p) => sum + getGasto(p), 0)
  const gastoArg = argProvs.reduce((sum, p) => sum + getGasto(p), 0)

  const conContrato = proveedores.filter(p => {
    const e = getEstado(p)
    return e === 'Firmado' || e === 'En revision'
  }).length

  const esporadicos = proveedores.filter(p => getEstado(p) === 'Esporádico').length

  const alertas = proveedores.filter(p => {
    const e = getEstado(p)
    return e === 'Vencido' || e === 'En revision'
  }).length

  const sinContrato = proveedores.filter(p => getEstado(p) === 'Sin contrato').length

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">Total proveedores</div>
        <div className="kpi-valor">{total}</div>
        <div className="kpi-sub">Chile + Argentina</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">🇨🇱 Chile</div>
        <div className="kpi-valor">{chileProvs.length}</div>
        <div className="kpi-sub">{gastoChile > 0 ? `${formatearMonedaCorta(gastoChile)} gasto anual` : 'proveedores activos'}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">🇦🇷 Argentina</div>
        <div className="kpi-valor">{argProvs.length}</div>
        <div className="kpi-sub">{gastoArg > 0 ? `${formatearMonedaCorta(gastoArg)} gasto anual` : 'proveedores activos'}</div>
      </div>

      <div className="kpi-card positivo">
        <div className="kpi-label">Con contrato formal</div>
        <div className="kpi-valor">{conContrato}</div>
        <div className="kpi-sub">
          {proveedores.filter(p => { const e = getEstado(p); return (e === 'Firmado' || e === 'En revision') && p.pais === 'Chile' }).length} Chile
          · {proveedores.filter(p => { const e = getEstado(p); return (e === 'Firmado' || e === 'En revision') && p.pais === 'Argentina' }).length} Argentina
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Esporádicos / por evento</div>
        <div className="kpi-valor">{esporadicos}</div>
        <div className="kpi-sub">sin contrato fijo</div>
      </div>

      <div className={`kpi-card ${alertas > 0 ? 'alerta' : ''}`}>
        <div className="kpi-label">Requieren atención</div>
        <div className="kpi-valor">{alertas}</div>
        <div className="kpi-sub">{sinContrato} sin contrato formal</div>
      </div>
    </div>
  )
}
