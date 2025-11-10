"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/SHARED-HOOKS"
import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/lib/types/SHARED-TYPES"

const tabs = [
  { id: "personal", name: "Personal Info" },
  { id: "address", name: "Address" },
]

interface ProfileContentProps {
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export function ProfileContent({ profile: initialProfile, loading, error }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  
  // Get updateProfile from the hook
  const { updateProfile } = useUserProfile(initialProfile?.id || null)

  const initializeFormData = (profileData: UserProfile | null) => {
    if (!profileData) {
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
        isSmoker: false,
        lastTobaccoUse: "",
      }
    }

    return {
      firstName: profileData.first_name || "",
      lastName: profileData.last_name || "",
      email: profileData.email || "",
      phone: profileData.phone || "",
      dateOfBirth: profileData.date_of_birth || "",
      gender: profileData.gender || "",
      address: profileData.address || "",
      city: profileData.city || "",
      state: profileData.state || "",
      zipCode: profileData.zip_code || "",
      country: profileData.country || "United States",
      isSmoker: profileData.is_smoker || false,
      lastTobaccoUse: profileData.last_tobacco_use || "",
    }
  }

  const [formData, setFormData] = useState(initializeFormData(initialProfile))
  const [originalData, setOriginalData] = useState(initializeFormData(initialProfile))

