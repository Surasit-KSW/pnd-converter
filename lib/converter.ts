/**
 * converter.ts — TypeScript port of convert_pnd.py
 * Converts ภงด3 / ภงด53 source files (CP874) into RD Prep pipe-delimited format.
 *
 * Source files must be decoded with TextDecoder('windows-874') before calling convertFile().
 */

export type PndType = 'pnd3' | 'pnd53'

export interface ConversionRow {
  seq: number
  taxId: string
  prefix: string
  name1: string
  name2: string          // lastname (pnd3) or '' (pnd53)
  address: string
  subdistrict: string
  district: string
  province: string
  postal: string
  date: string
  incomeType: string
  rate: string
  amount: string
  tax: string
  condition: string
}

export interface ConversionResult {
  pndType: PndType
  rows: ConversionRow[]
  output: string         // pipe-delimited text ready to save as _rdprep.txt
}

// ---------------------------------------------------------------------------
// Prefix tables
// ---------------------------------------------------------------------------

const INDIVIDUAL_PREFIXES = [
  'นางสาว', 'น.ส.', 'นาง', 'นาย', 'ดร.',
  'เด็กชาย', 'ด.ช.', 'เด็กหญิง', 'ด.ญ.',
  'MR.', 'MRS.', 'MISS', 'MS.',
  'พล.ต.อ.', 'พล.ต.ท.', 'พล.ต.ต.',
  'พ.ต.อ.', 'ร.ต.อ.', 'ส.ต.อ.',
  'พ.ต.ท.', 'ร.ต.ท.', 'ส.ต.ท.',
  'พ.ต.', 'ร.ต.', 'ส.ต.',
  'ด.ต.', 'ส.ต.ต.', 'ร.ต.ต.', 'พ.ต.ต.',
  'พ.อ.', 'ร.อ.', 'ส.อ.',
  'นาวาอากาศเอก', 'นาวาอากาศโท', 'นาวาอากาศตรี',
  'น.อ.', 'น.ท.', 'น.ต.',
  'พลเรือเอก', 'พลเรือโท', 'พลเรือตรี',
  'พลตรี', 'พลโท', 'พลเอก',
  'ว่าที่ ร.ต.', 'ว่าที่ร.ต.',
  'ศ.', 'รศ.', 'ผศ.',
  'Dr.',
  'พระ', 'หลวง',
].sort((a, b) => b.length - a.length)

const COMPANY_PREFIXES = [
  'บริษัท จำกัด (มหาชน)',
  'ห้างหุ้นส่วนจำกัด',
  'ห้างหุ้นส่วนสามัญนิติบุคคล',
  'ห้างหุ้นส่วนสามัญ',
  'ห้างหุ้นส่วน',
  'บริษัท',
  'สหกรณ์',
  'มูลนิธิ',
  'สมาคม',
  'วิสาหกิจชุมชน',
  'กระทรวง',
  'กรม',
  'การ',
  'องค์การ',
  'หจก.',
  'บจก.',
  'ห้าง',
  'วัด',
].sort((a, b) => b.length - a.length)

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

export function detectPndType(filename: string): PndType {
  const name = filename.toUpperCase()
  if (name.includes('PND53') || name.includes('PND_53')) return 'pnd53'
  if (name.includes('PND03') || name.includes('PND3') || name.includes('PND_3') || name.includes('PND_03')) return 'pnd3'
  throw new Error(
    `ไม่สามารถระบุประเภทแบบจากชื่อไฟล์ได้: ${filename}\n` +
    'กรุณาตรวจสอบว่าชื่อไฟล์มี PND03/PND3 หรือ PND53'
  )
}

function findOffset(fields: string[]): number | null {
  for (let i = 0; i < Math.min(fields.length, 6); i++) {
    if (/^\d{13}$/.test(fields[i].trim())) return i
  }
  return null
}

function convertDate(s: string): string {
  s = s.trim()
  if (!s || s.length !== 8 || !/^\d{8}$/.test(s)) return s
  const dd = s.slice(0, 2)
  const mm = s.slice(2, 4)
  const yyyy = parseInt(s.slice(4, 8)) + 543
  return `${dd}/${mm}/${yyyy}`
}

