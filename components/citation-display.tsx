"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  ExternalLink,
  Quote,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin
} from 'lucide-react'

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

interface CitationDisplayProps {
  citations: Citation[]
  onCitationClick?: (citation: Citation) => void
  onQuoteCitation?: (citation: Citation) => void
  className?: string
}

export function CitationDisplay({
  citations,
  onCitationClick,
  onQuoteCitation,
  className = ""
}: CitationDisplayProps) {
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set())
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null)

  const toggleCitation = (citationId: string) => {
    const newExpanded = new Set(expandedCitations)
    if (newExpanded.has(citationId)) {
      newExpanded.delete(citationId)
    } else {
      newExpanded.add(citationId)
    }
    setExpandedCitations(newExpanded)
  }

  const copyCitation = async (citation: Citation) => {
    const citationText = `"${citation.content}"\n\nSource: ${citation.filename}${citation.page_number ? ` (Page ${citation.page_number})` : ''}`

    try {
      await navigator.clipboard.writeText(citationText)
      setCopiedCitation(citation.id)
      setTimeout(() => setCopiedCitation(null), 2000)
    } catch (error) {
      console.error('Failed to copy citation:', error)
    }
  }

  const formatSimilarityScore = (score: number) => {
    return (score * 100).toFixed(1)
  }

  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <Card className={`mt-4 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Sources ({citations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {citations.map((citation, index) => {
              const isExpanded = expandedCitations.has(citation.id)
              const isCopied = copiedCitation === citation.id

              return (
                <div
                  key={citation.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Citation Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium text-sm truncate">
                          {citation.filename}
                        </span>
                        {citation.page_number && (
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            Page {citation.page_number}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Relevance: {formatSimilarityScore(citation.similarity_score)}%</span>
                        <span>•</span>
                        <span>Chunk {citation.chunk_index + 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCitation(citation.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Citation Content */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <Quote className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {citation.content}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onCitationClick && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCitationClick(citation)}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View in Document
                          </Button>
                        )}

                        {onQuoteCitation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onQuoteCitation(citation)}
                            className="flex items-center gap-1"
                          >
                            <Quote className="h-3 w-3" />
                            Quote
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCitation(citation)}
                          className="flex items-center gap-1"
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 