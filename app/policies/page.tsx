'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { PoliciesContent } from "@/components/policies-content"
import { useAuth } from "@/contexts/auth-context"
import { useApplications } from "@/hooks/SHARED-HOOKS"

export default function PoliciesPage() {
  const { user } = useAuth()
  const { applications, loading, error } = useApplications(user?.id || null)

  // Filtrar solo pólizas activas o aprobadas
  const policies = applications.filter(app => 
    app.status === 'active' || app.status === 'approved'
  )

  return (
    <DashboardLayout currentPage="My policies">
      <PoliciesContent policies={policies} loading={loading} error={error} />
    </DashboardLayout>
  )
}
