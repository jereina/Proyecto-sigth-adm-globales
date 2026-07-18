import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const navigate = useNavigate()
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setCargando(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre_completo: nombreCompleto },
      },
    })

    setCargando(false)

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este correo ya está registrado.'
        : 'No se pudo completar el registro. Intenta de nuevo.')
      return
    }

    if (data.session) {
      navigate('/', { replace: true })
      return
    }

    setMensaje('Registro exitoso. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.')
  }

  return (
    <div className="pantalla-auth">
      <div className="tarjeta-auth">
        <div className="marca-auth">
          <h1>SIGTH</h1>
          <p>ADM Globales 7480 · Gestión de vacantes</p>
        </div>

        <h2>Crear cuenta</h2>

        <form onSubmit={handleSubmit} className="formulario">
          <label>
            Nombre completo
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej. María Fernanda López"
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}
          {mensaje && <p className="mensaje-exito">{mensaje}</p>}

          <button type="submit" className="boton boton-primario" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="enlace-secundario">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
