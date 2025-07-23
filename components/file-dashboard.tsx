"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { File, Trash2, Download, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Document {
  id: number
  filename: string
  file_type: string
  is_processed: boolean
  uploaded_at: string
  content?: string
}

interface FileDashboardProps {
  documents?: Document[]
  onDeleteDocument?: (id: number) => Promise<void>
  onProcessDocument?: (id: number) => Promise<void>
  onViewDocument?: (id: number) => void
  isLoading?: boolean
}

export function FileDashboard({
  documents = [],
  onDeleteDocument,
  onProcessDocument,
  onViewDocument,
  isLoading = false
}: FileDashboardProps) {
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  const handleProcess = async (id: number) => {
    if (!onProcessDocument) return

    setProcessingIds(prev => new Set(prev).add(id))
    try {
      await onProcessDocument(id)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!onDeleteDocument) return

    if (confirm('Are you sure you want to delete this document?')) {
      await onDeleteDocument(id)
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄'
      case 'md':
      case 'markdown':
        return '📝'
      case 'html':
      case 'htm':
        return '🌐'
      case 'txt':
        return '📄'
      default:
        return '📄'
    }
  }

  const getStatusIcon = (isProcessed: boolean, isProcessing: boolean) => {
    if (isProcessing) {
      return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
    }
    return isProcessed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-orange-500" />
    )
  }

  const getStatusText = (isProcessed: boolean, isProcessing: boolean) => {
    if (isProcessing) return 'Processing...'
    return isProcessed ? 'Processed' : 'Not Processed'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Document Library
          </CardTitle>
          <CardDescription>
            Manage your uploaded documents and their processing status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(documents) || documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
              <p className="text-sm">
                Upload your first document to get started with Doc Query.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {Array.isArray(documents) && documents.map((doc) => {
                const isProcessing = processingIds.has(doc.id)

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(doc.uploaded_at)} • {doc.file_type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.is_processed, isProcessing)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(doc.is_processed, isProcessing)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onViewDocument && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDocument(doc.id)}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {onProcessDocument && !doc.is_processed && !isProcessing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcess(doc.id)}
                            className="text-gray-400 hover:text-green-500"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {onDeleteDocument && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 