'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  Plus,
  Key,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Search,
  Lock,
  Mail,
  User,
  Settings,
  Building,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Edit2,
  Trash2,
  Clock,
  LayoutDashboard,
  Package,
  FolderTree,
  Wrench,
  MapPin,
  ClipboardCheck,
  CreditCard,
  CalendarCheck,
  History,
} from 'lucide-react'
import { toast } from 'sonner'

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  adminRole?: string
  permissions: string[]
  status: 'ACTIVE' | 'SUSPENDED'
  createdBy?: string
  createdAt: string
  lastLoginAt?: string
}

export const MODULE_DEFINITIONS = [
  { key: 'DASHBOARD', label: 'Dashboard', desc: 'Overall KPIs, charts, and activity summaries', icon: LayoutDashboard },
  { key: 'ASSETS', label: 'Asset Catalog', desc: 'View, register, edit, and configure equipment listings', icon: Package },
  { key: 'CATEGORIES', label: 'Categories', desc: 'Equipment category taxonomy and tree structure', icon: FolderTree },
  { key: 'MAINTENANCE', label: 'Maintenance', desc: 'Fleet repair schedules and unit calendar blocks', icon: Wrench },
  { key: 'LOCATIONS', label: 'Locations', desc: 'Warehouse fulfillment hubs and pickup facilities', icon: MapPin },
  { key: 'RENTAL_REQUESTS', label: 'Rental Requests', desc: 'Review, approve, or reject customer rental requests', icon: ClipboardCheck },
  { key: 'PAYMENTS', label: 'Payments & Deposits', desc: 'Finance center, receipts, and deposit escrow ledgers', icon: CreditCard },
  { key: 'RESERVATIONS', label: 'Reservations & Handover', desc: 'Equipment staging, customer pickup, and closure', icon: CalendarCheck },
  { key: 'AUDIT_TRAIL', label: 'Audit Trail', desc: 'System security logs and administrative action history', icon: History },
  { key: 'SETTINGS', label: 'Settings & Users', desc: 'Manage administrative users and assign module access', icon: Settings },
]

export const ROLE_PRESETS = [
  {
    id: 'SUPERADMIN',
    label: 'Super Admin',
    desc: 'Unrestricted full access to all 10 modules including Settings & User Management',
    modules: MODULE_DEFINITIONS.map((m) => m.key),
  },
  {
    id: 'OPERATIONS',
    label: 'Operations Lead',
    desc: 'Full operational access to assets, requests, reservations, handovers, and fleet maintenance',
    modules: ['DASHBOARD', 'ASSETS', 'CATEGORIES', 'MAINTENANCE', 'LOCATIONS', 'RENTAL_REQUESTS', 'RESERVATIONS'],
  },
  {
    id: 'FINANCE',
    label: 'Finance Specialist',
    desc: 'Access to financial transactions, deposits, approvals, settlements, and audit logs',
    modules: ['DASHBOARD', 'PAYMENTS', 'RENTAL_REQUESTS', 'RESERVATIONS', 'AUDIT_TRAIL'],
  },
  {
    id: 'WAREHOUSE',
    label: 'Warehouse Staff',
    desc: 'Focused access for equipment preparation, handover counter, and maintenance check-in',
    modules: ['RESERVATIONS', 'MAINTENANCE', 'LOCATIONS'],
  },
  {
    id: 'CUSTOM',
    label: 'Custom Access',
    desc: 'Granularly select individual modules with custom checkboxes',
    modules: [],
  },
]

