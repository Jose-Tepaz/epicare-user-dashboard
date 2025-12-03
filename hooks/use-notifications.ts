"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationType } from '@/lib/types/SHARED-TYPES'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  refetch: () => Promise<void>
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const channelRef = useRef<any>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50) // Limitar a las 50 más recientes

      if (fetchError) {
        console.error('Error fetching notifications:', fetchError)
        setError(fetchError.message)
        return
      }

      if (isMounted.current) {
        setNotifications(data || [])
      }
    } catch (err) {
      console.error('Error in fetchNotifications:', err)
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchNotifications()

    // Configurar suscripción en tiempo real
    if (userId) {
      // Limpiar suscripción anterior si existe
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('📬 Notification change:', payload.eventType)
            
            if (payload.eventType === 'INSERT') {
              // Nueva notificación agregada
              const newNotification = payload.new as Notification
              if (isMounted.current) {
                setNotifications((prev) => [newNotification, ...prev].slice(0, 50))
              }
            } else if (payload.eventType === 'UPDATE') {
              // Notificación actualizada (marcada como leída o eliminada)
              const updatedNotification = payload.new as Notification
              if (isMounted.current) {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
                )
              }
            } else if (payload.eventType === 'DELETE') {
              // Notificación eliminada
              const deletedId = payload.old.id
              if (isMounted.current) {
                setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
              }
            }
          }
        )
        .subscribe()

      channelRef.current = channel

      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe()
        }
      }
    }
  }, [userId, fetchNotifications, supabase])

  const markAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', notificationId)
          .eq('user_id', userId)

        if (error) {
          console.error('Error marking notification as read:', error)
          return false
        }

        // Actualizar estado local
        if (isMounted.current) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId
                ? { ...n, is_read: true, read_at: new Date().toISOString() }
                : n
            )
          )
        }

        return true
      } catch (err) {
        console.error('Error in markAsRead:', err)
        return false
      }
    },
    [userId, supabase]
  )

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      // Actualizar estado local
      if (isMounted.current) {
        const now = new Date().toISOString()
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: now }))
        )
      }

      return true
    } catch (err) {
      console.error('Error in markAllAsRead:', err)
      return false
    }
  }, [userId, supabase])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}

