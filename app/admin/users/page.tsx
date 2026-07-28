import { neon } from '@neondatabase/serverless'

async function getUsers() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const users = await sql`
      SELECT 
        COALESCE(u.name, c.name, 'Anonymous') as name,
        u.email,
        u.created_at,
        (SELECT COUNT(*) FROM books b WHERE b.character_id IN 
          (SELECT id FROM characters ch WHERE ch.name = COALESCE(u.name, c.name))) as book_count
      FROM "user" u
      FULL JOIN characters c ON c.name = u.name
      ORDER BY u.created_at DESC NULLS LAST
      LIMIT 50
    `
    return users as { name: string; email: string | null; created_at: Date; book_count: number }[]
  } catch {
    return []
  }
}

export default async function AdminUsers() {
  const users = await getUsers()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Users</h1>
        <p className="text-sm text-[#8E8E93] mt-1">{users.length} users registered</p>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#F8F8FA]">
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Name</th>
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Email</th>
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Joined</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Books</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#8E8E93]">No users yet</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} className="border-b border-[#E5E5EA] hover:bg-[#F8F8FA] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FFF5EE] flex items-center justify-center text-xs font-bold text-[#FF6B8A]">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#2D2D2D]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#8E8E93]">{u.email || '—'}</td>
                  <td className="px-5 py-3.5 text-[#8E8E93]">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3.5 text-center font-medium">{u.book_count}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#98D8C8]/20 text-[#4A9E8E]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
