import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'ระบบแปลงไฟล์ ภงด3/ภงด53 → RD Prep',
  description: 'แปลงไฟล์ภาษีหัก ณ ที่จ่ายเพื่อนำเข้าโปรแกรม RD Prep',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className={`${sarabun.className} min-h-screen bg-gray-50`}>
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="mx-auto max-w-5xl px-4 flex items-center gap-6 h-14">
            <Link href="/" className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              ภงด Converter
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              แปลงไฟล์
            </Link>
            <Link href="/history" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              ประวัติ
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
