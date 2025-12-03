-- ==================================================
-- MIGRACIÓN: Eliminar vistas con SECURITY DEFINER
-- Descripción: Eliminar vistas no utilizadas que tienen problemas de seguridad
-- ==================================================
-- 
-- Estas vistas fueron creadas con SECURITY DEFINER, lo cual es un riesgo
-- de seguridad. Como no se están utilizando actualmente en el código,
-- las eliminamos para resolver el error del linter de Supabase.
--
-- Si en el futuro necesitas estas vistas, puedes recrearlas fácilmente
-- usando las definiciones guardadas en check-views-definition.sql
-- pero asegurándote de usar SECURITY INVOKER en lugar de SECURITY DEFINER.
-- ==================================================

-- ============================================
-- ELIMINAR VISTAS NO UTILIZADAS
-- ============================================

DROP VIEW IF EXISTS public.v_applications_with_carriers CASCADE;
DROP VIEW IF EXISTS public.v_multi_carrier_applications CASCADE;

-- ============================================
-- NOTAS PARA EL FUTURO
-- ============================================
-- 
-- Si necesitas recrear estas vistas en el futuro:
--
-- 1. Las definiciones están guardadas en:
--    - epicare-dashboard/sql/queries/check-views-definition.sql
--    - Resultado de la consulta ejecutada anteriormente
--
-- 2. Al recrearlas, usa SECURITY INVOKER (no SECURITY DEFINER):
--    CREATE VIEW nombre_vista
--    WITH (security_invoker = true) AS
--    SELECT ...;
--
-- 3. Las vistas NO afectan los datos subyacentes, solo son consultas
--    predefinidas. Eliminarlas o recrearlas es seguro.
-- ============================================

