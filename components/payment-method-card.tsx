'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CreditCard, Building2, Star, Trash2, Loader2 } from 'lucide-react'
import type { UserPaymentMethod } from '@/lib/types/SHARED-TYPES'
import { isCardExpired } from '@/hooks/use-payment-methods'

// ============================================
// TIPOS
// ============================================

interface PaymentMethodCardProps {
  method: UserPaymentMethod
  onSetDefault: (id: string) => Promise<{ success: boolean; error?: string }>
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
}

// ============================================
// UTILIDADES
// ============================================

function getCardBrandColor(brand: string | null): string {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return 'bg-blue-600'
    case 'mastercard':
      return 'bg-orange-500'
    case 'american express':
      return 'bg-blue-400'
    case 'discover':
      return 'bg-orange-600'
    default:
      return 'bg-gray-500'
  }
}

function getCardBrandLogo(brand: string | null): string {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return 'VISA'
    case 'mastercard':
      return 'MC'
    case 'american express':
      return 'AMEX'
    case 'discover':
      return 'DISC'
    default:
      return 'CARD'
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function PaymentMethodCard({ method, onSetDefault, onDelete }: PaymentMethodCardProps) {
  const [isSettingDefault, setIsSettingDefault] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isCard = method.payment_method === 'credit_card' || method.payment_method === 'debit_card'
  const isBank = method.payment_method === 'ach' || method.payment_method === 'bank_account'
  const expired = isCard && isCardExpired(method.card_expiry_month, method.card_expiry_year)

  const handleSetDefault = async () => {
    if (method.is_default) return
    setIsSettingDefault(true)
    await onSetDefault(method.id)
    setIsSettingDefault(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(method.id)
    setIsDeleting(false)
  }

  return (
    <Card className={`relative overflow-hidden ${expired ? 'border-red-300' : ''}`}>
      {/* Indicador de color de marca */}
      {isCard && (
        <div className={`absolute top-0 left-0 w-1 h-full ${getCardBrandColor(method.card_brand)}`} />
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          {/* Icono y detalles */}
          <div className="flex items-start gap-3">
            {/* Icono */}
            <div className={`p-2 rounded-lg ${isCard ? 'bg-slate-100' : 'bg-emerald-100'}`}>
              {isCard ? (
                <CreditCard className="h-5 w-5 text-slate-600" />
              ) : (
                <Building2 className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            
            {/* Detalles */}
            <div className="space-y-1">
              {/* Título */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {isCard ? (
                    <>
                      <span className="text-xs font-bold mr-1.5 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {getCardBrandLogo(method.card_brand)}
                      </span>
                      •••• {method.card_last_four}
                    </>
                  ) : (
                    <>
                      {method.bank_name || 'Bank Account'}
                      <span className="text-slate-500 ml-1">
                        •••• {method.account_last_four}
                      </span>
                    </>
                  )}
                </span>
                
                {/* Badges */}
                {method.is_default && (
                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                    <Star className="h-3 w-3 mr-0.5 fill-current" />
                    Default
                  </Badge>
                )}
                {expired && (
                  <Badge variant="destructive" className="text-xs py-0 px-1.5">
                    Expired
                  </Badge>
                )}
              </div>
              
              {/* Información adicional */}
              <div className="text-xs text-slate-500">
                {isCard && method.card_expiry_month && method.card_expiry_year && (
                  <span>
                    Expires {method.card_expiry_month}/{method.card_expiry_year}
                  </span>
                )}
                {isBank && method.account_type && (
                  <span className="capitalize">{method.account_type} Account</span>
                )}
              </div>
              
              {/* Nombre del titular */}
              {(method.card_holder_name || method.account_holder_name) && (
                <div className="text-xs text-slate-400">
                  {method.card_holder_name || method.account_holder_name}
                </div>
              )}
              
              {/* Nickname */}
              {method.nickname && (
                <div className="text-xs text-emerald-600 font-medium">
                  "{method.nickname}"
                </div>
              )}
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex items-center gap-1">
            {/* Establecer como predeterminado */}
            {!method.is_default && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSetDefault}
                disabled={isSettingDefault}
                className="text-xs h-7 px-2"
              >
                {isSettingDefault ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Star className="h-3 w-3 mr-1" />
                    Set Default
                  </>
                )}
              </Button>
            )}
            
            {/* Eliminar */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará el método de pago terminado en 
                    <strong className="mx-1">
                      {isCard ? method.card_last_four : method.account_last_four}
                    </strong>
                    de tu cuenta. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

