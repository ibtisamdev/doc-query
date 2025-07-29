"use client"

import {
  BarChart3,
  Users,
  Settings,
  Home,
  FileText,
  Activity,
  Package,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { UnifiedDashboardLayout } from '@/components/unified-dashboard-layout'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const stats = [
  { name: 'Total Documents', value: '1,234', change: '+12%', changeType: 'positive' },
  { name: 'Active Users', value: '567', change: '+8%', changeType: 'positive' },
  { name: 'Queries Today', value: '89', change: '-3%', changeType: 'negative' },
  { name: 'Storage Used', value: '2.4 GB', change: '+5%', changeType: 'positive' },
]

const recentActivity = [
  { id: 1, user: 'John Doe', action: 'Uploaded document', document: 'Q4 Report.pdf', time: '2 minutes ago', avatar: 'JD' },
  { id: 2, user: 'Jane Smith', action: 'Created query', document: 'Annual Review.docx', time: '5 minutes ago', avatar: 'JS' },
  { id: 3, user: 'Mike Johnson', action: 'Downloaded report', document: 'Sales Data.xlsx', time: '10 minutes ago', avatar: 'MJ' },
  { id: 4, user: 'Sarah Wilson', action: 'Shared document', document: 'Project Plan.pdf', time: '15 minutes ago', avatar: 'SW' },
]

export default function DashboardPage() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="Dashboard Overview"
      subtitle="Welcome back! Here's what's happening with your documents today."
      useShadcn={false}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${stat.changeType === 'positive'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Avatar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user} <span className="text-gray-500 font-normal">{activity.action}</span>
                    </p>
                    <p className="text-sm text-gray-600">{activity.document}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Activity className="h-4 w-4 mr-2" />
                Start Chat
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  )
} 