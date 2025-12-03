-- ==================================================
-- CONSULTA SIMPLIFICADA: Ver todas las políticas RLS actuales
-- Ejecuta esta consulta para ver el estado completo
-- ==================================================

-- Ver todas las políticas de support_tickets y ticket_messages
SELECT 
    tablename,
    policyname,
    cmd AS operation,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 Lectura'
        WHEN cmd = 'INSERT' THEN '➕ Crear'
        WHEN cmd = 'UPDATE' THEN '✏️ Actualizar'
        WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
        ELSE cmd::text
    END AS operation_label,
    CASE 
        WHEN policyname ILIKE '%client%' OR qual::text ILIKE '%role%client%' THEN '👤 Cliente'
        WHEN policyname ILIKE '%admin%' OR policyname ILIKE '%staff%' OR policyname ILIKE '%agent%' THEN '👔 Staff'
        ELSE '❓ Desconocido'
    END AS target_role,
    LEFT(qual::text, 100) AS condition_preview -- Primeros 100 caracteres de la condición
FROM pg_policies
WHERE tablename IN ('support_tickets', 'ticket_messages')
ORDER BY tablename, cmd, policyname;

