"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PolicyDetailContent } from "@/components/policy-detail-content"

export default function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  return (
    <DashboardLayout currentPage="My policies">
      <PolicyDetailContent policyId={id} />
    </DashboardLayout>
  )
}
