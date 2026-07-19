import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'cvs'
const URL_EXPIRACION_SEGUNDOS = 60 * 60

export default function CandidatosModal({ vacante, onClose, onEnviado }) {
  const [candidatos, setCandidatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [nota, setNota] = useState('')
  const [comentario, setComentario] = useState('')
  const [contacto, setContacto] = useState('')
  const [agregando, setAgregando] = useState(false)
  const inputArchivoRef = useRef(null)

  const [eliminandoId, setEliminandoId] = useState(null)
  const [abriendoId, setAbriendoId] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(Boolean(vacante.candidatos_enviados))

  const cargarCandidatos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante.id)
      .order('created_at', { ascending: true })

    if (error) {
      setError('No se pudieron cargar los candidatos.')
    } else {
      setCandidatos(data)
    }
    setCargando(false)
  }, [vacante.id])

  useEffect(() => {
    cargarCandidatos()
  }, [cargarCandidatos])

  const limpiarFormulario = () => {
    setNombre('')
    setNota('')
    setComentario('')
    setContacto('')
    if (inputArchivoRef.current) inputArchivoRef.current.value = ''
  }

  const handleAgregar = async (e) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim()) {
      setError('El nombre del candidato es obligatorio.')
      return
    }

    setAgregando(true)

    let cvPath = null
    const archivo = inputArchivoRef.current?.files?.[0]

    if (archivo) {
      const rutaArchivo = `${vacante.id}/${Date.now()}-${archivo.name}`
      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(rutaArchivo, archivo, { contentType: archivo.type || 'application/pdf' })

      if (errorSubida) {
        setError('No se pudo subir el CV. Intenta de nuevo.')
        setAgregando(false)
        return
      }
      cvPath = rutaArchivo
    }

    const { error: errorInsertar } = await supabase.from('candidatos').insert({
      vacante_id: vacante.id,
      nombre: nombre.trim(),
      nota: nota === '' ? null : Number(nota),
      comentario: comentario.trim() || null,
      contacto: contacto.trim() || null,
      cv_path: cvPath,
    })

    setAgregando(false)

    if (errorInsertar) {
      setError('No se pudo registrar el candidato. Intenta de nuevo.')
      return
    }

    limpiarFormulario()
    cargarCandidatos()
  }

  const handleEliminar = async (candidato) => {
    const confirmado = window.confirm(
      `¿Eliminar al candidato "${candidato.nombre}"? Esta acción no se puede deshacer.`,
    )
    if (!confirmado) return

    setEliminandoId(candidato.id)
    setError('')

    const { error } = await supabase.from('candidatos').delete().eq('id', candidato.id)

    if (error) {
      setError('No se pudo eliminar el candidato.')
      setEliminandoId(null)
      return
    }

    if (candidato.cv_path) {
      await supabase.storage.from(BUCKET).remove([candidato.cv_path])
    }

    setEliminandoId(null)
    cargarCandidatos()
  }

  const handleVerCV = async (candidato) => {
    if (!candidato.cv_path) return

    setAbriendoId(candidato.id)
    setError('')

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(candidato.cv_path, URL_EXPIRACION_SEGUNDOS)

    setAbriendoId(null)

    if (error) {
      setError('No se pudo abrir el CV.')
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const handleEnviar = async () => {
    const confirmado = window.confirm('¿Enviar la lista de candidatos al gerente? Podrá verla en su panel.')
    if (!confirmado) return

    setEnviando(true)
    setError('')

    const { error } = await supabase
      .from('vacantes')
      .update({ candidatos_enviados: true })
      .eq('id', vacante.id)

    setEnviando(false)

    if (error) {
      setError('No se pudo enviar la lista de candidatos.')
      return
    }

    setEnviado(true)
    onEnviado(vacante.id)
  }

  return (
    <div className="fondo-modal" onClick={onClose}>
      <div className="tarjeta-modal tarjeta-modal-ancha" onClick={(e) => e.stopPropagation()}>
        <div className="cabecera-modal">
          <div>
            <h2>Candidatos — {vacante.cargo}</h2>
            <p className="texto-atenuado">
              {vacante.departamento?.nombre ? `${vacante.departamento.nombre} · ` : ''}
              {candidatos.length} candidato{candidatos.length === 1 ? '' : 's'} registrado
              {candidatos.length === 1 ? '' : 's'}
            </p>
          </div>
          <button className="boton-cerrar" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        <form onSubmit={handleAgregar} className="formulario">
          <div className="fila-formulario">
            <label>
              Nombre
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del candidato"
              />
            </label>
            <label>
              Nota (1-10)
              <input
                type="number"
                min={0}
                max={10}
                step="0.1"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. 8.5"
              />
            </label>
          </div>

          <label>
            Contacto
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Correo o teléfono"
            />
          </label>

          <label>
            Comentario
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Observaciones sobre el candidato"
            />
          </label>

          <label>
            CV (PDF)
            <input type="file" accept="application/pdf" ref={inputArchivoRef} />
          </label>

          <div className="acciones-modal">
            <button type="submit" className="boton boton-primario" disabled={agregando}>
              {agregando ? 'Agregando…' : '+ Agregar candidato'}
            </button>
          </div>
        </form>

        <div className="separador-modal" />

        {cargando ? (
          <p className="texto-atenuado">Cargando candidatos…</p>
        ) : candidatos.length === 0 ? (
          <div className="estado-vacio">
            <p>Aún no hay candidatos registrados para esta vacante.</p>
          </div>
        ) : (
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Nota</th>
                  <th>Contacto</th>
                  <th>Comentario</th>
                  <th>CV</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {candidatos.map((c) => (
                  <tr key={c.id}>
                    <td className="celda-principal">{c.nombre}</td>
                    <td>{c.nota ?? '—'}</td>
                    <td>{c.contacto || '—'}</td>
                    <td className="celda-secundaria">{c.comentario || '—'}</td>
                    <td>
                      {c.cv_path ? (
                        <button
                          className="boton boton-secundario"
                          disabled={abriendoId === c.id}
                          onClick={() => handleVerCV(c)}
                        >
                          {abriendoId === c.id ? 'Abriendo…' : 'Ver CV'}
                        </button>
                      ) : (
                        <span className="texto-atenuado">Sin CV</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="boton boton-peligro"
                        disabled={eliminandoId === c.id}
                        onClick={() => handleEliminar(c)}
                      >
                        {eliminandoId === c.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pie-modal-candidatos">
          {enviado ? (
            <span className="badge badge-estado-abierta">Candidatos enviados al gerente</span>
          ) : (
            <button
              className="boton boton-primario"
              disabled={enviando || candidatos.length === 0}
              onClick={handleEnviar}
            >
              {enviando ? 'Enviando…' : 'Enviar candidatos al gerente'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
