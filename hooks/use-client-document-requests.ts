"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DocumentRequest } from '@/lib/types/SHARED-TYPES'

/**
 * Hook para obtener solicitudes de documentos pendientes del cliente autenticado
 */
export function useClientDocumentRequests() {
  const [requests, setRequests] = useState<DocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('No autenticado')
        return
      }

      console.log('Fetching document requests for client:', user.id)

      const { data, error: fetchError } = await supabase
        .from('document_requests')
        .select(`
          *,
          requester:users!document_requests_requested_by_fkey(id, email, first_name, last_name),
          document:documents(id, file_name, file_url, uploaded_at)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching document requests:', fetchError)
        throw fetchError
      }

      console.log('Document requests fetched:', data?.length || 0)
      setRequests(data || [])
    } catch (err) {
      console.error('Error fetching document requests:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  return { requests, loading, error, refetch: fetchRequests }
}

/**
 * Hook para marcar una solicitud como cumplida cuando el cliente sube un documento
 */
export function useFulfillClientDocumentRequest() {
  const [fulfilling, setFulfilling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fulfillRequest = async (
    requestId: string,
    documentId: string
  ): Promise<boolean> => {
    try {
      setFulfilling(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No autenticado')
      }

      // Actualizar la solicitud a fulfilled
      const { error: updateError } = await supabase
        .from('document_requests')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
          fulfilled_by: user.id,
          document_id: documentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('client_id', user.id) // Asegurar que solo el cliente puede cumplir su propia solicitud

      if (updateError) throw updateError

      console.log('✅ Document request fulfilled:', requestId)
      return true
    } catch (err) {
      console.error('Error fulfilling document request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al cumplir solicitud'
      setError(errorMessage)
      return false
    } finally {
      setFulfilling(false)
    }
  }

  return { fulfillRequest, fulfilling, error }
}

