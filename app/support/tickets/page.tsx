"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react"
import { useState } from "react"
import { useClientTickets, useClientTicketStats, useCreateTicket } from "@/hooks/use-client-tickets"
import type { TicketPriority } from "@/lib/types/SHARED-TYPES"

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

const formatPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    'urgent': 'Urgente',
    'high': 'Alta',
    'medium': 'Media',
    'low': 'Baja',
  }
  return labels[priority] || priority
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

export default function MyTicketsPage() {
  const { tickets, loading, error, refetch } = useClientTickets()
  const { stats, loading: statsLoading } = useClientTicketStats()
  const { createTicket, loading: creating } = useCreateTicket()

  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as TicketPriority,
  })

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      return
    }

    const ticket = await createTicket(
      newTicket.subject,
      newTicket.description,
      newTicket.priority
    )

    if (ticket) {
      setShowNewTicketModal(false)
      setNewTicket({ subject: "", description: "", priority: "medium" })
      refetch()
    }
  }

  return (
    <DashboardLayout currentPage="Support">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Tickets de Soporte</h1>
            <p className="text-gray-600">Gestiona tus consultas y solicitudes de soporte</p>
          </div>
          <Button
            onClick={() => setShowNewTicketModal(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Abiertos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Progreso</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.in_progress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resueltos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cerrados</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por asunto o número de ticket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todos los Estados</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En Progreso</option>
                <option value="waiting_on_customer">Esperando Mi Respuesta</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Tickets ({filteredTickets.length})</CardTitle>
            <CardDescription>Historial de solicitudes de soporte</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar tickets</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-700">
                            #{ticket.ticket_number}
                          </span>
                          <Badge className={getStatusColor(ticket.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(ticket.status)}
                              {formatStatusLabel(ticket.status)}
                            </div>
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-gray-900 mb-2">{ticket.subject}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ticket.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Creado {formatDate(ticket.created_at)}</span>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{ticket.message_count || 0} mensajes</span>
                          </div>
                        </div>
                      </div>

                      <Link href={`/support/tickets/${ticket.id}`}>
                        <Button variant="outline" size="sm" className="ml-4">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {filteredTickets.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes tickets</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== "all"
                        ? "No se encontraron tickets con los filtros aplicados."
                        : "Crea tu primer ticket de soporte para recibir ayuda."}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button
                        onClick={() => setShowNewTicketModal(true)}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Ticket
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Ticket Modal */}
        {showNewTicketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Crear Nuevo Ticket</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewTicketModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Describe tu problema o consulta y nuestro equipo te ayudará
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Asunto *</Label>
                  <Input
                    id="subject"
                    placeholder="Describe brevemente tu consulta"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    placeholder="Proporciona todos los detalles necesarios..."
                    rows={6}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <select
                    id="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })
                    }
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona la urgencia de tu consulta
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewTicketModal(false)}
                    className="flex-1"
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    disabled={!newTicket.subject || !newTicket.description || creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Crear Ticket
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

