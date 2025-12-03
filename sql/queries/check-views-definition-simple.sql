-- ==================================================
-- CONSULTA SIMPLE: Ver definición de vistas
-- Ejecuta esta consulta en Supabase SQL Editor
-- ==================================================

-- Ver definición de las vistas problemáticas
SELECT 
    viewname,
    definition
FROM pg_views
WHERE viewname IN ('v_applications_with_carriers', 'v_multi_carrier_applications')
ORDER BY viewname;

