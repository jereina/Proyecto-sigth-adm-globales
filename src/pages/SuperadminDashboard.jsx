import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { EstadoBadge, PrioridadBadge } from '../components/EstadoBadge'

const formateador = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export default function SuperadminDashboard() {
  const [vacantes, setVacantes] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')

    const [{ data: dataVacantes, error: errorVacantes }, { data: dataDeptos, error: errorDeptos }] =
      await Promise.all([
        supabase
          .from('vacantes')
          .select('*, departamento:departamentos(nombre), solicitante:perfiles!solicitado_por(nombre_completo)')
          .order('fecha_solicitud', { ascending: false }),
        supabase.from('departamentos').select('id, nombre').order('nombre'),
      ])

    if (errorVacantes || errorDeptos) {
      setError('No se pudieron cargar las vacantes.')
    } else {
      setVacantes(dataVacantes)
      setDepartamentos(dataDeptos)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const vacantesFiltradas = useMemo(() => {
    return vacantes.filter((v) => {
      const coincideDepto = filtroDepartamento === 'todos' || v.departamento_id === filtroDepartamento
      const coincideEstado = filtroEstado === 'todos' || v.estado === filtroEstado
      return coincideDepto && coincideEstado
    })
  }, [vacantes, filtroDepartamento, filtroEstado])

  return (
    <div className="contenedor-dashboard">
      <div className="cabecera-seccion">
        <div>
          <h2>Todas las vacantes</h2>
          <p className="texto-atenuado">Vista consolidada de Recursos Humanos.</p>
        </div>
      </div>

      <div className="barra-filtros">
        <label>
          Departamento
          <select value={filtroDepartamento} onChange={(e) => setFiltroDepartamento(e.target.value)}>
            <option value="todos">Todos</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Estado
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="abierta">Abierta</option>
            <option value="en_proceso">En proceso</option>
            <option value="cerrada">Cerrada</option>
          </select>
        </label>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando vacantes…</p>
      ) : vacantesFiltradas.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay vacantes que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Solicitado por</th>
                <th>Cantidad</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha de solicitud</th>
              </tr>
            </thead>
            <tbody>
              {vacantesFiltradas.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="celda-principal">{v.cargo}</div>
                    {v.descripcion && <div className="celda-secundaria">{v.descripcion}</div>}
                  </td>
                  <td>{v.departamento?.nombre ?? '—'}</td>
                  <td>{v.solicitante?.nombre_completo ?? '—'}</td>
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
    </div>
  )
}
