"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, FolderOpen } from 'lucide-react'
import { UnifiedDashboardLayout } from '@/components/unified-dashboard-layout'

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FolderOpen },
]

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to chat page by default
    router.push('/chat')
  }, [router])

  return (
    <UnifiedDashboardLayout
      navigation={navigation}
      title="Loading..."
      useShadcn={false}
      showUserMenu={false}
    >
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to chat...</p>
        </div>
      </div>
    </UnifiedDashboardLayout>
  )
} 