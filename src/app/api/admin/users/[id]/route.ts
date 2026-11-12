import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentAdminUserState, hashPassword, ALL_ADMIN_MODULES } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user: currentAdmin } = await getCurrentAdminUserState()

    if (!currentAdmin || currentAdmin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const isSuper = currentAdmin.adminRole === 'SUPERADMIN' || currentAdmin.email === 'admin@renthub.app'
    const hasSettingsPerm = currentAdmin.permissions?.includes('SETTINGS')

    if (!isSuper && !hasSettingsPerm) {
      return NextResponse.json({ ok: false, error: 'Access denied: Settings permission required.' }, { status: 403 })
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser || targetUser.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Admin user not found.' }, { status: 404 })
    }

    // Protect root admin from suspension or demotion
    if (targetUser.email === 'admin@renthub.app' && currentAdmin.id !== targetUser.id && !isSuper) {
      return NextResponse.json(
        { ok: false, error: 'Cannot modify primary root super administrator.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, adminRole, permissions, status, password } = body

    const updateData: any = {}

    if (name?.trim()) updateData.name = name.trim()
    if (adminRole) {
      // Prevent demoting primary root super admin
      if (targetUser.email === 'admin@renthub.app' && adminRole !== 'SUPERADMIN') {
        updateData.adminRole = 'SUPERADMIN'
      } else {
        updateData.adminRole = adminRole
      }
    }
    if (permissions !== undefined) {
      if (adminRole === 'SUPERADMIN' || targetUser.email === 'admin@renthub.app') {
        updateData.permissions = JSON.stringify(ALL_ADMIN_MODULES)
      } else {
        updateData.permissions = JSON.stringify(permissions)
      }
    }
    if (status) {
      if (targetUser.email === 'admin@renthub.app' && status === 'SUSPENDED') {
        return NextResponse.json({ ok: false, error: 'Cannot suspend primary root administrator.' }, { status: 400 })
      }
      updateData.status = status
    }
    if (password?.trim()) {
      updateData.passwordHash = await hashPassword(password.trim())
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    })

    let perms: string[] = []
    try {
      perms = updated.permissions ? JSON.parse(updated.permissions) : []
    } catch {
      perms = []
    }

    return NextResponse.json({
      ok: true,
      message: 'Admin user updated successfully.',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        adminRole: updated.adminRole,
        permissions: perms,
        status: updated.status,
      },
    })
  } catch (error: any) {
    console.error('Error updating admin user:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user: currentAdmin } = await getCurrentAdminUserState()

    if (!currentAdmin || currentAdmin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const isSuper = currentAdmin.adminRole === 'SUPERADMIN' || currentAdmin.email === 'admin@renthub.app'
    const hasSettingsPerm = currentAdmin.permissions?.includes('SETTINGS')

    if (!isSuper && !hasSettingsPerm) {
      return NextResponse.json({ ok: false, error: 'Access denied: Settings permission required.' }, { status: 403 })
    }

    if (currentAdmin.id === id) {
      return NextResponse.json({ ok: false, error: 'You cannot delete your own admin account.' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser || targetUser.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Admin user not found.' }, { status: 404 })
    }

    if (targetUser.email === 'admin@renthub.app') {
      return NextResponse.json({ ok: false, error: 'Cannot delete primary root super administrator.' }, { status: 403 })
    }

    await db.user.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true, message: 'Admin user removed successfully.' })
  } catch (error: any) {
    console.error('Error deleting admin user:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}

