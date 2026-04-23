'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Scale, AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { formatDeadline } from '@/lib/deadlines'

interface Stats {
  totalJudgments: number
  totalObligations: number
  activeObligations: number
  overdueCount: number
  completedThisMonth: number
  byStatus: { [key: string]: number }
  byPriority: { [key: string]: number }
}

interface Deadline {
  id: string
  title: string
  deadline: string
  priority: string
  judgment: {
    id: string
    title: string
    caseNumber: string | null
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/dashboard/deadlines?days=30').then(r => r.json()),
    ]).then(([statsData, deadlinesData]) => {
      setStats(statsData)
      setDeadlines(deadlinesData.deadlines || [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const priorityColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Scale className="h-8 w-8 text-slate-700" />
                Verdict→Action
              </h1>
              <p className="text-slate-600 mt-1">From court judgments to verified action plans</p>
            </div>
            <Link href="/judgments/new">
              <Button size="lg" className="gap-2">
                <Upload className="h-5 w-5" />
                Upload Judgment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Judgments</CardTitle>
              <FileText className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalJudgments || 0}</div>
              <p className="text-xs text-slate-600 mt-1">
                {stats?.totalObligations || 0} total obligations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Obligations</CardTitle>
              <Scale className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeObligations || 0}</div>
              <p className="text-xs text-slate-600 mt-1">Pending or in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.overdueCount || 0}</div>
              <p className="text-xs text-slate-600 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completedThisMonth || 0}</div>
              <p className="text-xs text-slate-600 mt-1">Successfully fulfilled</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Obligations by Priority</CardTitle>
              <CardDescription>Distribution across priority levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => (
                  <div key={priority} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${priorityColors[priority]}`} />
                        <span className="text-sm font-medium">{priority}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${priorityColors[priority]}`}
                          style={{
                            width: `${((stats?.byPriority[priority] || 0) / (stats?.totalObligations || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-semibold">{stats?.byPriority[priority] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadlines.slice(0, 5).map(deadline => (
                  <Link key={deadline.id} href={`/obligations/${deadline.id}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[deadline.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{deadline.title}</p>
                        <p className="text-xs text-slate-600 truncate">
                          {deadline.judgment.caseNumber || deadline.judgment.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDeadline(deadline.deadline ? new Date(deadline.deadline) : null)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {deadlines.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines</p>
                )}
                {deadlines.length > 5 && (
                  <Link href="/obligations">
                    <Button variant="outline" className="w-full">
                      View All Obligations
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/judgments">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-5 w-5" />
                    View All Judgments
                  </Button>
                </Link>
                <Link href="/obligations">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Scale className="h-5 w-5" />
                    Track Obligations
                  </Button>
                </Link>
                <Link href="/judgments/new">
                  <Button className="w-full justify-start gap-2">
                    <Upload className="h-5 w-5" />
                    Upload New Judgment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
