-- ==================================================
-- CONSULTA: Ver definición de vistas con SECURITY DEFINER
-- Descripción: Obtener la definición completa de las vistas problemáticas
-- ==================================================
-- Ejecuta estas consultas UNA POR UNA en Supabase SQL Editor
-- ==================================================

-- Consulta 1: Ver definición básica de las vistas
SELECT 
    schemaname,
    viewname,
    definition,
    viewowner
FROM pg_views
WHERE viewname IN ('v_applications_with_carriers', 'v_multi_carrier_applications')
ORDER BY viewname;

-- Consulta 2: Ver definición completa con pg_get_viewdef
SELECT 
    n.nspname AS schema_name,
    c.relname AS view_name,
    pg_get_viewdef(c.oid, true) AS full_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('v_applications_with_carriers', 'v_multi_carrier_applications')
AND c.relkind = 'v'
ORDER BY c.relname;

