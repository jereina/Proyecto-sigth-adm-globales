import { useOutletContext } from 'react-router-dom'
import GerenteDashboard from './GerenteDashboard'
import SuperadminDashboard from './SuperadminDashboard'

export default function VacantesPage() {
  const { perfil, user } = useOutletContext()

  if (perfil.rol === 'superadmin') {
    return <SuperadminDashboard />
  }

  return (
    <GerenteDashboard
      perfil={perfil}
      userId={user.id}
      soloLectura={perfil.rol !== 'gerente'}
    />
  )
}
