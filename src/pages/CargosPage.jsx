import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import CargoModal from '../components/CargoModal'

export default function CargosPage() {
  const { perfil } = useOutletContext()
  const esGerente = perfil.rol === 'gerente'
  const esSuperadmin = perfil.rol === 'superadmin'

  const [cargos, setCargos] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargoEnEdicion, setCargoEnEdicion] = useState(null)

  const cargarCargos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error } = await supabase.from('cargos').select('*').order('nombre')

    if (error) {
      setError('No se pudieron cargar los cargos.')
    } else {
      setCargos(data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarCargos()
  }, [cargarCargos])

  useEffect(() => {
    if (!esSuperadmin) return
    let activo = true

    supabase
      .from('departamentos')
      .select('id, nombre')
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo || error) return
        setDepartamentos(data)
      })

    return () => {
      activo = false
    }
  }, [esSuperadmin])

  const conteoPorDepartamento = useMemo(() => {
    const mapa = {}
    cargos.forEach((cargo) => {
      mapa[cargo.departamento_id] = (mapa[cargo.departamento_id] ?? 0) + 1
    })
    return mapa
  }, [cargos])

  const cargosVisibles = esSuperadmin
    ? cargos.filter((cargo) => String(cargo.departamento_id) === departamentoSeleccionado)
    : cargos

  const handleEliminar = async (cargo) => {
    const confirmado = window.confirm(`¿Eliminar el cargo "${cargo.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmado) return

    const { error } = await supabase.from('cargos').delete().eq('id', cargo.id)

    if (error) {
      setError('No se pudo eliminar el cargo.')
      return
    }

    cargarCargos()
  }

  return (
    <div className="contenedor-dashboard">
      <div className="cabecera-seccion">
        <div>
          <h2>Descripción de cargo</h2>
          <p className="texto-atenuado">
            {esSuperadmin
              ? 'Selecciona un departamento para ver sus cargos.'
              : 'Cargos definidos para tu departamento.'}
          </p>
        </div>
        {esGerente && (
          <button
            className="boton boton-primario"
            onClick={() => {
              setCargoEnEdicion(null)
              setModalAbierto(true)
            }}
          >
            + Nuevo cargo
          </button>
        )}
      </div>

      {esSuperadmin && (
        <div className="barra-filtros">
          <label>
            Departamento
            <select
              value={departamentoSeleccionado}
              onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
            >
              <option value="">Selecciona un departamento</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({conteoPorDepartamento[d.id] ?? 0})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando cargos…</p>
      ) : esSuperadmin && !departamentoSeleccionado ? (
        <div className="estado-vacio">
          <p>Selecciona un departamento para ver sus cargos.</p>
        </div>
      ) : cargosVisibles.length === 0 ? (
        <div className="estado-vacio">
          <p>
            {esSuperadmin
              ? 'Este departamento aún no tiene cargos definidos.'
              : 'Aún no hay cargos registrados.'}
          </p>
        </div>
      ) : (
        <div className="grid-cargos">
          {cargosVisibles.map((cargo) => (
            <div className="tarjeta-cargo" key={cargo.id}>
              <div className="cabecera-tarjeta-cargo">
                <h3>{cargo.nombre}</h3>
              </div>
              <p className="descripcion-cargo">{cargo.descripcion || 'Sin descripción.'}</p>
              {esGerente && (
                <div className="acciones-tarjeta-cargo">
                  <button
                    className="boton boton-secundario"
                    onClick={() => {
                      setCargoEnEdicion(cargo)
                      setModalAbierto(true)
                    }}
                  >
                    Editar
                  </button>
                  <button className="boton boton-peligro" onClick={() => handleEliminar(cargo)}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <CargoModal
          departamentoId={perfil.departamento_id}
          cargo={cargoEnEdicion}
          onClose={() => setModalAbierto(false)}
          onGuardado={() => {
            setModalAbierto(false)
            cargarCargos()
          }}
        />
      )}
    </div>
  )
}
