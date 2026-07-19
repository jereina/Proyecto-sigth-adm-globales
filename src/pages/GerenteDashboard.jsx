import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EstadoBadge, PrioridadBadge } from '../components/EstadoBadge'
import NuevaVacanteModal from '../components/NuevaVacanteModal'
import VerCandidatosModal from '../components/VerCandidatosModal'
import VacanteDetalleModal from '../components/VacanteDetalleModal'
import { ordenarVacantesPorPrioridad } from '../lib/ordenVacantes'

const formateador = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export default function GerenteDashboard({ perfil, userId, soloLectura = false }) {
  const esGerente = !soloLectura

  const [vacantes, setVacantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [vacanteDetalle, setVacanteDetalle] = useState(null)
  const [vacanteCandidatos, setVacanteCandidatos] = useState(null)

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
      // Las vacantes cerradas por contratación pasan a "Histórico" y ya no viven aquí.
      const activas = data.filter((v) => !(v.estado === 'cerrada' && v.fecha_contratacion))
      setVacantes(ordenarVacantesPorPrioridad(activas))
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
        {!soloLectura && (
          <button className="boton boton-primario" onClick={() => setModalAbierto(true)}>
            + Nueva solicitud de vacante
          </button>
        )}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vacantes.map((v) => (
                <tr key={v.id}>
                  <td className="celda-principal">{v.cargo}</td>
                  <td>{v.cantidad}</td>
                  <td><PrioridadBadge prioridad={v.prioridad} /></td>
                  <td><EstadoBadge estado={v.estado} /></td>
                  <td>{formateador.format(new Date(v.fecha_solicitud))}</td>
                  <td>
                    <button className="boton boton-secundario" onClick={() => setVacanteDetalle(v)}>
                      Ver detalle
                    </button>
                  </td>
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

      {vacanteDetalle && (
        <VacanteDetalleModal
          vacante={vacanteDetalle}
          onClose={() => setVacanteDetalle(null)}
          onVerCandidatos={
            esGerente && vacanteDetalle.candidatos_enviados
              ? () => {
                  setVacanteCandidatos(vacanteDetalle)
                  setVacanteDetalle(null)
                }
              : undefined
          }
        />
      )}

      {vacanteCandidatos && (
        <VerCandidatosModal
          vacante={vacanteCandidatos}
          onClose={() => setVacanteCandidatos(null)}
          onContratado={() => {
            setVacanteCandidatos(null)
            cargarVacantes()
          }}
        />
      )}
    </div>
  )
}
