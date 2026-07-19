import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'cvs'
const URL_EXPIRACION_SEGUNDOS = 60 * 60

export default function VerCandidatosModal({ vacante, onClose, onContratado }) {
  const [candidatos, setCandidatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [abriendoId, setAbriendoId] = useState(null)
  const [contratandoId, setContratandoId] = useState(null)

  const cargarCandidatos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante.id)
      .order('nota', { ascending: false, nullsFirst: false })

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

  const handleContratar = async (candidato) => {
    const confirmado = window.confirm(
      `¿Contratar a ${candidato.nombre}? La vacante se cerrará y pasará al histórico.`,
    )
    if (!confirmado) return

    setContratandoId(candidato.id)
    setError('')

    const { error } = await supabase
      .from('vacantes')
      .update({
        estado: 'cerrada',
        contratado_candidato_id: candidato.id,
        fecha_contratacion: new Date().toISOString(),
      })
      .eq('id', vacante.id)

    setContratandoId(null)

    if (error) {
      setError('No se pudo registrar la contratación. Intenta de nuevo.')
      return
    }

    onContratado()
  }

  return (
    <div className="fondo-modal" onClick={onClose}>
      <div className="tarjeta-modal tarjeta-modal-ancha" onClick={(e) => e.stopPropagation()}>
        <div className="cabecera-modal">
          <div>
            <h2>Candidatos — {vacante.cargo}</h2>
            <p className="texto-atenuado">
              {candidatos.length} candidato{candidatos.length === 1 ? '' : 's'} recibido
              {candidatos.length === 1 ? '' : 's'}
            </p>
          </div>
          <button className="boton-cerrar" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {error && <p className="mensaje-error">{error}</p>}

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
                        className="boton boton-primario"
                        disabled={contratandoId === c.id}
                        onClick={() => handleContratar(c)}
                      >
                        {contratandoId === c.id ? 'Procesando…' : 'Contratar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
