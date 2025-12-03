import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// GET: Obtener un método de pago específico
// ============================================

export async function GET(
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

    const { data: method, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !method) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, method })
  } catch (err) {
    console.error('Payment method GET error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH: Actualizar método de pago
// ============================================

export async function PATCH(
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

    const updates = await request.json()

    // Verificar que el método pertenece al usuario
    const { data: existing } = await supabase
      .from('user_payment_methods')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir actualizar ciertos campos
    const allowedUpdates: any = {}
    if (updates.nickname !== undefined) allowedUpdates.nickname = updates.nickname
    if (updates.is_default !== undefined) allowedUpdates.is_default = updates.is_default

    const { data: updated, error: updateError } = await supabase
      .from('user_payment_methods')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar método de pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, method: updated })
  } catch (err) {
    console.error('Payment method PATCH error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE: Eliminar método de pago (soft delete)
// ============================================

export async function DELETE(
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

    // Verificar que el método pertenece al usuario
    const { data: existing } = await supabase
      .from('user_payment_methods')
      .select('id, vault_secret_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      )
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('user_payment_methods')
      .update({ 
        is_active: false,
        is_default: false
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar método de pago' },
        { status: 500 }
      )
    }

    // Opcional: Eliminar secreto de Vault
    if (existing.vault_secret_id) {
      try {
        await supabase.rpc('delete_vault_secret', {
          secret_id: existing.vault_secret_id
        })
      } catch (vaultErr) {
        console.error('Error deleting vault secret:', vaultErr)
        // No fallar si no se puede eliminar de Vault
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Payment method DELETE error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

