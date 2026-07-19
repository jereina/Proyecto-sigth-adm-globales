const RANGO_PRIORIDAD = { alta: 0, media: 1, baja: 2 }

export function ordenarVacantesPorPrioridad(vacantes) {
  return [...vacantes].sort((a, b) => {
    const rangoA = RANGO_PRIORIDAD[a.prioridad] ?? 99
    const rangoB = RANGO_PRIORIDAD[b.prioridad] ?? 99
    if (rangoA !== rangoB) return rangoA - rangoB
    return new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud)
  })
}
