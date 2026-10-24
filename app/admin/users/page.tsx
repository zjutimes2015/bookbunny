'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  isPaid: boolean
  subscriptionTier: string
  credits: number | null
  monthlyAllowanceRemaining: number | null
  bookCount: number
  createdAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const TIERS = ['free', 'starter', 'creator', 'studio']

export default function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDetail, setUserDetail] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)

  async function fetchUsers(page = 1) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    if (search) params.set('search', search)
    if (tier) params.set('tier', tier)

    try {
      const res = await fetch(`/api/admin/users?${params}`)
      const json = await res.json()
      if (json.users) {
        setUsers(json.users)
        setPagination(json.pagination ?? pagination)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 300)
    return () => clearTimeout(timer)
  }, [search, tier])

  async function viewDetail(user: User) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`)
      const json = await res.json()
      setSelectedUser(user)
      setUserDetail(json)
      setShowDetail(true)
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Users</h1>
          <p className="text-sm text-[#8E8E93] mt-1">{pagination.total} users registered</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="apple-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-[#E5E5EA] text-sm text-[#2D2D2D] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B8A]/30"
        />
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#E5E5EA] text-sm text-[#2D2D2D] bg-white focus:outline-none"
        >
          <option value="">All tiers</option>
          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => { setSearch(''); setTier(''); fetchUsers(1); }}
          className="px-3 py-2 text-sm text-[#8E8E93] hover:text-[#2D2D2D] transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#F8F8FA]">
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Name</th>
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Email</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Books</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Plan</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Credits</th>
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Joined</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#8E8E93]">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#8E8E93]">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-[#E5E5EA] hover:bg-[#F8F8FA] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FFF5EE] flex items-center justify-center text-xs font-bold text-[#FF6B8A]">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#2D2D2D]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#8E8E93] max-w-[180px] truncate" title={u.email}>{u.email}</td>
                  <td className="px-5 py-3.5 text-center font-medium">{u.bookCount}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.isPaid
                        ? 'bg-[#98D8C8]/20 text-[#4A9E8E]'
                        : 'bg-[#F2F2F7] text-[#8E8E93]'
                    }`}>
                      {u.subscriptionTier || 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-[#8E8E93]">{u.credits ?? '—'}</td>
                  <td className="px-5 py-3.5 text-[#8E8E93]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => viewDetail(u)}
                      className="text-xs text-[#FF6B8A] hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E5EA]">
            <p className="text-sm text-[#8E8E93]">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[#E5E5EA] text-[#8E8E93] hover:bg-[#F2F2F7] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[#E5E5EA] text-[#8E8E93] hover:bg-[#F2F2F7] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {showDetail && selectedUser && userDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF5EE] flex items-center justify-center text-lg font-bold text-[#FF6B8A]">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-[#2D2D2D]">{selectedUser.name}</h2>
                  <p className="text-sm text-[#8E8E93]">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-[#8E8E93] hover:text-[#2D2D2D] text-xl leading-none">✕</button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="apple-card p-3 text-center">
                <p className="text-2xl font-bold text-[#2D2D2D]">{userDetail.books?.length ?? 0}</p>
                <p className="text-xs text-[#8E8E93]">Books</p>
              </div>
              <div className="apple-card p-3 text-center">
                <p className="text-2xl font-bold text-[#2D2D2D]">{userDetail.payments?.length ?? 0}</p>
                <p className="text-xs text-[#8E8E93]">Payments</p>
              </div>
              <div className="apple-card p-3 text-center">
                <p className="text-2xl font-bold text-[#2D2D2D]">{userDetail.consents?.length ?? 0}</p>
                <p className="text-xs text-[#8E8E93]">Consents</p>
              </div>
            </div>

            {/* Books */}
            {userDetail.books?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-[#2D2D2D] mb-3">Recent Books</h3>
                <div className="space-y-2">
                  {userDetail.books.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between text-sm px-3 py-2 bg-[#F8F8FA] rounded-lg">
                      <span className="text-[#2D2D2D]">{b.title}</span>
                      <span className="text-[#8E8E93] text-xs">{new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {userDetail.payments?.length > 0 && (
              <div>
                <h3 className="font-semibold text-[#2D2D2D] mb-3">Payments</h3>
                <div className="space-y-2">
                  {userDetail.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm px-3 py-2 bg-[#F8F8FA] rounded-lg">
                      <span className="text-[#2D2D2D] capitalize">{p.plan}</span>
                      <span className="text-[#98D8C8] font-medium">${p.amountDollars?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!userDetail.books?.length && !userDetail.payments?.length && (
              <p className="text-sm text-[#8E8E93] text-center py-4">No activity recorded</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
