"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  FolderOpen,
  Upload,
  Menu,
  X,
  BarChart3,
  Users,
  Settings,
  Home,
  FileText,
  Search,
  Bell,
  User,
  ChevronDown,
  Activity,
  CreditCard,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface NavigationItem {
  name: string
  href: string
  icon: any
}

interface UnifiedDashboardLayoutProps {
  children: React.ReactNode
  navigation: NavigationItem[]
  title?: string
  subtitle?: string
  useShadcn?: boolean
  showSearch?: boolean
  showUserMenu?: boolean
  showNotifications?: boolean
  customHeader?: React.ReactNode
}

export function UnifiedDashboardLayout({
  children,
  navigation,
  title = "Dashboard",
  subtitle,
  useShadcn = false,
  showSearch = true,
  showUserMenu = true,
  showNotifications = true,
  customHeader
}: UnifiedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const bgClass = useShadcn ? 'bg-background' : 'bg-slate-50'
  const sidebarBgClass = useShadcn ? 'bg-card border-r' : 'bg-white shadow-xl'
  const textClass = useShadcn ? 'text-foreground' : 'text-gray-900'
  const mutedTextClass = useShadcn ? 'text-muted-foreground' : 'text-gray-600'
  const borderClass = useShadcn ? 'border-border' : 'border-gray-200'
  const headerBgClass = useShadcn ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' : 'bg-white shadow-sm'

  return (
    <div className={`min-h-screen ${bgClass} flex`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className={`fixed inset-0 ${useShadcn ? 'bg-background/80 backdrop-blur-sm' : 'bg-gray-600 bg-opacity-75'}`} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 ${sidebarBgClass} transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex items-center justify-between h-16 px-6 border-b ${borderClass} flex-shrink-0`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DQ</span>
            </div>
            <span className={`text-lg font-semibold ${textClass}`}>Doc Query</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-6">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const activeClass = useShadcn
                ? 'bg-accent text-accent-foreground'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-600'
              const inactiveClass = useShadcn
                ? 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              const iconActiveClass = useShadcn
                ? 'text-accent-foreground'
                : 'text-blue-600'
              const iconInactiveClass = useShadcn
                ? 'text-muted-foreground group-hover:text-foreground'
                : 'text-gray-400 group-hover:text-gray-500'

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? activeClass : inactiveClass
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? iconActiveClass : iconInactiveClass
                    }`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className={`p-4 border-t ${borderClass} flex-shrink-0`}>
          <p className={`text-xs ${mutedTextClass} text-center`}>
            {useShadcn ? 'Advanced Document Management' : 'Document Chat with RAG'}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        {/* Top bar */}
        <header className={`sticky top-0 z-10 ${headerBgClass} border-b ${borderClass}`}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              {useShadcn ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <div className={`flex items-center justify-between h-16 px-6 border-b ${borderClass}`}>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">DQ</span>
                        </div>
                        <span className="text-lg font-semibold">Doc Query</span>
                      </div>
                    </div>
                    <nav className="px-3 py-6">
                      <div className="space-y-1">
                        {navigation.map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                  ? 'bg-accent text-accent-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                }`}
                            >
                              <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                }`} />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              {showSearch && (
                <div className="relative max-w-lg">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${mutedTextClass}`} />
                  <Input
                    type="text"
                    placeholder="Search documents, users, or analytics..."
                    className="pl-10"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {showNotifications && (
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>
              )}

              {showUserMenu && useShadcn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/01.png" alt="User" />
                        <AvatarFallback>AU</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Admin User</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          admin@docquery.com
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {showUserMenu && !useShadcn && (
                <Button variant="ghost" className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:bg-gray-100">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block text-sm font-medium">Admin User</span>
                </Button>
              )}

              {!showUserMenu && (
                <div className="flex items-center space-x-4">
                  <div className={`text-sm ${mutedTextClass}`}>
                    {navigation.find(item => item.href === pathname)?.name || title}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {customHeader || (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className={`text-3xl font-bold tracking-tight ${textClass}`}>{title}</h1>
                {subtitle && (
                  <p className={`mt-2 ${mutedTextClass}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            </>
          )}
          {children}
        </main>
      </div>
    </div>
  )
} 