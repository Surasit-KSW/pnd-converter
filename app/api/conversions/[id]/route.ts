import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
const { conversions } = schema
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [row] = await getDb()
      .select()
      .from(conversions)
      .where(eq(conversions.id, id))
      .limit(1)

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const outputFilename = row.filename.replace(/\.txt$/i, '_rdprep.txt')
    return new NextResponse(row.output, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${outputFilename}"`,
      },
    })
  } catch (err) {
    console.error('/api/conversions/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch conversion' }, { status: 500 })
  }
}
