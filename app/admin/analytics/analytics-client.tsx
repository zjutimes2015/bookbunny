'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, ComposedChart,
} from 'recharts'

const COLORS = ['#FF6B8A', '#C8A2E8', '#98D8C8', '#87CEEB', '#FFDAB9']

export default function AnalyticsClient({
  data,
}: {
  data: {
    dailyBooks: { day: string; count: number }[]
    dailyUsers: { day: string; count: number }[]
    statusCounts: { status: string; count: number }[]
    revenueTrend: { day: string; amount: number }[]
  }
}) {
  const totalBooks = data.dailyBooks.reduce((s, d) => s + d.count, 0)
  const totalNewUsers = data.dailyUsers.reduce((s, d) => s + d.count, 0)
  const totalRevenue = data.revenueTrend.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary numbers */}
      <div className="grid sm:grid-cols-3 gap-4">
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
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">Last 14 Days</p>
          <p className="text-3xl font-bold text-[#FF6B8A] mt-1">${totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-[#8E8E93]">revenue</p>
        </div>
      </div>

      {/* Revenue trend chart */}
      {data.revenueTrend.length > 0 && (
        <div className="apple-card p-6">
          <h3 className="font-semibold text-[#2D2D2D] mb-4">Revenue Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B8A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF6B8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8E8E93' }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="amount" stroke="#FF6B8A" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Combined: Books + Revenue on shared X axis */}
      {data.revenueTrend.length > 0 && data.dailyBooks.length > 0 && (
        <div className="apple-card p-6">
          <h3 className="font-semibold text-[#2D2D2D] mb-4">Books & Revenue Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={(() => {
                  const bookMap = new Map(data.dailyBooks.map(d => [d.day, d.count]))
                  const revMap = new Map(data.revenueTrend.map(r => [r.day, r.amount]))
                  const allDays = [...new Set([...bookMap.keys(), ...revMap.keys()])].sort()
                  return allDays.map(day => ({
                    day: day.slice(5),
                    books: bookMap.get(day) ?? 0,
                    revenue: revMap.get(day) ?? 0,
                  }))
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8E8E93' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#8E8E93' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8E8E93' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="books" fill="#C8A2E8" radius={[4, 4, 0, 0]} name="Books" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#FF6B8A" strokeWidth={2} dot={{ fill: '#FF6B8A', r: 3 }} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status distribution */}
        {data.statusCounts.length > 0 && (
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
        )}

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
    </div>
  )
}
