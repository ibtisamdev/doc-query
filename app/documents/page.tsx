"use client"

import { useState, useEffect } from 'react'
import { FileDashboard } from '@/components/file-dashboard'
import { FileUpload } from '@/components/file-upload'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiService } from '@/lib/api'

interface Document {
  id: number
  filename: string
  file_type: string
  is_processed: boolean
  uploaded_at: string
  content?: string
}

export default function DocumentsPage() {
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

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Upload and manage your documents</p>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="manage">Manage Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  onFileProcess={handleFileProcess}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Library</CardTitle>
              </CardHeader>
              <CardContent>
                <FileDashboard
                  documents={documents}
                  onDeleteDocument={handleDeleteDocument}
                  onProcessDocument={handleFileProcess}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 