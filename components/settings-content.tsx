"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Search, Bell, Shield, CreditCard, User, AlertTriangle, Plus, Loader2 } from "lucide-react"
import { usePaymentMethods } from "@/hooks/use-payment-methods"
import { PaymentMethodCard } from "@/components/payment-method-card"
import { AddPaymentMethodModal } from "@/components/add-payment-method-modal"
import { DeleteAccountModal } from "@/components/delete-account-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

const settingsCategories = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
]

export function SettingsContent() {
  const [activeCategory, setActiveCategory] = useState("account")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const supabase = createClient()
  
  // Estado del usuario
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estado del perfil
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  
  // Estado de seguridad
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Estado de modales
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  
  // Hook de métodos de pago
  const { 
    methods: paymentMethods, 
    loading: loadingPaymentMethods,
    addMethod,
    deleteMethod,
    setDefault
  } = usePaymentMethods(userId)

  // Cargar usuario actual
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setEmail(user.email || "")
          
          // Cargar perfil desde la tabla users
          const { data: profile } = await supabase
            .from("users")
            .select("first_name, last_name, phone")
            .eq("id", user.id)
            .single()
          
          if (profile) {
            setFirstName(profile.first_name || "")
            setLastName(profile.last_name || "")
            setPhone(profile.phone || "")
          }
        }
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [supabase])

  // Guardar perfil
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const response = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email: email !== "" ? email : undefined
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Perfil Actualizado",
          description: result.emailVerificationRequired 
            ? "Se envió un email de verificación a tu nueva dirección."
            : "Tu perfil ha sido actualizado correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el perfil",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el perfil",
        variant: "destructive"
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      })
      return
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive"
      })
      return
    }
    
    setChangingPassword(true)
    try {
      const response = await fetch("/api/settings/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Contraseña Actualizada",
          description: "Tu contraseña ha sido cambiada correctamente.",
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo cambiar la contraseña",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al cambiar la contraseña",
        variant: "destructive"
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // Eliminar cuenta
  const handleDeleteAccount = async (confirmation: string) => {
    const response = await fetch("/api/settings/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation })
    })
    
    const result = await response.json()
    
    return {
      success: response.ok,
      error: result.error
    }
  }

  const filteredCategories = settingsCategories.filter((category) =>
    category.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )
    }

    switch (activeCategory) {
      case "account":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tus datos de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nombre</Label>
                    <Input 
                      id="first-name" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Apellido</Label>
                    <Input 
                      id="last-name" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Si cambias el email, recibirás un correo de verificación.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleChangePassword} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={changingPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    "Cambiar Contraseña"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autenticación de Dos Factores</CardTitle>
                <CardDescription>Añade una capa extra de seguridad a tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>2FA con Autenticador</Label>
                    <p className="text-sm text-muted-foreground">
                      Usa una app como Google Authenticator
                    </p>
                  </div>
                  <Switch disabled />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Próximamente disponible
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case "billing":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Métodos de Pago</CardTitle>
                    <CardDescription>Administra tus tarjetas y cuentas bancarias</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowAddPaymentModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPaymentMethods ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No tienes métodos de pago guardados</p>
                    <Button 
                      variant="link" 
                      onClick={() => setShowAddPaymentModal(true)}
                      className="text-emerald-600"
                    >
                      Agregar tu primer método de pago
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        onSetDefault={setDefault}
                        onDelete={deleteMethod}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones por Email</CardTitle>
                <CardDescription>Elige qué notificaciones quieres recibir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Actualizaciones de Póliza</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones sobre cambios y renovaciones
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recordatorios de Pago</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe recordatorios de pagos próximos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Estado de Aplicaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Actualizaciones sobre tus aplicaciones de seguro
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Documentos Solicitados</Label>
                    <p className="text-sm text-muted-foreground">
                      Cuando se te solicite un nuevo documento
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button 
                  onClick={() => toast({
                    title: "Preferencias Guardadas",
                    description: "Tus preferencias de notificación han sido actualizadas.",
                  })} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Guardar Preferencias
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "danger":
        return (
          <div className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectan tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Eliminar Cuenta</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Una vez que elimines tu cuenta, perderás acceso permanente a todas tus 
                    aplicaciones, documentos y datos asociados. Esta acción no se puede deshacer.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteAccountModal(true)}
                  >
                    Eliminar Mi Cuenta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <div>Selecciona una categoría</div>
    }
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full">
        <div className="lg:hidden p-4 border-b bg-muted/10">
          <Select value={activeCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona categoría">
                <div className="flex items-center gap-2">
                  {(() => {
                    const category = settingsCategories.find((cat) => cat.id === activeCategory)
                    const Icon = category?.icon
                    return (
                      <>
                        {Icon && <Icon className="h-4 w-4" />}
                        {category?.label}
                      </>
                    )
                  })()}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {settingsCategories.map((category) => {
                const Icon = category.icon
                return (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 border-r bg-muted/10 p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ajustes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <nav className="space-y-1">
              {filteredCategories.map((category) => {
                const Icon = category.icon
                const isDanger = category.id === "danger"
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? isDanger 
                          ? "bg-red-100 text-red-700 font-medium"
                          : "bg-emerald-100 text-emerald-700 font-medium"
                        : isDanger
                          ? "hover:bg-red-50 text-red-600"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl lg:text-2xl font-bold">Configuración</h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                Administra tu cuenta y preferencias
              </p>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modales */}
      <AddPaymentMethodModal
        open={showAddPaymentModal}
        onOpenChange={setShowAddPaymentModal}
        onAdd={addMethod}
      />
      
      <DeleteAccountModal
        open={showDeleteAccountModal}
        onOpenChange={setShowDeleteAccountModal}
        onDelete={handleDeleteAccount}
      />
    </>
  )
}
