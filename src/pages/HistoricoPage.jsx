import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'cvs'
const URL_EXPIRACION_SEGUNDOS = 60 * 60
const formateador = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

export default function HistoricoPage() {
  const { perfil } = useOutletContext()
  const esSuperadmin = perfil.rol === 'superadmin'

  const [vacantes, setVacantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [abriendoId, setAbriendoId] = useState(null)

  const cargarHistorico = useCallback(async () => {
    setCargando(true)
    setError('')

    const columnas = esSuperadmin
      ? '*, departamento:departamentos(nombre), contratado:candidatos!vacantes_contratado_fk(nombre, cv_path)'
      : '*, contratado:candidatos!vacantes_contratado_fk(nombre, cv_path)'

    const { data, error } = await supabase
      .from('vacantes')
      .select(columnas)
      .eq('estado', 'cerrada')
      .not('fecha_contratacion', 'is', null)
      .order('fecha_contratacion', { ascending: false })

    if (error) {
      setError('No se pudo cargar el histórico.')
    } else {
      setVacantes(data)
    }
    setCargando(false)
  }, [esSuperadmin])

  useEffect(() => {
    cargarHistorico()
  }, [cargarHistorico])

  const handleVerCV = async (vacante) => {
    const rutaCV = vacante.contratado?.cv_path
    if (!rutaCV) return

    setAbriendoId(vacante.id)
    setError('')

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(rutaCV, URL_EXPIRACION_SEGUNDOS)

    setAbriendoId(null)

    if (error) {
      setError('No se pudo abrir el CV.')
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="contenedor-dashboard">
      <div className="cabecera-seccion">
        <div>
          <h2>Histórico de contrataciones</h2>
          <p className="texto-atenuado">
            {esSuperadmin
              ? 'Vacantes cerradas por contratación en todos los departamentos.'
              : 'Vacantes cerradas por contratación en tu departamento.'}
          </p>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando histórico…</p>
      ) : vacantes.length === 0 ? (
        <div className="estado-vacio">
          <p>Aún no hay contrataciones registradas.</p>
        </div>
      ) : (
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cargo</th>
                {esSuperadmin && <th>Departamento</th>}
                <th>Contratado</th>
                <th>Fecha de contratación</th>
                <th>CV</th>
              </tr>
            </thead>
            <tbody>
              {vacantes.map((v) => (
                <tr key={v.id}>
                  <td className="celda-principal">{v.cargo}</td>
                  {esSuperadmin && <td>{v.departamento?.nombre ?? '—'}</td>}
                  <td>{v.contratado?.nombre ?? '—'}</td>
                  <td>{formateador.format(new Date(v.fecha_contratacion))}</td>
                  <td>
                    {v.contratado?.cv_path ? (
                      <button
                        className="boton boton-secundario"
                        disabled={abriendoId === v.id}
                        onClick={() => handleVerCV(v)}
                      >
                        {abriendoId === v.id ? 'Abriendo…' : 'Ver CV'}
                      </button>
                    ) : (
                      <span className="texto-atenuado">Sin CV</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
