import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Doc Query - Document Chat with RAG',
  description: 'Upload and chat with your documents using RAG technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} p-0 m-0`}>
        <div className="min-h-screen bg-gray-50 flex">
          {children}
        </div>
      </body>
    </html>
  )
} 