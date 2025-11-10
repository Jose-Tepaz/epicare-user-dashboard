"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApplicationDetailContent } from "@/components/application-detail-content"
import { useApplication } from "@/hooks/SHARED-HOOKS"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { application, loading, error } = useApplication(id)

  return (
    <DashboardLayout currentPage="Applications">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/applications">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Applications
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Application Details
              </h1>
              <p className="text-sm text-gray-600">
                Application ID: #{id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading application details...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading application</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && !error && !application && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Application not found</h3>
            <p className="mt-1 text-sm text-gray-500">The application you're looking for doesn't exist or you don't have access to it.</p>
            <div className="mt-6">
              <Link href="/applications">
                <Button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Back to Applications
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Application Details */}
        {!loading && !error && application && (
          <ApplicationDetailContent application={application} />
        )}
      </div>
    </DashboardLayout>
  )
}