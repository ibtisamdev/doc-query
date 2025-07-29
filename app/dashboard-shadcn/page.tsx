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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { UnifiedDashboardLayout } from '@/components/unified-dashboard-layout'

const navigation = [
  { name: 'Overview', href: '/dashboard-shadcn', icon: Home },
  { name: 'Analytics', href: '/dashboard-shadcn/analytics', icon: BarChart3 },
  { name: 'Documents', href: '/dashboard-shadcn/documents', icon: FileText },
  { name: 'Users', href: '/dashboard-shadcn/users', icon: Users },
  { name: 'Settings', href: '/dashboard-shadcn/settings', icon: Settings },
]

const stats = [
  {
    name: 'Total Documents',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: FileText,
  },
  {
    name: 'Active Users',
    value: '567',
    change: '+8%',
    changeType: 'positive',
    icon: Users,
  },
  {
    name: 'Queries Today',
    value: '89',
    change: '-3%',
    changeType: 'negative',
    icon: Activity,
  },
  {
    name: 'Storage Used',
    value: '2.4 GB',
    change: '+5%',
    changeType: 'positive',
    icon: Package,
  },
]

const recentActivity = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Uploaded document',
    document: 'Q4 Report.pdf',
    time: '2 minutes ago',
    avatar: 'JD'
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Created query',
    document: 'Annual Review.docx',
    time: '5 minutes ago',
    avatar: 'JS'
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Downloaded report',
    document: 'Sales Data.xlsx',
    time: '10 minutes ago',
    avatar: 'MJ'
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    action: 'Shared document',
    document: 'Project Plan.pdf',
    time: '15 minutes ago',
    avatar: 'SW'
  },
]

export default function DashboardShadcnPage() {
  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="Dashboard Overview"
      subtitle="Welcome back! Here's what's happening with your documents today."
      useShadcn={true}
    >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest user activities and document interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{activity.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user} <span className="text-muted-foreground font-normal">{activity.action}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{activity.document}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Download</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" size="lg">
              <FileText className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Activity className="mr-2 h-4 w-4" />
              Start Chat
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Documents</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Q4 Report.pdf</span>
                  <Badge variant="secondary">2 min ago</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Annual Review.docx</span>
                  <Badge variant="secondary">5 min ago</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  )
} 