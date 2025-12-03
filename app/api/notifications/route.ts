import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'application' | 'document' | 'support' | null
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar por tipo si se especifica
    if (type && ['application', 'document', 'support'].includes(type)) {
      query = query.eq('type', type)
    }

    // Filtrar solo no leídas si se especifica
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data || [] })
  } catch (err) {
    console.error('Error in GET /api/notifications:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, type, title, message, link_url, metadata } = body

    // Validar campos requeridos
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: user_id, type, title, message' },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!['application', 'document', 'support'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Debe ser: application, document, o support' },
        { status: 400 }
      )
    }

    // Solo permitir crear notificaciones para el usuario autenticado o para otros usuarios si es admin
    // Por ahora, solo permitimos crear para el usuario autenticado
    if (user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado para crear notificaciones para otros usuarios' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        link_url: link_url || null,
        metadata: metadata || null,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notification: data }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/notifications:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

