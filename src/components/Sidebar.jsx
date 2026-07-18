import { NavLink } from 'react-router-dom'

const SECCIONES = [
  { to: '/vacantes', etiqueta: 'Vacantes', icono: '📋', roles: ['superadmin', 'gerente', 'coordinador'] },
  { to: '/cargos', etiqueta: 'Descripción de cargo', icono: '🗂️', roles: ['superadmin', 'gerente', 'coordinador'] },
  { to: '/organigrama', etiqueta: 'Organigrama', icono: '🏢', roles: ['superadmin', 'gerente', 'coordinador'] },
  { to: '/usuarios', etiqueta: 'Gestión de usuarios', icono: '👥', roles: ['superadmin'] },
]

export default function Sidebar({ rol }) {
  const secciones = SECCIONES.filter((seccion) => seccion.roles.includes(rol))

  return (
    <nav className="barra-lateral">
      <ul className="lista-lateral">
        {secciones.map((seccion) => (
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
