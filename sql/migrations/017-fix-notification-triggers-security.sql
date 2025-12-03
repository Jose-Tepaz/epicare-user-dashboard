-- ==================================================
-- MIGRACIÓN: Corregir seguridad de triggers de notificaciones
-- Descripción: Permitir que los triggers creen notificaciones para otros usuarios
-- ==================================================

-- ============================================
-- 1. AGREGAR POLÍTICAS PARA QUE EL STAFF PUEDA CREAR NOTIFICACIONES
-- ============================================

-- Helper function para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function para obtener el scope del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_scope()
RETURNS VARCHAR AS $$
  SELECT scope FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function para obtener el agent asignado del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_assigned_agent()
RETURNS UUID AS $$
  SELECT assigned_to_agent_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Eliminar política antigua si existe (de versión anterior de esta migración)
DROP POLICY IF EXISTS "staff_insert_notifications_for_clients" ON public.notifications;

-- Admin/Super Admin pueden crear notificaciones para cualquier cliente
DROP POLICY IF EXISTS "admin_insert_notifications_for_clients" ON public.notifications;
CREATE POLICY "admin_insert_notifications_for_clients" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin')
    )
  );

-- Support Staff puede crear notificaciones según su scope
DROP POLICY IF EXISTS "support_staff_insert_notifications_for_clients" ON public.notifications;
CREATE POLICY "support_staff_insert_notifications_for_clients" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'support_staff'
      AND (
        -- Scope global: puede crear notificaciones para cualquier cliente
        u.scope = 'global'
        OR
        -- Scope agent_specific: solo puede crear notificaciones para clientes de su agent asignado
        (
          u.scope = 'agent_specific'
          AND EXISTS (
            SELECT 1 FROM public.users client
            WHERE client.id = notifications.user_id
            AND client.agent_id = u.assigned_to_agent_id
          )
        )
      )
    )
  );

-- Agent puede crear notificaciones solo para sus propios clientes
DROP POLICY IF EXISTS "agent_insert_notifications_for_clients" ON public.notifications;
CREATE POLICY "agent_insert_notifications_for_clients" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'agent'
      AND EXISTS (
        SELECT 1 FROM public.users client
        WHERE client.id = notifications.user_id
        AND client.agent_id = (
          SELECT agent_id FROM public.agents WHERE user_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- 2. ACTUALIZAR FUNCIONES DE TRIGGER A SECURITY DEFINER
-- ============================================
-- Esto permite que las funciones se ejecuten con privilegios elevados
-- para poder insertar notificaciones para otros usuarios

-- Función para notificaciones de cambio de estado de aplicación
CREATE OR REPLACE FUNCTION create_application_status_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con privilegios del propietario de la función
SET search_path = public
AS $$
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
$$;

-- Función para notificaciones de solicitudes de documentos
CREATE OR REPLACE FUNCTION create_document_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con privilegios del propietario de la función
SET search_path = public
AS $$
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
$$;

-- Función para notificaciones de mensajes de soporte
CREATE OR REPLACE FUNCTION create_support_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar con privilegios del propietario de la función
SET search_path = public
AS $$
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
$$;

-- ============================================
-- 3. COMENTARIOS
-- ============================================

COMMENT ON POLICY "admin_insert_notifications_for_clients" ON public.notifications IS 
'Permite a admin/super_admin crear notificaciones para cualquier cliente (usado por triggers del sistema)';

COMMENT ON POLICY "support_staff_insert_notifications_for_clients" ON public.notifications IS 
'Permite a support_staff crear notificaciones según su scope (usado por triggers del sistema)';

COMMENT ON POLICY "agent_insert_notifications_for_clients" ON public.notifications IS 
'Permite a agents crear notificaciones para sus propios clientes (usado por triggers del sistema)';

COMMENT ON FUNCTION create_application_status_notification() IS 
'Crea una notificación cuando cambia el estado de una aplicación. Ejecuta con SECURITY DEFINER para poder crear notificaciones para otros usuarios.';

COMMENT ON FUNCTION create_document_request_notification() IS 
'Crea una notificación cuando se crea una nueva solicitud de documento. Ejecuta con SECURITY DEFINER para poder crear notificaciones para otros usuarios.';

COMMENT ON FUNCTION create_support_message_notification() IS 
'Crea una notificación cuando un miembro del staff envía un mensaje en un ticket. Ejecuta con SECURITY DEFINER para poder crear notificaciones para otros usuarios.';

