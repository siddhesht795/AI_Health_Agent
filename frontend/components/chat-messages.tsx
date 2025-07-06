"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { User, Bot, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  type?: "analysis" | "error"
}

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to the bottom (into view) whenever messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>Your analysis will appear here</p>
          <p className="text-sm">Ask questions about your medical report</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                  ${message.type === "error" ? "bg-red-100" : "bg-blue-100"}`}
              >
                {message.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Bot className="h-4 w-4 text-blue-600" />
                )}
              </div>
            )}

            <Card
              className={`max-w-[80%] ${message.role === "user"
                ? "bg-blue-600 text-white"
                : message.type === "error"
                  ? "bg-red-50 border-red-200"
                  : message.type === "analysis"
                    ? "bg-green-50 border-green-200"
                    : "bg-white"
                }`}
            >
              <CardContent className="p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.role === "assistant" && message.type !== "error" ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
                <div
                  className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-blue-100" : "text-gray-500"
                    }`}
                >
                  {isNaN(new Date(message.timestamp).getTime())
                    ? ""
                    : formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>

            {message.role === "user" && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Scroll target for auto-scroll to bottom */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
