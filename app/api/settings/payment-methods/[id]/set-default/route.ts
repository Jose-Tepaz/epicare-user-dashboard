import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// POST: Establecer método de pago como predeterminado
// ============================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el método pertenece al usuario y está activo
    const { data: existing } = await supabase
      .from('user_payment_methods')
      .select('id, is_active')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing || !existing.is_active) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Quitar default de todos los métodos del usuario
    await supabase
      .from('user_payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Establecer este método como default
    const { data: updated, error: updateError } = await supabase
      .from('user_payment_methods')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Set default error:', updateError)
      return NextResponse.json(
        { error: 'Error al establecer método predeterminado' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      method: updated 
    })
  } catch (err) {
    console.error('Set default error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

