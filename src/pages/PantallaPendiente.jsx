import { useAuth } from '../context/AuthContext'

export default function PantallaPendiente() {
  const { signOut } = useAuth()

  return (
    <div className="pantalla-auth">
      <div className="tarjeta-auth tarjeta-pendiente">
        <div className="marca-auth">
          <h1>SIGTH</h1>
          <p>ADM Globales 7480 · Gestión de vacantes</p>
        </div>

        <div className="icono-pendiente" aria-hidden="true">⏳</div>

        <h2>Cuenta pendiente de activación</h2>
        <p className="texto-atenuado texto-centrado">
          Tu cuenta está pendiente de activación. Recursos Humanos debe asignarte un rol
          y un departamento antes de que puedas ingresar al sistema.
        </p>

        <button className="boton boton-secundario" onClick={signOut}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
