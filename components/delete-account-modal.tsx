'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'

// ============================================
// TIPOS
// ============================================

interface DeleteAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (confirmation: string) => Promise<{ success: boolean; error?: string }>
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DeleteAccountModal({ open, onOpenChange, onDelete }: DeleteAccountModalProps) {
  const [confirmation, setConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = confirmation === 'DELETE'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      setError('Debes escribir DELETE para confirmar')
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      const result = await onDelete(confirmation)
      
      if (result.success) {
        // Redirigir a la página de login
        window.location.href = '/auth/login'
      } else {
        setError(result.error || 'Error al eliminar cuenta')
        setIsDeleting(false)
      }
    } catch (err) {
      setError('Error inesperado')
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setConfirmation('')
      setError(null)
      onOpenChange(newOpen)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">Eliminar Cuenta</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <strong>¡Advertencia!</strong> Esta acción es permanente y no se puede deshacer.
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium">Al eliminar tu cuenta:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Perderás acceso a todas tus aplicaciones de seguro</li>
                <li>Tus documentos guardados serán eliminados</li>
                <li>No podrás recuperar tu historial de pagos</li>
                <li>Tus métodos de pago guardados serán eliminados</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="confirmation">
              Escribe <span className="font-bold text-red-600">DELETE</span> para confirmar
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
              disabled={isDeleting}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <AlertDialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Mi Cuenta'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

