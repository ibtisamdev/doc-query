"use client"

import { useState, useEffect } from 'react'
import { FileUpload } from '@/components/file-upload'
import { ChatInterface } from '@/components/chat-interface'
import { FileDashboard } from '@/components/file-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, MessageSquare, FolderOpen } from 'lucide-react'
import { apiService } from '@/lib/api'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Document {
  id: number
  filename: string
  file_type: string
  is_processed: boolean
  uploaded_at: string
  content?: string
}

type TabType = 'upload' | 'chat' | 'documents'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [messages, setMessages] = useState<Message[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    const response = await apiService.getDocuments()
    if (response.success && response.data && response.data.documents) {
      setDocuments(response.data.documents)
    } else {
      setDocuments([])
    }
  }

  // API functions
  const handleFileUpload = async (file: File) => {
    const response = await apiService.uploadDocument(file)
    if (response.success && response.data) {
      await loadDocuments() // Reload documents list
      return response.data // Return the uploaded document data
    } else {
      console.error('Upload failed:', response.error)
      throw new Error(response.error || 'Upload failed')
    }
  }

  const handleFileProcess = async (documentId: number) => {
    const response = await apiService.processDocument(documentId)
    if (response.success) {
      await loadDocuments() // Reload documents list
    } else {
      console.error('Processing failed:', response.error)
      throw new Error(response.error || 'Processing failed')
    }
  }

  const handleDeleteDocument = async (documentId: number) => {
    const response = await apiService.deleteDocument(documentId)
    if (response.success) {
      await loadDocuments() // Reload documents list
    } else {
      console.error('Delete failed:', response.error)
      throw new Error(response.error || 'Delete failed')
    }
  }

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await apiService.sendRagQuery(message)
      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data.response,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(response.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat failed:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStreamMessage = async (message: string, onChunk: (chunk: string) => void) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    let fullResponse = ''

    try {
      await apiService.sendStreamingRagQuery(message, (data) => {
        if (data.type === 'content') {
          fullResponse += data.content
          onChunk(data.content)
        } else if (data.type === 'complete') {
          // The complete message contains the full response
          fullResponse = data.content
          onChunk(data.content)
        }
      })

      // Add the complete assistant message to the messages array
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date()
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
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleClearChat = () => {
    setMessages([])
  }

  const tabs = [
    { id: 'upload' as TabType, label: 'Upload', icon: Upload },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'documents' as TabType, label: 'Documents', icon: FolderOpen }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Doc Query</h1>
              <span className="ml-2 text-sm text-gray-500">Document Chat with RAG</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  onFileProcess={handleFileProcess}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-6">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onStreamMessage={handleStreamMessage}
              isLoading={isLoading}
              onClearChat={handleClearChat}
            />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <FileDashboard
              documents={documents}
              onDeleteDocument={handleDeleteDocument}
              onProcessDocument={handleFileProcess}
              isLoading={false}
            />
          </div>
        )}
      </main>
    </div>
  )
} 