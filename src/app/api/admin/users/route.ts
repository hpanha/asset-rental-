import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdminUserState, hashPassword, ALL_ADMIN_MODULES } from '@/lib/auth'

export async function GET() {
  try {
    const { user: currentAdmin } = await getCurrentAdminUserState()

    if (!currentAdmin || currentAdmin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const isSuper = currentAdmin.adminRole === 'SUPERADMIN' || currentAdmin.email === 'admin@renthub.app'
    const hasSettingsPerm = currentAdmin.permissions?.includes('SETTINGS')

    if (!isSuper && !hasSettingsPerm) {
      return NextResponse.json({ ok: false, error: 'Access denied: Settings permission required.' }, { status: 403 })
    }

    const adminUsers = await db.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        status: true,
        role: true,
        adminRole: true,
        permissions: true,
        createdBy: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedUsers = adminUsers.map((u) => {
      let perms: string[] = []
      if (u.adminRole === 'SUPERADMIN' || u.email === 'admin@renthub.app') {
        perms = ALL_ADMIN_MODULES
      } else {
        try {
          perms = u.permissions ? JSON.parse(u.permissions) : []
        } catch {
          perms = []
        }
      }

      return {
        ...u,
        permissions: perms,
      }
    })

    return NextResponse.json({ ok: true, users: formattedUsers })
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: currentAdmin } = await getCurrentAdminUserState()

    if (!currentAdmin || currentAdmin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const isSuper = currentAdmin.adminRole === 'SUPERADMIN' || currentAdmin.email === 'admin@renthub.app'
    const hasSettingsPerm = currentAdmin.permissions?.includes('SETTINGS')

    if (!isSuper && !hasSettingsPerm) {
      return NextResponse.json({ ok: false, error: 'Access denied: Settings permission required.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, adminRole = 'CUSTOM', permissions = [] } = body

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // Check unique email
    const existing = await db.user.findUnique({
      where: { email: cleanEmail },
    })

    if (existing) {
      return NextResponse.json(
        { ok: false, error: `An account with email "${cleanEmail}" already exists.` },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password.trim())
    const permsJson = JSON.stringify(adminRole === 'SUPERADMIN' ? ALL_ADMIN_MODULES : permissions)

    // Generate avatar
    const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=b6e3f4`

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        avatar,
        role: 'admin',
        adminRole,
        permissions: permsJson,
        createdBy: currentAdmin.name || currentAdmin.email,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(
      {
        ok: true,
        message: 'Admin user created successfully.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          adminRole: newUser.adminRole,
          permissions: adminRole === 'SUPERADMIN' ? ALL_ADMIN_MODULES : permissions,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating admin user:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

