'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { OverviewSection } from "@/components/overview-section"
import { useAuth } from "@/contexts/auth-context"
import { useDashboardStats, useApplications } from "@/hooks/SHARED-HOOKS"

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { stats, loading: statsLoading } = useDashboardStats(user?.id || null)
  const { applications, loading: appsLoading } = useApplications(user?.id || null)

  const loading = authLoading || statsLoading || appsLoading

  return (
    <DashboardLayout currentPage="Dashboard">
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Dashboard Title */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Manage your insurance applications, policies, and family members</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && <StatsCards stats={stats} />}

        {/* Overview Section */}
        {!loading && <OverviewSection applications={applications} stats={stats} />}
      </div>
    </DashboardLayout>
  )
}
