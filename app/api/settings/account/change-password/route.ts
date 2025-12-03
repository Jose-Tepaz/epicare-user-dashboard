import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// POST: Cambiar contraseña
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validaciones
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas son requeridas' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar contraseña actual (opcional pero recomendado)
    // Nota: Supabase no proporciona una forma directa de verificar la contraseña actual
    // Por seguridad, se puede requerir re-autenticación

    // Actualizar contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Error changing password:', updateError)
      return NextResponse.json(
        { error: 'Error al cambiar contraseña: ' + updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contraseña actualizada correctamente' 
    })
  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

