import { DashboardLayout } from "@/components/dashboard-layout"
import { SettingsContent } from "@/components/settings-content"

export default function SettingsPage() {
  return (
    <DashboardLayout currentPage="Settings">
      <SettingsContent />
    </DashboardLayout>
  )
}
