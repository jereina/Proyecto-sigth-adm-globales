import { supabase } from './supabaseClient'

/**
 * Aplica la regla "una sola prioridad Alta activa por departamento".
 * Si prioridad !== 'alta', no hay nada que verificar.
 * Si ya existe otra vacante Alta activa (abierta/en_proceso) en el mismo
 * departamento, pide confirmación al usuario para reemplazarla (esa
 * vacante anterior baja a Media) antes de continuar.
 *
 * @returns {Promise<{continuar: boolean, error?: string}>}
 */
export async function verificarYResolverPrioridadAlta({ prioridad, departamentoId, vacanteIdActual = null }) {
  if (prioridad !== 'alta') {
    return { continuar: true }
  }

  let consulta = supabase
    .from('vacantes')
    .select('id, cargo')
    .eq('departamento_id', departamentoId)
    .eq('prioridad', 'alta')
    .in('estado', ['abierta', 'en_proceso'])

  if (vacanteIdActual) {
    consulta = consulta.neq('id', vacanteIdActual)
  }

  const { data: vacantesAltaActivas, error: errorConsulta } = await consulta

  if (errorConsulta) {
    return { continuar: false, error: 'No se pudo verificar la prioridad del departamento. Intenta de nuevo.' }
  }

  if (!vacantesAltaActivas || vacantesAltaActivas.length === 0) {
    return { continuar: true }
  }

  const vacanteAltaActual = vacantesAltaActivas[0]
  const confirmado = window.confirm(
    `Este departamento ya tiene una vacante en prioridad Alta: "${vacanteAltaActual.cargo}". Solo puede haber una prioridad Alta activa a la vez. ¿Deseas reemplazarla? La vacante anterior pasará a prioridad Media.`,
  )

  if (!confirmado) {
    return { continuar: false }
  }

  const { error: errorDegradar } = await supabase
    .from('vacantes')
    .update({ prioridad: 'media' })
    .in('id', vacantesAltaActivas.map((v) => v.id))

  if (errorDegradar) {
    return { continuar: false, error: 'No se pudo actualizar la vacante anterior. Intenta de nuevo.' }
  }

  return { continuar: true }
}
