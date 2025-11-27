"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ClientDocument {
  id: string
  client_id: string
  application_id: string | null
  document_type: string
  file_url: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  version: number
  is_current: boolean
  uploaded_by: string
  uploaded_at: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export function useClientDocuments() {
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_current', true)
        .order('uploaded_at', { ascending: false })

      if (fetchError) throw fetchError

      setDocuments(data || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return { documents, loading, error, refetch: fetchDocuments }
}

export function useUploadClientDocument() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadDocument = async (
    file: File,
    documentType: string,
    applicationId?: string
  ): Promise<ClientDocument | null> => {
    try {
      setUploading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('No autenticado')
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          client_id: user.id,
          application_id: applicationId || null,
          document_type: documentType,
          file_url: fileName,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (dbError) throw dbError

      return document
    } catch (err) {
      console.error('Error uploading document:', err)
      setError(err instanceof Error ? err.message : 'Error al subir documento')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploadDocument, uploading, error }
}

export function useDownloadClientDocument() {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      setDownloading(true)
      setError(null)

      const supabase = createClient()

      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(fileUrl)

      if (downloadError) throw downloadError

      // Create blob and download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading document:', err)
      setError(err instanceof Error ? err.message : 'Error al descargar documento')
    } finally {
      setDownloading(false)
    }
  }

  return { downloadDocument, downloading, error }
}

