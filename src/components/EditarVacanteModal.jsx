import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { verificarYResolverPrioridadAlta } from '../lib/prioridadAlta'

export default function EditarVacanteModal({ vacante, onClose, onGuardada }) {
  const [cargos, setCargos] = useState([])
  const [cargandoCargos, setCargandoCargos] = useState(true)
  const [cargoId, setCargoId] = useState('')
  const [cantidad, setCantidad] = useState(vacante.cantidad)
  const [prioridad, setPrioridad] = useState(vacante.prioridad)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true

    supabase
      .from('cargos')
      .select('id, nombre, descripcion')
      .eq('departamento_id', vacante.departamento_id)
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo) return
        if (!error) {
          setCargos(data)
          const cargoActual = data.find((c) => c.nombre === vacante.cargo)
          if (cargoActual) setCargoId(String(cargoActual.id))
        }
        setCargandoCargos(false)
      })

    return () => {
      activo = false
    }
  }, [vacante.departamento_id, vacante.cargo])

  const cargoSeleccionado = cargos.find((c) => String(c.id) === cargoId)
  const sinCargos = !cargandoCargos && cargos.length === 0
  const descripcionMostrada = cargoSeleccionado?.descripcion ?? vacante.descripcion ?? ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!cargoSeleccionado) {
      setError('Selecciona un cargo de la lista.')
      return
    }

    setEnviando(true)

    const resultado = await verificarYResolverPrioridadAlta({
      prioridad,
      departamentoId: vacante.departamento_id,
      vacanteIdActual: vacante.id,
    })

    if (!resultado.continuar) {
      if (resultado.error) setError(resultado.error)
      setEnviando(false)
      return
    }

    const { error } = await supabase
      .from('vacantes')
      .update({
        cargo: cargoSeleccionado.nombre,
        descripcion: cargoSeleccionado.descripcion,
        cantidad: Number(cantidad),
        prioridad,
      })
      .eq('id', vacante.id)

    setEnviando(false)

    if (error) {
      setError('No se pudo guardar la vacante. Intenta de nuevo.')
      return
    }

    onGuardada()
  }

  return (
    <div className="fondo-modal" onClick={onClose}>
      <div className="tarjeta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cabecera-modal">
          <h2>Editar vacante</h2>
          <button className="boton-cerrar" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="formulario">
          <label>
            Cargo
            <select
              required
              value={cargoId}
              onChange={(e) => setCargoId(e.target.value)}
              disabled={cargandoCargos || sinCargos}
            >
              <option value="" disabled>
                {cargandoCargos ? 'Cargando cargos…' : 'Selecciona un cargo'}
              </option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          {sinCargos && (
            <p className="mensaje-error">
              Este departamento ya no tiene cargos disponibles en "Descripción de cargo". Crea uno antes
              de guardar los cambios.
            </p>
          )}

          <label>
            Cantidad de vacantes
            <input
              type="number"
              min={1}
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </label>

          <label>
            Prioridad
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>

          <label>
            Descripción
            <textarea
              rows={4}
              value={descripcionMostrada}
              readOnly
              placeholder="Selecciona un cargo para ver su descripción"
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}

          <div className="acciones-modal">
            <button type="button" className="boton boton-secundario" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={enviando || sinCargos}>
              {enviando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
