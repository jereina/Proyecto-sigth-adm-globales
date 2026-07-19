import { EstadoBadge, PrioridadBadge } from './EstadoBadge'

const formateador = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export default function VacanteDetalleModal({
  vacante,
  onClose,
  onVerCandidatos,
  textoBotonCandidatos = 'Ver candidatos',
  onArchivar,
  archivando = false,
}) {
  const mostrarArchivar = Boolean(onArchivar) && vacante.estado === 'cerrada'

  return (
    <div className="fondo-modal" onClick={onClose}>
      <div className="tarjeta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cabecera-modal">
          <h2>{vacante.cargo}</h2>
          <button className="boton-cerrar" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="detalle-vacante">
          <div className="fila-detalle">
            <span className="etiqueta-detalle">Estado</span>
            <EstadoBadge estado={vacante.estado} />
          </div>

          <div className="fila-detalle">
            <span className="etiqueta-detalle">Prioridad</span>
            <PrioridadBadge prioridad={vacante.prioridad} />
          </div>

          <div className="fila-detalle">
            <span className="etiqueta-detalle">Cantidad</span>
            <span>{vacante.cantidad}</span>
          </div>

          {vacante.departamento?.nombre && (
            <div className="fila-detalle">
              <span className="etiqueta-detalle">Departamento</span>
              <span>{vacante.departamento.nombre}</span>
            </div>
          )}

          {vacante.solicitante?.nombre_completo && (
            <div className="fila-detalle">
              <span className="etiqueta-detalle">Solicitado por</span>
              <span>{vacante.solicitante.nombre_completo}</span>
            </div>
          )}

          <div className="fila-detalle">
            <span className="etiqueta-detalle">Fecha de solicitud</span>
            <span>{formateador.format(new Date(vacante.fecha_solicitud))}</span>
          </div>

          <div className="fila-detalle">
            <span className="etiqueta-detalle">Candidatos</span>
            {vacante.candidatos_enviados ? (
              <span className="badge badge-estado-abierta">Enviados</span>
            ) : (
              <span className="texto-atenuado">Sin enviar</span>
            )}
          </div>

          <div className="bloque-descripcion-detalle">
            <span className="etiqueta-detalle">Descripción</span>
            <p className="descripcion-cargo">{vacante.descripcion || 'Sin descripción.'}</p>
          </div>
        </div>

        {(onVerCandidatos || mostrarArchivar) && (
          <div className="acciones-modal">
            {onVerCandidatos && (
              <button className="boton boton-secundario" onClick={onVerCandidatos}>
                {textoBotonCandidatos}
              </button>
            )}
            {mostrarArchivar && (
              <button className="boton boton-peligro" disabled={archivando} onClick={onArchivar}>
                {archivando ? 'Archivando…' : 'Archivar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
