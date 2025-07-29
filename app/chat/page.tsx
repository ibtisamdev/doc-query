"use client"

import { useState, useEffect } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { ChatSessions } from '@/components/chat-sessions'
import { DocumentViewer } from '@/components/document-viewer'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/api'

interface Citation {
  id: string
  document_id: number
  filename: string
  content: string
  page_number?: number
  chunk_index: number
  similarity_score: number
  start_position?: number
  end_position?: number
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  sessionId?: string
  feedback?: number
  citations?: Citation[]
  messageId?: number // Backend message ID for feedback submission
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<any[]>([])
  const [documentViewer, setDocumentViewer] = useState<{
    isOpen: boolean
    documentId: number
    filename: string
    highlightChunk?: number
  }>({
    isOpen: false,
    documentId: 0,
    filename: ''
  })

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions()
  }, [])

  // Load chat sessions
  const loadChatSessions = async () => {
    try {
      const response = await apiService.getChatSessions()
      if (response.success && response.data) {
        setChatSessions(response.data)
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
    }
  }

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await apiService.getChatMessages(sessionId)
      if (response.success && response.data) {
        const formattedMessages: Message[] = response.data.map((msg: any) => [
          {
            id: msg.id.toString(),
            content: msg.message,
            role: 'user' as const,
            timestamp: new Date(msg.created_at),
            sessionId: sessionId,
            feedback: msg.feedback
          },
          {
            id: (msg.id + 0.5).toString(),
            content: msg.response,
            role: 'assistant' as const,
            timestamp: new Date(msg.created_at),
            sessionId: sessionId,
            feedback: msg.feedback,
            messageId: msg.id // Backend message ID for feedback
          }
        ]).flat()
        setMessages(formattedMessages)
        setCurrentSessionId(sessionId)
      }
    } catch (error) {
      console.error('Failed to load session messages:', error)
    }
  }

  // Create new chat session
  const createNewSession = () => {
    setMessages([])
    setCurrentSessionId(null)
  }

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
      sessionId: currentSessionId || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Send message to persistent chat system
      const response = await apiService.sendChatMessage(currentSessionId, message)
      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data.response,
          role: 'assistant',
          timestamp: new Date(),
          sessionId: response.data.session_id
        }
        setMessages(prev => [...prev, assistantMessage])

        // Update current session ID if this is a new session
        if (!currentSessionId) {
          setCurrentSessionId(response.data.session_id)
        }

        // Reload chat sessions to show the new session
        await loadChatSessions()
      } else {
        throw new Error(response.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat failed:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant',
        timestamp: new Date(),
        sessionId: currentSessionId || undefined
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamMessage = async (message: string, onChunk: (chunk: any) => void) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
      sessionId: currentSessionId || undefined
    }

    setMessages(prev => [...prev, userMessage])

    let fullResponse = ''
    let citations: Citation[] = []
    let messageId: number | undefined

    try {
      // Use streaming chat with persistence
      await apiService.sendStreamingChatMessage(currentSessionId, message, (data) => {
        if (data.type === 'content') {
          fullResponse += data.content
          onChunk(data.content)
        } else if (data.type === 'complete') {
          // The complete message contains the full response and citations
          fullResponse = data.content
          citations = data.citations || []
          messageId = data.message_id
          onChunk(data.content)

          // Update current session ID if this is a new session
          if (!currentSessionId) {
            setCurrentSessionId(data.session_id)
          }

          // Reload chat sessions to show the new session
          loadChatSessions()
        }
      })

      // Add the complete assistant message to the messages array
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date(),
        sessionId: currentSessionId || undefined,
        citations: citations,
        messageId: messageId
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Streaming failed:', error)
      const errorResponse = `\n\nError: ${error instanceof Error ? error.message : 'Streaming failed'}`
      fullResponse += errorResponse
      onChunk(errorResponse)

      // Add error message to messages array
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date(),
        sessionId: currentSessionId || undefined
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Handle feedback submission
  const handleFeedbackSubmit = async (messageId: number, feedback: 'positive' | 'negative') => {
    try {
      const feedbackValue = feedback === 'positive' ? 1 : -1
      const response = await apiService.submitFeedback(messageId, feedback)

      if (response.success) {
        // Update the message feedback in the local state
        setMessages(prev => prev.map(msg =>
          msg.messageId === messageId
            ? { ...msg, feedback: feedbackValue }
            : msg
        ))
      } else {
        console.error('Failed to submit feedback:', response.error)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setCurrentSessionId(null)
  }

  // Citation handling functions
  const handleCitationClick = (citation: Citation) => {
    setDocumentViewer({
      isOpen: true,
      documentId: citation.document_id,
      filename: citation.filename,
      highlightChunk: citation.chunk_index
    })
  }

  const handleQuoteCitation = (citation: Citation) => {
    const quoteText = `"${citation.content}"\n\nSource: ${citation.filename}${citation.page_number ? ` (Page ${citation.page_number})` : ''}`
    navigator.clipboard.writeText(quoteText)
  }

  const closeDocumentViewer = () => {
    setDocumentViewer({
      isOpen: false,
      documentId: 0,
      filename: ''
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-3">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-gray-600">Ask questions about your uploaded documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Chat Sessions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Chat Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <ChatSessions
                  sessions={chatSessions}
                  currentSessionId={currentSessionId}
                  onSessionSelect={loadSessionMessages}
                  onNewSession={createNewSession}
                />
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-160px)]">
              <CardContent className="p-0 h-full">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onStreamMessage={handleStreamMessage}
                  isLoading={isLoading}
                  onClearChat={handleClearChat}
                  onCitationClick={handleCitationClick}
                  onQuoteCitation={handleQuoteCitation}
                  onFeedbackSubmit={handleFeedbackSubmit}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Document Viewer Modal */}
        {documentViewer.isOpen && (
          <DocumentViewer
            documentId={documentViewer.documentId}
            filename={documentViewer.filename}
            onClose={closeDocumentViewer}
            highlightChunk={documentViewer.highlightChunk}
          />
        )}
      </div>
    </DashboardLayout>
  )
} 