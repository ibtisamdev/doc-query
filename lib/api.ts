const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Health checks
  async getHealth(): Promise<ApiResponse<any>> {
    return this.request('/health')
  }

  async getDetailedHealth(): Promise<ApiResponse<any>> {
    return this.request('/health/detailed')
  }

  // Document management
  async getDocuments(): Promise<ApiResponse<{ documents: any[], total: number }>> {
    return this.request('/documents/')
  }

  async uploadDocument(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async getDocument(id: number): Promise<ApiResponse<any>> {
    return this.request(`/documents/${id}`)
  }

  async deleteDocument(id: number): Promise<ApiResponse<any>> {
    return this.request(`/documents/${id}`, { method: 'DELETE' })
  }

  async processDocument(id: number): Promise<ApiResponse<any>> {
    return this.request(`/documents/${id}/process`, { method: 'POST' })
  }

  async getDocumentChunks(id: number): Promise<ApiResponse<any[]>> {
    return this.request(`/documents/${id}/chunks`)
  }

  // Vector search
  async searchDocuments(query: string, nResults: number = 5): Promise<ApiResponse<any[]>> {
    return this.request('/documents/search', {
      method: 'POST',
      body: JSON.stringify({ query, n_results: nResults }),
    })
  }

  async getVectorStats(): Promise<ApiResponse<any>> {
    return this.request('/documents/vector-stats')
  }

  // LLM integration
  async sendRagQuery(query: string, options: {
    nContextChunks?: number
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  } = {}): Promise<ApiResponse<any>> {
    return this.request('/llm/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        n_context_chunks: options.nContextChunks || 5,
        system_prompt: options.systemPrompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    })
  }

  async sendStreamingRagQuery(
    query: string,
    onChunk: (chunk: any) => void,
    options: {
      nContextChunks?: number
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
    } = {}
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/llm/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          n_context_chunks: options.nContextChunks || 5,
          system_prompt: options.systemPrompt,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onChunk(data)
            } catch (e) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming query failed:', error)
      throw error
    }
  }

  async analyzeDocument(
    documentId: number,
    analysisType: 'summary' | 'keywords',
    options: { maxLength?: number; maxKeywords?: number } = {}
  ): Promise<ApiResponse<any>> {
    return this.request('/llm/analyze', {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        analysis_type: analysisType,
        max_length: options.maxLength,
        max_keywords: options.maxKeywords,
      }),
    })
  }

  async getLlmStatus(): Promise<ApiResponse<any>> {
    return this.request('/llm/status')
  }

  async getAvailableModels(): Promise<ApiResponse<any>> {
    return this.request('/llm/models')
  }

  // Chat sessions
  async getChatSessions(): Promise<ApiResponse<any[]>> {
    return this.request('/chat/sessions')
  }

  async getChatMessages(sessionId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/chat/sessions/${sessionId}/messages`)
  }

  async sendChatMessage(sessionId: number, message: string): Promise<ApiResponse<any>> {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        message,
      }),
    })
  }

  async submitFeedback(messageId: number, feedback: 'positive' | 'negative'): Promise<ApiResponse<any>> {
    return this.request(`/chat/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    })
  }
}

export const apiService = new ApiService()
export default apiService 