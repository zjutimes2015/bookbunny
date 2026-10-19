import { neon } from '@neondatabase/serverless'

async function getStats() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const [userCount, bookCount, charCount, recentUsers, recentBooks] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM "user"`,
      sql`SELECT COUNT(*) as count FROM books`,
      sql`SELECT COUNT(*) as count FROM characters`,
      sql`SELECT name, created_at FROM characters ORDER BY created_at DESC LIMIT 5`,
      sql`SELECT title, status, created_at FROM books ORDER BY created_at DESC LIMIT 5`,
    ])

    return {
      users: Number(userCount[0]?.count || 0),
      books: Number(bookCount[0]?.count || 0),
      characters: Number(charCount[0]?.count || 0),
      recentUsers: (recentUsers as Record<string, any>[]).map((u: Record<string, any>) => ({
        name: u.name,
        date: new Date(u.created_at).toLocaleDateString(),
      })),
      recentBooks: (recentBooks as Record<string, any>[]).map((b: Record<string, any>) => ({
        title: b.title,
        status: b.status,
        date: new Date(b.created_at).toLocaleDateString(),
      })),
    }
  } catch {
    return {
      users: 0, books: 0, characters: 0,
      recentUsers: [], recentBooks: [],
      dbError: 'Database not configured yet. Add NEON_DATABASE_URL to .env.local',
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Dashboard</h1>
        <p className="text-sm text-[#8E8E93] mt-1">Overview of your SproutTales platform</p>
      </div>

      {'dbError' in stats ? (
        <div className="apple-card p-8 text-center">
          <div className="text-4xl mb-3">🗄️</div>
          <h2 className="font-semibold text-[#2D2D2D] mb-2">Database Not Connected</h2>
          <p className="text-sm text-[#8E8E93]">{(stats as any).dbError}</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <StatCard icon="👥" label="Total Users" value={stats.users} color="#FF6B8A" />
            <StatCard icon="📚" label="Total Books" value={stats.books} color="#C8A2E8" />
            <StatCard icon="🐰" label="Characters" value={stats.characters} color="#98D8C8" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent activity */}
            <div className="apple-card p-6">
              <h3 className="font-semibold text-[#2D2D2D] mb-4">Recent Users</h3>
              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-[#8E8E93]">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentUsers.map((u: { name: string; date: string }, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#2D2D2D]">{u.name}</span>
                      <span className="text-[#8E8E93]">{u.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="apple-card p-6">
              <h3 className="font-semibold text-[#2D2D2D] mb-4">Recent Books</h3>
              {stats.recentBooks.length === 0 ? (
                <p className="text-sm text-[#8E8E93]">No books yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentBooks.map((b: { title: string; status: string; date: string }, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${b.status === 'ready' ? 'bg-[#98D8C8]' : 'bg-[#E5E5EA]'}`} />
                        <span className="text-[#2D2D2D]">{b.title}</span>
                      </div>
                      <span className="text-[#8E8E93]">{b.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="apple-card p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: color + '20' }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#2D2D2D]">{value}</p>
        <p className="text-sm text-[#8E8E93]">{label}</p>
      </div>
    </div>
  )
}
