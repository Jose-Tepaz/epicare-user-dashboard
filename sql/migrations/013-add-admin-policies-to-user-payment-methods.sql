-- =====================================================
-- MIGRACIÓN: Agregar políticas RLS para admins en user_payment_methods
-- Permite a admins y agents acceder a métodos de pago para procesar enrollments
-- =====================================================

-- 1. Política para que admins puedan ver métodos de pago de usuarios
DROP POLICY IF EXISTS "admins_select_user_payment_methods" ON user_payment_methods;
CREATE POLICY "admins_select_user_payment_methods" ON user_payment_methods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'admin', 'agent')
    )
  );

-- 2. Política similar para que agents puedan ver métodos de pago de SUS usuarios asignados
-- (Opcional: puedes descomentar si quieres restringir a agents solo a sus usuarios)
-- DROP POLICY IF EXISTS "agents_select_assigned_user_payment_methods" ON user_payment_methods;
-- CREATE POLICY "agents_select_assigned_user_payment_methods" ON user_payment_methods
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE users.id = user_payment_methods.user_id 
--       AND users.assigned_agent_id = auth.uid()
--     )
--   );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que las políticas se crearon:
-- SELECT * FROM pg_policies WHERE tablename = 'user_payment_methods';

