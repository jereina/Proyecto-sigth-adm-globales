import { useCallback, useEffect, useState } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ROLES_ASIGNABLES = [
  { value: 'gerente', etiqueta: 'Gerente' },
  { value: 'coordinador', etiqueta: 'Coordinador' },
  { value: 'pendiente', etiqueta: 'Pendiente' },
]

export default function UsuariosPage() {
  const { perfil, user } = useOutletContext()

  const [usuarios, setUsuarios] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [edicion, setEdicion] = useState({})
  const [guardandoId, setGuardandoId] = useState(null)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')

    const [{ data: dataUsuarios, error: errorUsuarios }, { data: dataDeptos, error: errorDeptos }] =
      await Promise.all([
        supabase.from('perfiles').select('*').order('nombre_completo'),
        supabase.from('departamentos').select('id, nombre').order('nombre'),
      ])

    if (errorUsuarios || errorDeptos) {
      setError('No se pudieron cargar los usuarios.')
    } else {
      setUsuarios(dataUsuarios)
      setDepartamentos(dataDeptos)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (perfil.rol !== 'superadmin') {
    return <Navigate to="/vacantes" replace />
  }

  const obtenerValor = (usuario, campo) => {
    const valorEditado = edicion[usuario.id]?.[campo]
    if (valorEditado !== undefined) return valorEditado
    return usuario[campo] ?? ''
  }

  const handleCambio = (usuario, campo, valor) => {
    setEdicion((prev) => ({
      ...prev,
      [usuario.id]: {
        rol: prev[usuario.id]?.rol ?? usuario.rol,
        departamento_id: prev[usuario.id]?.departamento_id ?? (usuario.departamento_id ?? ''),
        [campo]: valor,
      },
    }))
  }

  const estaModificado = (usuario) => {
    const cambios = edicion[usuario.id]
    if (!cambios) return false
    const departamentoOriginal = usuario.departamento_id ?? ''
    return cambios.rol !== usuario.rol || cambios.departamento_id !== departamentoOriginal
  }

  const handleGuardar = async (usuario) => {
    const cambios = edicion[usuario.id]
    if (!cambios) return

    setGuardandoId(usuario.id)
    setError('')

    const { error } = await supabase
      .from('perfiles')
      .update({
        rol: cambios.rol,
        departamento_id: cambios.departamento_id ? cambios.departamento_id : null,
      })
      .eq('id', usuario.id)

    setGuardandoId(null)

    if (error) {
      setError('No se pudo actualizar el usuario. Intenta de nuevo.')
      return
    }

    setEdicion((prev) => {
      const copia = { ...prev }
      delete copia[usuario.id]
      return copia
    })
    cargarDatos()
  }

  return (
    <div className="contenedor-dashboard">
      <div className="cabecera-seccion">
        <div>
          <h2>Gestión de usuarios</h2>
          <p className="texto-atenuado">
            Asigna rol y departamento a cada usuario. Las filas resaltadas están pendientes de activación.
          </p>
        </div>
      </div>

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando usuarios…</p>
      ) : usuarios.length === 0 ? (
        <div className="estado-vacio">
          <p>No hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Rol</th>
                <th>Departamento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const esSuperadmin = usuario.rol === 'superadmin'
                const esUsuarioActual = usuario.id === user.id
                const modificado = estaModificado(usuario)

                return (
                  <tr key={usuario.id} className={usuario.rol === 'pendiente' ? 'fila-pendiente' : ''}>
                    <td>
                      <div className="celda-principal">{usuario.nombre_completo || 'Sin nombre'}</div>
                      {esUsuarioActual && <div className="celda-secundaria">Tú</div>}
                    </td>
                    <td>
                      {esSuperadmin ? (
                        <span className="badge badge-superadmin">Superadmin</span>
                      ) : (
                        <select
                          value={obtenerValor(usuario, 'rol')}
                          onChange={(e) => handleCambio(usuario, 'rol', e.target.value)}
                        >
                          {ROLES_ASIGNABLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.etiqueta}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {esSuperadmin ? (
                        <span className="texto-atenuado">—</span>
                      ) : (
                        <select
                          value={obtenerValor(usuario, 'departamento_id')}
                          onChange={(e) => handleCambio(usuario, 'departamento_id', e.target.value)}
                        >
                          <option value="">Sin asignar</option>
                          {departamentos.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {!esSuperadmin && (
                        <button
                          className="boton boton-primario"
                          disabled={!modificado || guardandoId === usuario.id}
                          onClick={() => handleGuardar(usuario)}
                        >
                          {guardandoId === usuario.id ? 'Guardando…' : 'Guardar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
