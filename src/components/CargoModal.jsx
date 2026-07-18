import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CargoModal({ departamentoId, cargo, onClose, onGuardado }) {
  const esEdicion = Boolean(cargo)
  const [nombre, setNombre] = useState(cargo?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(cargo?.descripcion ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    const { error } = esEdicion
      ? await supabase.from('cargos').update({ nombre, descripcion }).eq('id', cargo.id)
      : await supabase.from('cargos').insert({ nombre, descripcion, departamento_id: departamentoId })

    setEnviando(false)

    if (error) {
      setError('No se pudo guardar el cargo. Intenta de nuevo.')
      return
    }

    onGuardado()
  }

  return (
    <div className="fondo-modal" onClick={onClose}>
      <div className="tarjeta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cabecera-modal">
          <h2>{esEdicion ? 'Editar cargo' : 'Nuevo cargo'}</h2>
          <button className="boton-cerrar" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="formulario">
          <label>
            Nombre del cargo
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Analista de Sistemas"
            />
          </label>

          <label>
            Descripción
            <textarea
              rows={5}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe las funciones y responsabilidades de este cargo"
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}

          <div className="acciones-modal">
            <button type="button" className="boton boton-secundario" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
