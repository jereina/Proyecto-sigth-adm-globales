const ETIQUETAS_ESTADO = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  cerrada: 'Cerrada',
}

const ETIQUETAS_PRIORIDAD = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export function EstadoBadge({ estado }) {
  return <span className={`badge badge-estado-${estado}`}>{ETIQUETAS_ESTADO[estado] ?? estado}</span>
}

export function PrioridadBadge({ prioridad }) {
  return <span className={`badge badge-prioridad-${prioridad}`}>{ETIQUETAS_PRIORIDAD[prioridad] ?? prioridad}</span>
}