  // Update form when profile data changes
  useEffect(() => {
    if (initialProfile && !isEditing) {
      const newFormData = initializeFormData(initialProfile)
      setFormData(newFormData)
      setOriginalData(newFormData)
    }
  }, [initialProfile, isEditing])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - restore original data
      setFormData(originalData)
      setIsEditing(false)
    } else {
      // Start editing - backup current data
      setOriginalData(formData)
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      })
      return
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (!initialProfile) {
      toast({
        title: "Error",
        description: "Profile not loaded. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      // Prepare data for Supabase
      const profileUpdate = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        country: formData.country || "United States",
        is_smoker: formData.isSmoker,
        last_tobacco_use: formData.lastTobaccoUse || null,
      }

      await updateProfile(profileUpdate)

      // Update original data and exit edit mode
      setOriginalData(formData)
      setIsEditing(false)

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTabChange = (tabId: string) => {
    console.log("[v0] Switching to tab:", tabId)
    setActiveTab(tabId)
    // Reset editing mode when switching tabs
    if (isEditing) {
      setFormData(originalData)
      setIsEditing(false)
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your personal information and account preferences</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-[#f5804f] hover:bg-[#e06d3a] text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#f5804f] focus:ring-offset-2",
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "personal" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h2>
            <p className="text-gray-600 mb-6">Update your basic personal details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing}
                className={cn("w-full", !isEditing && "bg-gray-50")}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={!isEditing}
                className={cn("w-full", !isEditing && "bg-gray-50")}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isEditing}
              className={cn("w-full", !isEditing && "bg-gray-50")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                className={cn("w-full", !isEditing && "bg-gray-50")}
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                Date of Birth
              </Label>
              <Input
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                disabled={!isEditing}
                className={cn("w-full", !isEditing && "bg-gray-50")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                disabled={!isEditing}
              >
                <SelectTrigger className={cn("w-full", !isEditing && "bg-gray-50")}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {activeTab === "address" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Address Information</h2>
            <p className="text-gray-600 mb-6">Update your home address details</p>
          </div>

          <div className="space-y-6">
            {/* Street Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Street Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                className={cn("w-full", !isEditing && "bg-gray-50")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={!isEditing}
                  className={cn("w-full", !isEditing && "bg-gray-50")}
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                  State
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange("state", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn("w-full", !isEditing && "bg-gray-50")}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ZIP Code */}
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                  ZIP Code
                </Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  disabled={!isEditing}
                  className={cn("w-full", !isEditing && "bg-gray-50")}
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn("w-full", !isEditing && "bg-gray-50")}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h2>
            <p className="text-gray-600 mb-6">Choose how you want to receive notifications</p>
          </div>

          <div className="space-y-6">
            {/* Communication Preferences */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Communication Preferences</h3>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via text message</p>
                </div>
                <Switch
                  checked={formData.smsNotifications}
                  onCheckedChange={(checked) => handleInputChange("smsNotifications", checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
                </div>
                <Switch
                  checked={formData.pushNotifications}
                  onCheckedChange={(checked) => handleInputChange("pushNotifications", checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Content Preferences */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900">Content Preferences</h3>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
                </div>
                <Switch
                  checked={formData.marketingEmails}
                  onCheckedChange={(checked) => handleInputChange("marketingEmails", checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Policy Updates</Label>
                  <p className="text-sm text-gray-500">Important updates about your insurance policies</p>
                </div>
                <Switch
                  checked={formData.policyUpdates}
                  onCheckedChange={(checked) => handleInputChange("policyUpdates", checked)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Payment Reminders</Label>
                  <p className="text-sm text-gray-500">Reminders about upcoming payments</p>
                </div>
                <Switch
                  checked={formData.paymentReminders}
                  onCheckedChange={(checked) => handleInputChange("paymentReminders", checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h2>
            <p className="text-gray-600 mb-6">Manage your account security and password</p>
          </div>

          <div className="space-y-8">
            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Change Password</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                    disabled={!isEditing}
                    className={cn("w-full", !isEditing && "bg-gray-50")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange("newPassword", e.target.value)}
                      disabled={!isEditing}
                      className={cn("w-full", !isEditing && "bg-gray-50")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      disabled={!isEditing}
                      className={cn("w-full", !isEditing && "bg-gray-50")}
                    />
                  </div>
                </div>

                {isEditing && <Button className="bg-[#f5804f] hover:bg-[#e06d3a] text-white">Update Password</Button>}
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900">Two-Factor Authentication</h3>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={formData.twoFactorAuth}
                  onCheckedChange={(checked) => handleInputChange("twoFactorAuth", checked)}
                  disabled={!isEditing}
                />
              </div>

              {formData.twoFactorAuth && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Two-factor authentication is enabled. You'll receive a verification code via SMS when logging in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Billing Information</h2>
            <p className="text-gray-600 mb-6">Manage your payment methods and billing details</p>
          </div>

          <div className="space-y-8">
            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Payment Method</h3>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formData.cardNumber}</p>
                      <p className="text-sm text-gray-500">Expires {formData.expiryDate}</p>
                    </div>
                  </div>
                  {isEditing && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Add New Payment Method */}
            {isEditing && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-md font-medium text-gray-900">Add New Payment Method</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardHolder" className="text-sm font-medium text-gray-700">
                      Cardholder Name
                    </Label>
                    <Input
                      id="cardHolder"
                      value={formData.cardHolder}
                      onChange={(e) => handleInputChange("cardHolder", e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newCardNumber" className="text-sm font-medium text-gray-700">
                      Card Number
                    </Label>
                    <Input id="newCardNumber" placeholder="1234 5678 9012 3456" className="w-full" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newExpiryDate" className="text-sm font-medium text-gray-700">
                        Expiry Date
                      </Label>
                      <Input id="newExpiryDate" placeholder="MM/YY" className="w-full" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                        CVV
                      </Label>
                      <Input id="cvv" type="password" placeholder="123" className="w-full" />
                    </div>
                  </div>

                  <Button className="bg-[#f5804f] hover:bg-[#e06d3a] text-white">Add Payment Method</Button>
                </div>
              </div>
            )}

            {/* Billing Address */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900">Billing Address</h3>

              <div className="space-y-2">
                <Label htmlFor="billingAddress" className="text-sm font-medium text-gray-700">
                  Billing Address
                </Label>
                <Select
                  value={formData.billingAddress}
                  onValueChange={(value) => handleInputChange("billingAddress", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={cn("w-full", !isEditing && "bg-gray-50")}>
                    <SelectValue placeholder="Select billing address" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Same as address above">Same as address above</SelectItem>
                    <SelectItem value="Different address">Use different address</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
