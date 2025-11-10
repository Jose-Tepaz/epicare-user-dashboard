"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Edit, Trash2, UserPlus, Calendar, Shield, User, ExternalLink, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface FamilyMember {
  id: string
  name: string
  relationship: string
  dateOfBirth: string
  coveredPolicies: string[]
  coveredApplications: string[]
  policyCount: number
  applicationCount: number
  hasActivePolicies: boolean
}

interface FamilyContentProps {
  members: FamilyMember[]
  loading: boolean
  error: string | null
  userId?: string
}

export function FamilyContent({ members, loading, error, userId }: FamilyContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEdit = (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      setSelectedMember(member)
    }
  }

  const handleDelete = (memberId: string) => {
    toast({
      title: "Delete Member",
      description: "This action cannot be undone. Members are removed when their policies are cancelled.",
      variant: "destructive",
    })
  }

  const handleAddMember = () => {
    setShowAddDialog(true)
  }

  const handleGoToMarketplace = () => {
    setShowAddDialog(false)
    router.push(process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000')
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Family Members</h1>
          <p className="text-gray-600">Manage family members covered under your policies</p>
        </div>
        <Button
          onClick={handleAddMember}
          className="bg-orange-500 hover:bg-orange-600 text-white border-0 px-6 py-2 rounded-full"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Family Member
        </Button>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-500" />
              Add Family Member
            </DialogTitle>
            <DialogDescription>
              To add a family member to your insurance coverage, you'll need to create a new insurance application or update an existing one on the marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">How to add a family member:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Go to the marketplace to explore insurance options</li>
                    <li>Create a new application or update an existing one</li>
                    <li>Include your family member information during enrollment</li>
                    <li>Complete the application process</li>
                    <li>Your family member will appear here once the policy is active</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Family members are automatically added to your dashboard based on the applicants listed in your insurance applications.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGoToMarketplace}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Marketplace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Details Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              {selectedMember?.name}
            </DialogTitle>
            <DialogDescription>
              Complete information for this family member
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6 py-4">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-sm text-gray-900">{selectedMember.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Relationship</p>
                    <p className="text-sm text-gray-900">{selectedMember.relationship}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-900">{formatDate(selectedMember.dateOfBirth)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coverage Information */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Insurance Coverage
                </h3>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Covered by {selectedMember.policyCount} {selectedMember.policyCount === 1 ? 'Policy' : 'Policies'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.coveredPolicies.map((policyId, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-blue-200 text-blue-700 bg-white cursor-pointer hover:bg-blue-50"
                        onClick={() => router.push(`/policies/${policyId}`)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Policy #{policyId.slice(0, 8)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Helpful Information */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> This member's information is automatically managed based on their enrollment in insurance applications. To update their information, please contact support or update their application.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedMember(null)}
            >
              Close
            </Button>
            {selectedMember && selectedMember.coveredPolicies.length > 0 && (
              <Button
                onClick={() => {
                  setSelectedMember(null)
                  router.push(`/policies/${selectedMember.coveredPolicies[0]}`)
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Policy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading family members...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading family members</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Family Members Grid */}
      {!loading && !error && members.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={member.hasActivePolicies 
                      ? "bg-green-100 text-green-800 hover:bg-green-200 text-xs px-3 py-1 rounded-full"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs px-3 py-1 rounded-full"
                    }
                  >
                    {member.hasActivePolicies 
                      ? `${member.policyCount} Active ${member.policyCount === 1 ? 'Policy' : 'Policies'}`
                      : `${member.applicationCount} Active ${member.applicationCount === 1 ? 'Application' : 'Applications'}`
                    }
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Member Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                      <p className="text-sm text-gray-900">{formatDate(member.dateOfBirth)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {member.hasActivePolicies ? 'Covered Policies' : 'Applications'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {member.hasActivePolicies ? (
                          member.coveredPolicies.map((policyId, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-green-200 text-green-700 bg-green-50 text-xs cursor-pointer hover:bg-green-100"
                              onClick={() => router.push(`/policies/${policyId}`)}
                            >
                              #{policyId.slice(0, 8)}
                            </Badge>
                          ))
                        ) : (
                          member.coveredApplications.map((appId, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-blue-200 text-blue-700 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100"
                              onClick={() => router.push(`/applications/${appId}`)}
                            >
                              #{appId.slice(0, 8)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleEdit(member.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-transparent"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    onClick={() => handleDelete(member.id)}
                    variant="outline"
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white border-red-500 px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State - Show when no family members */}
      {!loading && !error && members.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">No family members added</h3>
              <p className="text-gray-600">Add family members to manage their insurance coverage</p>
            </div>
            <Button
              onClick={handleAddMember}
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 px-6 py-2 rounded-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Your First Family Member
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