export default function AdminSettingsPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'USERS' | 'COMPANY'>('USERS')

  // Create / Edit User Modal
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formRolePreset, setFormRolePreset] = useState('OPERATIONS')
  const [formPermissions, setFormPermissions] = useState<string[]>([])
  const [submittingUser, setSubmittingUser] = useState(false)

  // Password Reset Modal
  const [resetModalUser, setResetModalUser] = useState<AdminUserRecord | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [submittingReset, setSubmittingReset] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      if (res.status === 403) {
        toast.error('Access denied: You do not have permission to view Settings.')
        return
      }
      if (!res.ok) throw new Error('Failed to load admin users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      toast.error(err.message || 'Error loading users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRolePreset('OPERATIONS')
    const preset = ROLE_PRESETS.find((p) => p.id === 'OPERATIONS')
    setFormPermissions(preset ? preset.modules : [])
    setUserModalOpen(true)
  }

  const handleOpenEditModal = (u: AdminUserRecord) => {
    setEditingUser(u)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormPassword('')
    setFormRolePreset(u.adminRole || 'CUSTOM')
    setFormPermissions(u.permissions || [])
    setUserModalOpen(true)
  }

  const handlePresetChange = (presetId: string) => {
    setFormRolePreset(presetId)
    const preset = ROLE_PRESETS.find((p) => p.id === presetId)
    if (preset && presetId !== 'CUSTOM') {
      setFormPermissions(preset.modules)
    }
  }

  const toggleModulePermission = (modKey: string) => {
    setFormRolePreset('CUSTOM')
    setFormPermissions((prev) =>
      prev.includes(modKey) ? prev.filter((k) => k !== modKey) : [...prev, modKey]
    )
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and email are required.')
      return
    }

    if (!editingUser && !formPassword.trim()) {
      toast.error('Password is required for new accounts.')
      return
    }

    try {
      setSubmittingUser(true)
      if (editingUser) {
        // Update user
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            adminRole: formRolePreset,
            permissions: formRolePreset === 'SUPERADMIN' ? MODULE_DEFINITIONS.map((m) => m.key) : formPermissions,
            ...(formPassword.trim() ? { password: formPassword.trim() } : {}),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update user')
        toast.success('Admin user updated successfully!')
      } else {
        // Create user
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim(),
            password: formPassword.trim(),
            adminRole: formRolePreset,
            permissions: formRolePreset === 'SUPERADMIN' ? MODULE_DEFINITIONS.map((m) => m.key) : formPermissions,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create user')
        toast.success('Admin user created successfully!')
      }

      setUserModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmittingUser(false)
    }
  }

  const handleToggleStatus = async (u: AdminUserRecord) => {
    const nextStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change status')
      toast.success(`User account is now ${nextStatus.toLowerCase()}.`)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteUser = async (u: AdminUserRecord) => {
    if (!confirm(`Are you sure you want to remove admin access for ${u.name}?`)) return
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      toast.success('Admin user removed.')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalUser || !newPassword.trim()) return
    try {
      setSubmittingReset(true)
      const res = await fetch(`/api/admin/users/${resetModalUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      toast.success(`Password reset for ${resetModalUser.name}.`)
      setResetModalUser(null)
      setNewPassword('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmittingReset(false)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.adminRole?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Security & Access Control
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Settings & User Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create administrative accounts, set role-based module access rules, and manage facility preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Admin User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'USERS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Admin Users & Roles ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'COMPANY'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="h-4 w-4" />
          Company & Facility Profile
        </button>
      </div>

      {/* TAB 1: Admin Users */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong>{filteredUsers.length}</strong> authorized admin accounts
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Admin User</th>
                  <th className="py-3.5 px-5">Role Preset</th>
                  <th className="py-3.5 px-5">Module Access</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Last Login</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      Loading admin users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No admin users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRoot = u.email === 'admin@renthub.app'
                    const isSuper = u.adminRole === 'SUPERADMIN' || isRoot

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        {/* User Identity */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                              alt={u.name}
                              className="h-9 w-9 rounded-xl object-cover bg-slate-100 border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {u.name}
                                {isRoot && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                                    Root
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Preset */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isSuper
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.adminRole === 'OPERATIONS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : u.adminRole === 'FINANCE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            {isSuper ? 'Super Admin' : u.adminRole || 'Custom'}
                          </span>
                        </td>

                        {/* Module Access Badges */}
                        <td className="py-4 px-5 max-w-xs">
                          {isSuper ? (
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50/60 px-2 py-1 rounded-md border border-purple-200">
                              All 10 Modules Enabled
                            </span>
                          ) : u.permissions.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">No modules assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {u.permissions.map((pk) => {
                                const def = MODULE_DEFINITIONS.find((m) => m.key === pk)
                                return (
                                  <span
                                    key={pk}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                  >
                                    {def?.label || pk}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {u.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="h-3 w-3" />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-4 px-5 text-slate-500 text-[11px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition inline-flex items-center gap-1"
                            title="Edit Permissions & Role"
                          >
                            <Edit2 className="h-3 w-3 text-slate-500" />
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              setResetModalUser(u)
                              setNewPassword('')
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition inline-flex items-center gap-1"
                            title="Reset User Password"
                          >
                            <Key className="h-3 w-3 text-amber-600" />
                            Reset Pw
                          </button>

                          {!isRoot && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1 ${
                                u.status === 'ACTIVE'
                                  ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                                  : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Suspend account access' : 'Reactivate account'}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          )}

                          {!isRoot && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="px-2 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-[11px] transition inline-flex items-center gap-1"
                              title="Delete admin account"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Company Profile */}
      {activeTab === 'COMPANY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Facility & Enterprise Configuration</h3>
              <p className="text-xs text-slate-500">Global operating settings applied across all locations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Trade Name:</label>
              <input
                type="text"
                defaultValue="RentHub Enterprise Rentals"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Base Currency:</label>
              <input
                type="text"
                defaultValue="USD ($)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Operational Timezone:</label>
              <input
                type="text"
                defaultValue="Asia/Phnom_Penh (UTC+7)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Email:</label>
              <input
                type="text"
                defaultValue="support@renthub.app"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Admin User with RBAC Module Selection */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingUser ? `Edit Admin User: ${editingUser.name}` : 'Create New Admin User'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign role presets or individual module permissions.
                  </p>
                </div>
              </div>
              <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Sokha Lim"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Email / Username */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email / Login Username: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      disabled={!!editingUser}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. sokha@renthub.app"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {editingUser ? 'Change Password (leave blank to keep current):' : 'Initial Password: *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Enter new password or leave blank' : 'Minimum 6 characters'}
                    className="w-full pl-9 pr-24 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = 'RH#' + Math.random().toString(36).slice(-8) + '!'
                        setFormPassword(generated)
                        setShowPassword(true)
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Presets */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5">
                  Assigned Role Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {ROLE_PRESETS.map((preset) => {
                    const selected = formRolePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetChange(preset.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                          {preset.label}
                          {selected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                          {preset.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Module Checkbox Grid */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-800 font-bold">
                    Authorized Modules ({formRolePreset === 'SUPERADMIN' ? 10 : formPermissions.length} / 10 active):
                  </label>
                  {formRolePreset !== 'SUPERADMIN' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormRolePreset('CUSTOM')
                          setFormPermissions(MODULE_DEFINITIONS.map((m) => m.key))
                        }}
                        className="text-[11px] text-emerald-700 hover:underline font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormRolePreset('CUSTOM')
                          setFormPermissions([])
                        }}
                        className="text-[11px] text-slate-500 hover:underline font-semibold"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {MODULE_DEFINITIONS.map((m) => {
                    const isChecked = formRolePreset === 'SUPERADMIN' || formPermissions.includes(m.key)
                    const IconComponent = m.icon

                    return (
                      <label
                        key={m.key}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition ${
                          isChecked
                            ? 'border-emerald-400 bg-emerald-50/40 text-slate-900'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={formRolePreset === 'SUPERADMIN'}
                          checked={isChecked}
                          onChange={() => toggleModulePermission(m.key)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <IconComponent className={`h-3.5 w-3.5 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                            {m.label}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.desc}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingUser ? 'Saving...' : editingUser ? 'Save Changes' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
              </div>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Set a new administrative password for <strong>{resetModalUser.name}</strong> ({resetModalUser.email}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password:</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submittingReset ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

