import { useState } from 'react'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Dashboard from './components/Dashboard/Dashboard'
import ListaProveedores from './components/Proveedores/ListaProveedores'
import FormularioProveedor from './components/Formulario/FormularioProveedor'
import DetalleProveedor from './components/Proveedores/DetalleProveedor'
import { useProveedores } from './hooks/useProveedores'

export default function App() {
  const [vista, setVista] = useState('dashboard')
  const [proveedorEditar, setProveedorEditar] = useState(null)
  const [proveedorDetalle, setProveedorDetalle] = useState(null)

  const { proveedores, loading, error, crear, actualizar, eliminar } = useProveedores()

  const irAEditar = (proveedor) => {
    setProveedorEditar(proveedor)
    setVista('formulario')
  }

  const irACrear = () => {
    setProveedorEditar(null)
    setVista('formulario')
  }

  const guardar = async (datos) => {
    if (proveedorEditar) {
      await actualizar(proveedorEditar.id, datos)
    } else {
      await crear(datos)
    }
    setVista('lista')
  }

  const cancelar = () => {
    setVista('lista')
    setProveedorEditar(null)
  }

  const tituloFormulario = proveedorEditar
    ? `Editar: ${proveedorEditar.nombre}`
    : 'Nuevo proveedor'

  return (
    <div className="app-container">
      <Sidebar vistaActual={vista} setVista={setVista} onNuevo={irACrear} />

      <div className="main-content">
        <Header vista={vista} tituloFormulario={tituloFormulario} />

        {loading && (
          <div className="loading-state">
            <span>Cargando proveedores...</span>
          </div>
        )}

        {error && (
          <div className="error-state">
            Error al conectar con Supabase: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {vista === 'dashboard' && (
              <Dashboard proveedores={proveedores} setVista={setVista} />
            )}
            {vista === 'lista' && (
              <ListaProveedores
                proveedores={proveedores}
                onEditar={irAEditar}
                onEliminar={eliminar}
                irACrear={irACrear}
                onVerDetalle={setProveedorDetalle}
              />
            )}
            {vista === 'formulario' && (
              <FormularioProveedor
                proveedor={proveedorEditar}
                onGuardar={guardar}
                onCancelar={cancelar}
              />
            )}
          </>
        )}
      </div>

      {proveedorDetalle && (
        <DetalleProveedor
          proveedor={proveedorDetalle}
          onCerrar={() => setProveedorDetalle(null)}
          onEditar={irAEditar}
        />
      )}
    </div>
  )
}
