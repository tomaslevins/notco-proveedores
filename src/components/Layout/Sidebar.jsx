const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
  </svg>
)

const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="1" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <line x1="7.5" y1="1" x2="7.5" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const NotCoLogo = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <line x1="2" y1="2" x2="28" y2="28" stroke="black" strokeWidth="5" strokeLinecap="round"/>
    <line x1="28" y1="2" x2="2" y2="28" stroke="black" strokeWidth="5" strokeLinecap="round"/>
  </svg>
)

export default function Sidebar({ vistaActual, setVista, onNuevo }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <NotCoLogo />
        <span className="sidebar-logo-text">NotCo</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${vistaActual === 'dashboard' ? 'active' : ''}`}
          onClick={() => setVista('dashboard')}
        >
          <IconDashboard />
          Dashboard
        </button>

        <button
          className={`nav-item ${vistaActual === 'lista' ? 'active' : ''}`}
          onClick={() => setVista('lista')}
        >
          <IconList />
          Proveedores
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-nuevo" onClick={onNuevo}>
          <IconPlus />
          Nuevo proveedor
        </button>
      </div>
    </aside>
  )
}
