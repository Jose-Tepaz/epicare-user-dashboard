-- ==================================================
-- MIGRACIÓN: Políticas RLS para clientes en support_tickets
-- Descripción: Permitir a los clientes crear y gestionar sus propios tickets de soporte
-- ==================================================

-- ============================================
-- 1. POLÍTICAS PARA SUPPORT_TICKETS
-- ============================================

-- Clientes pueden ver sus propios tickets
DROP POLICY IF EXISTS "clients_select_own_tickets" ON public.support_tickets;
CREATE POLICY "clients_select_own_tickets" ON public.support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'client'
      AND (
        support_tickets.client_id = auth.uid()
        OR support_tickets.created_by = auth.uid()
      )
    )
  );

-- Clientes pueden crear sus propios tickets
DROP POLICY IF EXISTS "clients_insert_own_tickets" ON public.support_tickets;
CREATE POLICY "clients_insert_own_tickets" ON public.support_tickets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'client'
    )
    AND (
      client_id = auth.uid()
      OR created_by = auth.uid()
    )
  );

-- Clientes pueden actualizar sus propios tickets (solo ciertos campos)
DROP POLICY IF EXISTS "clients_update_own_tickets" ON public.support_tickets;
CREATE POLICY "clients_update_own_tickets" ON public.support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'client'
      AND (
        support_tickets.client_id = auth.uid()
        OR support_tickets.created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'client'
      AND (
        support_tickets.client_id = auth.uid()
        OR support_tickets.created_by = auth.uid()
      )
    )
  );

-- ============================================
-- 2. POLÍTICAS PARA TICKET_MESSAGES
-- ============================================

-- Clientes pueden ver mensajes de sus tickets (solo mensajes no internos)
DROP POLICY IF EXISTS "clients_select_own_ticket_messages" ON public.ticket_messages;
CREATE POLICY "clients_select_own_ticket_messages" ON public.ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'client'
      AND EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id = ticket_messages.ticket_id
        AND (
          st.client_id = auth.uid()
          OR st.created_by = auth.uid()
        )
      )
      AND NOT ticket_messages.is_internal -- Clientes no ven mensajes internos
    )
  );

-- Clientes pueden crear mensajes en sus tickets
DROP POLICY IF EXISTS "clients_insert_own_ticket_messages" ON public.ticket_messages;
CREATE POLICY "clients_insert_own_ticket_messages" ON public.ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'client'
      AND sender_id = auth.uid()
      AND NOT is_internal -- Los mensajes de clientes nunca son internos
      AND EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id = ticket_messages.ticket_id
        AND (
          st.client_id = auth.uid()
          OR st.created_by = auth.uid()
        )
      )
    )
  );

-- ============================================
-- 3. COMENTARIOS
-- ============================================

COMMENT ON POLICY "clients_select_own_tickets" ON public.support_tickets IS 
'Permite a los clientes ver sus propios tickets de soporte';

COMMENT ON POLICY "clients_insert_own_tickets" ON public.support_tickets IS 
'Permite a los clientes crear sus propios tickets de soporte';

COMMENT ON POLICY "clients_update_own_tickets" ON public.support_tickets IS 
'Permite a los clientes actualizar sus propios tickets de soporte';

COMMENT ON POLICY "clients_select_own_ticket_messages" ON public.ticket_messages IS 
'Permite a los clientes ver mensajes de sus tickets (excluyendo mensajes internos)';

COMMENT ON POLICY "clients_insert_own_ticket_messages" ON public.ticket_messages IS 
'Permite a los clientes crear mensajes en sus propios tickets';

