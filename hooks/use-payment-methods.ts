'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserPaymentMethod, PaymentMethodFormData, BillingAddress } from '@/lib/types/SHARED-TYPES'
import { detectCardBrand, getLastFour } from '@/lib/utils/vault'

// ============================================
// TIPOS DE RETORNO
// ============================================

interface UsePaymentMethodsReturn {
  methods: UserPaymentMethod[]
  loading: boolean
  error: string | null
  addMethod: (data: PaymentMethodFormData) => Promise<{ success: boolean; error?: string }>
  updateMethod: (id: string, data: Partial<UserPaymentMethod>) => Promise<{ success: boolean; error?: string }>
  deleteMethod: (id: string) => Promise<{ success: boolean; error?: string }>
  setDefault: (id: string) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function usePaymentMethods(userId: string | null): UsePaymentMethodsReturn {
  const [methods, setMethods] = useState<UserPaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // ============================================
  // FETCH MÉTODOS DE PAGO
  // ============================================
  
  const fetchMethods = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setMethods(data || [])
    } catch (err) {
      console.error('Error fetching payment methods:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar métodos de pago')
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  // ============================================
  // AGREGAR MÉTODO DE PAGO
  // ============================================
  
  const addMethod = async (data: PaymentMethodFormData): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      // Llamar al API route que maneja el Vault
      const response = await fetch('/api/settings/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Error al agregar método de pago' }
      }

      // Refrescar la lista
      await fetchMethods()
      
      return { success: true }
    } catch (err) {
      console.error('Error adding payment method:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      }
    }
  }

  // ============================================
  // ACTUALIZAR MÉTODO DE PAGO
  // ============================================
  
  const updateMethod = async (
    id: string, 
    data: Partial<UserPaymentMethod>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      const response = await fetch(`/api/settings/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Error al actualizar método de pago' }
      }

      // Refrescar la lista
      await fetchMethods()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating payment method:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      }
    }
  }

  // ============================================
  // ELIMINAR MÉTODO DE PAGO (SOFT DELETE)
  // ============================================
  
  const deleteMethod = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      const response = await fetch(`/api/settings/payment-methods/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Error al eliminar método de pago' }
      }

      // Refrescar la lista
      await fetchMethods()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting payment method:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      }
    }
  }

  // ============================================
  // ESTABLECER COMO PREDETERMINADO
  // ============================================
  
  const setDefault = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    try {
      const response = await fetch(`/api/settings/payment-methods/${id}/set-default`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Error al establecer como predeterminado' }
      }

      // Refrescar la lista
      await fetchMethods()
      
      return { success: true }
    } catch (err) {
      console.error('Error setting default payment method:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      }
    }
  }

  // ============================================
  // EFFECT PARA CARGAR DATOS INICIALES
  // ============================================
  
  useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  return {
    methods,
    loading,
    error,
    addMethod,
    updateMethod,
    deleteMethod,
    setDefault,
    refresh: fetchMethods
  }
}

// ============================================
// UTILIDADES PARA EL HOOK
// ============================================

/**
 * Formatea un método de pago para mostrar
 */
export function formatPaymentMethod(method: UserPaymentMethod): string {
  if (method.payment_method === 'credit_card' || method.payment_method === 'debit_card') {
    return `${method.card_brand || 'Card'} ending in ${method.card_last_four}`
  }
  
  if (method.payment_method === 'ach' || method.payment_method === 'bank_account') {
    return `${method.bank_name || 'Bank'} ${method.account_type || 'account'} ending in ${method.account_last_four}`
  }
  
  return 'Unknown payment method'
}

/**
 * Obtiene el icono/color apropiado para la marca de tarjeta
 */
export function getCardBrandInfo(brand: string | null): { color: string; icon: string } {
  const brandLower = (brand || '').toLowerCase()
  
  switch (brandLower) {
    case 'visa':
      return { color: '#1A1F71', icon: '💳' }
    case 'mastercard':
      return { color: '#EB001B', icon: '💳' }
    case 'american express':
    case 'amex':
      return { color: '#006FCF', icon: '💳' }
    case 'discover':
      return { color: '#FF6000', icon: '💳' }
    default:
      return { color: '#6B7280', icon: '💳' }
  }
}

/**
 * Verifica si una tarjeta está expirada
 */
export function isCardExpired(month: string | null, year: string | null): boolean {
  if (!month || !year) return false
  
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  const expMonth = parseInt(month, 10)
  const expYear = parseInt(year, 10)
  const fullYear = expYear < 100 ? 2000 + expYear : expYear
  
  return fullYear < currentYear || (fullYear === currentYear && expMonth < currentMonth)
}

/**
 * Obtiene el método de pago predeterminado
 */
export function getDefaultMethod(methods: UserPaymentMethod[]): UserPaymentMethod | null {
  return methods.find(m => m.is_default) || methods[0] || null
}

