import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function NuevaVacanteModal({ departamentoId, solicitadoPor, onClose, onCreada }) {
  const [cargo, setCargo] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    const { error } = await supabase.from('vacantes').insert({
      cargo,
      departamento_id: departamentoId,
      descripcion,
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
            <input
              type="text"
              required
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej. Analista de Sistemas"
            />
          </label>

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
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalla el perfil y las responsabilidades del cargo"
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}

          <div className="acciones-modal">
            <button type="button" className="boton boton-secundario" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
