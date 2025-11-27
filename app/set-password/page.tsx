'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function SetPasswordPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [processingTokens, setProcessingTokens] = useState(false)

  useEffect(() => {
    const setupSession = async () => {
      // Verificar si hay tokens en sessionStorage (viniendo de callback-handler)
      const tokensData = sessionStorage.getItem('auth_tokens')
      
      if (tokensData && !user) {
        setProcessingTokens(true)
        try {
          console.log('🔐 Tokens encontrados en sessionStorage, estableciendo sesión...')
          const tokens = JSON.parse(tokensData)
          const supabase = createClient()
          
          // Establecer sesión
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })

          if (sessionError) {
            console.error('❌ Error estableciendo sesión:', sessionError)
            sessionStorage.removeItem('auth_tokens')
            router.push('/login?error=session_failed')
            return
          }

          console.log('✅ Sesión establecida correctamente')
          
          // Limpiar tokens de sessionStorage
          sessionStorage.removeItem('auth_tokens')
          setProcessingTokens(false)
          
          // Pequeño delay y luego recargar
          setTimeout(() => {
            window.location.reload()
          }, 500)
        } catch (err) {
          console.error('❌ Error procesando tokens:', err)
          sessionStorage.removeItem('auth_tokens')
          setProcessingTokens(false)
          router.push('/login?error=token_error')
        }
        return
      }

      // Si no hay tokens y no hay usuario, redirigir al login
      if (!authLoading && !user && !tokensData) {
        setTimeout(() => {
          if (!user) {
            router.push('/login')
          }
        }, 1000)
      }
    }

    setupSession()
  }, [user, authLoading, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!password.trim()) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirma tu contraseña"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!user) {
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      
      // Establecer la contraseña
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password.trim() 
      })

      if (updateError) {
        // Si el error es que la contraseña es la misma, el usuario ya tiene contraseña
        // Redirigir al dashboard en lugar de mostrar error
        if (updateError.message?.includes('different from the old password') || 
            updateError.message?.includes('same as the old password')) {
          window.location.href = '/'
          return
        }
        throw updateError
      }

      // Verificar si el perfil ya está completado
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('profile_completed, first_name, last_name')
          .eq('id', user.id)
          .single()
        
        if (!profileError && profileData) {
          // Si el perfil ya está completado o tiene nombre, ir al dashboard
          if (profileData.profile_completed || (profileData.first_name && profileData.last_name)) {
            window.location.href = '/'
            return
          }
        }
      } catch (profileError) {
        console.warn('Error verificando perfil, continuando con complete-profile:', profileError)
      }

      // Redirigir a complete-profile usando window.location para forzar navegación completa
      window.location.href = '/complete-profile'
    } catch (error: any) {
      console.error('Error setting password:', error)
      setErrors({ submit: error.message || 'Error al establecer la contraseña. Por favor intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || processingTokens || (sessionStorage.getItem('auth_tokens') && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-sm text-gray-600">
            {processingTokens ? 'Estableciendo sesión...' : 'Cargando...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Establece tu Contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">
            Bienvenido! Por favor establece una contraseña para tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white shadow rounded-lg p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: "" }))
                    }
                  }}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: "" }))
                    }
                  }}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

