"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react'
import { apiService } from '@/lib/api'

interface FeedbackStats {
  totalMessages: number
  positiveFeedback: number
  negativeFeedback: number
  noFeedback: number
  positivePercentage: number
  negativePercentage: number
  averageRating: number
}

interface FeedbackTrend {
  date: string
  positive: number
  negative: number
  total: number
}

interface FeedbackAnalyticsProps {
  className?: string
}

export function FeedbackAnalytics({ className }: FeedbackAnalyticsProps) {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [trends, setTrends] = useState<FeedbackTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadFeedbackData()
  }, [timeRange])

  const loadFeedbackData = async () => {
    setIsLoading(true)
    try {
      // Load feedback stats from backend
      const statsResponse = await apiService.getFeedbackStats()
      if (statsResponse.success && statsResponse.data) {
        setStats({
          totalMessages: statsResponse.data.total_messages,
          positiveFeedback: statsResponse.data.positive_feedback,
          negativeFeedback: statsResponse.data.negative_feedback,
          noFeedback: statsResponse.data.no_feedback,
          positivePercentage: statsResponse.data.positive_percentage,
          negativePercentage: statsResponse.data.negative_percentage,
          averageRating: statsResponse.data.average_rating
        })
      }

      // Load feedback trends from backend
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const trendsResponse = await apiService.getFeedbackTrends(days)
      if (trendsResponse.success && trendsResponse.data) {
        setTrends(trendsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load feedback data:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const exportFeedbackData = () => {
    if (!stats) return

    const data = {
      stats,
      trends,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading feedback analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No feedback data available</p>
            <p className="text-sm">Start chatting to see feedback analytics</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Feedback Analytics</h2>
          <p className="text-gray-600">Track user satisfaction and response quality</p>
        </div>
        <Button onClick={exportFeedbackData} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              All chat interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.positiveFeedback}</div>
            <p className="text-xs text-muted-foreground">
              {stats.positivePercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Feedback</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.negativeFeedback}</div>
            <p className="text-xs text-muted-foreground">
              {stats.negativePercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? '+' : ''}{stats.averageRating.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averageRating > 0 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Positive trend
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Needs improvement
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span>Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stats.positiveFeedback}</span>
                      <Badge variant="secondary">{stats.positivePercentage.toFixed(1)}%</Badge>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${stats.positivePercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span>Negative</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stats.negativeFeedback}</span>
                      <Badge variant="secondary">{stats.negativePercentage.toFixed(1)}%</Badge>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${stats.negativePercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span>No Feedback</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stats.noFeedback}</span>
                      <Badge variant="secondary">
                        {((stats.noFeedback / stats.totalMessages) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{ width: `${(stats.noFeedback / stats.totalMessages) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Feedback Review
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Improvement Suggestions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Feedback Trends</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={timeRange === '7d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('7d')}
                  >
                    7D
                  </Button>
                  <Button
                    variant={timeRange === '30d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('30d')}
                  >
                    30D
                  </Button>
                  <Button
                    variant={timeRange === '90d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('90d')}
                  >
                    90D
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{trend.date}</span>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{trend.positive}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">{trend.negative}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {trend.total} total
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Response Quality</h4>
                  <p className="text-sm text-gray-600">
                    {stats.positivePercentage > 70
                      ? "Excellent response quality with high user satisfaction"
                      : stats.positivePercentage > 50
                        ? "Good response quality with room for improvement"
                        : "Response quality needs attention and improvement"
                    }
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Feedback Rate</h4>
                  <p className="text-sm text-gray-600">
                    {((stats.positiveFeedback + stats.negativeFeedback) / stats.totalMessages * 100).toFixed(1)}% of messages received feedback
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Improvement Areas</h4>
                  <p className="text-sm text-gray-600">
                    {stats.negativeFeedback > 0
                      ? `${stats.negativeFeedback} responses need improvement`
                      : "No negative feedback recorded"
                    }
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Encourage more user feedback</li>
                    <li>• Review negative feedback patterns</li>
                    <li>• Monitor response quality trends</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 