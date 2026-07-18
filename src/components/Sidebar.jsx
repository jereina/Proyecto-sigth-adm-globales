import { NavLink } from 'react-router-dom'

const SECCIONES = [
  { to: '/vacantes', etiqueta: 'Vacantes', icono: '📋' },
  { to: '/cargos', etiqueta: 'Descripción de cargo', icono: '🗂️' },
]

export default function Sidebar() {
  return (
    <nav className="barra-lateral">
      <ul className="lista-lateral">
        {SECCIONES.map((seccion) => (
          <li key={seccion.to}>
            <NavLink
              to={seccion.to}
              className={({ isActive }) =>
                isActive ? 'enlace-lateral enlace-lateral-activo' : 'enlace-lateral'
              }
            >
              <span className="icono-lateral" aria-hidden="true">{seccion.icono}</span>
              {seccion.etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
