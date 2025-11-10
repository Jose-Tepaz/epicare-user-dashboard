"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Users, Download, Edit, UserPlus, CreditCard, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PolicyDetailContentProps {
  policyId: string
}

// Mock data - in a real app this would come from an API
const getPolicyData = (id: string) => {
  return {
    id: "AMR-2024-001234",
    title: "Health Insurance Premium",
    provider: "Ameritas",
    premium: "$299/month",
    deductible: "$1500",
    outOfPocketMax: "$8,000",
    effectiveDate: "2024-01-01",
    renewalDate: "2024-12-31",
    nextPayment: "2024-02-15",
    coveredMembers: [
      { name: "John Doe", id: "1" },
      { name: "Maria Rodriguez", id: "2" },
      { name: "Carlos Rodriguez", id: "3" },
    ],
    benefits: [
      { name: "Primary Care Visits", coverage: "100% after deductible" },
      { name: "Specialist Visits", coverage: "80% after deductible" },
      { name: "Emergency Room", coverage: "70% after deductible" },
      { name: "Prescription Drugs", coverage: "$10/$30/$60 copay" },
      { name: "Mental Health", coverage: "100% after deductible" },
    ],
    documents: [
      { name: "Policy Certificate", type: "PDF", date: "2024-01-01" },
      { name: "Benefits Summary", type: "PDF", date: "2024-01-01" },
      { name: "ID Cards", type: "PDF", date: "2024-01-01" },
    ],
  }
}

export function PolicyDetailContent({ policyId }: PolicyDetailContentProps) {
  const router = useRouter()
  const policy = getPolicyData(policyId)

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{policy.title}</h1>
          <p className="text-gray-600">
            {policy.provider} • {policy.id}
          </p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Family Member
        </Button>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coverage Details */}
        <Card className="border border-orange-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Coverage Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Premium</p>
              <p className="text-lg font-semibold text-orange-600">{policy.premium}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Deductible</p>
              <p className="text-sm text-gray-900">{policy.deductible}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Out-of-Pocket Max</p>
              <p className="text-sm text-gray-900">{policy.outOfPocketMax}</p>
            </div>
          </CardContent>
        </Card>

        {/* Policy Dates */}
        <Card className="border border-orange-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Policy Dates</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Effective Date</p>
              <p className="text-sm text-gray-900">{policy.effectiveDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Renewal Date</p>
              <p className="text-sm text-gray-900">{policy.renewalDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Next Payment</p>
              <p className="text-sm font-semibold text-orange-600">{policy.nextPayment}</p>
            </div>
          </CardContent>
        </Card>

        {/* Covered Members */}
        <Card className="border border-orange-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Covered Members</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {policy.coveredMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{member.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Benefits & Coverage */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Benefits & Coverage</h2>
          <p className="text-gray-600">What's covered under this policy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policy.benefits.map((benefit, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{benefit.name}</span>
                  <span className="text-sm text-orange-600 font-medium">{benefit.coverage}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Policy Documents */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Policy Documents</h2>
          <p className="text-gray-600">Download important policy documents</p>
        </div>

        <div className="space-y-3">
          {policy.documents.map((document, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <Download className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{document.name}</p>
                      <p className="text-sm text-gray-500">
                        {document.type} • {document.date}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Policy Actions */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Policy Actions</h2>
          <p className="text-gray-600">Manage your policy settings and coverage</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 bg-transparent">
            <Edit className="w-4 h-4 mr-2" />
            Modify Coverage
          </Button>
          <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 bg-transparent">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Family Member
          </Button>
          <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50 bg-transparent">
            <CreditCard className="w-4 h-4 mr-2" />
            Update Payment Method
          </Button>
          <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 bg-transparent">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
