"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { Loader2 } from "lucide-react"

interface DashboardProps {
  user: any
  onLogout: () => void
}

interface Chat {
  id: string
  title: string
  createdAt: string
  profile?: any
  messages: any[]
  testData?: any
  reportText?: string
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Track analysis state per chat
  const [analyzingChats, setAnalyzingChats] = useState<{ [chatId: string]: boolean }>({})

  // Store abort controllers for each chat's analysis
  const abortControllers = useRef<{ [chatId: string]: AbortController }>({})

  const [isLoading, setIsLoading] = useState(true)
  const [switchingChatId, setSwitchingChatId] = useState<string | null>(null)

  useEffect(() => {
    // Load chats from localStorage
    setIsLoading(true)
    const savedChats = localStorage.getItem("chats")
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats)
      setChats(parsedChats)
      if (parsedChats.length > 0) {
        setActiveChat(parsedChats[0])
      }
    }
    setTimeout(() => setIsLoading(false), 500) // Simulate loading
  }, [])

  const saveChats = (updatedChats: Chat[]) => {
    setChats(updatedChats)
    localStorage.setItem("chats", JSON.stringify(updatedChats))
  }

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    }
    const updatedChats = [newChat, ...chats]
    saveChats(updatedChats)
    setActiveChat(newChat)
  }

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    const updatedChats = chats.map((chat) => (chat.id === chatId ? { ...chat, ...updates } : chat))
    saveChats(updatedChats)
    if (activeChat?.id === chatId) {
      setActiveChat({ ...activeChat, ...updates })
    }
  }

  const deleteChat = (chatId: string) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    saveChats(updatedChats)
    if (activeChat?.id === chatId) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0] : null)
    }
    // Clean up analysis state and abort controller
    setAnalyzingChats((prev) => {
      const copy = { ...prev }
      delete copy[chatId]
      return copy
    })
    if (abortControllers.current[chatId]) {
      abortControllers.current[chatId].abort()
      delete abortControllers.current[chatId]
    }
  }

  // --- Analysis and message logic moved here ---
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

  const handlePdfAnalysis = async (chat: Chat, file: File) => {
    setAnalyzingChats((prev) => ({ ...prev, [chat.id]: true }))
    // Create a new abort controller for this analysis
    const controller = new AbortController()
    abortControllers.current[chat.id] = controller

    try {
      const formData = new FormData()
      formData.append("file", file)

      const extractResponse = await fetch(`${BACKEND_URL}/api/extract_pdf`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      if (!extractResponse.ok) {
        throw new Error("Failed to extract PDF text")
      }

      const { text: reportText } = await extractResponse.json()

      const analyzeResponse = await fetch(`${BACKEND_URL}/api/analyze_report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportText,
          userProfile: chat.profile,
        }),
        signal: controller.signal,
      })

      if (!analyzeResponse.ok) {
        throw new Error("Failed to analyze report")
      }

      const { testData, insight } = await analyzeResponse.json()

      const analysisMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: insight,
        timestamp: new Date().toISOString(),
        type: "analysis",
      }

      updateChat(chat.id, {
        testData,
        reportText,
        messages: [...chat.messages, analysisMessage],
      })
    } catch (error) {
      if (controller.signal.aborted) {
        // If aborted, do not show error message
        return
      }
      console.error("Error analyzing PDF:", error)
      const errorMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          error instanceof TypeError
            ? "Could not connect to the backend server. Please make sure it is running and accessible."
            : "Sorry, I encountered an error while analyzing your report. Please try again.",
        timestamp: new Date().toISOString(),
        type: "error",
      }
      updateChat(chat.id, {
        messages: [...chat.messages, errorMessage],
      })
    } finally {
      setAnalyzingChats((prev) => ({ ...prev, [chat.id]: false }))
      delete abortControllers.current[chat.id]
    }
  }

  const handleSendMessage = async (chat: Chat, message: string) => {
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...chat.messages, userMessage]
    updateChat(chat.id, { messages: updatedMessages })

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          testData: chat.testData,
          userProfile: chat.profile,
          sessionId: chat.id,
          reportText: chat.reportText,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const { response: aiResponse } = await response.json()

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }

      updateChat(chat.id, {
        messages: [...updatedMessages, assistantMessage],
      })
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          error instanceof TypeError
            ? "Could not connect to the backend server. Please make sure it is running and accessible."
            : "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
        type: "error",
      }

      updateChat(chat.id, {
        messages: [...updatedMessages, errorMessage],
      })
    }
  }

  const handleSelectChat = (chat: Chat) => {
    setSwitchingChatId(chat.id)
    setTimeout(() => {
      setActiveChat(chat)
      setSwitchingChatId(null)
    }, 200) // Fade animation duration
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <Sidebar
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
          user={user}
          analyzingChats={analyzingChats}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">{activeChat?.title || "Medical Report Analysis"}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50 animate-fade-in">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <span className="text-lg text-blue-700 font-medium">Loading your chats...</span>
            </div>
          ) : switchingChatId ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-40 animate-fade-out pointer-events-none opacity-60">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
              <span className="text-blue-700">Switching chat...</span>
            </div>
          ) : activeChat ? (
            <ChatInterface
              chat={activeChat}
              onUpdateChat={async (updates) => updateChat(activeChat.id, updates)}
              onPdfAnalysis={async (file) => await handlePdfAnalysis(activeChat, file)}
              onSendMessage={async (message) => await handleSendMessage(activeChat, message)}
              isAnalyzing={!!analyzingChats[activeChat.id]}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Medical Report Analysis</h2>
                <p className="text-gray-600 mb-4">Create a new chat to start analyzing your medical reports</p>
                <Button onClick={createNewChat}>Start New Analysis</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
