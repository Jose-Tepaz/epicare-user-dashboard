-- ==================================================
-- MIGRACIÓN: Crear tabla user_payment_methods
-- Descripción: Métodos de pago guardados a nivel de usuario
-- para reutilización entre aplicaciones
-- ==================================================

-- ============================================
-- 1. TABLA DE MÉTODOS DE PAGO DEL USUARIO
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo de método de pago
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'ach', 'bank_account')),
  
  -- ============================================
  -- DATOS DE TARJETA DE CRÉDITO/DÉBITO
  -- (Solo información no sensible, visible al usuario)
  -- ============================================
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),           -- Visa, Mastercard, American Express, Discover
  card_expiry_month VARCHAR(2),
  card_expiry_year VARCHAR(4),
  card_holder_name TEXT,
  
  -- ============================================
  -- DATOS DE CUENTA BANCARIA (ACH)
  -- (Solo información no sensible, visible al usuario)
  -- ============================================
  account_last_four VARCHAR(4),
  account_type VARCHAR(50),         -- checking, savings
  bank_name TEXT,
  account_holder_name TEXT,
  
  -- ============================================
  -- REFERENCIA A SUPABASE VAULT
  -- (Datos sensibles encriptados)
  -- ============================================
  vault_secret_id UUID,             -- ID del secreto en vault.secrets
  
  -- ============================================
  -- NOMBRE PERSONALIZADO Y ESTADO
  -- ============================================
  nickname VARCHAR(100),            -- Ej: "Mi tarjeta personal", "Cuenta de ahorros"
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,   -- Soft delete
  
  -- ============================================
  -- METADATA Y TIMESTAMPS
  -- ============================================
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comentarios de documentación
COMMENT ON TABLE public.user_payment_methods IS 'Métodos de pago guardados del usuario, reutilizables entre aplicaciones';
COMMENT ON COLUMN public.user_payment_methods.vault_secret_id IS 'Referencia a vault.secrets para datos sensibles (número de tarjeta, CVV, número de cuenta, routing)';
COMMENT ON COLUMN public.user_payment_methods.is_active IS 'Soft delete: false indica que el método fue eliminado pero se mantiene para historial';
-- NOTA: billing_address eliminada - se usa la dirección de la tabla users

-- ============================================
-- 2. ÍNDICES
-- ============================================

CREATE INDEX idx_user_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_active ON user_payment_methods(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_payment_methods_default ON user_payment_methods(user_id, is_default) WHERE is_default = true AND is_active = true;
CREATE INDEX idx_user_payment_methods_type ON user_payment_methods(user_id, payment_method);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo pueden ver sus propios métodos de pago
CREATE POLICY "users_select_own_payment_methods" ON user_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuarios solo pueden insertar sus propios métodos de pago
CREATE POLICY "users_insert_own_payment_methods" ON user_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios solo pueden actualizar sus propios métodos de pago
CREATE POLICY "users_update_own_payment_methods" ON user_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuarios solo pueden eliminar sus propios métodos de pago
CREATE POLICY "users_delete_own_payment_methods" ON user_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TRIGGER PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_user_payment_methods_updated_at
  BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. FUNCIÓN PARA ASEGURAR UN SOLO DEFAULT
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el nuevo registro es default, quitar default de los demás
  IF NEW.is_default = true THEN
    UPDATE user_payment_methods
    SET is_default = false, updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payment
  AFTER INSERT OR UPDATE OF is_default ON user_payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- ============================================
-- 6. MODIFICAR application_payment_info
-- Agregar referencia a método guardado del usuario
-- ============================================

ALTER TABLE application_payment_info 
  ADD COLUMN IF NOT EXISTS user_payment_method_id UUID REFERENCES user_payment_methods(id);

CREATE INDEX IF NOT EXISTS idx_app_payment_user_method ON application_payment_info(user_payment_method_id);

COMMENT ON COLUMN application_payment_info.user_payment_method_id IS 'Referencia a método de pago guardado del usuario. Si es NULL, los datos están directamente en esta tabla.';

-- ============================================
-- 7. FUNCIONES RPC PARA VAULT
-- Estas funciones permiten interactuar con Supabase Vault
-- desde el cliente de forma segura
-- ============================================

-- Crear secreto en Vault
CREATE OR REPLACE FUNCTION create_vault_secret(
  secret_value TEXT,
  secret_name TEXT,
  secret_description TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE
  new_secret_id UUID;
BEGIN
  -- Verificar que el usuario está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create secrets';
  END IF;
  
  -- Insertar en vault.secrets
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (secret_value, secret_name, secret_description)
  RETURNING id INTO new_secret_id;
  
  RETURN new_secret_id;
END;
$$;

-- Obtener secreto de Vault (solo para uso interno/backend)
CREATE OR REPLACE FUNCTION get_vault_secret(secret_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE
  decrypted_value TEXT;
BEGIN
  -- Verificar que el usuario está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to read secrets';
  END IF;
  
  -- Obtener el secreto desencriptado
  SELECT decrypted_secret INTO decrypted_value
  FROM vault.decrypted_secrets
  WHERE id = secret_id;
  
  IF decrypted_value IS NULL THEN
    RAISE EXCEPTION 'Secret not found or access denied';
  END IF;
  
  RETURN decrypted_value;
END;
$$;

-- Eliminar secreto de Vault
CREATE OR REPLACE FUNCTION delete_vault_secret(secret_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
BEGIN
  -- Verificar que el usuario está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete secrets';
  END IF;
  
  -- Eliminar el secreto
  DELETE FROM vault.secrets
  WHERE id = secret_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- 8. VERIFICACIÓN DE MIGRACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migración 012-create-user-payment-methods completada exitosamente';
  RAISE NOTICE 'Tabla user_payment_methods creada con RLS habilitado';
  RAISE NOTICE 'Columna user_payment_method_id agregada a application_payment_info';
  RAISE NOTICE 'Funciones RPC para Vault creadas';
END $$;

