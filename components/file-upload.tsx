"use client"

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<any>
  onFileProcess?: (documentId: number) => Promise<void>
}

interface UploadedFile {
  id: string
  file: File
  status: 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error'
  progress: number
  error?: string
  documentId?: number
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/markdown': ['.md', '.markdown'],
  'text/html': ['.html', '.htm'],
  'text/plain': ['.txt']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function FileUpload({ onFileUpload, onFileProcess }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    }

    // Check file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).some(type =>
      file.type === type || ACCEPTED_FILE_TYPES[type as keyof typeof ACCEPTED_FILE_TYPES].some(ext =>
        file.name.toLowerCase().endsWith(ext)
      )
    )

    if (!isValidType) {
      return 'File type not supported. Please upload PDF, Markdown, HTML, or text files.'
    }

    return null
  }, [])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (const fileData of newFiles) {
      const error = validateFile(fileData.file)
      if (error) {
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id
            ? { ...f, status: 'error' as const, error }
            : f
        ))
        continue
      }

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileData.id
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ))
        }, 100)

        // Upload file
        const uploadResult = await onFileUpload(fileData.file)

        clearInterval(progressInterval)

        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id
            ? { ...f, status: 'uploaded' as const, progress: 100 }
            : f
        ))

        // Process file if callback provided and we have a document ID
        if (onFileProcess && uploadResult && uploadResult.id) {
          setUploadedFiles(prev => prev.map(f =>
            f.id === fileData.id
              ? { ...f, status: 'processing' as const }
              : f
          ))

          try {
            await onFileProcess(uploadResult.id)

            setUploadedFiles(prev => prev.map(f =>
              f.id === fileData.id
                ? { ...f, status: 'processed' as const, documentId: uploadResult.id }
                : f
            ))
          } catch (error) {
            setUploadedFiles(prev => prev.map(f =>
              f.id === fileData.id
                ? { ...f, status: 'error' as const, error: 'Processing failed' }
                : f
            ))
          }
        }
      } catch (error) {
        setUploadedFiles(prev => prev.map(f =>
          f.id === fileData.id
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        ))
      }
    }
  }, [validateFile, onFileUpload, onFileProcess])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
      case 'uploaded':
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'uploaded':
        return 'Uploaded'
      case 'processing':
        return 'Processing...'
      case 'processed':
        return 'Processed'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Drag and drop your files here, or click to browse. Supports PDF, Markdown, HTML, and text files up to 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center p-8 space-y-4 cursor-pointer"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, MD, HTML, TXT up to 10MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.md,.markdown,.html,.htm,.txt"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((fileData) => (
                <div key={fileData.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(fileData.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(fileData.status)}
                      </span>
                    </div>

                    {fileData.status === 'uploading' && (
                      <div className="w-24">
                        <Progress value={fileData.progress} className="h-2" />
                      </div>
                    )}

                    {fileData.status === 'processed' && fileData.documentId && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        ID: {fileData.documentId}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alerts */}
      {uploadedFiles.some(f => f.status === 'error') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some files failed to upload or process. Please check the file requirements and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 