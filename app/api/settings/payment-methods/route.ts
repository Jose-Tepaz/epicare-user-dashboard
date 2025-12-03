import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PaymentMethodFormData } from '@/lib/types/SHARED-TYPES'

// ============================================
// GET: Obtener métodos de pago del usuario
// ============================================

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener métodos de pago activos
    const { data: methods, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json(
        { error: 'Error al obtener métodos de pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, methods })
  } catch (err) {
    console.error('Payment methods GET error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: Agregar nuevo método de pago
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const data: PaymentMethodFormData = await request.json()

    // Validar datos requeridos
    if (!data.paymentMethodType) {
      return NextResponse.json(
        { error: 'Tipo de método de pago requerido' },
        { status: 400 }
      )
    }

    // Preparar datos para insertar
    const paymentMethodData: any = {
      user_id: user.id,
      payment_method: data.paymentMethodType,
      is_default: data.setAsDefault || false,
      is_active: true,
      nickname: data.nickname || null
    }

    // Datos según tipo de método
    if (data.paymentMethodType === 'credit_card' || data.paymentMethodType === 'debit_card') {
      // Validar campos de tarjeta
      if (!data.cardNumber || !data.expiryMonth || !data.expiryYear || !data.cvv) {
        return NextResponse.json(
          { error: 'Datos de tarjeta incompletos' },
          { status: 400 }
        )
      }

      // Detectar marca de tarjeta
      const cardBrand = detectCardBrand(data.cardNumber)
      
      // Guardar datos en Vault
      let vaultSecretId = null
      try {
        const { data: secretId, error: vaultError } = await supabase.rpc('create_vault_secret', {
          secret_value: JSON.stringify({
            cardNumber: data.cardNumber,
            cvv: data.cvv
          }),
          secret_name: `card_${user.id}_${Date.now()}`,
          secret_description: `Card ending in ${getLastFour(data.cardNumber)}`
        })

        if (vaultError) {
          console.error('Vault error:', vaultError)
          // Continuar sin Vault si falla (degradación elegante)
        } else {
          vaultSecretId = secretId
        }
      } catch (vaultErr) {
        console.error('Vault exception:', vaultErr)
      }

      paymentMethodData.card_last_four = getLastFour(data.cardNumber)
      paymentMethodData.card_brand = cardBrand
      paymentMethodData.card_expiry_month = data.expiryMonth
      paymentMethodData.card_expiry_year = data.expiryYear
      paymentMethodData.card_holder_name = data.cardHolderName || null
      paymentMethodData.vault_secret_id = vaultSecretId

    } else if (data.paymentMethodType === 'ach' || data.paymentMethodType === 'bank_account') {
      // Validar campos de cuenta bancaria
      if (!data.accountNumber || !data.routingNumber) {
        return NextResponse.json(
          { error: 'Datos de cuenta bancaria incompletos' },
          { status: 400 }
        )
      }

      // Guardar datos en Vault
      let vaultSecretId = null
      try {
        const { data: secretId, error: vaultError } = await supabase.rpc('create_vault_secret', {
          secret_value: JSON.stringify({
            accountNumber: data.accountNumber,
            routingNumber: data.routingNumber
          }),
          secret_name: `bank_${user.id}_${Date.now()}`,
          secret_description: `Bank account ending in ${getLastFour(data.accountNumber)}`
        })

        if (vaultError) {
          console.error('Vault error:', vaultError)
        } else {
          vaultSecretId = secretId
        }
      } catch (vaultErr) {
        console.error('Vault exception:', vaultErr)
      }

      paymentMethodData.account_last_four = getLastFour(data.accountNumber)
      paymentMethodData.account_type = data.accountType || 'checking'
      paymentMethodData.bank_name = data.bankName || null
      paymentMethodData.account_holder_name = data.accountHolderName || null
      paymentMethodData.vault_secret_id = vaultSecretId
    }

    // Insertar en la base de datos
    const { data: newMethod, error: insertError } = await supabase
      .from('user_payment_methods')
      .insert(paymentMethodData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Error al guardar método de pago' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      paymentMethod: newMethod 
    })
  } catch (err) {
    console.error('Payment methods POST error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================
// UTILIDADES
// ============================================

function getLastFour(number: string): string {
  const cleaned = number.replace(/\D/g, '')
  return cleaned.slice(-4)
}

function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (/^4/.test(cleaned)) return 'Visa'
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'Mastercard'
  if (/^3[47]/.test(cleaned)) return 'American Express'
  if (/^(6011|622|64|65)/.test(cleaned)) return 'Discover'
  
  return 'Unknown'
}

