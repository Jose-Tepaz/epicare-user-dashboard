"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eye, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { APPLICATION_STATUS_CONFIG } from "@/lib/config/DASHBOARD-CONFIG"
import type { ApplicationWithDetails } from "@/lib/types/SHARED-TYPES"

interface ApplicationsTableProps {
  applications: ApplicationWithDetails[]
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    const statusConfig = APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG]
    
    if (!statusConfig) {
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
      <Badge className={colorMap[statusConfig.color as keyof typeof colorMap]}>
        {statusConfig.label}
      </Badge>
    )
  }

  const getProgressPercentage = (status: string) => {
    const statusConfig = APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG]
    
    if (!statusConfig) return 0

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
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTotalPremium = (application: ApplicationWithDetails) => {
    return application.coverages?.reduce((total, coverage) => 
      total + (coverage.monthly_premium || 0), 0) || 0
  }

  const handleViewApplication = (applicationId: string) => {
    router.push(`/applications/${applicationId}`)
  }

  const handleEditApplication = (applicationId: string) => {
    router.push(`/applications/${applicationId}`)
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Application ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Provider</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Progress</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Monthly Premium</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Effective Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Created</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map((app) => {
              const progress = getProgressPercentage(app.status)
              const totalPremium = getTotalPremium(app)
              const statusConfig = APPLICATION_STATUS_CONFIG[app.status as keyof typeof APPLICATION_STATUS_CONFIG]
              
              return (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{app.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {app.carrier_name || app.insurance_company?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                  <td className="px-6 py-4">
                    <div className="w-24">
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
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {totalPremium > 0 ? formatCurrency(totalPremium) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {app.effective_date ? formatDate(app.effective_date) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(app.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 bg-transparent"
                        onClick={() => handleViewApplication(app.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {statusConfig?.canEdit && (
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleEditApplication(app.id)}
                          title="Edit Application"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary */}
      {applications.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total Applications: {applications.length}</span>
            <span>
              Total Monthly Premium: {formatCurrency(
                applications.reduce((total, app) => total + getTotalPremium(app), 0)
              )}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
