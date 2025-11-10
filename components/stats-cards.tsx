import { Card } from "@/components/ui/card"
import type { DashboardStats } from "@/lib/types/SHARED-TYPES"

interface StatsCardsProps {
  stats: DashboardStats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getNextPaymentDate = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const statsList = [
    {
      title: "Active Applications",
      value: stats?.total_applications?.toString() || "0",
      subtitle: `${stats?.pending_applications || 0} pending review`,
      color: "text-orange-500",
    },
    {
      title: "Active Policies",
      value: stats?.active_policies?.toString() || "0",
      subtitle: stats?.total_monthly_premium ? `${formatCurrency(stats.total_monthly_premium)}/month total` : "No active policies",
      color: "text-orange-500",
    },
    {
      title: "Total Applications",
      value: stats?.total_applications?.toString() || "0",
      subtitle: `${stats?.applications_by_status?.active || 0} active, ${stats?.applications_by_status?.approved || 0} approved`,
      color: "text-blue-500",
    },
    {
      title: "Next Payment",
      value: getNextPaymentDate(),
      subtitle: stats?.total_monthly_premium ? `${formatCurrency(stats.total_monthly_premium)} due` : "No payments due",
      color: "text-green-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsList.map((stat, index) => (
        <Card key={index} className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <p className="text-sm text-gray-500">{stat.subtitle}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
