import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EstadoBadge, PrioridadBadge } from '../components/EstadoBadge'
import NuevaVacanteModal from '../components/NuevaVacanteModal'

const formateador = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export default function GerenteDashboard({ perfil, userId }) {
  const [vacantes, setVacantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  const cargarVacantes = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error } = await supabase
      .from('vacantes')
      .select('*')
      .order('fecha_solicitud', { ascending: false })

    if (error) {
      setError('No se pudieron cargar las vacantes.')
    } else {
      setVacantes(data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarVacantes()
  }, [cargarVacantes])

  return (
    <div className="contenedor-dashboard">
      <div className="cabecera-seccion">
        <div>
          <h2>Vacantes de mi departamento</h2>
          <p className="texto-atenuado">Solicitudes registradas para tu área.</p>
        </div>
        <button className="boton boton-primario" onClick={() => setModalAbierto(true)}>
          + Nueva solicitud de vacante
        </button>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando vacantes…</p>
      ) : vacantes.length === 0 ? (
        <div className="estado-vacio">
          <p>Aún no has registrado solicitudes de vacante.</p>
        </div>
      ) : (
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Cantidad</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha de solicitud</th>
              </tr>
            </thead>
            <tbody>
              {vacantes.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="celda-principal">{v.cargo}</div>
                    {v.descripcion && <div className="celda-secundaria">{v.descripcion}</div>}
                  </td>
                  <td>{v.cantidad}</td>
                  <td><PrioridadBadge prioridad={v.prioridad} /></td>
                  <td><EstadoBadge estado={v.estado} /></td>
                  <td>{formateador.format(new Date(v.fecha_solicitud))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <NuevaVacanteModal
          departamentoId={perfil.departamento_id}
          solicitadoPor={userId}
          onClose={() => setModalAbierto(false)}
          onCreada={() => {
            setModalAbierto(false)
            cargarVacantes()
          }}
        />
      )}
    </div>
  )
}
