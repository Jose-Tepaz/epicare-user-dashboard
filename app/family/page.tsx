'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { FamilyContent } from "@/components/family-content"
import { useAuth } from "@/contexts/auth-context"
import { useApplications } from "@/hooks/SHARED-HOOKS"
import { useMemo } from "react"

export default function FamilyPage() {
  const { user } = useAuth()
  const { applications, loading, error } = useApplications(user?.id || null)

  // Extraer miembros únicos de la familia desde los applicants
  // De TODAS las aplicaciones (activas e inactivas)
  const familyMembers = useMemo(() => {
    if (!applications || applications.length === 0) return []

    const membersMap = new Map<string, {
      id: string
      name: string
      relationship: string
      dateOfBirth: string
      coveredPolicies: string[]
      coveredApplications: string[]
    }>()

    applications.forEach(app => {
      app.applicants?.forEach(applicant => {
        const key = `${applicant.first_name}_${applicant.last_name}_${applicant.date_of_birth}`
        
        if (!membersMap.has(key)) {
          membersMap.set(key, {
            id: key,
            name: `${applicant.first_name}${applicant.middle_initial ? ` ${applicant.middle_initial}.` : ''} ${applicant.last_name}`,
            relationship: applicant.relationship,
            dateOfBirth: applicant.date_of_birth,
            coveredPolicies: [],
            coveredApplications: [app.id]
          })
        } else {
          const member = membersMap.get(key)!
          if (!member.coveredApplications.includes(app.id)) {
            member.coveredApplications.push(app.id)
          }
        }

        // Agregar a pólizas activas si el estado es active o approved
        if (app.status === 'active' || app.status === 'approved') {
          const member = membersMap.get(key)!
          if (!member.coveredPolicies.includes(app.id)) {
            member.coveredPolicies.push(app.id)
          }
        }
      })
    })

    return Array.from(membersMap.values()).map(member => {
      const activePolicies = member.coveredPolicies.length
      const allApplications = member.coveredApplications.length
      
      return {
        ...member,
        policyCount: activePolicies,
        applicationCount: allApplications,
        hasActivePolicies: activePolicies > 0
      }
    })
  }, [applications])

  return (
    <DashboardLayout currentPage="Family">
      <FamilyContent 
        members={familyMembers} 
        loading={loading} 
        error={error}
        userId={user?.id}
      />
    </DashboardLayout>
  )
}
