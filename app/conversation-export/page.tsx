"use client"

import { ConversationExport } from '@/components/conversation-export'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function ConversationExportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-3">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Export Conversations</h1>
          <p className="text-gray-600">Export your chat history in various formats</p>
        </div>

        <ConversationExport />
      </div>
    </DashboardLayout>
  )
} 