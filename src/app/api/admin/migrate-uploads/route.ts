import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'

// One-time migration: copies images from public/uploads into Vercel Blob and
// rewrites database links that still point to /uploads/... to the Blob URLs.
// Admin-only (protected by middleware). Use ?dryRun=1 to preview without changes.

type Summary = {
  dryRun: boolean
  filesFound: number
  uploaded: Array<{ from: string; to: string }>
  failed: Array<{ from: string; error: string }>
  rowsUpdated: Record<string, number>
}

function isLocalUpload(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.startsWith('/uploads/')) return true
  return (
    value.startsWith('http') &&
    value.includes('/uploads/') &&
    !value.includes('blob.vercel-storage.com')
  )
}

// Deep-replace local upload URLs inside a plain string or a JSON-encoded string/array
function rewriteValue(value: string, map: Map<string, string>): { next: string; changed: boolean } {
  if (map.has(value)) return { next: map.get(value)!, changed: true }
  if (value.trim().startsWith('[') || value.trim().startsWith('{')) {
    try {
      let changed = false
      const walk = (node: any): any => {
        if (typeof node === 'string' && map.has(node)) {
          changed = true
          return map.get(node)
        }
        if (Array.isArray(node)) return node.map(walk)
        if (node && typeof node === 'object') {
          return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v)]))
        }
        return node
      }
      const parsed = JSON.parse(value)
      const next = JSON.stringify(walk(parsed))
      return { next, changed }
    } catch {
      return { next: value, changed: false }
    }
  }
  return { next: value, changed: false }
}

function collectLocalValues(values: Array<string | null | undefined>): string[] {
  const found = new Set<string>()
  for (const raw of values) {
    if (typeof raw !== 'string') continue
    if (isLocalUpload(raw)) {
      found.add(raw)
      continue
    }
    // JSON arrays/objects stored as strings
    if (raw.includes('/uploads/')) {
      const matches = raw.match(/"((?:https?:\/\/[^"]*)?\/uploads\/[^"]+)"/g) || []
      for (const m of matches) {
        const v = m.slice(1, -1)
        if (isLocalUpload(v)) found.add(v)
      }
    }
  }
  return [...found]
}

export async function POST(request: NextRequest) {
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1'
  const origin = request.nextUrl.origin

  const summary: Summary = {
    dryRun,
    filesFound: 0,
    uploaded: [],
    failed: [],
    rowsUpdated: {},
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BLOB_READ_WRITE_TOKEN is not set for this deployment.' },
        { status: 500 }
      )
    }

    // 1. Collect every local upload URL stored in the database
    const [listings, categories, units, evidence, users] = await Promise.all([
      db.assetListing.findMany({ select: { id: true, coverImage: true, images: true } }),
      db.assetCategory.findMany({ select: { id: true, imageUrl: true } }),
      db.assetUnit.findMany({ select: { id: true, conditionPhotos: true } }),
      db.rentalEvidence.findMany({ select: { id: true, mediaUrl: true } }),
      db.user.findMany({ select: { id: true, avatar: true } }),
    ])

    const allValues = [
      ...listings.flatMap((l) => [l.coverImage, l.images]),
      ...categories.map((c) => c.imageUrl),
      ...units.map((u) => u.conditionPhotos),
      ...evidence.map((e) => e.mediaUrl),
      ...users.map((u) => u.avatar),
    ]
    const localValues = collectLocalValues(allValues)
    summary.filesFound = localValues.length

    // 2. Copy each file into Blob (once per unique source)
    const map = new Map<string, string>()
    for (const value of localValues) {
      const fetchUrl = value.startsWith('/') ? `${origin}${value}` : value
      try {
        if (dryRun) {
          map.set(value, `(dry-run) ${value}`)
          summary.uploaded.push({ from: value, to: '(dry-run)' })
          continue
        }
        const res = await fetch(fetchUrl)
        if (!res.ok) throw new Error(`fetch ${res.status}`)
        const buffer = Buffer.from(await res.arrayBuffer())
        const contentType = res.headers.get('content-type') || 'application/octet-stream'
        const fileName = decodeURIComponent(value.split('/').pop() || 'image')
        const blob = await put(`uploads/${fileName}`, buffer, {
          access: 'public',
          contentType,
          addRandomSuffix: true,
        })
        map.set(value, blob.url)
        summary.uploaded.push({ from: value, to: blob.url })
      } catch (err: any) {
        summary.failed.push({ from: value, error: err?.message || 'unknown error' })
      }
    }

    // 3. Rewrite database rows that reference a migrated file
    const rewriteRows = async (
      label: string,
      rows: Array<{ id: string; [k: string]: any }>,
      fields: string[],
      update: (id: string, data: Record<string, string>) => Promise<unknown>
    ) => {
      let count = 0
      for (const row of rows) {
        const data: Record<string, string> = {}
        for (const field of fields) {
          const current = row[field]
          if (typeof current !== 'string') continue
          const { next, changed } = rewriteValue(current, map)
          if (changed && next !== current) data[field] = next
        }
        if (Object.keys(data).length > 0) {
          count++
          if (!dryRun) await update(row.id, data)
        }
      }
      summary.rowsUpdated[label] = count
    }

    await rewriteRows('assetListing', listings as any, ['coverImage', 'images'], (id, data) =>
      db.assetListing.update({ where: { id }, data })
    )
    await rewriteRows('assetCategory', categories as any, ['imageUrl'], (id, data) =>
      db.assetCategory.update({ where: { id }, data })
    )
    await rewriteRows('assetUnit', units as any, ['conditionPhotos'], (id, data) =>
      db.assetUnit.update({ where: { id }, data })
    )
    await rewriteRows('rentalEvidence', evidence as any, ['mediaUrl'], (id, data) =>
      db.rentalEvidence.update({ where: { id }, data })
    )
    await rewriteRows('user', users as any, ['avatar'], (id, data) =>
      db.user.update({ where: { id }, data })
    )

    return NextResponse.json({ ok: summary.failed.length === 0, ...summary })
  } catch (error: any) {
    console.error('Migrate uploads error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Migration failed', ...summary }, { status: 500 })
  }
}
