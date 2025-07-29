"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Search,
  FileText,
  MapPin,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react'

interface DocumentChunk {
  id: string
  content: string
  page_number?: number
  chunk_index: number
  metadata: {
    filename: string
    document_id: number
    [key: string]: any
  }
}

interface DocumentViewerProps {
  documentId: number
  filename: string
  onClose: () => void
  highlightChunk?: number
  onChunkClick?: (chunk: DocumentChunk) => void
}

export function DocumentViewer({
  documentId,
  filename,
  onClose,
  highlightChunk,
  onChunkClick
}: DocumentViewerProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredChunks, setFilteredChunks] = useState<DocumentChunk[]>([])
  const [selectedChunk, setSelectedChunk] = useState<number | null>(highlightChunk || null)

  useEffect(() => {
    loadDocumentChunks()
  }, [documentId])

  useEffect(() => {
    if (highlightChunk !== undefined) {
      setSelectedChunk(highlightChunk)
      scrollToChunk(highlightChunk)
    }
  }, [highlightChunk])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = chunks.filter(chunk =>
        chunk.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredChunks(filtered)
    } else {
      setFilteredChunks(chunks)
    }
  }, [searchTerm, chunks])

  const loadDocumentChunks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentId}/chunks`)
      if (response.ok) {
        const data = await response.json()
        // Transform the chunks data to match our interface
        const transformedChunks = data.chunks.map((chunk: any, index: number) => ({
          id: `chunk_${index}`,
          content: chunk.content,
          page_number: chunk.metadata?.page_number,
          chunk_index: index,
          metadata: {
            filename: data.filename,
            document_id: documentId,
            ...chunk.metadata
          }
        }))
        setChunks(transformedChunks)
        setFilteredChunks(transformedChunks)
      } else {
        console.error('Failed to load document chunks')
      }
    } catch (error) {
      console.error('Error loading document chunks:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToChunk = (chunkIndex: number) => {
    const element = document.getElementById(`chunk-${chunkIndex}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleChunkClick = (chunk: DocumentChunk) => {
    setSelectedChunk(chunk.chunk_index)
    if (onChunkClick) {
      onChunkClick(chunk)
    }
  }

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text

    const regex = new RegExp(`(${searchTerm})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const navigateToChunk = (direction: 'up' | 'down') => {
    if (selectedChunk === null) return

    const currentIndex = filteredChunks.findIndex(chunk => chunk.chunk_index === selectedChunk)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === 'up') {
      newIndex = Math.max(0, currentIndex - 1)
    } else {
      newIndex = Math.min(filteredChunks.length - 1, currentIndex + 1)
    }

    const newChunk = filteredChunks[newIndex]
    setSelectedChunk(newChunk.chunk_index)
    scrollToChunk(newChunk.chunk_index)
  }

  if (loading) {
    return (
      <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Loading {filename}...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading document content...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="fixed inset-4 z-50 bg-white shadow-2xl flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {filename}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedChunk !== null && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToChunk('up')}
                className="h-8 w-8 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToChunk('down')}
                className="h-8 w-8 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {filteredChunks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchTerm ? 'No chunks found matching your search.' : 'No document chunks available.'}
              </div>
            ) : (
              filteredChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  id={`chunk-${chunk.chunk_index}`}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedChunk === chunk.chunk_index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  onClick={() => handleChunkClick(chunk)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Chunk {chunk.chunk_index + 1}
                    </Badge>
                    {chunk.page_number && (
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        Page {chunk.page_number}
                      </Badge>
                    )}
                    {selectedChunk === chunk.chunk_index && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-700 leading-relaxed">
                    {highlightText(chunk.content, searchTerm)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 