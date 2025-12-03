/**
 * Utilidades para interactuar con Supabase Vault
 * 
 * Supabase Vault proporciona encriptación transparente para datos sensibles.
 * Los datos se almacenan encriptados y solo se pueden leer mediante
 * la vista vault.decrypted_secrets.
 * 
 * Documentación: https://supabase.com/docs/guides/database/vault
 */

import { createClient } from '@/lib/supabase/server'

// ============================================
// TIPOS
// ============================================

export interface VaultCardData {
  cardNumber: string
  cvv: string
}

export interface VaultBankData {
  accountNumber: string
  routingNumber: string
}

export interface VaultSecretResult {
  success: boolean
  secretId?: string
  error?: string
}

// ============================================
// FUNCIONES PARA GUARDAR DATOS EN VAULT
// ============================================

/**
 * Guarda datos sensibles de tarjeta en Supabase Vault
 * 
 * @param cardData - Datos de la tarjeta (número y CVV)
 * @param description - Descripción opcional del secreto
 * @returns ID del secreto creado
 */
export async function saveCardToVault(
  cardData: VaultCardData,
  description?: string
): Promise<VaultSecretResult> {
  try {
    const supabase = await createClient()
    
    // Crear el secreto en vault
    // La función vault.create_secret encripta automáticamente los datos
    const { data, error } = await supabase.rpc('create_vault_secret', {
      secret_value: JSON.stringify(cardData),
      secret_name: `card_${Date.now()}`,
      secret_description: description || 'Credit/Debit Card Data'
    })

    if (error) {
      console.error('Error saving card to vault:', error)
      return { success: false, error: error.message }
    }

    return { success: true, secretId: data }
  } catch (err) {
    console.error('Vault error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown vault error' 
    }
  }
}

/**
 * Guarda datos sensibles de cuenta bancaria en Supabase Vault
 * 
 * @param bankData - Datos de la cuenta (número y routing)
 * @param description - Descripción opcional del secreto
 * @returns ID del secreto creado
 */
export async function saveBankToVault(
  bankData: VaultBankData,
  description?: string
): Promise<VaultSecretResult> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('create_vault_secret', {
      secret_value: JSON.stringify(bankData),
      secret_name: `bank_${Date.now()}`,
      secret_description: description || 'Bank Account Data'
    })

    if (error) {
      console.error('Error saving bank data to vault:', error)
      return { success: false, error: error.message }
    }

    return { success: true, secretId: data }
  } catch (err) {
    console.error('Vault error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown vault error' 
    }
  }
}

// ============================================
// FUNCIONES PARA LEER DATOS DE VAULT
// ============================================

/**
 * Obtiene datos de tarjeta desde Vault
 * NOTA: Solo usar para procesamiento interno, nunca exponer al cliente
 * 
 * @param secretId - ID del secreto en Vault
 * @returns Datos de la tarjeta o null
 */
export async function getCardFromVault(
  secretId: string
): Promise<VaultCardData | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('get_vault_secret', {
      secret_id: secretId
    })

    if (error || !data) {
      console.error('Error reading card from vault:', error)
      return null
    }

    return JSON.parse(data) as VaultCardData
  } catch (err) {
    console.error('Vault read error:', err)
    return null
  }
}

/**
 * Obtiene datos de cuenta bancaria desde Vault
 * NOTA: Solo usar para procesamiento interno, nunca exponer al cliente
 * 
 * @param secretId - ID del secreto en Vault
 * @returns Datos de la cuenta o null
 */
export async function getBankFromVault(
  secretId: string
): Promise<VaultBankData | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('get_vault_secret', {
      secret_id: secretId
    })

    if (error || !data) {
      console.error('Error reading bank data from vault:', error)
      return null
    }

    return JSON.parse(data) as VaultBankData
  } catch (err) {
    console.error('Vault read error:', err)
    return null
  }
}

// ============================================
// FUNCIONES PARA ELIMINAR DATOS DE VAULT
// ============================================

/**
 * Elimina un secreto de Vault
 * 
 * @param secretId - ID del secreto a eliminar
 * @returns true si se eliminó correctamente
 */
export async function deleteSecretFromVault(
  secretId: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.rpc('delete_vault_secret', {
      secret_id: secretId
    })

    if (error) {
      console.error('Error deleting secret from vault:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Vault delete error:', err)
    return false
  }
}

// ============================================
// UTILIDADES DE VALIDACIÓN
// ============================================

/**
 * Obtiene los últimos 4 dígitos de un número
 */
export function getLastFour(number: string): string {
  const cleaned = number.replace(/\D/g, '')
  return cleaned.slice(-4)
}

/**
 * Detecta la marca de tarjeta según el número
 */
export function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // Visa: comienza con 4
  if (/^4/.test(cleaned)) return 'Visa'
  
  // Mastercard: comienza con 51-55 o 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'Mastercard'
  
  // American Express: comienza con 34 o 37
  if (/^3[47]/.test(cleaned)) return 'American Express'
  
  // Discover: comienza con 6011, 622, 64, 65
  if (/^(6011|622|64|65)/.test(cleaned)) return 'Discover'
  
  return 'Unknown'
}

/**
 * Valida número de tarjeta con algoritmo Luhn
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (cleaned.length < 13 || cleaned.length > 19) return false
  
  let sum = 0
  let isEven = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Valida CVV
 */
export function validateCVV(cvv: string, cardBrand?: string): boolean {
  const cleaned = cvv.replace(/\D/g, '')
  
  // Amex tiene 4 dígitos, otros tienen 3
  if (cardBrand === 'American Express') {
    return cleaned.length === 4
  }
  
  return cleaned.length === 3
}

/**
 * Valida fecha de expiración
 */
export function validateExpiryDate(month: string, year: string): boolean {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  const expMonth = parseInt(month, 10)
  const expYear = parseInt(year, 10)
  
  // Año con 2 dígitos
  const fullYear = expYear < 100 ? 2000 + expYear : expYear
  
  if (expMonth < 1 || expMonth > 12) return false
  if (fullYear < currentYear) return false
  if (fullYear === currentYear && expMonth < currentMonth) return false
  
  return true
}

/**
 * Valida routing number (ABA)
 */
export function validateRoutingNumber(routingNumber: string): boolean {
  const cleaned = routingNumber.replace(/\D/g, '')
  
  if (cleaned.length !== 9) return false
  
  // Checksum validation
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * weights[i]
  }
  
  return sum % 10 === 0
}

/**
 * Valida número de cuenta bancaria
 */
export function validateAccountNumber(accountNumber: string): boolean {
  const cleaned = accountNumber.replace(/\D/g, '')
  return cleaned.length >= 4 && cleaned.length <= 17
}

