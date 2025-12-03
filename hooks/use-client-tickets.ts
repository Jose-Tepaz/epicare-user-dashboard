import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  SupportTicket,
  TicketMessage,
  TicketWithMessages,
  TicketStatus,
  TicketPriority,
} from '@/lib/types/SHARED-TYPES'

/**
 * Hook para obtener tickets del cliente actual
 */
export function useClientTickets() {
  const [tickets, setTickets] = useState<TicketWithMessages[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuario no autenticado')
        return
      }

      // Fetch tickets where user is the client or creator
      const { data, error: fetchError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          assigned:users!support_tickets_assigned_to_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .or(`client_id.eq.${user.id},created_by.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching tickets:', fetchError)
        setError(fetchError.message)
        return
      }

      // Fetch message count for each ticket
      const ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .eq('is_internal', false) // Don't count internal messages

          return {
            ...ticket,
            message_count: count || 0,
          }
        })
      )

      setTickets(ticketsWithCounts)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado al cargar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  }
}

/**
 * Hook para obtener detalles de un ticket específico
 */
export function useClientTicketDetails(ticketId: string) {
  const [ticket, setTicket] = useState<TicketWithMessages | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTicketDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuario no autenticado')
        return
      }

      // Fetch ticket details
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          assigned:users!support_tickets_assigned_to_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', ticketId)
        .or(`client_id.eq.${user.id},created_by.eq.${user.id}`)
        .single()

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError)
        setError(ticketError.message)
        return
      }

      // Fetch ticket messages (excluding internal messages)
      const { data: messagesData, error: messagesError } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          sender:users!ticket_messages_sender_id_fkey(
            id,
            email,
            first_name,
            last_name,
            role
          )
        `)
        .eq('ticket_id', ticketId)
        .eq('is_internal', false) // Clients don't see internal messages
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        setError(messagesError.message)
        return
      }

      setTicket(ticketData)
      setMessages(messagesData || [])
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado al cargar detalles del ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails()
    }
  }, [ticketId])

  return {
    ticket,
    messages,
    loading,
    error,
    refetch: fetchTicketDetails,
  }
}

/**
 * Hook para crear un nuevo ticket
 */
export function useCreateTicket() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const createTicket = async (
    subject: string,
    description: string,
    priority: TicketPriority = 'medium'
  ): Promise<SupportTicket | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuario no autenticado')
        return null
      }

      // Generate ticket number (simple implementation - in production use a sequence)
      const ticketNumber = `TKT-${Date.now()}`

      const { data, error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          client_id: user.id,
          created_by: user.id,
          status: 'open',
          priority,
          subject,
          description,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating ticket:', insertError)
        setError(insertError.message)
        return null
      }

      // Crear notificación para el admin cuando el cliente crea un ticket
      if (data) {
        try {
          const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3002'
          await fetch(`${adminApiUrl}/api/notifications/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketId: data.id,
              clientId: user.id,
              type: 'new',
              ticketNumber: data.ticket_number,
            }),
          })
        } catch (err) {
          console.error('Error creating admin notification:', err)
        }
      }

      return data
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado al crear ticket')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createTicket,
    loading,
    error,
  }
}

/**
 * Hook para crear un mensaje en un ticket
 */
export function useCreateTicketMessage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const createMessage = async (
    ticketId: string,
    message: string
  ): Promise<TicketMessage | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuario no autenticado')
        return null
      }

      const { data, error: insertError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          message,
          is_internal: false, // Client messages are never internal
        })
        .select(`
          *,
          sender:users!ticket_messages_sender_id_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .single()

      if (insertError) {
        console.error('Error creating message:', insertError)
        setError(insertError.message)
        return null
      }

      // Update ticket updated_at and get ticket info
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('ticket_number')
        .eq('id', ticketId)
        .single()

      await supabase
        .from('support_tickets')
        .update({ 
          updated_at: new Date().toISOString(),
          status: 'open' // Reopen if client responds
        })
        .eq('id', ticketId)

      // Crear notificación para el admin cuando el cliente responde a un ticket
      if (data && ticket) {
        try {
          const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL || 'http://localhost:3002'
          await fetch(`${adminApiUrl}/api/notifications/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketId: ticketId,
              clientId: user.id,
              type: 'reply',
              ticketNumber: ticket.ticket_number,
            }),
          }).catch((err) => {
            console.error('Error creating admin notification:', err)
            // No fallar el flujo principal si falla la notificación
          })
        } catch (err) {
          console.error('Error creating admin notification:', err)
          // No fallar el flujo principal si falla la notificación
        }
      }

      return data
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado al crear mensaje')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createMessage,
    loading,
    error,
  }
}

/**
 * Hook para obtener estadísticas de tickets del cliente
 */
export function useClientTicketStats() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuario no autenticado')
        return
      }

      const { data: tickets, error: fetchError } = await supabase
        .from('support_tickets')
        .select('id, status')
        .or(`client_id.eq.${user.id},created_by.eq.${user.id}`)

      if (fetchError) {
        console.error('Error fetching ticket stats:', fetchError)
        setError(fetchError.message)
        return
      }

      const ticketsArray = tickets || []

      setStats({
        total: ticketsArray.length,
        open: ticketsArray.filter((t) => t.status === 'open').length,
        in_progress: ticketsArray.filter((t) => t.status === 'in_progress').length,
        resolved: ticketsArray.filter((t) => t.status === 'resolved').length,
        closed: ticketsArray.filter((t) => t.status === 'closed').length,
      })
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Error inesperado al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

