import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'organigramas'
const URL_EXPIRACION_SEGUNDOS = 60 * 60

export default function OrganigramaPage() {
  const { perfil, user } = useOutletContext()
  const esSuperadmin = perfil.rol === 'superadmin'
  const esGerente = perfil.rol === 'gerente'

  const [departamentos, setDepartamentos] = useState([])
  const [departamentoId, setDepartamentoId] = useState(esSuperadmin ? '' : perfil.departamento_id)
  const [registro, setRegistro] = useState(null)
  const [urlImagen, setUrlImagen] = useState('')
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [visorAbierto, setVisorAbierto] = useState(false)
  const inputArchivoRef = useRef(null)

  useEffect(() => {
    if (!esSuperadmin) return

    supabase
      .from('departamentos')
      .select('id, nombre')
      .order('nombre')
      .then(({ data, error }) => {
        if (error) return
        setDepartamentos(data)
        setDepartamentoId((actual) => actual || data[0]?.id || '')
      })
  }, [esSuperadmin])

  const cargarOrganigrama = useCallback(async () => {
    if (!departamentoId) {
      setRegistro(null)
      setUrlImagen('')
      setCargando(false)
      return
    }

    setCargando(true)
    setError('')
    setUrlImagen('')

    const { data, error } = await supabase
      .from('organigramas')
      .select('*')
      .eq('departamento_id', departamentoId)
      .maybeSingle()

    if (error) {
      setError('No se pudo cargar el organigrama.')
      setRegistro(null)
      setCargando(false)
      return
    }

    setRegistro(data)

    if (data) {
      const { data: firmada, error: errorFirmada } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(data.storage_path, URL_EXPIRACION_SEGUNDOS)

      if (errorFirmada) {
        setError('No se pudo generar el enlace de la imagen.')
      } else {
        setUrlImagen(firmada.signedUrl)
      }
    }

    setCargando(false)
  }, [departamentoId])

  useEffect(() => {
    cargarOrganigrama()
  }, [cargarOrganigrama])

  const handleSeleccionArchivo = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    setError('')
    setSubiendo(true)

    const extension = archivo.name.split('.').pop().toLowerCase()
    const rutaNueva = `${perfil.departamento_id}/organigrama.${extension}`

    if (registro?.storage_path && registro.storage_path !== rutaNueva) {
      await supabase.storage.from(BUCKET).remove([registro.storage_path])
    }

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(rutaNueva, archivo, { upsert: true, contentType: archivo.type })

    if (errorSubida) {
      setError('No se pudo subir la imagen. Intenta de nuevo.')
      setSubiendo(false)
      return
    }

    const { error: errorGuardado } = await supabase
      .from('organigramas')
      .upsert(
        {
          departamento_id: perfil.departamento_id,
          storage_path: rutaNueva,
          actualizado_por: user.id,
        },
        { onConflict: 'departamento_id' },
      )

    setSubiendo(false)

    if (errorGuardado) {
      setError('La imagen se subió, pero no se pudo registrar. Intenta de nuevo.')
      return
    }

    cargarOrganigrama()
  }

  return (
    <div className="contenedor-dashboard">
      <div className="cabecera-seccion">
        <div>
          <h2>Organigrama</h2>
          <p className="texto-atenuado">
            {esSuperadmin
              ? 'Consulta el organigrama de cualquier departamento.'
              : 'Organigrama de tu departamento.'}
          </p>
        </div>

        {esGerente && (
          <div className="acciones-organigrama">
            <a
              href="/plantilla-organigrama.svg"
              download="plantilla-organigrama-sigth.svg"
              className="boton boton-secundario"
            >
              Descargar plantilla
            </a>

            <input
              type="file"
              accept="image/png, image/jpeg"
              ref={inputArchivoRef}
              onChange={handleSeleccionArchivo}
              style={{ display: 'none' }}
            />
            <button
              className="boton boton-primario"
              onClick={() => inputArchivoRef.current?.click()}
              disabled={subiendo}
            >
              {subiendo ? 'Subiendo…' : registro ? 'Reemplazar organigrama' : 'Subir organigrama'}
            </button>
          </div>
        )}
      </div>

      {esSuperadmin && (
        <div className="barra-filtros">
          <label>
            Departamento
            <select value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {error && <p className="mensaje-error">{error}</p>}

      {cargando ? (
        <p className="texto-atenuado">Cargando organigrama…</p>
      ) : urlImagen ? (
        <div className="visor-organigrama">
          <img
            src={urlImagen}
            alt="Organigrama del departamento"
            className="imagen-organigrama"
            onClick={() => setVisorAbierto(true)}
          />
          <p className="texto-atenuado texto-centrado">Haz clic en la imagen para verla más grande.</p>
        </div>
      ) : (
        <div className="estado-vacio">
          <p>Este departamento aún no ha cargado su organigrama.</p>
        </div>
      )}

      {visorAbierto && urlImagen && (
        <div className="fondo-modal" onClick={() => setVisorAbierto(false)}>
          <img
            src={urlImagen}
            alt="Organigrama ampliado"
            className="imagen-organigrama-ampliada"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
