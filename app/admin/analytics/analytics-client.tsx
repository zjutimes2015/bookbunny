'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'

const COLORS = ['#FF6B8A', '#C8A2E8', '#98D8C8', '#87CEEB', '#FFDAB9']

export default function AnalyticsClient({
  data,
}: {
  data: {
    dailyBooks: { day: string; count: number }[]
    dailyUsers: { day: string; count: number }[]
    statusCounts: { status: string; count: number }[]
  }
}) {
  const totalBooks = data.dailyBooks.reduce((s, d) => s + d.count, 0)
  const totalNewUsers = data.dailyUsers.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6">
      {/* Summary numbers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">Last 14 Days</p>
          <p className="text-3xl font-bold text-[#2D2D2D] mt-1">{totalBooks}</p>
          <p className="text-sm text-[#8E8E93]">books created</p>
        </div>
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">Last 14 Days</p>
          <p className="text-3xl font-bold text-[#2D2D2D] mt-1">{totalNewUsers}</p>
          <p className="text-sm text-[#8E8E93]">new users</p>
        </div>
      </div>

      {/* Books per day chart */}
      <div className="apple-card p-6">
        <h3 className="font-semibold text-[#2D2D2D] mb-4">Books Created Per Day</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyBooks.length > 0 ? data.dailyBooks : [{ day: 'No data', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8E8E93' }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E5E5EA', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="count" fill="#FF6B8A" radius={[6, 6, 0, 0]} name="Books" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status distribution */}
      {data.statusCounts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="apple-card p-6">
            <h3 className="font-semibold text-[#2D2D2D] mb-4">Book Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusCounts.map((s) => ({
                      name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
                      value: s.count,
                    }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value"
                  >
                    {data.statusCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {data.statusCounts.map((s, i) => (
                <div key={s.status} className="flex items-center gap-1.5 text-xs text-[#8E8E93]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {s.status}: {s.count}
                </div>
              ))}
            </div>
          </div>

          {/* User trend */}
          <div className="apple-card p-6">
            <h3 className="font-semibold text-[#2D2D2D] mb-4">New Users Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyUsers.length > 0 ? data.dailyUsers : [{ day: 'No data', count: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8E8E93' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#C8A2E8" strokeWidth={2} dot={{ fill: '#C8A2E8', r: 4 }} name="Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
