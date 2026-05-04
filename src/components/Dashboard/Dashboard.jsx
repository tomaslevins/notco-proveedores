import KPICards from './KPICards'
import AlertasVencimiento from './AlertasVencimiento'
import Graficos from './Graficos'

export default function Dashboard({ proveedores, setVista }) {
  return (
    <div className="page-content">
      <KPICards proveedores={proveedores} />
      <AlertasVencimiento proveedores={proveedores} />
      <Graficos proveedores={proveedores} />
    </div>
  )
}
