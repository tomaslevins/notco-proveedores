import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre')

    if (error) {
      setError(error.message)
    } else {
      setProveedores(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = async (datos) => {
    const { error } = await supabase.from('proveedores').insert([limpiarDatos(datos)])
    if (error) throw error
    await cargar()
  }

  const actualizar = async (id, datos) => {
    const { error } = await supabase
      .from('proveedores')
      .update(limpiarDatos(datos))
      .eq('id', id)
    if (error) throw error
    await cargar()
  }

  const eliminar = async (id) => {
    const { error } = await supabase.from('proveedores').delete().eq('id', id)
    if (error) throw error
    await cargar()
  }

  return { proveedores, loading, error, crear, actualizar, eliminar, refrescar: cargar }
}

// Convierte strings vacíos a null y parsea numéricos
function limpiarDatos(datos) {
  const limpio = { ...datos }
  Object.keys(limpio).forEach((k) => {
    if (limpio[k] === '') limpio[k] = null
  })
  if (limpio.valor !== null) limpio.valor = limpio.valor ? Number(limpio.valor) : null
  if (limpio.gasto_anual !== null) limpio.gasto_anual = limpio.gasto_anual ? Number(limpio.gasto_anual) : null
  if (limpio.ocs !== null) limpio.ocs = limpio.ocs ? Number(limpio.ocs) : null
  return limpio
}
