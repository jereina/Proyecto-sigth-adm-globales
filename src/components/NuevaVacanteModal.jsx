import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function NuevaVacanteModal({ departamentoId, solicitadoPor, onClose, onCreada }) {
  const [cargos, setCargos] = useState([])
  const [cargandoCargos, setCargandoCargos] = useState(true)
  const [cargoId, setCargoId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [prioridad, setPrioridad] = useState('media')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true

    supabase
      .from('cargos')
      .select('id, nombre, descripcion')
      .eq('departamento_id', departamentoId)
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo) return
        if (!error) setCargos(data)
        setCargandoCargos(false)
      })

    return () => {
      activo = false
    }
  }, [departamentoId])

  const cargoSeleccionado = cargos.find((c) => String(c.id) === cargoId)
  const sinCargos = !cargandoCargos && cargos.length === 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!cargoSeleccionado) {
      setError('Selecciona un cargo de la lista.')
      return
    }

    setEnviando(true)

    if (prioridad === 'alta') {
      const { data: vacantesAltaActivas, error: errorConsulta } = await supabase
        .from('vacantes')
        .select('id, cargo')
        .eq('departamento_id', departamentoId)
        .eq('prioridad', 'alta')
        .in('estado', ['abierta', 'en_proceso'])

      if (errorConsulta) {
        setError('No se pudo verificar la prioridad del departamento. Intenta de nuevo.')
        setEnviando(false)
        return
      }

      if (vacantesAltaActivas && vacantesAltaActivas.length > 0) {
        const vacanteAltaActual = vacantesAltaActivas[0]
        const confirmado = window.confirm(
          `Tu departamento ya tiene una vacante en prioridad Alta: "${vacanteAltaActual.cargo}". Solo puede haber una prioridad Alta activa a la vez. ¿Deseas reemplazarla? La vacante anterior pasará a prioridad Media.`,
        )

        if (!confirmado) {
          setEnviando(false)
          return
        }

        const { error: errorDegradar } = await supabase
          .from('vacantes')
          .update({ prioridad: 'media' })
          .in('id', vacantesAltaActivas.map((v) => v.id))

        if (errorDegradar) {
          setError('No se pudo actualizar la vacante anterior. Intenta de nuevo.')
          setEnviando(false)
          return
        }
      }
    }

    const { error } = await supabase.from('vacantes').insert({
      cargo: cargoSeleccionado.nombre,
      departamento_id: departamentoId,
      descripcion: cargoSeleccionado.descripcion,
      cantidad: Number(cantidad),
      prioridad,
      solicitado_por: solicitadoPor,
    })

    setEnviando(false)

    if (error) {
      setError('No se pudo enviar la solicitud. Intenta de nuevo.')
      return
    }

    onCreada()
  }

  return (
    <div className="fondo-modal" onClick={onClose}>
      <div className="tarjeta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cabecera-modal">
          <h2>Nueva solicitud de vacante</h2>
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
              Aún no has creado cargos para tu departamento. Ve a "Descripción de cargo" para crear uno
              antes de publicar una vacante.
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
              value={cargoSeleccionado?.descripcion ?? ''}
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
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
