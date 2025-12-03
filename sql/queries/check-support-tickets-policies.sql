-- ==================================================
-- CONSULTA: Verificar políticas RLS actuales para support_tickets y ticket_messages
-- Descripción: Muestra todas las políticas existentes antes de ejecutar la migración
-- ==================================================

-- ============================================
-- 1. POLÍTICAS PARA SUPPORT_TICKETS
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operation, -- SELECT, INSERT, UPDATE, DELETE
    qual AS using_expression, -- Condición USING
    with_check AS with_check_expression -- Condición WITH CHECK
FROM pg_policies
WHERE tablename = 'support_tickets'
ORDER BY cmd, policyname;

-- ============================================
-- 2. POLÍTICAS PARA TICKET_MESSAGES
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operation, -- SELECT, INSERT, UPDATE, DELETE
    qual AS using_expression, -- Condición USING
    with_check AS with_check_expression -- Condición WITH CHECK
FROM pg_policies
WHERE tablename = 'ticket_messages'
ORDER BY cmd, policyname;

-- ============================================
-- 3. RESUMEN: Contar políticas por operación
-- ============================================

SELECT 
    'support_tickets' AS table_name,
    cmd AS operation,
    COUNT(*) AS policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) AS policy_names
FROM pg_policies
WHERE tablename = 'support_tickets'
GROUP BY cmd
ORDER BY cmd;

SELECT 
    'ticket_messages' AS table_name,
    cmd AS operation,
    COUNT(*) AS policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) AS policy_names
FROM pg_policies
WHERE tablename = 'ticket_messages'
GROUP BY cmd
ORDER BY cmd;

-- ============================================
-- 4. VERIFICAR SI HAY POLÍTICAS PARA CLIENTES
-- ============================================

SELECT 
    tablename,
    policyname,
    cmd AS operation,
    CASE 
        WHEN policyname LIKE '%client%' OR policyname LIKE '%own%' THEN '✅ Posible política para clientes'
        ELSE '❌ No parece ser para clientes'
    END AS client_policy_check
FROM pg_policies
WHERE tablename IN ('support_tickets', 'ticket_messages')
    AND (
        policyname ILIKE '%client%' 
        OR policyname ILIKE '%own%'
        OR qual::text ILIKE '%client%'
        OR qual::text ILIKE '%auth.uid()%'
    )
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 5. VERIFICAR ESTADO DE RLS
-- ============================================

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('support_tickets', 'ticket_messages')
ORDER BY tablename;

