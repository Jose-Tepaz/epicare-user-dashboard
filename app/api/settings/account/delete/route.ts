import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================
// POST: Eliminar cuenta
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

    const { confirmation } = await request.json()

    // Verificar confirmación
    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Debes escribir DELETE para confirmar la eliminación' },
        { status: 400 }
      )
    }

    // ============================================
    // SOFT DELETE: Desactivar cuenta
    // ============================================
    
    // Marcar usuario como inactivo
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error soft deleting user:', updateError)
      return NextResponse.json(
        { error: 'Error al eliminar cuenta' },
        { status: 500 }
      )
    }

    // Desactivar métodos de pago del usuario
    await supabase
      .from('user_payment_methods')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Cerrar sesión
    await supabase.auth.signOut()

    return NextResponse.json({ 
      success: true, 
      message: 'Tu cuenta ha sido eliminada. Lamentamos verte ir.' 
    })

    // ============================================
    // NOTA: Para eliminar completamente de auth.users
    // se necesita usar el Admin API con service_role key
    // ============================================
    /*
    // Crear cliente admin con service_role
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(user.id)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
    }
    */
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

