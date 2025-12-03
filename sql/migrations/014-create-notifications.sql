-- ==================================================
-- MIGRACIÓN: Crear tabla notifications
-- Descripción: Sistema de notificaciones para usuarios del dashboard
-- ==================================================

-- ============================================
-- 1. TABLA DE NOTIFICACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo de notificación
  type VARCHAR(50) NOT NULL CHECK (type IN ('application', 'document', 'support')),
  
  -- Contenido de la notificación
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT, -- URL a la página relacionada (ej: /applications/[id])
  
  -- Metadata adicional (JSONB para flexibilidad)
  metadata JSONB, -- Datos adicionales: application_id, document_id, ticket_id, etc.
  
  -- Estado de lectura
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. ÍNDICES
-- ============================================

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Índice para notificaciones no leídas (más común)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Índice para búsquedas por metadata (document_request_id, ticket_id, etc.)
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN(metadata);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo pueden ver/editar sus propias notificaciones
DROP POLICY IF EXISTS "users_manage_own_notifications" ON notifications;
CREATE POLICY "users_manage_own_notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. COMENTARIOS EN TABLA Y COLUMNAS
-- ============================================

COMMENT ON TABLE notifications IS 'Notificaciones del sistema para usuarios del dashboard';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: application, document, support';
COMMENT ON COLUMN notifications.metadata IS 'Datos adicionales en formato JSON: application_id, document_request_id, ticket_id, etc.';
COMMENT ON COLUMN notifications.link_url IS 'URL para navegar a la página relacionada con la notificación';

