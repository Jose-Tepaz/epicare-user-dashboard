"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react"
import { useUploadClientDocument } from "@/hooks/use-client-documents"
import { useFulfillClientDocumentRequest } from "@/hooks/use-client-document-requests"

interface UploadClientDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  documentRequestId?: string | null
  preselectedDocumentType?: string | null
}

export function UploadClientDocumentModal({
  open,
  onOpenChange,
  onSuccess,
  documentRequestId,
  preselectedDocumentType,
}: UploadClientDocumentModalProps) {
  const [documentType, setDocumentType] = useState("identification")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const { uploadDocument, uploading, error: uploadError } = useUploadClientDocument()
  const { fulfillRequest, fulfilling } = useFulfillClientDocumentRequest()

  // Set preselected document type when provided
  useEffect(() => {
    if (preselectedDocumentType) {
      setDocumentType(preselectedDocumentType)
    }
  }, [preselectedDocumentType])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFile(null)
      if (!preselectedDocumentType) {
        setDocumentType("identification")
      }
    }
  }, [open, preselectedDocumentType])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    const maxSize = 10 * 1024 * 1024 // 10 MB

    if (!allowedTypes.includes(file.type)) {
      alert('File type not allowed. Please upload PDF, JPG, or PNG files.')
      return false
    }

    if (file.size > maxSize) {
      alert('File size exceeds 10 MB limit.')
      return false
    }

    return true
  }

  const handleUpload = async () => {
    if (!file || !documentType) {
      alert('Please select a file and document type')
      return
    }

    // Upload the document
    const uploadedDocument = await uploadDocument(file, documentType)

    if (uploadedDocument) {
      console.log('✅ Document uploaded:', uploadedDocument.id)

      // If this is for a document request, fulfill it
      if (documentRequestId) {
        console.log('📄 Fulfilling document request:', documentRequestId)
        const fulfilled = await fulfillRequest(documentRequestId, uploadedDocument.id)
        
        if (fulfilled) {
          console.log('✅ Document request fulfilled')
        } else {
          console.warn('⚠️ Failed to fulfill document request, but document was uploaded')
        }
      }

      // Success - reset and close
      setFile(null)
      setDocumentType("identification")
      onSuccess?.()
      onOpenChange(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    if (mb < 1) {
      const kb = bytes / 1024
      return `${kb.toFixed(2)} KB`
    }
    return `${mb.toFixed(2)} MB`
  }

  const isProcessing = uploading || fulfilling

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {documentRequestId ? "Upload Requested Document" : "Upload Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {documentRequestId && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                This document will fulfill a pending request from your administrator.
              </span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          <div>
            <Label htmlFor="documentType">Document Type *</Label>
            <Select 
              value={documentType} 
              onValueChange={setDocumentType}
              disabled={!!preselectedDocumentType || isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="identification">Identification</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {preselectedDocumentType && (
              <p className="text-xs text-blue-600 mt-1">
                Document type is pre-selected based on the request
              </p>
            )}
            {!preselectedDocumentType && (
              <p className="text-xs text-gray-500 mt-1">
                Select the type of document you are uploading
              </p>
            )}
          </div>

          <div>
            <Label>File *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 text-gray-600" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="h-8 w-8 p-0"
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-700 font-medium">Drag and drop file here</p>
                    <p className="text-sm text-gray-500">or</p>
                  </div>
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isProcessing}
                    >
                      Browse Files
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10 MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={!file || !documentType || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
