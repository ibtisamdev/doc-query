"use client"

import { FeedbackAnalytics } from '@/components/feedback-analytics'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function FeedbackAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-3">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Feedback Analytics</h1>
          <p className="text-gray-600">Track user satisfaction and response quality</p>
        </div>

        <FeedbackAnalytics />
      </div>
    </DashboardLayout>
  )
} 