"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Calendar, Users, FileText } from "lucide-react"

interface ProfileFormProps {
  onSubmit: (profile: any) => void
}

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    medicalHistory: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const profile = {
      ...formData,
      medicalHistory: formData.medicalHistory
        ? formData.medicalHistory
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    }

    onSubmit(profile)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Patient Profile</h2>
        <p className="text-gray-600 mt-2">Please provide your details to get personalized medical insights</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Age
          </Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={(e) => handleChange("age", e.target.value)}
            required
            min="1"
            max="120"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gender
          </Label>
          <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicalHistory" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Medical History (Optional)
          </Label>
          <Textarea
            id="medicalHistory"
            placeholder="Enter any relevant medical conditions, separated by commas (e.g., diabetes, hypertension, allergies)"
            value={formData.medicalHistory}
            onChange={(e) => handleChange("medicalHistory", e.target.value)}
            rows={3}
          />
          <p className="text-xs text-gray-500">Separate multiple conditions with commas</p>
        </div>

        <Button type="submit" className="w-full" disabled={!formData.name || !formData.age || !formData.gender}>
          Continue to Report Upload
        </Button>
      </form>
    </div>
  )
}
