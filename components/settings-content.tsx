"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Search, Bell, Shield, CreditCard, Globe, Users, Database, Key } from "lucide-react"

const settingsCategories = [
  { id: "general", label: "General", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team Management", icon: Users },
  { id: "data", label: "Data & Privacy", icon: Database },
  { id: "advanced", label: "Advanced", icon: Key },
]

export function SettingsContent() {
  const [activeCategory, setActiveCategory] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const handleSave = (section: string) => {
    toast({
      title: "Settings Updated",
      description: `${section} settings have been saved successfully.`,
    })
  }

  const filteredCategories = settingsCategories.filter((category) =>
    category.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  const getCurrentCategoryLabel = () => {
    return settingsCategories.find((cat) => cat.id === activeCategory)?.label || "General"
  }

  const renderContent = () => {
    switch (activeCategory) {
      case "general":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" defaultValue="Epicare Plans" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Account Type</Label>
                    <Select defaultValue="premium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="est">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="cst">Central Time (CST)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleSave("General")} className="bg-orange-600 hover:bg-orange-700">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what email notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Policy Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about policy changes and renewals</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders for upcoming payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Application Status</Label>
                    <p className="text-sm text-muted-foreground">Updates on your insurance applications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button onClick={() => handleSave("Notifications")} className="bg-orange-600 hover:bg-orange-700">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password & Authentication</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
                <Button onClick={() => handleSave("Security")} className="bg-orange-600 hover:bg-orange-700">
                  Update Security
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "billing":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="**** **** **** 1234" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-address">Billing Address</Label>
                  <Textarea id="billing-address" placeholder="Enter your billing address" />
                </div>
                <Button onClick={() => handleSave("Billing")} className="bg-orange-600 hover:bg-orange-700">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "team":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage team access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Invite Team Member</Label>
                  <div className="flex gap-2">
                    <Input id="invite-email" placeholder="email@example.com" className="flex-1" />
                    <Button className="bg-orange-600 hover:bg-orange-700">Invite</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Default Role for New Members</Label>
                  <Select defaultValue="viewer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleSave("Team Management")} className="bg-orange-600 hover:bg-orange-700">
                  Save Team Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "data":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Control how your data is used and stored</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Analytics</Label>
                    <p className="text-sm text-muted-foreground">Allow us to collect anonymous usage data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing emails and updates</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select defaultValue="2years">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="2years">2 Years</SelectItem>
                      <SelectItem value="5years">5 Years</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleSave("Data & Privacy")} className="bg-orange-600 hover:bg-orange-700">
                  Update Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case "advanced":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Advanced configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input id="api-key" value="sk-..." readOnly className="flex-1" />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Developer Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable advanced developer features</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select defaultValue="info">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleSave("Advanced")} className="bg-orange-600 hover:bg-orange-700">
                  Save Advanced Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <div>Select a category to view settings</div>
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="lg:hidden p-4 border-b bg-muted/10">
        <Select value={activeCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category">
              <div className="flex items-center gap-2">
                {(() => {
                  const category = settingsCategories.find((cat) => cat.id === activeCategory)
                  const Icon = category?.icon
                  return (
                    <>
                      {Icon && <Icon className="h-4 w-4" />}
                      {category?.label}
                    </>
                  )
                })()}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {settingsCategories.map((category) => {
              const Icon = category.icon
              return (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 border-r bg-muted/10 p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <nav className="space-y-1">
            {filteredCategories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? "bg-orange-100 text-orange-700 font-medium"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl lg:text-2xl font-bold">Settings</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  )
}
