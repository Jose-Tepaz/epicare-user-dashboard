'use client'

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProfileContent } from "@/components/profile-content"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/SHARED-HOOKS"

export default function ProfilePage() {
  const { user } = useAuth()
  const { profile, loading, error } = useUserProfile(user?.id || null)

  return (
    <DashboardLayout currentPage="Profile">
      <ProfileContent 
        profile={profile}
        loading={loading}
        error={error}
      />
    </DashboardLayout>
  )
}
