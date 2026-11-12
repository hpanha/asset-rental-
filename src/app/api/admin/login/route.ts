import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPassword,
  hashPassword,
  createAdminToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  ALL_ADMIN_MODULES,
} from '@/lib/auth'

// Default administrator account. The first successful login with these
// credentials creates the account in the database, so the Admin Console works
// on a fresh Postgres database without running the seed script.
const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'
const DEFAULT_ADMIN_NAME = 'Administrator'
// Seeded account from prisma/seed.ts (created without a password hash)
const LEGACY_ADMIN_EMAIL = 'admin@renthub.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body
    const identity = (email || username || '').trim().toLowerCase()
    const rawPassword = (password || '').trim()

    if (!identity || !rawPassword) {
      return NextResponse.json(
        { ok: false, error: 'Please enter both username/email and password.' },
        { status: 400 }
      )
    }

    // "admin" as a username is shorthand for the default admin email
    const isBootstrapIdentity = identity === 'admin' || identity === DEFAULT_ADMIN_EMAIL
    const isDefaultPassword = rawPassword === DEFAULT_ADMIN_PASSWORD
    const targetEmail = identity === 'admin' ? DEFAULT_ADMIN_EMAIL : identity

    // Look up user by email or name with resilient error handling
    let user: any = null
    try {
      user = await db.user.findFirst({
        where: {
          OR: [
            { email: targetEmail },
            { name: { equals: identity } },
          ],
        },
      })
    } catch (dbError) {
      console.warn('[Admin Login] Database query warning:', dbError)
    }

    // First login with the default credentials: create the admin row in the database
    if (!user && isBootstrapIdentity && isDefaultPassword) {
      try {
        user = await db.user.create({
          data: {
            email: DEFAULT_ADMIN_EMAIL,
            name: DEFAULT_ADMIN_NAME,
            role: 'admin',
            adminRole: 'SUPERADMIN',
            status: 'ACTIVE',
            passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
            permissions: JSON.stringify(ALL_ADMIN_MODULES),
          },
        })
      } catch (createError) {
        console.warn('[Admin Login] Could not create default admin, using in-memory session:', createError)
      }

      // DB unreachable or write failed: still let the default admin in for this session
      if (!user) {
        user = {
          id: 'root-admin',
          email: DEFAULT_ADMIN_EMAIL,
          name: DEFAULT_ADMIN_NAME,
          role: 'admin',
          avatar: null,
          status: 'ACTIVE',
          adminRole: 'SUPERADMIN',
          permissions: null,
          passwordHash: null,
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Account not found.' },
        { status: 401 }
      )
    }

    // Strict Role Check: Client users cannot log in to the Admin Console
    if (user.role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Access denied. Client accounts cannot access the Admin Console.' },
        { status: 403 }
      )
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { ok: false, error: 'Admin account suspended. Please contact root owner.' },
        { status: 403 }
      )
    }

    // Verify password against the stored hash
    let passwordValid = false
    if (user.passwordHash) {
      passwordValid = await verifyPassword(rawPassword, user.passwordHash)
    } else if (
      isDefaultPassword &&
      (isBootstrapIdentity || identity === LEGACY_ADMIN_EMAIL)
    ) {
      // Only the default admin accounts may use the default password without a hash
      passwordValid = true
    }

    if (!passwordValid) {
      return NextResponse.json(
        { ok: false, error: 'Invalid admin credentials. Please try again.' },
        { status: 401 }
      )
    }

    // Update lastLoginAt safely (non-blocking if DB is in read-only mode or lock is held)
    try {
      if (user.id) {
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      }
    } catch (updateErr) {
      console.warn('[Admin Login] Non-fatal lastLoginAt update skipped:', updateErr)
    }

    // Issue isolated admin JWT session token (8h)
    const isSuper =
      user.email === LEGACY_ADMIN_EMAIL ||
      user.email === DEFAULT_ADMIN_EMAIL ||
      user.adminRole === 'SUPERADMIN'
    let perms: string[] = []
    if (isSuper) {
      perms = ALL_ADMIN_MODULES
    } else {
      try {
        perms = user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : []
      } catch {
        perms = []
      }
    }

    const token = await createAdminToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: 'admin',
      avatar: user.avatar,
      adminRole: user.adminRole || (isSuper ? 'SUPERADMIN' : 'STAFF'),
      permissions: perms,
    }, '8h')

    const response = NextResponse.json({
      ok: true,
      message: 'Admin signed in successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'admin',
        adminRole: user.adminRole || (isSuper ? 'SUPERADMIN' : 'STAFF'),
        permissions: perms,
        avatar: user.avatar,
      },
    })

    // Set isolated admin session cookie
    setAdminSessionCookie(response, token)

    return response
  } catch (error: any) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, message: 'Signed out of Admin Console.' })
  clearAdminSessionCookie(response)
  return response
}
