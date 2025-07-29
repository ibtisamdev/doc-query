"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import { CitationDisplay } from '@/components/citation-display'

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
  isStreaming?: boolean
  citations?: Citation[]
  feedback?: number // 1 for thumbs up, -1 for thumbs down, undefined for no feedback
  messageId?: number // Backend message ID for feedback submission
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>
  onStreamMessage?: (message: string, onChunk: (chunk: any) => void) => Promise<void>
  messages?: Message[]
  isLoading?: boolean
  onClearChat?: () => void
  onCitationClick?: (citation: Citation) => void
  onQuoteCitation?: (citation: Citation) => void
  onFeedbackSubmit?: (messageId: number, feedback: 'positive' | 'negative') => Promise<void>
}

export function ChatInterface({
  onSendMessage,
  onStreamMessage,
  messages = [],
  isLoading = false,
  onClearChat,
  onCitationClick,
  onQuoteCitation,
  onFeedbackSubmit
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, streamingMessage])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSending) return

    const message = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    try {
      if (onStreamMessage) {
        // Handle streaming response
        setStreamingMessage('')
        await onStreamMessage(message, (chunk: string) => {
          setStreamingMessage(prev => prev + chunk)
        })
        // Clear streaming message after it's been added to messages array
        setStreamingMessage('')
      } else {
        // Handle regular response
        await onSendMessage(message)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }, [inputValue, isSending, onSendMessage, onStreamMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleFeedback = useCallback(async (messageId: number, feedback: 'positive' | 'negative') => {
    if (!onFeedbackSubmit || feedbackSubmitting === messageId) return

    setFeedbackSubmitting(messageId)
    try {
      await onFeedbackSubmit(messageId, feedback)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setFeedbackSubmitting(null)
    }
  }, [onFeedbackSubmit, feedbackSubmitting])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      className={`flex gap-3 p-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}
    >
      {message.role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-900'
          }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className="flex items-center justify-between mt-2">
          <div
            className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}
          >
            {formatTime(message.timestamp)}
          </div>

          {/* Feedback buttons for assistant messages */}
          {message.role === 'assistant' && message.messageId && onFeedbackSubmit && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${message.feedback === 1 ? 'text-green-600' : 'text-gray-400'}`}
                onClick={() => handleFeedback(message.messageId!, 'positive')}
                disabled={feedbackSubmitting === message.messageId}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${message.feedback === -1 ? 'text-red-600' : 'text-gray-400'}`}
                onClick={() => handleFeedback(message.messageId!, 'negative')}
                disabled={feedbackSubmitting === message.messageId}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Citations for assistant messages */}
      {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
        <div className="w-full mt-2">
          <CitationDisplay
            citations={message.citations}
            onCitationClick={onCitationClick}
            onQuoteCitation={onQuoteCitation}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Chat Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Doc Query Chat
            </CardTitle>
            {onClearChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearChat}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 mb-4">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-[500px] w-full">
            <div ref={scrollAreaRef} className="flex flex-col">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                  <Bot className="h-12 w-12 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Doc Query</h3>
                  <p className="text-sm">
                    Ask questions about your uploaded documents and get intelligent responses.
                  </p>
                </div>
              )}

              {messages.map(renderMessage)}

              {/* Streaming Message */}
              {streamingMessage && (
                <div className="flex gap-3 p-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                    <div className="whitespace-pre-wrap break-words">
                      {streamingMessage}
                      <span className="animate-pulse">▋</span>
                    </div>
                    <div className="text-xs mt-1 text-gray-500">
                      {formatTime(new Date())}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isLoading && !streamingMessage && (
                <div className="flex gap-3 p-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              disabled={isSending || isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || isLoading}
              className="flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 