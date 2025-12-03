import { createClient } from '@/lib/supabase/server'
import type { ApplicationStatus, NotificationMetadata } from '@/lib/types/SHARED-TYPES'

/**
 * Crea una notificación en la base de datos
 */
async function createNotification(
  userId: string,
  type: 'application' | 'document' | 'support',
  title: string,
  message: string,
  linkUrl: string | null = null,
  metadata: NotificationMetadata | null = null
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link_url: linkUrl,
      metadata,
      is_read: false,
    })

    if (error) {
      console.error(`Error creating ${type} notification:`, error)
      throw error
    }
  } catch (err) {
    console.error(`Failed to create notification for user ${userId}:`, err)
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Obtiene el mensaje de notificación para un cambio de estado de aplicación
 */
function getApplicationStatusMessage(
  status: ApplicationStatus,
  previousStatus?: ApplicationStatus
): { title: string; message: string } {
  const statusLabels: Record<ApplicationStatus, string> = {
    draft: 'Borrador',
    submitted: 'Enviada',
    pending_approval: 'Pendiente de aprobación',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    active: 'Activa',
    cancelled: 'Cancelada',
    submission_failed: 'Error de envío',
  }

  const title = `Estado de aplicación actualizado`
  let message = `Tu aplicación cambió de estado a "${statusLabels[status]}"`

  if (previousStatus) {
    message = `Tu aplicación cambió de "${statusLabels[previousStatus]}" a "${statusLabels[status]}"`
  }

  return { title, message }
}

/**
 * Crea una notificación cuando cambia el estado de una aplicación
 */
export async function createApplicationNotification(
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
  previousStatus?: ApplicationStatus
): Promise<void> {
  const { title, message } = getApplicationStatusMessage(status, previousStatus)

  await createNotification(
    userId,
    'application',
    title,
    message,
    `/applications/${applicationId}`,
    {
      application_id: applicationId,
      status,
      previous_status: previousStatus,
    }
  )
}

/**
 * Crea una notificación cuando se crea una nueva solicitud de documento
 */
export async function createDocumentNotification(
  userId: string,
  documentRequestId: string,
  type: 'new_request' | 'document_required',
  documentName?: string
): Promise<void> {
  const title =
    type === 'new_request'
      ? 'Nueva solicitud de documento'
      : 'Documento requerido'
  const message =
    type === 'new_request'
      ? `Se ha creado una nueva solicitud de documento${documentName ? `: ${documentName}` : ''}`
      : `Se requiere que subas un documento${documentName ? `: ${documentName}` : ''}`

  await createNotification(
    userId,
    'document',
    title,
    message,
    '/documents',
    {
      document_request_id: documentRequestId,
    }
  )
}

/**
 * Crea una notificación cuando hay un nuevo mensaje en un ticket de soporte
 */
export async function createSupportNotification(
  userId: string,
  ticketId: string,
  type: 'new_message' | 'ticket_response',
  ticketNumber?: string,
  senderName?: string
): Promise<void> {
  const title =
    type === 'new_message'
      ? 'Nuevo mensaje en ticket'
      : 'Respuesta a tu ticket'
  const message =
    type === 'new_message'
      ? `${senderName || 'Alguien'} envió un nuevo mensaje en el ticket${ticketNumber ? ` #${ticketNumber}` : ''}`
      : `Has recibido una respuesta en el ticket${ticketNumber ? ` #${ticketNumber}` : ''}`

  await createNotification(
    userId,
    'support',
    title,
    message,
    `/support?ticket=${ticketId}`,
    {
      ticket_id: ticketId,
    }
  )
}

/**
 * Elimina notificaciones relacionadas con una solicitud de documento cuando se completa
 */
export async function deleteDocumentRequestNotifications(
  userId: string,
  documentRequestId: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'document')
      .eq('metadata->>document_request_id', documentRequestId)

    if (error) {
      console.error('Error deleting document request notifications:', error)
    }
  } catch (err) {
    console.error('Failed to delete document request notifications:', err)
  }
}

/**
 * Elimina notificaciones relacionadas con un ticket de soporte cuando se cierra
 */
export async function deleteSupportTicketNotifications(
  userId: string,
  ticketId: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'support')
      .eq('metadata->>ticket_id', ticketId)

    if (error) {
      console.error('Error deleting support ticket notifications:', error)
    }
  } catch (err) {
    console.error('Failed to delete support ticket notifications:', err)
  }
}

/**
 * Elimina notificaciones relacionadas con una aplicación
 * Opcionalmente filtra por estado específico
 */
export async function deleteApplicationNotifications(
  userId: string,
  applicationId: string,
  status?: ApplicationStatus
): Promise<void> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', 'application')
      .eq('metadata->>application_id', applicationId)

    if (status) {
      query = query.eq('metadata->>status', status)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting application notifications:', error)
    }
  } catch (err) {
    console.error('Failed to delete application notifications:', err)
  }
}

