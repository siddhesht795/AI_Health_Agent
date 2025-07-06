"use client"

import { useState, useRef, useEffect } from "react"
import { ProfileForm } from "@/components/profile-form"
import { PdfUpload } from "@/components/pdf-upload"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Chat {
  id: string
  title: string
  createdAt: string
  profile?: any
  messages: any[]
  testData?: any
  reportText?: string
}

interface ChatInterfaceProps {
  chat: Chat
  onUpdateChat: (updates: Partial<Chat>) => void
  onPdfAnalysis: (file: File) => void
  onSendMessage: (message: string) => void
  isAnalyzing: boolean
}

export function ChatInterface({
  chat,
  onUpdateChat,
  onPdfAnalysis,
  onSendMessage,
  isAnalyzing,
}: ChatInterfaceProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const [isThinking, setIsThinking] = useState(false)

  const scrollToStartOfLastMessage = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  useEffect(() => {
    scrollToStartOfLastMessage()
  }, [chat.messages])

  const handleProfileSubmit = (profile: any) => {
    onUpdateChat({
      profile,
      title: `${profile.name} - ${profile.age} - ${new Date().toLocaleDateString()}`,
    })
  }

  const handleSendMessage = (message: string) => {
    setIsThinking(true)
    const maybePromise = onSendMessage(message)
    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.finally(() => setIsThinking(false))
    }
  }

  useEffect(() => {
    if (!isAnalyzing) {
      setIsThinking(false)
    }
  }, [isAnalyzing])

  if (!chat.profile) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <ProfileForm onSubmit={handleProfileSubmit} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!chat.testData && chat.messages.length === 0 && !isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <PdfUpload
              onUpload={onPdfAnalysis}
              isAnalyzing={isAnalyzing}
              profile={chat.profile}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative" ref={chatContainerRef}>
      {/* Modal overlay when analyzing */}
      <Dialog open={isAnalyzing}>
        <DialogContent
          className="flex flex-col items-center justify-center gap-3 outline-none border-none shadow-none bg-white/90 dark:bg-black/80"
          hideClose
        >
          <DialogHeader>
            <DialogTitle>Analyzing Report</DialogTitle>
            <DialogDescription>
              Please wait while we analyze your medical report.
            </DialogDescription>
          </DialogHeader>
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-medium">Analyzing report...</span>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-hidden">
        <ChatMessages messages={chat.messages} lastMessageRef={lastMessageRef} />

        {isThinking && (
          <div className="flex items-center gap-2 px-4 py-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-gray-500">Assistant is thinking...</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
