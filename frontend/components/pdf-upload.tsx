"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, Loader2, User } from "lucide-react"

interface PdfUploadProps {
  onUpload: (file: File) => void
  isAnalyzing: boolean
  profile: any
}

export function PdfUpload({ onUpload, isAnalyzing, profile }: PdfUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0] && files[0].type === "application/pdf") {
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-600">
              {profile.age} years old • {profile.gender}
            </p>
            {profile.medicalHistory && profile.medicalHistory.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">Medical History: {profile.medicalHistory.join(", ")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Upload Medical Report</h2>
        <p className="text-gray-600 mt-2">Upload your PDF medical report to get AI-powered analysis and insights</p>
      </div>

      {/* File Upload Area */}
      <Card
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${selectedFile ? "border-green-400 bg-green-50" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          {selectedFile ? (
            <div className="space-y-3">
              <FileText className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">Drop your PDF here, or click to browse</p>
                <p className="text-sm text-gray-500">Supports PDF files up to 10MB</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

      {selectedFile && (
        <div className="space-y-3">
          <Button onClick={handleUpload} className="w-full" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Report...
              </>
            ) : (
              "Analyze Report"
            )}
          </Button>

          <Button variant="outline" onClick={() => setSelectedFile(null)} className="w-full" disabled={isAnalyzing}>
            Choose Different File
          </Button>
        </div>
      )}
    </div>
  )
}
