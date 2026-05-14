'use client'

import { useState, useCallback } from 'react'
import FileUpload from '@/components/FileUpload'
import ConversionTable from '@/components/ConversionTable'
import { ConversionRow, PndType } from '@/lib/converter'

interface ConversionState {
  id: string | null
  filename: string
  pndType: PndType
  rowCount: number
  rows: ConversionRow[]
  output: string
}

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ConversionState | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setResult(null)
    setError('')
  }, [])

  async function handleConvert() {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/convert', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'เกิดข้อผิดพลาด')
        return
      }

      setResult({
        id: data.id,
        filename: selectedFile.name,
        pndType: data.pndType,
        rowCount: data.rowCount,
        rows: data.rows,
        output: data.output,
      })
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    if (!result) return
    const blob = new Blob([result.output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename.replace(/\.txt$/i, '_rdprep.txt')
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ระบบแปลงไฟล์ ภงด3 / ภงด53</h1>
        <p className="mt-1 text-sm text-gray-500">นำเข้าไฟล์จากระบบบัญชี → แปลง → ส่งออกเพื่อนำเข้า RD Prep</p>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Step 1: Import */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
            <h2 className="font-semibold text-gray-800">นำเข้าไฟล์</h2>
          </div>
          <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
          {selectedFile && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
              <svg className="h-4 w-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate text-xs font-medium text-blue-800">{selectedFile.name}</span>
            </div>
          )}
        </div>

        {/* Step 2: Convert */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
            <h2 className="font-semibold text-gray-800">แปลงไฟล์</h2>
          </div>
          <button
            onClick={handleConvert}
            disabled={!selectedFile || loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังแปลง...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                แปลงไฟล์
              </>
            )}
          </button>
          {result && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800">
              <span className="font-semibold">สำเร็จ</span> — {result.rowCount} แถว •{' '}
              <span className={`font-medium ${result.pndType === 'pnd3' ? 'text-blue-700' : 'text-purple-700'}`}>
                {result.pndType === 'pnd3' ? 'ภงด3' : 'ภงด53'}
              </span>
            </div>
          )}
        </div>

        {/* Step 3: Export */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
            <h2 className="font-semibold text-gray-800">ส่งออกไฟล์</h2>
          </div>
          <button
            onClick={handleExport}
            disabled={!result}
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ดาวน์โหลด _rdprep.txt
          </button>
          {result && (
            <p className="mt-3 text-xs text-gray-500">
              ไฟล์: <span className="font-mono">{result.filename.replace(/\.txt$/i, '_rdprep.txt')}</span>
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">ข้อผิดพลาด:</span> {error}
        </div>
      )}

      {/* Preview table */}
      {result && result.rows.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-800">
            ตัวอย่างข้อมูล ({result.rowCount} แถว)
          </h3>
          <ConversionTable rows={result.rows} pndType={result.pndType} />
        </div>
      )}
    </div>
  )
}
