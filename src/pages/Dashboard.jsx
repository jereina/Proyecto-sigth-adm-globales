import { useAuth } from '../context/AuthContext'
import GerenteDashboard from './GerenteDashboard'
import SuperadminDashboard from './SuperadminDashboard'

export default function Dashboard() {
  const { user, perfil, signOut } = useAuth()

  if (!perfil) {
    return (
      <div className="pantalla-carga">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="encabezado">
        <div className="marca-encabezado">
          <span className="marca-titulo">SIGTH</span>
          <span className="marca-subtitulo">ADM Globales 7480</span>
        </div>

        <div className="usuario-encabezado">
          <div className="info-usuario">
            <span className="nombre-usuario">{perfil.nombre_completo}</span>
            <span className="rol-usuario">
              {perfil.rol === 'superadmin' ? 'Recursos Humanos' : 'Gerente de departamento'}
            </span>
          </div>
          <button className="boton boton-secundario" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="contenido-principal">
        {perfil.rol === 'superadmin' ? (
          <SuperadminDashboard />
        ) : (
          <GerenteDashboard perfil={perfil} userId={user.id} />
        )}
      </main>
    </div>
  )
}
