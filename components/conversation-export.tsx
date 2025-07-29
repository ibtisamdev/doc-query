"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  FileText,
  MessageSquare,
  Calendar,
  User,
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { apiService } from '@/lib/api'

interface ChatSession {
  session_id: string
  created_at: string
  updated_at: string
  message_count: number
}

interface ChatMessage {
  id: number
  message: string
  response: string
  created_at: string
  feedback?: number
}

interface ConversationExportProps {
  className?: string
}

export function ConversationExport({ className }: ConversationExportProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'csv' | 'md'>('json')
  const [includeFeedback, setIncludeFeedback] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.getChatSessions()
      if (response.success && response.data) {
        setSessions(response.data)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const selectAllSessions = () => {
    setSelectedSessions(sessions.map(s => s.session_id))
  }

  const clearSelection = () => {
    setSelectedSessions([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const exportConversations = async () => {
    if (selectedSessions.length === 0) return

    setIsExporting(true)
    try {
      const exportData: any[] = []

      for (const sessionId of selectedSessions) {
        const session = sessions.find(s => s.session_id === sessionId)
        if (!session) continue

        const messagesResponse = await apiService.getChatMessages(sessionId)
        if (messagesResponse.success && messagesResponse.data) {
          const sessionData = {
            session_id: sessionId,
            created_at: session.created_at,
            updated_at: session.updated_at,
            message_count: session.message_count,
            messages: messagesResponse.data.map((msg: ChatMessage) => ({
              id: msg.id,
              user_message: msg.message,
              assistant_response: msg.response,
              timestamp: msg.created_at,
              feedback: includeFeedback ? msg.feedback : undefined
            }))
          }
          exportData.push(sessionData)
        }
      }

      // Generate file content based on format
      let content = ''
      let filename = `conversations-${new Date().toISOString().split('T')[0]}`
      let mimeType = ''

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(exportData, null, 2)
          filename += '.json'
          mimeType = 'application/json'
          break

        case 'txt':
          content = exportData.map(session => {
            let text = `=== Session: ${session.session_id} ===\n`
            text += `Created: ${formatDate(session.created_at)}\n`
            text += `Updated: ${formatDate(session.updated_at)}\n`
            text += `Messages: ${session.message_count}\n\n`

            session.messages.forEach((msg: any, index: number) => {
              text += `[${index + 1}] User: ${msg.user_message}\n`
              text += `Assistant: ${msg.assistant_response}\n`
              if (includeFeedback && msg.feedback !== undefined) {
                text += `Feedback: ${msg.feedback === 1 ? '👍' : '👎'}\n`
              }
              text += `Time: ${formatDate(msg.timestamp)}\n\n`
            })

            return text
          }).join('\n' + '='.repeat(50) + '\n\n')

          filename += '.txt'
          mimeType = 'text/plain'
          break

        case 'csv':
          const headers = ['Session ID', 'Message ID', 'User Message', 'Assistant Response', 'Timestamp']
          if (includeFeedback) headers.push('Feedback')

          content = headers.join(',') + '\n'

          exportData.forEach(session => {
            session.messages.forEach((msg: any) => {
              const row = [
                session.session_id,
                msg.id,
                `"${msg.user_message.replace(/"/g, '""')}"`,
                `"${msg.assistant_response.replace(/"/g, '""')}"`,
                msg.timestamp
              ]
              if (includeFeedback) {
                row.push(msg.feedback === 1 ? 'positive' : msg.feedback === -1 ? 'negative' : 'none')
              }
              content += row.join(',') + '\n'
            })
          })

          filename += '.csv'
          mimeType = 'text/csv'
          break

        case 'md':
          content = exportData.map(session => {
            let md = `# Session: ${session.session_id}\n\n`
            md += `**Created:** ${formatDate(session.created_at)}\n`
            md += `**Updated:** ${formatDate(session.updated_at)}\n`
            md += `**Messages:** ${session.message_count}\n\n`
            md += `---\n\n`

            session.messages.forEach((msg: any, index: number) => {
              md += `## Message ${index + 1}\n\n`
              md += `**User:** ${msg.user_message}\n\n`
              md += `**Assistant:** ${msg.assistant_response}\n\n`
              if (includeFeedback && msg.feedback !== undefined) {
                md += `**Feedback:** ${msg.feedback === 1 ? '👍 Positive' : '👎 Negative'}\n\n`
              }
              md += `*${formatDate(msg.timestamp)}*\n\n`
              md += `---\n\n`
            })

            return md
          }).join('\n\n')

          filename += '.md'
          mimeType = 'text/markdown'
          break
      }

      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading conversations...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export Conversations</h2>
          <p className="text-gray-600">Export your chat history in various formats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Export Options */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Export Format</label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="txt">Plain Text</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="md">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-feedback"
                    checked={includeFeedback}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeFeedback(checked === true)}
                  />
                  <label htmlFor="include-feedback" className="text-sm">
                    Include feedback data
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-metadata"
                    checked={includeMetadata}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeMetadata(checked === true)}
                  />
                  <label htmlFor="include-metadata" className="text-sm">
                    Include session metadata
                  </label>
                </div>
              </div>

              {/* Selection Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllSessions}
                  className="w-full"
                >
                  Select All Sessions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="w-full"
                >
                  Clear Selection
                </Button>
              </div>

              {/* Export Button */}
              <Button
                onClick={exportConversations}
                disabled={selectedSessions.length === 0 || isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {selectedSessions.length} Session{selectedSessions.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Session List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Sessions ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No chat sessions found</p>
                  <p className="text-sm">Start chatting to see sessions here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedSessions.includes(session.session_id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                        }`}
                      onClick={() => toggleSessionSelection(session.session_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedSessions.includes(session.session_id)}
                          onChange={() => toggleSessionSelection(session.session_id)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {session.session_id.substring(0, 8)}...
                            </span>
                            <Badge variant="secondary">
                              {session.message_count} messages
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Updated {formatDate(session.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedSessions.includes(session.session_id) && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Summary */}
      {selectedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Format: {exportFormat.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Ready to export
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 