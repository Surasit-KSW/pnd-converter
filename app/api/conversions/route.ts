import { NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
const { conversions } = schema
import { desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json([])
    }
    const rows = await getDb()
      .select({
        id: conversions.id,
        filename: conversions.filename,
        pndType: conversions.pndType,
        rowCount: conversions.rowCount,
        createdAt: conversions.createdAt,
      })
      .from(conversions)
      .orderBy(desc(conversions.createdAt))
      .limit(50)
    return NextResponse.json(rows)
  } catch (err) {
    console.error('/api/conversions error:', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
