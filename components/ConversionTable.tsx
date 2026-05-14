'use client'

import { useState } from 'react'
import { ConversionRow, PND3_HEADERS, PND53_HEADERS, PndType } from '@/lib/converter'

interface ConversionTableProps {
  rows: ConversionRow[]
  pndType: PndType
}

const PAGE_SIZE = 20

export default function ConversionTable({ rows, pndType }: ConversionTableProps) {
  const [page, setPage] = useState(0)
  const headers = pndType === 'pnd3' ? PND3_HEADERS : PND53_HEADERS
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function rowValues(r: ConversionRow): string[] {
    if (pndType === 'pnd3') {
      return [String(r.seq), r.taxId, r.prefix, r.name1, r.name2, r.address, r.subdistrict, r.district, r.province, r.postal, r.date, r.incomeType, r.rate, r.amount, r.tax, r.condition]
    }
    return [String(r.seq), r.taxId, r.prefix, r.name1, r.address, r.subdistrict, r.district, r.province, r.postal, r.date, r.incomeType, r.rate, r.amount, r.tax, r.condition]
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(h => (
                <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map(row => (
              <tr key={row.seq} className="hover:bg-blue-50 transition-colors">
                {rowValues(row).map((v, i) => (
                  <td key={i} className="whitespace-nowrap px-3 py-1.5 text-gray-700 max-w-[200px] truncate" title={v}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>แถว {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} จาก {rows.length}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-3 py-1 border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              ←
            </button>
            <span className="px-3 py-1">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded px-3 py-1 border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
