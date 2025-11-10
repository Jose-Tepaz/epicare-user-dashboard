'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { ApplicationsTable } from "@/components/applications-table"
import { useAuth } from "@/contexts/auth-context"
import { useApplications } from "@/hooks/SHARED-HOOKS"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

export default function ApplicationsPage() {
  const { user } = useAuth()
  const { applications, loading, error } = useApplications(user?.id || null)

  return (
    <DashboardLayout currentPage="Applications">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Insurance Applications</h1>
            <p className="text-gray-600">Track and manage your insurance applications</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" />
              Buy New Insurance
            </button>
            </Link>
            <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
            </button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading applications...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading applications</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new insurance application.</p>
            <div className="mt-6">
              <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Application
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Applications Table */}
        {!loading && !error && applications.length > 0 && (
          <ApplicationsTable applications={applications} />
        )}
      </div>
    </DashboardLayout>
  )
}
