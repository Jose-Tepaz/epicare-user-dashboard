"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react"
import { use, useState } from "react"
import Link from "next/link"
import { useClientTicketDetails, useCreateTicketMessage } from "@/hooks/use-client-tickets"

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "in_progress":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "waiting_on_customer":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200"
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200"
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open":
      return <AlertCircle className="h-4 w-4" />
    case "in_progress":
      return <Clock className="h-4 w-4" />
    case "waiting_on_customer":
      return <Clock className="h-4 w-4" />
    case "resolved":
      return <CheckCircle className="h-4 w-4" />
    case "closed":
      return <CheckCircle className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

const formatStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'open': 'Abierto',
    'in_progress': 'En Progreso',
    'waiting_on_customer': 'Esperando Tu Respuesta',
    'resolved': 'Resuelto',
    'closed': 'Cerrado',
    'cancelled': 'Cancelado',
  }
  return labels[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getUserDisplayName = (user: any): string => {
  if (!user) return 'Usuario'
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return fullName || user.email || 'Usuario'
}

const getInitials = (user: any): string => {
  if (!user) return 'U'
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  }
  if (user.email) {
    return user.email.substring(0, 2).toUpperCase()
  }
  return 'U'
}

const isStaffMember = (role?: string): boolean => {
  return ['admin', 'super_admin', 'support_staff', 'agent'].includes(role || '')
}

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { ticket, messages, loading, error, refetch } = useClientTicketDetails(resolvedParams.id)
  const { createMessage, loading: sending } = useCreateTicketMessage()

  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return

    const message = await createMessage(ticket.id, newMessage)
    if (message) {
      setNewMessage("")
      refetch()
    }
  }

  const canReply = ticket && ['open', 'in_progress', 'waiting_on_customer'].includes(ticket.status)

  if (loading) {
    return (
      <DashboardLayout currentPage="Support">
        <div className="p-6">
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !ticket) {
    return (
      <DashboardLayout currentPage="Support">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket No Encontrado</h2>
            <p className="text-gray-600 mb-4">
              {error || "El ticket que buscas no existe o no tienes acceso a él."}
            </p>
            <Link href="/support/tickets">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Mis Tickets
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="Support">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/support/tickets">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.ticket_number}</h1>
              <p className="text-gray-600">{ticket.subject}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(ticket.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      {formatStatusLabel(ticket.status)}
                    </div>
                  </Badge>
                </div>
                <CardDescription className="mt-2">{ticket.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversación ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.map((message) => {
                  const isStaff = isStaffMember(message.sender?.role)
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={isStaff ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}>
                          {getInitials(message.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isStaff ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {getUserDisplayName(message.sender)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                          {isStaff && (
                            <Badge variant="outline" className="text-xs bg-orange-50">
                              Equipo de Soporte
                            </Badge>
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            isStaff
                              ? "bg-orange-50 border border-orange-200"
                              : "bg-blue-50 border border-blue-200"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {messages.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay mensajes aún. Inicia la conversación enviando un mensaje.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reply Form */}
            {canReply ? (
              <Card>
                <CardHeader>
                  <CardTitle>Responder</CardTitle>
                  <CardDescription>
                    {ticket.status === 'waiting_on_customer' 
                      ? 'El equipo de soporte está esperando tu respuesta'
                      : 'Agrega información o responde al equipo de soporte'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Escribe tu respuesta aquí..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    disabled={sending}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {sending && "Enviando mensaje..."}
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Respuesta
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {ticket.status === 'resolved' ? 'Ticket Resuelto' : 'Ticket Cerrado'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {ticket.status === 'resolved' 
                      ? 'Este ticket ha sido marcado como resuelto. Si necesitas más ayuda, crea un nuevo ticket.'
                      : 'Este ticket está cerrado. Si necesitas ayuda adicional, crea un nuevo ticket.'}
                  </p>
                  <Link href="/support/tickets">
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Ver Mis Tickets
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Número de Ticket</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">#{ticket.ticket_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Estado</p>
                  <Badge className={getStatusColor(ticket.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      {formatStatusLabel(ticket.status)}
                    </div>
                  </Badge>
                </div>
                {ticket.assigned && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Asignado a</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                          {getInitials(ticket.assigned)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm text-gray-900">{getUserDisplayName(ticket.assigned)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Línea de Tiempo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Creado:</span>
                  <span>{formatDate(ticket.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600">Última Actualización:</span>
                  <span>{formatDate(ticket.updated_at)}</span>
                </div>
                {ticket.closed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-600">Cerrado:</span>
                    <span>{formatDate(ticket.closed_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">¿Necesitas ayuda inmediata?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Si tu consulta es urgente, puedes llamarnos al:
                </p>
                <p className="font-semibold text-orange-600 mb-3">1-800-EPICARE</p>
                <p className="text-xs text-gray-500">
                  Lun-Vie: 8AM-8PM EST
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

