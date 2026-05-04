import { useState } from 'react'

const calcularFechaAviso = (vencimiento, meses) => {
  if (!vencimiento || !meses) return ''
  const [y, m, d] = vencimiento.split('-').map(Number)
  const fecha = new Date(y, m - 1 - Number(meses), d)
  return fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const TIPOS_CONTRATO = ['', 'Fijo', 'Esporádico', 'Sin contrato', 'Ppto por evento', 'Prestación de servicios']
const FRECUENCIAS = ['', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Por evento']

const VACIO = {
  nombre: '',
  pais: '',
  categoria: '',
  tipo: '',
  servicio: '',
  contacto: '',
  telefono: '',
  email: '',
  vencimiento: '',
  plazo_aviso: '',
  valor: '',
  gasto_anual: '',
  ocs: '',
  rango_facturacion: '',
  frecuencia: '',
  notas: '',
}

export default function FormularioProveedor({ proveedor, onGuardar, onCancelar }) {
  const esEdicion = Boolean(proveedor)

  const [form, setForm] = useState(() => {
    if (!proveedor) return VACIO
    return {
      nombre: proveedor.nombre || '',
      pais: proveedor.pais || '',
      categoria: proveedor.categoria || '',
      tipo: proveedor.tipo || '',
      servicio: proveedor.servicio || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      vencimiento: proveedor.vencimiento || '',
      plazo_aviso: proveedor.plazo_aviso ?? '',
      valor: proveedor.valor ?? '',
      gasto_anual: proveedor.gasto_anual ?? '',
      ocs: proveedor.ocs ?? '',
      rango_facturacion: proveedor.rango_facturacion || '',
      frecuencia: proveedor.frecuencia || '',
      notas: proveedor.notas || '',
    }
  })

  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState(null)

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const tieneContrato = form.tipo && form.tipo !== 'Sin contrato'
  const esContratoFijo = form.tipo === 'Fijo'
  const moneda = form.pais === 'Chile' ? 'CLP' : form.pais === 'Argentina' ? 'ARS' : ''
  const telPlaceholder = form.pais === 'Chile' ? '+56 9 XXXX XXXX' : form.pais === 'Argentina' ? '+54 11 XXXX XXXX' : 'Teléfono'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorForm(null)

    if (!form.nombre.trim()) { setErrorForm('El nombre del proveedor es obligatorio.'); return }
    if (!form.pais) { setErrorForm('Selecciona el país.'); return }

    setGuardando(true)
    try {
      await onGuardar(form)
    } catch (err) {
      setErrorForm(err.message || 'Error al guardar. Intentá de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div className="page-content">
      <div className="form-page">
        <button type="button" className="form-back" onClick={onCancelar}>← Volver</button>
        <div className="form-titulo">
          {esEdicion ? `Editar proveedor` : 'Nuevo proveedor'}
        </div>
        <div className="form-sub">
          {esEdicion ? `Modificando: ${proveedor.nombre}` : 'Completá los datos del nuevo proveedor'}
        </div>

        {errorForm && <div className="form-error">{errorForm}</div>}

        <form onSubmit={handleSubmit}>
          {/* Sección: Datos básicos */}
          <div className="form-section">
            <div className="form-section-title">Datos básicos</div>
            <div className="form-grid">
              <div className="form-group form-full">
                <label>Nombre del proveedor <span className="req">*</span></label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Empresa de Seguridad SA"
                />
              </div>

              <div className="form-group">
                <label>País <span className="req">*</span></label>
                <select value={form.pais} onChange={e => set('pais', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="Chile">🇨🇱 Chile</option>
                  <option value="Argentina">🇦🇷 Argentina</option>
                </select>
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="HR">HR</option>
                  <option value="Facilities">Facilities</option>
                </select>
              </div>

              <div className="form-group form-full">
                <label>Servicio / descripción</label>
                <input
                  type="text"
                  value={form.servicio}
                  onChange={e => set('servicio', e.target.value)}
                  placeholder="Ej: Limpieza de oficinas, Seguridad, Beneficios..."
                />
              </div>
            </div>
          </div>

          {/* Sección: Contacto */}
          <div className="form-section">
            <div className="form-section-title">Contacto</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Persona de contacto</label>
                <input
                  type="text"
                  value={form.contacto}
                  onChange={e => set('contacto', e.target.value)}
                  placeholder="Nombre del contacto"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value)}
                  placeholder={telPlaceholder}
                />
              </div>

              <div className="form-group form-full">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Sección: Contrato */}
          <div className="form-section">
            <div className="form-section-title">Contrato</div>
            <div className="form-grid">
              <div className="form-group form-full">
                <label>Tipo de contrato</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  {TIPOS_CONTRATO.map(t => (
                    <option key={t} value={t}>{t || 'Seleccionar...'}</option>
                  ))}
                </select>
              </div>

              {tieneContrato && (
                <div className="form-group">
                  <label>Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={form.vencimiento}
                    onChange={e => set('vencimiento', e.target.value)}
                  />
                </div>
              )}

              {tieneContrato && (
                <div className="form-group">
                  <label>Plazo de aviso (meses)</label>
                  <input
                    type="number"
                    value={form.plazo_aviso}
                    onChange={e => set('plazo_aviso', e.target.value)}
                    placeholder="Ej: 3"
                    min="0"
                    max="24"
                  />
                  <span className="form-hint">
                    Meses antes del vencimiento que hay que avisar para no renovar
                    {form.plazo_aviso && form.vencimiento
                      ? ` — Avisar antes del ${calcularFechaAviso(form.vencimiento, form.plazo_aviso)}`
                      : ''}
                  </span>
                </div>
              )}

              {esContratoFijo && (
                <div className="form-group">
                  <label>Valor del contrato {moneda && `(${moneda})`}</label>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => set('valor', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sección: Información financiera */}
          <div className="form-section">
            <div className="form-section-title">Información financiera</div>
            <div className="form-grid cols-3">
              <div className="form-group">
                <label>Gasto anual histórico {moneda && `(${moneda})`}</label>
                <input
                  type="number"
                  value={form.gasto_anual}
                  onChange={e => set('gasto_anual', e.target.value)}
                  placeholder="0"
                  min="0"
                />
                <span className="form-hint">Acumulado histórico, no mensual</span>
              </div>

              <div className="form-group">
                <label>OCs emitidas (2024-2026)</label>
                <input
                  type="number"
                  value={form.ocs}
                  onChange={e => set('ocs', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Rango de facturación</label>
                <input
                  type="text"
                  value={form.rango_facturacion}
                  onChange={e => set('rango_facturacion', e.target.value)}
                  placeholder="Ej: 1M–5M"
                />
              </div>

              <div className="form-group">
                <label>Frecuencia de pago</label>
                <select value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)}>
                  {FRECUENCIAS.map(f => (
                    <option key={f} value={f}>{f || 'Seleccionar...'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="form-section">
            <div className="form-section-title">Notas</div>
            <div className="form-group">
              <textarea
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
                placeholder="Observaciones, comentarios adicionales..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
