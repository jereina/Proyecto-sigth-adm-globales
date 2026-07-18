import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import CargoModal from '../components/CargoModal'

export default function CargosPage() {
  const { perfil } = useOutletContext()
  const esGerente = perfil.rol === 'gerente'
  const esSuperadmin = perfil.rol === 'superadmin'

  const [cargos, setCargos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargoEnEdicion, setCargoEnEdicion] = useState(null)

  const cargarCargos = useCallback(async () => {
    setCargando(true)
    setError('')

    const consulta = esSuperadmin
      ? supabase.from('cargos').select('*, departamento:departamentos(nombre)').order('nombre')
      : supabase.from('cargos').select('*').order('nombre')

    const { data, error } = await consulta

    if (error) {
      setError('No se pudieron cargar los cargos.')
    } else {
      setCargos(data)
    }
    setCargando(false)
  }, [esSuperadmin])

  useEffect(() => {
    cargarCargos()
  }, [cargarCargos])

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
              ? 'Cargos definidos en todos los departamentos.'
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

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando cargos…</p>
      ) : cargos.length === 0 ? (
        <div className="estado-vacio">
          <p>Aún no hay cargos registrados.</p>
        </div>
      ) : (
        <div className="grid-cargos">
          {cargos.map((cargo) => (
            <div className="tarjeta-cargo" key={cargo.id}>
              <div className="cabecera-tarjeta-cargo">
                <h3>{cargo.nombre}</h3>
                {esSuperadmin && cargo.departamento?.nombre && (
                  <span className="badge badge-departamento">{cargo.departamento.nombre}</span>
                )}
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
