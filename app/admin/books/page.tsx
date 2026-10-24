import { neon } from '@neondatabase/serverless'

async function getBooks() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const books = await sql`
      SELECT
        b.title,
        b.status,
        b.created_at,
        u.email as owner_email
      FROM books b
      LEFT JOIN bookbunny_users u ON u.id = b.user_id
      ORDER BY b.created_at DESC
      LIMIT 50
    `
    return books as { title: string; status: string; created_at: Date; owner_email: string | null }[]
  } catch {
    return []
  }
}

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-[#F2F2F7] text-[#8E8E93]', label: 'Draft' },
  generating: { color: 'bg-[#FFDAB9] text-[#CC7A3A]', label: 'Generating' },
  ready: { color: 'bg-[#98D8C8]/20 text-[#4A9E8E]', label: 'Ready' },
  exported: { color: 'bg-[#C8A2E8]/20 text-[#7B52AB]', label: 'Exported' },
}

export default async function AdminBooks() {
  const books = await getBooks()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Books</h1>
        <p className="text-sm text-[#8E8E93] mt-1">{books.length} books created</p>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#F8F8FA]">
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Title</th>
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Owner</th>
                <th className="text-left px-5 py-3 font-medium text-[#8E8E93]">Created</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Status</th>
                <th className="text-center px-5 py-3 font-medium text-[#8E8E93]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#8E8E93]">No books yet</td></tr>
              ) : books.map((b, i) => {
                const badge = STATUS_BADGES[b.status] || STATUS_BADGES.draft
                return (
                  <tr key={i} className="border-b border-[#E5E5EA] hover:bg-[#F8F8FA] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#2D2D2D]">{b.title}</td>
                    <td className="px-5 py-3.5 text-[#8E8E93]">{b.owner_email || '—'}</td>
                    <td className="px-5 py-3.5 text-[#8E8E93]">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button className="text-xs text-[#FF6B8A] hover:underline">View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
