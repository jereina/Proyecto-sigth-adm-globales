import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = useCallback(async (userId) => {
    if (!userId) {
      setPerfil(null)
      return
    }
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, rol, departamento_id')
      .eq('id', userId)
      .single()

    if (error) {
      setPerfil(null)
    } else {
      setPerfil(data)
    }
  }, [])

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!activo) return
      setSession(session)
      if (session?.user) {
        await cargarPerfil(session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        await cargarPerfil(session.user.id)
      } else {
        setPerfil(null)
      }
    })

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [cargarPerfil])

  const signOut = async () => {
    await supabase.auth.signOut()
    setPerfil(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    perfil,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
