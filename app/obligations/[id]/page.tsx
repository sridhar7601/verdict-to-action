'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Calendar, User, FileText, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { formatDeadline } from '@/lib/deadlines'

interface Update {
  id: string
  status: string
  note: string
  evidenceUrl: string | null
  updatedBy: string
  updatedAt: string
}

interface Obligation {
  id: string
  type: string
  status: string
  priority: string
  title: string
  description: string
  deadline: string | null
  deadlineText: string | null
  sourceExcerpt: string
  sourcePage: number | null
  reasoning: string
  confidence: number
  verified: boolean
  verifierNotes: string | null
  judgment: {
    id: string
    title: string
    caseNumber: string | null
    courtName: string | null
  }
  responsibleParty: {
    id: string
    name: string
    role: string
  } | null
  updates: Update[]
}

export default function ObligationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [obligation, setObligation] = useState<Obligation | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetch(`/api/obligations/${id}`)
      .then(r => r.json())
      .then(data => {
        setObligation(data)
        setNewStatus(data.status)
        setLoading(false)
      })
  }, [id])

  const handleVerify = async () => {
    if (!obligation) return
    
    await fetch(`/api/obligations/${id}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !obligation.verified }),
    })
    
    setObligation({ ...obligation, verified: !obligation.verified })
  }

  const handleStatusUpdate = async () => {
    if (!obligation || !newNote.trim()) {
      alert('Please add a note for this status update')
      return
    }
    
    await fetch(`/api/obligations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        note: newNote,
        updatedBy: 'Demo User',
      }),
    })
    
    const updated = await fetch(`/api/obligations/${id}`).then(r => r.json())
    setObligation(updated)
    setNewNote('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading obligation...</div>
      </div>
    )
  }

  if (!obligation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Obligation not found</div>
      </div>
    )
  }

  const priorityColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-green-100 text-green-800',
  }

  const statusColors: { [key: string]: string } = {
    PENDING: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    DISPUTED: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/obligations" className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block">
            ← Back to Obligations
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={priorityColors[obligation.priority]}>
                  {obligation.priority}
                </Badge>
                <Badge className={statusColors[obligation.status]}>
                  {obligation.status}
                </Badge>
                {obligation.verified && (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{obligation.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Link href={`/judgments/${obligation.judgment.id}`} className="hover:text-slate-900">
                  <FileText className="inline h-4 w-4 mr-1" />
                  {obligation.judgment.caseNumber || obligation.judgment.title}
                </Link>
                {obligation.responsibleParty && (
                  <span>
                    <User className="inline h-4 w-4 mr-1" />
                    {obligation.responsibleParty.name}
                  </span>
                )}
              </div>
            </div>
            <Button onClick={handleVerify} variant={obligation.verified ? 'outline' : 'default'}>
              {obligation.verified ? 'Unverify' : 'Verify Obligation'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Obligation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-600">Description</Label>
              <p className="text-base text-slate-900 mt-1">{obligation.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-600">Type</Label>
                <p className="text-base text-slate-900 mt-1">{obligation.type.replace('_', ' ')}</p>
              </div>
              {obligation.deadline && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Deadline</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-base text-slate-900">
                        {format(new Date(obligation.deadline), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-slate-600">
                        {formatDeadline(new Date(obligation.deadline))}
                      </p>
                      {obligation.deadlineText && (
                        <p className="text-xs text-slate-500">Verbatim: {obligation.deadlineText}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source Traceability</CardTitle>
            <CardDescription>Verbatim excerpt from the judgment</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <div className="mb-2">
                  <span className="font-medium">Source Page:</span> {obligation.sourcePage || 'Not specified'}
                </div>
                <div className="bg-slate-50 rounded p-3 text-sm italic text-slate-700">
                  "{obligation.sourceExcerpt}"
                </div>
              </AlertDescription>
            </Alert>
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <div className="font-medium text-blue-900 mb-1">AI Extraction Reasoning:</div>
              <p className="text-blue-800">{obligation.reasoning}</p>
              <p className="text-blue-700 mt-2">
                <span className="font-medium">Confidence Score:</span> {(obligation.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Record progress and add notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value || newStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this status update..."
                rows={3}
              />
            </div>
            <Button onClick={handleStatusUpdate} disabled={!newNote.trim()}>
              Add Update
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update History</CardTitle>
            <CardDescription>Timeline of status changes</CardDescription>
          </CardHeader>
          <CardContent>
            {obligation.updates.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No updates yet</p>
            ) : (
              <div className="space-y-4">
                {obligation.updates.map((update, index) => (
                  <div key={update.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      {index < obligation.updates.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={statusColors[update.status]}>{update.status}</Badge>
                        <span className="text-sm text-slate-500">
                          {format(new Date(update.updatedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">{update.note}</p>
                      <p className="text-xs text-slate-500">by {update.updatedBy}</p>
                      {update.evidenceUrl && (
                        <a
                          href={update.evidenceUrl}
                          className="text-xs text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Evidence →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
