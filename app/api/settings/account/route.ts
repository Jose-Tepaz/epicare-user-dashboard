import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================
// PATCH: Actualizar perfil del usuario
// ============================================

export async function PATCH(request: NextRequest) {
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

    const updates = await request.json()

    // Preparar updates para la tabla users
    const userUpdates: any = {}
    
    if (updates.firstName !== undefined) {
      userUpdates.first_name = updates.firstName
    }
    if (updates.lastName !== undefined) {
      userUpdates.last_name = updates.lastName
    }
    if (updates.phone !== undefined) {
      userUpdates.phone = updates.phone
    }

    // Actualizar tabla users
    if (Object.keys(userUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return NextResponse.json(
          { error: 'Error al actualizar perfil' },
          { status: 500 }
        )
      }
    }

    // Actualizar email si se proporcionó (requiere verificación)
    if (updates.email && updates.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: updates.email
      })

      if (emailError) {
        console.error('Error updating email:', emailError)
        return NextResponse.json(
          { error: 'Error al actualizar email. ' + emailError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Perfil actualizado. Se envió un email de verificación a tu nueva dirección.',
        emailVerificationRequired: true
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Perfil actualizado correctamente' 
    })
  } catch (err) {
    console.error('Account PATCH error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================
// GET: Obtener datos del perfil
// ============================================

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener datos del usuario de la tabla users
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, created_at')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Error al obtener perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      profile: {
        ...profile,
        authEmail: user.email // Email desde auth (puede diferir si hay verificación pendiente)
      }
    })
  } catch (err) {
    console.error('Account GET error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

