import { NextRequest, NextResponse } from 'next/server'
import { convertFile, detectPndType } from '@/lib/converter'
import { getDb, schema } from '@/lib/db'
const { conversions } = schema

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filename = file.name
    let pndType
    try {
      pndType = detectPndType(filename)
    } catch {
      return NextResponse.json({ error: `ไม่สามารถระบุประเภทแบบจากชื่อไฟล์: ${filename}` }, { status: 400 })
    }

    // Decode CP874 (Windows-874 / TIS-620)
    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder('windows-874')
    const content = decoder.decode(buffer)

    const result = convertFile(content, pndType)

    // Check if DB is configured; if not, skip saving (dev without DB)
    let savedId: string | null = null
    if (process.env.DATABASE_URL) {
      const [saved] = await getDb().insert(conversions).values({
        filename,
        pndType,
        rowCount: result.rows.length,
        output: result.output,
      }).returning({ id: conversions.id })
      savedId = saved.id
    }

    return NextResponse.json({
      id: savedId,
      pndType: result.pndType,
      rowCount: result.rows.length,
      rows: result.rows,
      output: result.output,
    })
  } catch (err) {
    console.error('/api/convert error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    )
  }
}
