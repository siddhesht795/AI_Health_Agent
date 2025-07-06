"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Trash2, User, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Chat {
  id: string
  title: string
  createdAt: string
  profile?: any
  messages: any[]
}

interface SidebarProps {
  chats: Chat[]
  activeChat: Chat | null
  onSelectChat: (chat: Chat) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  user: any
  analyzingChats?: { [chatId: string]: boolean } // <-- add this prop
}

export function Sidebar({ chats, activeChat, onSelectChat, onNewChat, onDeleteChat, user, analyzingChats }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-transform hover:scale-105">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Button onClick={onNewChat} className="w-full transition-transform hover:scale-105 active:scale-95">
          <Plus className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-pulse" />
              <p className="text-gray-500 text-sm">No chats yet</p>
              <p className="text-gray-400 text-xs">Start a new analysis to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    group relative p-3 rounded-lg cursor-pointer transition-colors duration-150
                    ${activeChat?.id === chat.id ? "bg-blue-50 border border-blue-200 shadow-md" : "hover:bg-blue-100"}
                  `}
                  onClick={() => onSelectChat(chat)}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter") onSelectChat(chat) }}
                  aria-label={`Open chat ${chat.title}`}
                  role="button"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate flex items-center gap-2">
                        {chat.title}
                        {analyzingChats && analyzingChats[chat.id] && (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" title="Analyzing..." />
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}
                      </p>
                      {chat.profile && (
                        <p className="text-xs text-gray-400 mt-1">
                          {chat.profile.name}, {chat.profile.age}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-red-50 active:scale-90"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteChat(chat.id)
                      }}
                      tabIndex={-1}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
