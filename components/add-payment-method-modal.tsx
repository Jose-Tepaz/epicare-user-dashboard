'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Building2, Loader2 } from 'lucide-react'
import type { PaymentMethodFormData, UserPaymentMethodType } from '@/lib/types/SHARED-TYPES'

// ============================================
// TIPOS
// ============================================

interface AddPaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: PaymentMethodFormData) => Promise<{ success: boolean; error?: string }>
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AddPaymentMethodModal({ open, onOpenChange, onAdd }: AddPaymentMethodModalProps) {
  const [paymentType, setPaymentType] = useState<UserPaymentMethodType>('credit_card')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Campos de tarjeta
  const [cardNumber, setCardNumber] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  
  // Campos de cuenta bancaria
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking')
  const [bankName, setBankName] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  
  // Opciones
  const [nickname, setNickname] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)

  const isCard = paymentType === 'credit_card' || paymentType === 'debit_card'

  const resetForm = () => {
    setCardNumber('')
    setExpiryMonth('')
    setExpiryYear('')
    setCvv('')
    setCardHolderName('')
    setAccountNumber('')
    setRoutingNumber('')
    setAccountType('checking')
    setBankName('')
    setAccountHolderName('')
    setNickname('')
    setSetAsDefault(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const formData: PaymentMethodFormData = {
        paymentMethodType: paymentType,
        nickname: nickname || undefined,
        setAsDefault,
        ...(isCard ? {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryMonth,
          expiryYear,
          cvv,
          cardHolderName,
        } : {
          accountNumber,
          routingNumber,
          accountType,
          bankName,
          accountHolderName,
        }),
      }

      const result = await onAdd(formData)
      
      if (result.success) {
        resetForm()
        onOpenChange(false)
      } else {
        setError(result.error || 'Error al agregar método de pago')
      }
    } catch (err) {
      setError('Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Formatear número de tarjeta
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(' ').substring(0, 19)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Método de Pago</DialogTitle>
          <DialogDescription>
            Agrega una tarjeta o cuenta bancaria para pagos futuros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de pago */}
          <div className="space-y-3">
            <Label>Tipo de método de pago</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as UserPaymentMethodType)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="card"
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  isCard ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem value="credit_card" id="card" className="sr-only" />
                <CreditCard className={`h-5 w-5 ${isCard ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium text-sm">Tarjeta</div>
                  <div className="text-xs text-gray-500">Crédito o débito</div>
                </div>
              </Label>
              
              <Label
                htmlFor="bank"
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  !isCard ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem value="ach" id="bank" className="sr-only" />
                <Building2 className={`h-5 w-5 ${!isCard ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium text-sm">Cuenta Bancaria</div>
                  <div className="text-xs text-gray-500">ACH / Bank Transfer</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Campos de tarjeta */}
          {isCard && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="expiryMonth">Mes</Label>
                  <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = String(i + 1).padStart(2, '0')
                        return (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="expiryYear">Año</Label>
                  <Select value={expiryYear} onValueChange={setExpiryYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="YY" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = String(new Date().getFullYear() + i).slice(-2)
                        return (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cardHolderName">Nombre en la tarjeta</Label>
                <Input
                  id="cardHolderName"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="JOHN DOE"
                  required
                />
              </div>
            </div>
          )}

          {/* Campos de cuenta bancaria */}
          {!isCard && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bankName">Nombre del banco</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank of America"
                />
              </div>
              
              <div>
                <Label htmlFor="accountType">Tipo de cuenta</Label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as 'checking' | 'savings')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking (Corriente)</SelectItem>
                    <SelectItem value="savings">Savings (Ahorros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="routingNumber">Número de Routing (ABA)</Label>
                <Input
                  id="routingNumber"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').substring(0, 9))}
                  placeholder="123456789"
                  maxLength={9}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Número de cuenta</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234567890"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="accountHolderName">Nombre del titular</Label>
                <Input
                  id="accountHolderName"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Opciones adicionales */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="nickname">Apodo (opcional)</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Mi tarjeta personal"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="setAsDefault"
                checked={setAsDefault}
                onCheckedChange={(checked) => setSetAsDefault(checked === true)}
              />
              <Label htmlFor="setAsDefault" className="text-sm font-normal cursor-pointer">
                Establecer como método de pago predeterminado
              </Label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Método de Pago'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

