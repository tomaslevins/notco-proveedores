const vistaTitulos = {
  dashboard: { titulo: 'Dashboard', sub: 'Visión ejecutiva de proveedores' },
  lista: { titulo: 'Proveedores', sub: 'Gestión y seguimiento de contratos' },
  formulario: { titulo: 'Proveedor', sub: null },
}

export default function Header({ vista, tituloFormulario }) {
  const info = vistaTitulos[vista] || vistaTitulos.dashboard
  const titulo = vista === 'formulario' ? tituloFormulario : info.titulo

  return (
    <header className="header">
      <div>
        <div className="header-title">{titulo}</div>
        {info.sub && vista !== 'formulario' && (
          <div className="header-sub">{info.sub}</div>
        )}
      </div>
    </header>
  )
}
