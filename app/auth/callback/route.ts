import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'invite', 'recovery', etc.
  const next = searchParams.get('next') ?? '/'

  console.log('🔐 User callback recibido:', { code: code ? 'presente' : 'ausente', type, next, origin })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sync basic profile fields (first_name, last_name, email) into public.users
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const meta: any = user.user_metadata || {}
          const firstName = meta.first_name || meta.given_name || null
          const lastName = meta.last_name || meta.family_name || null
          const payload = {
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
          }
          // Upsert to ensure row exists and names are stored
          const { error: upsertError } = await supabase
            .from('users')
            .upsert(payload, { onConflict: 'id' })
          if (upsertError) {
            console.error('Failed to upsert users profile in callback:', upsertError)
          }
          
          console.log('✅ Usuario autenticado, redirigiendo a:', next || (type === 'invite' ? '/complete-profile' : '/'))
        }
      } catch (e) {
        console.error('Profile sync error in callback:', e)
      }
      
      // Si es una invitación, redirigir a set-password primero
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}/set-password`)
      }
      
      // Si no es invitación, usar el next especificado o redirigir al dashboard
      const redirectPath = next || '/'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    } else {
      console.error('❌ Error en exchangeCodeForSession:', error)
    }
  } else {
    console.error('❌ No se recibió código en el callback')
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
