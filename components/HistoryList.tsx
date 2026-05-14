'use client'

import { useEffect, useState } from 'react'

interface HistoryItem {
  id: string
  filename: string
  pndType: string
  rowCount: number
  createdAt: string
}

export default function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/conversions')
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setError('โหลดประวัติไม่ได้'); setLoading(false) })
  }, [])

  function download(id: string) {
    window.location.href = `/api/conversions/${id}`
  }

  if (loading) return <p className="text-gray-500 text-sm">กำลังโหลด...</p>
  if (error) return <p className="text-red-500 text-sm">{error}</p>
  if (items.length === 0) return (
    <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีประวัติการแปลงไฟล์</p>
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b">ชื่อไฟล์</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b">ประเภท</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b">จำนวนแถว</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b">วันที่แปลง</th>
            <th className="px-4 py-3 border-b"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-800 font-mono text-xs">{item.filename}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.pndType === 'pnd3' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {item.pndType === 'pnd3' ? 'ภงด3' : 'ภงด53'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{item.rowCount} แถว</td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {new Date(item.createdAt).toLocaleString('th-TH')}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => download(item.id)}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  ดาวน์โหลด
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
