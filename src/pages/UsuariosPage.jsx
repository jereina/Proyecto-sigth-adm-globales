import { useCallback, useEffect, useState } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ROLES_ASIGNABLES = [
  { value: 'gerente', etiqueta: 'Gerente' },
  { value: 'coordinador', etiqueta: 'Coordinador' },
  { value: 'pendiente', etiqueta: 'Pendiente' },
]

const OPCIONES_FILTRO_ROL = [
  { value: 'todos', etiqueta: 'Todos' },
  { value: 'gerente', etiqueta: 'Gerente' },
  { value: 'coordinador', etiqueta: 'Coordinador' },
  { value: 'pendiente', etiqueta: 'Pendiente' },
  { value: 'superadmin', etiqueta: 'Superadmin' },
]

async function extraerMensajeError(error, mensajePorDefecto) {
  if (!error) return mensajePorDefecto

  if (typeof error.context?.json === 'function') {
    try {
      const cuerpo = await error.context.json()
      if (cuerpo?.error) return cuerpo.error
    } catch {
      // El cuerpo de la respuesta no era JSON legible; se usa el mensaje por defecto.
    }
  }

  return error.message || mensajePorDefecto
}

export default function UsuariosPage() {
  const { perfil, user } = useOutletContext()

  const [usuarios, setUsuarios] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [edicion, setEdicion] = useState({})
  const [guardandoId, setGuardandoId] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const [filtroRol, setFiltroRol] = useState('todos')

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
    return cambios.rol !== usuario.rol || String(cambios.departamento_id) !== String(departamentoOriginal)
  }

  const handleGuardar = async (usuario) => {
    const cambios = edicion[usuario.id]
    if (!cambios) return

    setGuardandoId(usuario.id)
    setError('')
    setMensajeExito('')

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

  const handleEliminar = async (usuario) => {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar a ${usuario.nombre_completo || 'este usuario'}? Esta acción no se puede deshacer.`,
    )
    if (!confirmado) return

    setEliminandoId(usuario.id)
    setError('')
    setMensajeExito('')

    const { data, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { user_id: usuario.id },
    })

    setEliminandoId(null)

    if (error || data?.error) {
      const mensaje = error
        ? await extraerMensajeError(error, 'No se pudo eliminar el usuario. Intenta de nuevo.')
        : data.error
      setError(mensaje)
      return
    }

    setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id))
    setEdicion((prev) => {
      const copia = { ...prev }
      delete copia[usuario.id]
      return copia
    })
    setMensajeExito(`Usuario "${usuario.nombre_completo || ''}" eliminado correctamente.`)
  }

  const usuariosFiltrados =
    filtroRol === 'todos' ? usuarios : usuarios.filter((usuario) => usuario.rol === filtroRol)

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

      <div className="barra-filtros">
        <label>
          Rol
          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            {OPCIONES_FILTRO_ROL.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mensaje-error">{error}</p>}
      {mensajeExito && <p className="mensaje-exito">{mensajeExito}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando usuarios…</p>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="estado-vacio">
          <p>{usuarios.length === 0 ? 'No hay usuarios registrados.' : 'No hay usuarios con este rol.'}</p>
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
              {usuariosFiltrados.map((usuario) => {
                const esSuperadminFila = usuario.rol === 'superadmin'
                const esUsuarioActual = usuario.id === user.id
                const modificado = estaModificado(usuario)

                return (
                  <tr key={usuario.id} className={usuario.rol === 'pendiente' ? 'fila-pendiente' : ''}>
                    <td>
                      <div className="celda-principal">{usuario.nombre_completo || 'Sin nombre'}</div>
                      {esUsuarioActual && <div className="celda-secundaria">Tú</div>}
                    </td>
                    <td>
                      {esSuperadminFila ? (
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
                      {esSuperadminFila ? (
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
                      <div className="acciones-fila">
                        {!esSuperadminFila && (
                          <button
                            className="boton boton-primario"
                            disabled={!modificado || guardandoId === usuario.id}
                            onClick={() => handleGuardar(usuario)}
                          >
                            {guardandoId === usuario.id ? 'Guardando…' : 'Guardar'}
                          </button>
                        )}
                        {!esUsuarioActual && (
                          <button
                            className="boton boton-peligro"
                            disabled={eliminandoId === usuario.id}
                            onClick={() => handleEliminar(usuario)}
                          >
                            {eliminandoId === usuario.id ? 'Eliminando…' : 'Eliminar'}
                          </button>
                        )}
                      </div>
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
