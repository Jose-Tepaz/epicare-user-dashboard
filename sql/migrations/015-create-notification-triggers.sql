-- ==================================================
-- MIGRACIÓN: Crear triggers para generar notificaciones automáticamente
-- Descripción: Triggers que crean notificaciones cuando ocurren eventos importantes
-- ==================================================

-- ============================================
-- 1. FUNCIÓN: Crear notificación de cambio de estado de aplicación
-- ============================================

CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear notificación si el estado cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url,
      metadata,
      is_read
    ) VALUES (
      NEW.user_id,
      'application',
      'Estado de aplicación actualizado',
      CASE
        WHEN NEW.status = 'submitted' THEN 'Tu aplicación ha sido enviada a la aseguradora'
        WHEN NEW.status = 'pending_approval' THEN 'Tu aplicación está pendiente de aprobación'
        WHEN NEW.status = 'approved' THEN '¡Felicidades! Tu aplicación ha sido aprobada'
        WHEN NEW.status = 'rejected' THEN 'Tu aplicación ha sido rechazada. Por favor revisa los detalles.'
        WHEN NEW.status = 'active' THEN 'Tu póliza está ahora activa'
        WHEN NEW.status = 'cancelled' THEN 'Tu aplicación ha sido cancelada'
        WHEN NEW.status = 'submission_failed' THEN 'Hubo un error al enviar tu aplicación. Por favor intenta nuevamente.'
        ELSE 'El estado de tu aplicación ha cambiado'
      END,
      '/applications/' || NEW.id,
      jsonb_build_object(
        'application_id', NEW.id,
        'status', NEW.status,
        'previous_status', OLD.status
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. TRIGGER: Aplicaciones - Cambio de estado
-- ============================================

DROP TRIGGER IF EXISTS trigger_application_status_notification ON applications;
CREATE TRIGGER trigger_application_status_notification
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_application_status_notification();

-- ============================================
-- 3. FUNCIÓN: Crear notificación de nueva solicitud de documento
-- ============================================

CREATE OR REPLACE FUNCTION create_document_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  document_type_label TEXT;
BEGIN
  -- Obtener el nombre del tipo de documento (simplificado)
  document_type_label := NEW.document_type;
  
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link_url,
    metadata,
    is_read
  ) VALUES (
    NEW.client_id,
    'document',
    'Nueva solicitud de documento',
    'Se requiere que subas un documento: ' || document_type_label,
    '/documents',
    jsonb_build_object(
      'document_request_id', NEW.id,
      'document_type', NEW.document_type
    ),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER: Solicitudes de documentos - Nueva solicitud
-- ============================================

DROP TRIGGER IF EXISTS trigger_document_request_notification ON document_requests;
CREATE TRIGGER trigger_document_request_notification
  AFTER INSERT ON document_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION create_document_request_notification();

-- ============================================
-- 5. FUNCIÓN: Crear notificación de mensaje de soporte (solo si es del staff)
-- ============================================

CREATE OR REPLACE FUNCTION create_support_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  ticket_record RECORD;
  sender_record RECORD;
  sender_name TEXT;
BEGIN
  -- Obtener información del ticket
  SELECT * INTO ticket_record FROM support_tickets WHERE id = NEW.ticket_id;
  
  -- Obtener información del remitente
  SELECT * INTO sender_record FROM users WHERE id = NEW.sender_id;
  
  -- Determinar nombre del remitente
  IF sender_record.first_name IS NOT NULL AND sender_record.last_name IS NOT NULL THEN
    sender_name := sender_record.first_name || ' ' || sender_record.last_name;
  ELSIF sender_record.first_name IS NOT NULL THEN
    sender_name := sender_record.first_name;
  ELSE
    sender_name := COALESCE(sender_record.email, 'Equipo de Soporte');
  END IF;
  
  -- Solo crear notificación si:
  -- 1. El mensaje no es interno
  -- 2. El remitente es del staff (admin, agent, support_staff)
  -- 3. El mensaje no es del cliente mismo
  IF NOT NEW.is_internal 
     AND sender_record.role IN ('admin', 'super_admin', 'agent', 'support_staff')
     AND NEW.sender_id != ticket_record.client_id THEN
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url,
      metadata,
      is_read
    ) VALUES (
      ticket_record.client_id,
      'support',
      'Nuevo mensaje en ticket',
      sender_name || ' envió un nuevo mensaje en el ticket #' || ticket_record.ticket_number,
      '/support/tickets/' || NEW.ticket_id,
      jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'ticket_message_id', NEW.id,
        'ticket_number', ticket_record.ticket_number
      ),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGER: Mensajes de tickets - Nuevo mensaje del staff
-- ============================================

DROP TRIGGER IF EXISTS trigger_support_message_notification ON ticket_messages;
CREATE TRIGGER trigger_support_message_notification
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  WHEN (NOT NEW.is_internal)
  EXECUTE FUNCTION create_support_message_notification();

-- ============================================
-- 7. COMENTARIOS
-- ============================================

COMMENT ON FUNCTION create_application_status_notification() IS 'Crea una notificación cuando cambia el estado de una aplicación';
COMMENT ON FUNCTION create_document_request_notification() IS 'Crea una notificación cuando se crea una nueva solicitud de documento';
COMMENT ON FUNCTION create_support_message_notification() IS 'Crea una notificación cuando un miembro del staff envía un mensaje en un ticket';

