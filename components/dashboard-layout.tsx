"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X, Settings, ArrowLeft, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

const navigationItems = [
  { name: "Dashboard", href: "/", active: false },
  { name: "Applications", href: "/applications", active: false },
  { name: "Documents", href: "/documents", active: false },
  { name: "My policies", href: "/policies", active: false },
  { name: "Family", href: "/family", active: false },
  { name: "Profile", href: "/profile", active: false },
  { name: "Support", href: "/support", active: false },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

export function DashboardLayout({ children, currentPage = "Dashboard" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-orange-500 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-orange-500 font-bold text-sm">E</span>
              </div>
              <div className="text-white">
                <div className="font-bold text-lg">epicare</div>
                <div className="text-sm opacity-90">Plans</div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-orange-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  item.name === currentPage ? "bg-orange-400 text-white" : "text-white hover:bg-orange-400",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Settings and User Actions */}
          <div className="p-4 space-y-2">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            
            {/* Back to Marketplace */}
            <Link
              href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Marketplace
            </Link>
            
            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white hover:bg-orange-400 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-medium text-gray-900">{user?.email?.split('@')[0] || 'User'}</span>
          <div className="flex items-center gap-2">
            <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                Buy New Insurance
              </Button>
            </Link>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
          <span className="font-medium text-gray-900">{user?.email?.split('@')[0] || 'User'}</span>
          <div className="flex items-center gap-3">
            <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Buy New Insurance</Button>
            </Link>
            <Link href={process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000'}>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                Back to Marketplace
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
