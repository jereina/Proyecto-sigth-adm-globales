import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

const ETIQUETAS_ROL = {
  superadmin: 'Recursos Humanos',
  gerente: 'Gerente de departamento',
  coordinador: 'Coordinador',
}

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
            <span className="rol-usuario">{ETIQUETAS_ROL[perfil.rol] ?? perfil.rol}</span>
          </div>
          <button className="boton boton-secundario" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="cuerpo-app">
        <Sidebar />

        <main className="contenido-principal">
          <Outlet context={{ perfil, user }} />
        </main>
      </div>
    </div>
  )
}
