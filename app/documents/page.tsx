"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Download, Upload, Loader2, AlertTriangle, Search, Clock, AlertCircle } from "lucide-react"
import { useClientDocuments, useDownloadClientDocument } from "@/hooks/use-client-documents"
import { useClientDocumentRequests } from "@/hooks/use-client-document-requests"
import { UploadClientDocumentModal } from "@/components/upload-client-document-modal"

export default function DocumentsPage() {
  console.log("Rendering DocumentsPage with DashboardLayout")
  const [searchTerm, setSearchTerm] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [preselectedDocType, setPreselectedDocType] = useState<string | null>(null)
  
  const { documents, loading, error, refetch } = useClientDocuments()
  const { requests, loading: loadingRequests, error: requestsError, refetch: refetchRequests } = useClientDocumentRequests()
  const { downloadDocument, downloading } = useDownloadClientDocument()

  // Filtrar solo solicitudes pendientes
  const pendingRequests = requests.filter((req) => req.status === 'pending')

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownload = async (fileUrl: string, fileName: string) => {
    await downloadDocument(fileUrl, fileName)
  }

  const handleUploadForRequest = (requestId: string, documentType: string) => {
    setSelectedRequestId(requestId)
    setPreselectedDocType(documentType)
    setShowUploadModal(true)
  }

  const handleModalClose = () => {
    setShowUploadModal(false)
    setSelectedRequestId(null)
    setPreselectedDocType(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    if (mb < 1) {
      const kb = bytes / 1024
      return `${kb.toFixed(2)} KB`
    }
    return `${mb.toFixed(2)} MB`
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      medical: 'Medical',
      identification: 'Identification',
      financial: 'Financial',
      property: 'Property',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      medical: 'bg-blue-100 text-blue-800',
      identification: 'bg-green-100 text-green-800',
      financial: 'bg-purple-100 text-purple-800',
      property: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || colors.other
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return colors[priority] || colors.medium
  }

  return (
    <DashboardLayout currentPage="Documents">
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600 mt-1">View and manage your uploaded documents</p>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Medical Docs</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {documents.filter((d) => d.document_type === 'medical').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">ID Documents</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {documents.filter((d) => d.document_type === 'identification').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Document Requests */}
        {pendingRequests.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Pending Document Requests</CardTitle>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                You have {pendingRequests.length} pending document {pendingRequests.length === 1 ? 'request' : 'requests'}
              </p>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : requestsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">{requestsError}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => {
                    const requesterName = request.requester
                      ? `${request.requester.first_name || ""} ${request.requester.last_name || ""}`.trim() || request.requester.email
                      : "Admin"

                    return (
                      <div
                        key={request.id}
                        className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getDocumentTypeColor(request.document_type)} w-fit`}>
                                {getDocumentTypeLabel(request.document_type)}
                              </Badge>
                              <Badge className={`${getPriorityColor(request.priority)} w-fit`}>
                                {request.priority} priority
                              </Badge>
                              {request.due_date && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: {formatDate(request.due_date)}
                                </Badge>
                              )}
                            </div>
                            {request.notes && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Note:</span> {request.notes}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Requested by {requesterName} on {formatDate(request.created_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => handleUploadForRequest(request.id, request.document_type)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Document
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>My Uploaded Documents</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading documents</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Try adjusting your search"
                    : "Upload your first document to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Document</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Uploaded</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getDocumentTypeColor(doc.document_type)} w-fit`}>
                            {getDocumentTypeLabel(doc.document_type)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {formatDate(doc.uploaded_at)}
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => handleDownload(doc.file_url, doc.file_name)}
                            disabled={downloading}
                          >
                            {downloading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <UploadClientDocumentModal
        open={showUploadModal}
        onOpenChange={handleModalClose}
        onSuccess={() => {
          refetch()
          refetchRequests()
        }}
        documentRequestId={selectedRequestId}
        preselectedDocumentType={preselectedDocType}
      />
    </DashboardLayout>
  )
}
