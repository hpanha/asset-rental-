'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export default function AdminOperationsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/reservations')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 text-sm">
      <RefreshCw className="h-6 w-6 animate-spin text-emerald-600 mb-3" />
      <p>Redirecting to Reservations & Operations...</p>
    </div>
  )
}
