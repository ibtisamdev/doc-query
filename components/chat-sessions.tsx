"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, Clock, Hash } from 'lucide-react'

interface ChatSession {
  session_id: string
  created_at: string
  updated_at: string
  message_count: number
}

interface ChatSessionsProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
}

export function ChatSessions({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession
}: ChatSessionsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatSessionId = (sessionId: string) => {
    return sessionId.substring(0, 8) + '...'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chat History</h3>
        <Button
          onClick={onNewSession}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No chat history yet</p>
            <p className="text-sm">Start a new conversation to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.session_id}
              className={`cursor-pointer transition-colors ${currentSessionId === session.session_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
                }`}
              onClick={() => onSessionSelect(session.session_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">
                        {formatSessionId(session.session_id)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.message_count} messages
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDate(session.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 