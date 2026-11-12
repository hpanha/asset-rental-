import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { put } from '@vercel/blob'

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB in bytes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const singleFile = formData.get('file') as File | null

    const filesToUpload: File[] = []
    if (files && files.length > 0) {
      filesToUpload.push(...files)
    } else if (singleFile) {
      filesToUpload.push(singleFile)
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate size for all files
    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        return NextResponse.json(
          { error: `"${file.name}" (${sizeMB}MB) exceeds the 1MB limit. Only files below 1MB are allowed.` },
          { status: 400 }
        )
      }
    }

    // Production (Vercel): the filesystem is read-only, so files go to Vercel Blob.
    // Requires a Blob store linked to the project (adds BLOB_READ_WRITE_TOKEN).
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN
    if (process.env.VERCEL && !useBlob) {
      return NextResponse.json(
        {
          error:
            'Image storage is not configured. In the Vercel project, open Storage, create a Blob store, and connect it to this project, then redeploy.',
        },
        { status: 500 }
      )
    }

    // Local development: write into public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!useBlob && !existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const uploadedResults: Array<{ url: string; fileName: string; size: number }> = []

    for (const file of filesToUpload) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const originalName = file.name || 'image.png'
      const ext = path.extname(originalName) || '.png'
      const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${safeBase}${ext}`

      let url: string
      if (useBlob) {
        const blob = await put(`uploads/${fileName}`, buffer, {
          access: 'public',
          contentType: file.type || 'application/octet-stream',
          addRandomSuffix: false,
        })
        url = blob.url
      } else {
        await writeFile(path.join(uploadsDir, fileName), buffer)
        url = `/uploads/${fileName}`
      }

      uploadedResults.push({
        url,
        fileName: originalName,
        size: file.size,
      })
    }

    if (singleFile && files.length === 0) {
      return NextResponse.json({
        success: true,
        url: uploadedResults[0].url,
        fileName: uploadedResults[0].fileName,
        size: uploadedResults[0].size,
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      urls: uploadedResults.map((r) => r.url),
    })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}
