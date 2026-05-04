import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import FilaProveedor from './FilaProveedor'
import { getEstado, getEstadoLabel, getGasto, formatearFecha, getDiasHastaAviso } from '../../utils/formatters'

function SortableHeader({ label, campo, sortConfig, onSort }) {
  const activo = sortConfig.key === campo
  const icono = activo ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''
  return (
    <th
      className={`sortable ${activo ? 'sort-activo' : ''}`}
      onClick={() => onSort(campo)}
      title={`Ordenar por ${label}`}
    >
      {label}{icono || ' ↕'}
    </th>
  )
}

function tieneAlerta(p) {
  const e = getEstado(p)
  if (e === 'Vencido' || e === 'En revision') return true
  const diasAviso = getDiasHastaAviso(p)
  if (diasAviso !== null && diasAviso <= 30) return true
  return false
}

export default function ListaProveedores({ proveedores, onEditar, onEliminar, irACrear, onVerDetalle }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroPais, setFiltroPais] = useState('Todos')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' })

  const handleSort = (campo) => {
    setSortConfig(prev =>
      prev.key === campo
        ? { key: campo, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key: campo, direction: 'asc' }
    )
  }

  const filtrados = useMemo(() => {
    return proveedores.filter(p => {
      if (filtroPais !== 'Todos' && p.pais !== filtroPais) return false
      if (filtroCategoria !== 'Todas' && p.categoria !== filtroCategoria) return false
      if (filtroEstado !== 'Todos' && getEstado(p) !== filtroEstado) return false
      if (soloAlertas && !tieneAlerta(p)) return false

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        return (
          p.nombre?.toLowerCase().includes(q) ||
          p.servicio?.toLowerCase().includes(q) ||
          p.contacto?.toLowerCase().includes(q) ||
          p.categoria?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [proveedores, busqueda, filtroPais, filtroCategoria, filtroEstado, soloAlertas])

  const ordenados = useMemo(() => {
    const { key, direction } = sortConfig
    return [...filtrados].sort((a, b) => {
      let va, vb
      if (key === 'gasto_anual') {
        va = getGasto(a)
        vb = getGasto(b)
      } else {
        va = a[key] ?? ''
        vb = b[key] ?? ''
      }
      if (typeof va === 'number' || typeof vb === 'number') {
        va = Number(va) || 0
        vb = Number(vb) || 0
      } else {
        va = va.toString().toLowerCase()
        vb = vb.toString().toLowerCase()
      }
      if (va < vb) return direction === 'asc' ? -1 : 1
      if (va > vb) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filtrados, sortConfig])

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroPais('Todos')
    setFiltroCategoria('Todas')
    setFiltroEstado('Todos')
    setSoloAlertas(false)
  }

  const hayFiltros = busqueda || filtroPais !== 'Todos' || filtroCategoria !== 'Todas' || filtroEstado !== 'Todos' || soloAlertas

  const cantAlertas = useMemo(() => proveedores.filter(tieneAlerta).length, [proveedores])

  const exportarExcel = () => {
    const headers = ['Nombre', 'País', 'Categoría', 'Tipo contrato', 'Servicio', 'Contacto', 'Teléfono', 'Email', 'Estado', 'Vencimiento', 'Gasto anual', 'OCs', 'Notas']
    const rows = ordenados.map(p => [
      p.nombre,
      p.pais,
      p.categoria,
      p.tipo,
      p.servicio,
      p.contacto,
      p.telefono,
      p.email,
      getEstadoLabel(getEstado(p)),
      p.vencimiento ? formatearFecha(p.vencimiento) : '',
      getGasto(p) || '',
      p.ocs || '',
      p.notas,
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores')
    XLSX.writeFile(wb, `proveedores-notco-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="page-content">
      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre, servicio, contacto, email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        <select className="filter-select" value={filtroPais} onChange={e => setFiltroPais(e.target.value)}>
          <option value="Todos">País: Todos</option>
          <option value="Chile">🇨🇱 Chile</option>
          <option value="Argentina">🇦🇷 Argentina</option>
        </select>

        <select className="filter-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="Todas">Categoría: Todas</option>
          <option value="HR">HR</option>
          <option value="Facilities">Facilities</option>
        </select>

        <select className="filter-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="Todos">Estado: Todos</option>
          <option value="Firmado">Firmado</option>
          <option value="En revision">En revisión</option>
          <option value="Vencido">Vencido</option>
          <option value="Sin contrato">Sin contrato</option>
        </select>

        <button
          className={`btn ${soloAlertas ? 'btn-alerta-activo' : 'btn-ghost'}`}
          onClick={() => setSoloAlertas(v => !v)}
          title="Mostrar solo proveedores con alertas activas"
        >
          ⚠ Con alertas {cantAlertas > 0 && `(${cantAlertas})`}
        </button>

        {hayFiltros && (
          <button className="btn btn-ghost" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}

        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={exportarExcel} title="Exportar lista actual a Excel">
            ↓ Exportar Excel
          </button>
          <button className="btn btn-primary" onClick={irACrear}>
            + Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="results-count">
        {ordenados.length} de {proveedores.length} proveedores
      </div>

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <SortableHeader label="Proveedor"     campo="nombre"      sortConfig={sortConfig} onSort={handleSort} />
              <th>Contacto</th>
              <SortableHeader label="País"          campo="pais"        sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Categoría"     campo="categoria"   sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Tipo contrato" campo="tipo"        sortConfig={sortConfig} onSort={handleSort} />
              <th>Estado</th>
              <SortableHeader label="Vencimiento"   campo="vencimiento" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Gasto anual"   campo="gasto_anual" sortConfig={sortConfig} onSort={handleSort} />
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.length === 0 ? (
              <tr>
                <td colSpan={9} className="tabla-empty">
                  No se encontraron proveedores con esos filtros.
                </td>
              </tr>
            ) : (
              ordenados.map(p => (
                <FilaProveedor
                  key={p.id}
                  proveedor={p}
                  onEditar={onEditar}
                  onEliminar={onEliminar}
                  onVerDetalle={onVerDetalle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