function parseIndividualName(fullName: string): [string, string, string] {
  fullName = fullName.trim()
  if (!fullName) return ['', '', '']

  for (const prefix of INDIVIDUAL_PREFIXES) {
    if (fullName.toUpperCase().startsWith(prefix.toUpperCase())) {
      const rest = fullName.slice(prefix.length).trim()
      const parts = rest.split(/\s+/).filter(Boolean)
      if (parts.length === 0) return [prefix, '', '']
      if (parts.length === 1) return [prefix, parts[0], '']
      return [prefix, parts.slice(0, -1).join(' '), parts[parts.length - 1]]
    }
  }

  // No known prefix — split on first space
  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return ['', parts[0], '']
  if (parts.length === 2) return [parts[0], parts[1], '']
  return [parts[0], parts.slice(1, -1).join(' '), parts[parts.length - 1]]
}

function parseCompanyName(fullName: string): [string, string] {
  fullName = fullName.trim()
  if (!fullName) return ['', '']

  for (const prefix of COMPANY_PREFIXES) {
    if (fullName.startsWith(prefix)) {
      const rest = fullName.slice(prefix.length).trim()
      return [prefix, rest]
    }
  }

  const parts = fullName.split(/\s+/, 2)
  if (parts.length === 1) return ['', parts[0]]
  return [parts[0], fullName.slice(parts[0].length).trim()]
}

