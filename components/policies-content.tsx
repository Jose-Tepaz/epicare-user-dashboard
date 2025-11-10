"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ExternalLink, Edit, Plus, DollarSign, Calendar, Users } from "lucide-react"
import Link from "next/link"
import type { ApplicationWithDetails } from "@/lib/types/SHARED-TYPES"
import { APPLICATION_STATUS_CONFIG } from "@/lib/config/DASHBOARD-CONFIG"

interface PoliciesContentProps {
  policies: ApplicationWithDetails[]
  loading: boolean
  error: string | null
}

export function PoliciesContent({ policies, loading, error }: PoliciesContentProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTotalPremium = (policy: ApplicationWithDetails) => {
    return policy.coverages?.reduce((total, coverage) => 
      total + (coverage.monthly_premium || 0), 0) || 0
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Insurance Policies</h1>
        <p className="text-gray-600">Manage your active insurance policies</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading policies...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading policies</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && policies.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active policies</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by exploring insurance options.</p>
          <div className="mt-6">
            <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
              <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                <Plus className="h-4 w-4 mr-2" />
                Explore Insurance Options
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Policies Grid */}
      {!loading && !error && policies.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {policies.map((policy) => {
            const totalPremium = getTotalPremium(policy)
            const statusInfo = getStatusBadge(policy.status)
            
            return (
              <Card key={policy.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {policy.carrier_name || policy.insurance_company?.name || 'Insurance Policy'}
                      </h3>
                      <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600 text-xs px-2 py-1">
                        {policy.carrier_name || 'N/A'}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className={`text-xs px-2 py-1 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Coverage Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Monthly Premium</p>
                        <p className="text-lg font-semibold text-orange-600">{formatCurrency(totalPremium)}</p>
                      </div>
                    </div>
                    {policy.effective_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Effective Date</p>
                          <p className="text-sm text-gray-900">{formatDate(policy.effective_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Policy Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Covered Members</p>
                        <p className="text-sm text-gray-900">
                          {policy.applicants?.length || 0} {policy.applicants?.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coverage Plans */}
                  {policy.coverages && policy.coverages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Coverage Plans</p>
                      <div className="flex flex-wrap gap-2">
                        {policy.coverages.slice(0, 3).map((coverage, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs px-2 py-1"
                          >
                            {coverage.plan_key}
                          </Badge>
                        ))}
                        {policy.coverages.length > 3 && (
                          <Badge
                            variant="outline"
                            className="border-gray-200 text-gray-700 bg-gray-50 text-xs px-2 py-1"
                          >
                            +{policy.coverages.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Link href={`/policies/${policy.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-transparent"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-transparent"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modify
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
