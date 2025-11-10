import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { ApplicationWithDetails, DashboardStats } from "@/lib/types/SHARED-TYPES"
import { APPLICATION_STATUS_CONFIG } from "@/lib/config/DASHBOARD-CONFIG"

interface OverviewSectionProps {
  applications: ApplicationWithDetails[]
  stats: DashboardStats | null
}

export function OverviewSection({ applications, stats }: OverviewSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const config = APPLICATION_STATUS_CONFIG[status as keyof typeof APPLICATION_STATUS_CONFIG]
    
    if (!config) {
      return { color: 'bg-gray-100 text-gray-800', label: status }
    }

    const colorMap = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    }

    return {
      color: colorMap[config.color as keyof typeof colorMap],
      label: config.label
    }
  }

  const getProgressPercentage = (status: string) => {
    const progressMap: Record<string, number> = {
      draft: 25,
      submitted: 50,
      pending_approval: 75,
      approved: 90,
      active: 100,
      rejected: 0,
      cancelled: 0,
      submission_failed: 25
    }
    return progressMap[status] || 0
  }

  // Obtener las 3 aplicaciones más recientes
  const recentApplications = applications
    .slice(0, 3)
    .map(app => {
      const statusInfo = getStatusBadge(app.status)
      return {
        ...app,
        statusBadge: statusInfo,
        progress: getProgressPercentage(app.status)
      }
    })

  // Obtener pólizas activas
  const activePolicies = applications
    .filter(app => app.status === 'active' || app.status === 'approved')
    .map(app => {
      const totalPremium = app.coverages?.reduce((sum, cov) => sum + (cov.monthly_premium || 0), 0) || 0
      return {
        id: app.id,
        carrier: app.carrier_name || app.insurance_company?.name || 'N/A',
        amount: totalPremium,
        status: app.status
      }
    })
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
            <p className="text-sm text-gray-600">Track your insurance application progress</p>
          </div>

          <div className="space-y-4">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => (
                <Link 
                  key={application.id} 
                  href={`/applications/${application.id}`}
                  className="block"
                >
                  <Card className="p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {application.carrier_name || application.insurance_company?.name || 'Insurance'}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">Application #{application.id.slice(0, 8)}</p>
                  </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${application.statusBadge.color}`}>
                        {application.statusBadge.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          application.status === 'active' ? 'bg-green-500' :
                          application.status === 'rejected' || application.status === 'cancelled' ? 'bg-red-500' :
                          'bg-orange-500'
                        }`}
                    style={{ width: `${application.progress}%` }}
                  />
                </div>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="p-8 bg-gray-50 border border-gray-200">
                <p className="text-center text-gray-500">No applications yet</p>
              </Card>
            )}
          </div>

          <Link href="/applications">
            <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent">
              View all applications
            </Button>
          </Link>
        </div>

        {/* Active Policies */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Active Policies</h3>
            <p className="text-sm text-gray-600">Your current insurance coverage</p>
          </div>

          <div className="space-y-4">
            {activePolicies.length > 0 ? (
              activePolicies.map((policy) => (
                <Card key={policy.id} className="p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{policy.carrier}</h4>
                      <p className="text-sm text-gray-600">Policy Status</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                      Active
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-orange-500">
                    {formatCurrency(policy.amount)}/month
                  </p>
                </Card>
              ))
            ) : (
              <Card className="p-8 bg-gray-50 border border-gray-200">
                <p className="text-center text-gray-500">No active policies</p>
              </Card>
            )}
          </div>

          <Link href="/policies">
            <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent">
              Manage Policies
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
