import HistoryList from '@/components/HistoryList'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติการแปลงไฟล์</h1>
        <p className="mt-1 text-sm text-gray-500">รายการไฟล์ที่แปลงแล้ว สามารถดาวน์โหลดซ้ำได้</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <HistoryList />
      </div>
    </div>
  )
}
