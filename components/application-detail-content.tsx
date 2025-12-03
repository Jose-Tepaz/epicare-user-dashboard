"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Download, CheckCircle, Clock, AlertCircle, Edit, DollarSign, Calendar, User, Phone, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { APPLICATION_STATUS_CONFIG } from "@/lib/config/DASHBOARD-CONFIG"
import type { ApplicationWithDetails } from "@/lib/types/SHARED-TYPES"

interface ApplicationDetailContentProps {
  application: ApplicationWithDetails
}

export function ApplicationDetailContent({ application }: ApplicationDetailContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)

  const statusConfig = APPLICATION_STATUS_CONFIG[application.status as keyof typeof APPLICATION_STATUS_CONFIG]

  const getStatusBadge = (status: string) => {
    const config = APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG]
    
    if (!config) {
      return <Badge variant="secondary">{status}</Badge>
    }

    const colorMap = {
      gray: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      blue: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      green: 'bg-green-100 text-green-800 hover:bg-green-100',
      red: 'bg-red-100 text-red-800 hover:bg-red-100'
    }

    return (
      <Badge className={colorMap[config.color as keyof typeof colorMap]}>
        {config.label}
      </Badge>
    )
  }

  const getProgressPercentage = (status: string) => {
    const config = APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG]
    
    if (!config) return 0

    const progressMap = {
      draft: 25,
      submitted: 50,
      pending_approval: 75,
      approved: 90,
      active: 100,
      rejected: 0,
      cancelled: 0,
      submission_failed: 25
    }

    return progressMap[status as keyof typeof progressMap] || 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTotalPremium = () => {
    return application.coverages?.reduce((total, coverage) => 
      total + (coverage.monthly_premium || 0), 0) || 0
  }

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "current":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getTimelineSteps = () => {
    const steps = [
      { step: "Application Created", date: application.created_at, status: "completed" },
      { step: "Application Submitted", date: application.enrollment_date, status: application.status === 'draft' ? 'pending' : 'completed' },
      { step: "Under Review", date: application.enrollment_date, status: ['submitted', 'pending_approval'].includes(application.status) ? 'current' : application.status === 'approved' || application.status === 'active' ? 'completed' : 'pending' },
      { step: "Approved", date: application.effective_date, status: application.status === 'approved' || application.status === 'active' ? 'completed' : 'pending' },
    ]

    return steps
  }

  const handleUploadDocument = () => {
    toast({
      title: "Upload Document",
      description: "Document upload functionality would be implemented here.",
    })
  }

  const handleCancelApplication = () => {
    toast({
      title: "Cancel Application",
      description: "Application cancellation would be processed here.",
      variant: "destructive",
    })
  }

  const handleEditApplication = () => {
    setIsEditing(!isEditing)
    toast({
      title: isEditing ? "Edit Mode Disabled" : "Edit Mode Enabled",
      description: isEditing ? "Changes have been saved." : "You can now edit application details.",
    })
  }

  const handleDownloadDocument = (docName: string) => {
    toast({
      title: "Download Document",
      description: `Downloading ${docName}...`,
    })
  }

  const progress = getProgressPercentage(application.status)
  const totalPremium = getTotalPremium()
  const timelineSteps = getTimelineSteps()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {application.carrier_name || application.insurance_company?.name || 'Insurance'} Application
            </h1>
            <p className="text-sm text-gray-600">Application ID: #{application.id.slice(0, 8)}</p>
          </div>
        </div>
        {statusConfig?.canEdit && (
          <Button onClick={handleEditApplication} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Save Changes" : "Edit Application"}
        </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Status */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">
                  {application.carrier_name || application.insurance_company?.name || 'N/A'} - Insurance Application
                </p>
                <p className="text-sm text-gray-600">
                  Created on {formatDate(application.created_at)}
                  {application.enrollment_date && (
                    <span> • Submitted on {formatDate(application.enrollment_date)}</span>
                  )}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  {getStatusBadge(application.status)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      statusConfig?.color === 'green' ? 'bg-green-500' :
                      statusConfig?.color === 'red' ? 'bg-red-500' :
                      statusConfig?.color === 'yellow' ? 'bg-yellow-500' :
                      statusConfig?.color === 'blue' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1 block">{progress}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {application.applicants?.map((applicant, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        {applicant.relationship === 'Self' ? 'Primary Applicant' : `${applicant.relationship}`}
                      </span>
                    </div>
                    <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                        <p className="text-sm text-gray-900">
                          {applicant.first_name} {applicant.middle_initial && `${applicant.middle_initial}. `}{applicant.last_name}
                        </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{application.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{application.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                        <p className="text-sm text-gray-900">{formatDate(applicant.date_of_birth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Gender</p>
                        <p className="text-sm text-gray-900">{applicant.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Smoker Status</p>
                        <p className="text-sm text-gray-900">{applicant.smoker ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Coverage Details */}
          <Card>
            <CardHeader>
              <CardTitle>Coverage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.coverages?.map((coverage, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    {/* Header del Plan */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-700">
                          {coverage.metadata?.planName || coverage.plan_key}
                        </span>
                      </div>
                      {coverage.carrier_name && (
                        <Badge className="bg-blue-100 text-blue-800">
                          {coverage.carrier_name}
                        </Badge>
                      )}
                    </div>

                    {/* Información Básica */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Plan Key</p>
                        <p className="text-sm text-gray-900">{coverage.plan_key}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Monthly Premium</p>
                        <p className="text-sm text-orange-600 font-medium">
                          {formatCurrency(coverage.monthly_premium)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Payment Frequency</p>
                        <p className="text-sm text-gray-900">{coverage.payment_frequency}</p>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Effective Date</p>
                        <p className="text-sm text-gray-900">{formatDate(coverage.effective_date)}</p>
                      </div>
                      {coverage.termination_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Termination Date</p>
                          <p className="text-sm text-gray-900">{formatDate(coverage.termination_date)}</p>
                        </div>
                      )}
                    </div>

                    {/* Términos y Agente */}
                    {(coverage.term || coverage.number_of_terms || coverage.agent_number) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {coverage.term && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Term</p>
                            <p className="text-sm text-gray-900">{coverage.term}</p>
                          </div>
                        )}
                        {coverage.number_of_terms && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Number of Terms</p>
                            <p className="text-sm text-gray-900">{coverage.number_of_terms}</p>
                          </div>
                        )}
                        {coverage.agent_number && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Agent Number</p>
                            <p className="text-sm text-gray-900">{coverage.agent_number}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tipo de Producto y Cobertura */}
                    {(coverage.metadata?.productType || coverage.metadata?.coverage) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coverage.metadata?.productType && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Product Type</p>
                            <p className="text-sm text-gray-900">{coverage.metadata.productType}</p>
                          </div>
                        )}
                        {coverage.metadata?.coverage && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Coverage Amount</p>
                            <p className="text-sm text-gray-900">{coverage.metadata.coverage}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Beneficios */}
                    {coverage.metadata?.benefitsList && coverage.metadata.benefitsList.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Benefits</p>
                        <ul className="list-disc list-inside space-y-1">
                          {coverage.metadata.benefitsList.map((benefit: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-900">{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Descripción de Beneficios */}
                    {coverage.metadata?.benefitDescription && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Benefit Description</p>
                        <p className="text-sm text-gray-600">{coverage.metadata.benefitDescription}</p>
                      </div>
                    )}

                    {/* Riders */}
                    {coverage.riders && Array.isArray(coverage.riders) && coverage.riders.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Riders</p>
                        <div className="flex flex-wrap gap-2">
                          {coverage.riders.map((rider: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {rider.name || rider.type || `Rider ${idx + 1}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discounts */}
                    {coverage.discounts && Array.isArray(coverage.discounts) && coverage.discounts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Discounts</p>
                        <div className="flex flex-wrap gap-2">
                          {coverage.discounts.map((discount: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 text-xs">
                              {discount.name || discount.type || `Discount ${idx + 1}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brochure Link */}
                    {coverage.metadata?.brochureUrl && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(coverage.metadata.brochureUrl, '_blank')}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View Plan Brochure
                        </Button>
                      </div>
                    )}

                    {/* Información de Pricing */}
                    {(coverage.metadata?.originalPrice || coverage.metadata?.applicantsIncluded) && (
                      <div className="pt-2 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {coverage.metadata?.applicantsIncluded && (
                            <p className="text-xs text-gray-600">
                              Applicants Included: {coverage.metadata.applicantsIncluded}
                            </p>
                          )}
                          {coverage.metadata?.originalPrice && coverage.metadata.originalPrice !== coverage.monthly_premium && (
                            <p className="text-xs text-gray-600">
                              Original Price: {formatCurrency(coverage.metadata.originalPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Loan Provision */}
                    {coverage.is_automatic_loan_provision_opted_in !== null && coverage.is_automatic_loan_provision_opted_in !== undefined && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">
                          Automatic Loan Provision: {coverage.is_automatic_loan_provision_opted_in ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {application.coverages?.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No coverage details available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {application.payment_transactions && application.payment_transactions.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle>Payment Information</CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {application.payment_transactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                        <p className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.payment_method} • {formatDate(transaction.created_at)}
                        </p>
                  </div>
                  <div className="flex items-center gap-2">
                        <Badge className={
                          transaction.transaction_status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.transaction_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {transaction.transaction_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Results */}
          {application.submission_results && application.submission_results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Submission Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {application.submission_results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Plan {result.plan_key || result.plan_type}
                          {result.policy_no && ` • Policy: ${result.policy_no}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.submission_received ? 'Submission Received' : 'Submission Pending'}
                          {result.total_rate && ` • ${formatCurrency(result.total_rate)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={result.submission_received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {result.submission_received ? 'Received' : 'Pending'}
                        </Badge>
                  </div>
                </div>
              ))}
                </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Right Column - Timeline and Actions */}
        <div className="space-y-6">
          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
              <p className="text-sm text-gray-600">Track your application progress</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineSteps.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  {getTimelineIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.step}</p>
                    <p className="text-xs text-gray-600">{item.date ? formatDate(item.date) : 'Pending'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Monthly Premium</span>
                <span className="text-sm font-medium">{formatCurrency(totalPremium)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coverage Plans</span>
                <span className="text-sm font-medium">{application.coverages?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Applicants</span>
                <span className="text-sm font-medium">{application.applicants?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Effective Date</span>
                <span className="text-sm font-medium">
                  {application.effective_date ? formatDate(application.effective_date) : 'TBD'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleUploadDocument}
                className="w-full justify-start bg-transparent border border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
              {statusConfig?.canEdit && (
              <Button
                onClick={handleCancelApplication}
                  className="w-full justify-start bg-red-500 hover:bg-red-600 text-white"
              >
                  Cancel Application
              </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