function parseAddress(a1: string, a2: string, a3: string, a4: string): [string, string, string, string] {
  const parts = [a1, a2, a3, a4].map(f => f.trim()).filter(Boolean)
  let combined = parts.join(' ')

  let province = ''
  let district = ''
  let subdistrict = ''

  // 1. Province — Bangkok special case
  if (/กรุงเทพมหานคร|กทม\.?/.test(combined)) {
    province = 'กรุงเทพมหานคร'
    combined = combined.replace(/(?:จ\.\s*|จังหวัด\s*)?(?:กรุงเทพมหานคร|กทม\.?)/g, '')
  } else {
    const m = combined.match(/(?:จังหวัด|จ\.)\s*(\S+)/)
    if (m) {
      province = m[1]
      combined = combined.replace(new RegExp(`(?:จังหวัด|จ\\.)\\s*${escapeRegex(province)}`, 'g'), '')
    }
  }

  // 2. District
  const dm = combined.match(/(?:อำเภอ|เขต|อ\.)\s*(\S+)/)
  if (dm) {
    district = dm[1]
    combined = combined.replace(new RegExp(`(?:อำเภอ|เขต|อ\\.)\\s*${escapeRegex(district)}`, 'g'), '')
  }

  // 3. Subdistrict
  const sm = combined.match(/(?:ตำบล|แขวง|ต\.|ข\.)\s*(\S+)/)
  if (sm) {
    subdistrict = sm[1]
    combined = combined.replace(new RegExp(`(?:ตำบล|แขวง|ต\\.|ข\\.)\\s*${escapeRegex(subdistrict)}`, 'g'), '')
  }

  // 4. Clean up remaining geo keywords
  combined = combined.replace(/\b(?:จังหวัด|อำเภอ|ตำบล|แขวง|เขต)\b/g, '')
  combined = combined.replace(/\s+[จอตข]\.\s*$/g, '')
  combined = combined.replace(/(?:^|\s)[จอตข]\.\s*(?=\s|$)/g, ' ')

  // 5. Strip trailing postal code if leaked in
  let address = combined.replace(/\s+\d{5}\s*$/, '').trim()
  address = address.replace(/\s+/g, ' ').replace(/^[\s\-,.]+|[\s\-,.]+$/g, '')

  // 6. RD Prep limit: address ≤ 30 chars
  address = address.slice(0, 30)

  return [address, subdistrict, district, province]
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function safeGet(fields: string[], index: number): string {
  return index < fields.length ? fields[index].trim() : ''
}

// ---------------------------------------------------------------------------
// Line processor
// ---------------------------------------------------------------------------

function processLine(
  line: string,
  pndType: PndType
): Omit<ConversionRow, 'seq'>[] {
  line = line.replace(/\r?\n$/, '')
  if (!line.trim()) return []

  const fields = line.split('|')
  const P = findOffset(fields)
  if (P === null) return []

  const taxId = safeGet(fields, P + 9)
  if (!/^\d{13}$/.test(taxId)) return []

  const fullName = safeGet(fields, P + 13)
  const a1 = safeGet(fields, P + 22)
  const a2 = safeGet(fields, P + 23)
  const a3 = safeGet(fields, P + 24)
  const a4 = safeGet(fields, P + 25)
  const postal = safeGet(fields, P + 26)
  const dateRaw = safeGet(fields, P + 28)
  const incomeType = safeGet(fields, P + 29)
  const rate = safeGet(fields, P + 30)
  const amount = safeGet(fields, P + 31)
  const taxAmount = safeGet(fields, P + 32)
  const condition = safeGet(fields, P + 33)

  const date = convertDate(dateRaw)
  const [address, subdistrict, district, province] = parseAddress(a1, a2, a3, a4)

  let prefix: string, name1: string, name2: string
  if (pndType === 'pnd3') {
    ;[prefix, name1, name2] = parseIndividualName(fullName)
  } else {
    ;[prefix, name1] = parseCompanyName(fullName)
    name2 = ''
  }

  const base = { taxId, prefix, name1, name2, address, subdistrict, district, province, postal }
  const rows: Omit<ConversionRow, 'seq'>[] = []

  rows.push({ ...base, date, incomeType, rate, amount, tax: taxAmount, condition })

  // Second income entry
  const date2Raw = safeGet(fields, P + 34)
  if (/^\d{8}$/.test(date2Raw)) {
    rows.push({
      ...base,
      date: convertDate(date2Raw),
      incomeType: safeGet(fields, P + 35),
      rate: safeGet(fields, P + 36),
      amount: safeGet(fields, P + 37),
      tax: safeGet(fields, P + 38),
      condition: safeGet(fields, P + 39),
    })
  }

  return rows
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function convertFile(content: string, pndType: PndType): ConversionResult {
  const lines = content.split('\n')
  const rawRows: Omit<ConversionRow, 'seq'>[] = []

  for (const line of lines) {
    const parsed = processLine(line, pndType)
    rawRows.push(...parsed)
  }

  const rows: ConversionRow[] = rawRows.map((r, i) => ({ seq: i + 1, ...r }))

  const outputLines = rows.map(r => {
    if (pndType === 'pnd3') {
      return [r.seq, r.taxId, r.prefix, r.name1, r.name2, r.address, r.subdistrict, r.district, r.province, r.postal, r.date, r.incomeType, r.rate, r.amount, r.tax, r.condition].join('|')
    } else {
      return [r.seq, r.taxId, r.prefix, r.name1, r.address, r.subdistrict, r.district, r.province, r.postal, r.date, r.incomeType, r.rate, r.amount, r.tax, r.condition].join('|')
    }
  })

  return { pndType, rows, output: outputLines.join('\n') + '\n' }
}

// Column headers for UI table display
export const PND3_HEADERS = ['ลำดับ', 'เลขประจำตัว', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'เลขที่', 'ตำบล/แขวง', 'อำเภอ/เขต', 'จังหวัด', 'รหัสไปรษณีย์', 'วันที่จ่าย', 'ประเภทเงินได้', 'อัตรา%', 'ยอดจ่าย', 'ภาษีหัก', 'เงื่อนไข']
export const PND53_HEADERS = ['ลำดับ', 'เลขนิติบุคคล', 'ประเภทนิติบุคคล', 'ชื่อบริษัท', 'เลขที่', 'ตำบล/แขวง', 'อำเภอ/เขต', 'จังหวัด', 'รหัสไปรษณีย์', 'วันที่จ่าย', 'ประเภทเงินได้', 'อัตรา%', 'ยอดจ่าย', 'ภาษีหัก', 'เงื่อนไข']
