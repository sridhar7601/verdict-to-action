'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Calendar, Scale, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { formatDeadline } from '@/lib/deadlines'

interface Party {
  id: string
  name: string
  role: string
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
  responsibleParty: Party | null
}

interface Judgment {
  id: string
  title: string
  courtName: string | null
  caseNumber: string | null
  judgmentDate: string | null
  fullText: string | null
  pageCount: number | null
  status: string
  uploadedAt: string
  obligations: Obligation[]
  parties: Party[]
}

export default function JudgmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [judgment, setJudgment] = useState<Judgment | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch(`/api/judgments/${id}`)
      .then(r => r.json())
      .then(data => {
        setJudgment(data)
        setLoading(false)
      })
  }, [id])

  const handleVerify = async (obligationId: string, currentVerified: boolean) => {
    await fetch(`/api/obligations/${obligationId}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !currentVerified }),
    })
    
    if (judgment) {
      setJudgment({
        ...judgment,
        obligations: judgment.obligations.map(o =>
          o.id === obligationId ? { ...o, verified: !currentVerified } : o
        ),
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading judgment...</div>
      </div>
    )
  }

  if (!judgment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Judgment not found</div>
      </div>
    )
  }

  const filteredObligations = filter === 'all' 
    ? judgment.obligations 
    : judgment.obligations.filter(o => o.type === filter || o.priority === filter || o.status === filter)

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/judgments" className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block">
            ← Back to Judgments
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{judgment.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            {judgment.courtName && <span>{judgment.courtName}</span>}
            {judgment.caseNumber && <span>• {judgment.caseNumber}</span>}
            {judgment.judgmentDate && (
              <span className="flex items-center gap-1">
                • <Calendar className="h-4 w-4" />
                {format(new Date(judgment.judgmentDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="obligations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="obligations">
              Obligations ({judgment.obligations.length})
            </TabsTrigger>
            <TabsTrigger value="document">Source Document</TabsTrigger>
            <TabsTrigger value="parties">Parties ({judgment.parties.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Judgment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Court</div>
                      <div className="text-base">{judgment.courtName || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Case Number</div>
                      <div className="text-base">{judgment.caseNumber || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Judgment Date</div>
                      <div className="text-base">
                        {judgment.judgmentDate ? format(new Date(judgment.judgmentDate), 'MMM d, yyyy') : 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Uploaded</div>
                      <div className="text-base">{format(new Date(judgment.uploadedAt), 'MMM d, yyyy')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Page Count</div>
                      <div className="text-base">{judgment.pageCount || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Total Obligations</div>
                      <div className="text-base font-semibold">{judgment.obligations.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Obligations by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['DEADLINE_BOUND', 'CONTINUOUS', 'REPORTING', 'POLICY_CHANGE', 'COMPENSATION', 'OTHER'].map(type => {
                        const count = judgment.obligations.filter(o => o.type === type).length
                        return count > 0 ? (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm">{type.replace('_', ' ')}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Obligations by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
                        const count = judgment.obligations.filter(o => o.priority === priority).length
                        return count > 0 ? (
                          <div key={priority} className="flex justify-between items-center">
                            <span className="text-sm">{priority}</span>
                            <Badge className={priorityColors[priority]}>{count}</Badge>
                          </div>
                        ) : null
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="obligations">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Obligations</CardTitle>
                <CardDescription>
                  AI-extracted obligations with source traceability
                </CardDescription>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'CRITICAL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('CRITICAL')}
                  >
                    Critical
                  </Button>
                  <Button
                    variant={filter === 'PENDING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('PENDING')}
                  >
                    Pending
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredObligations.map(obligation => (
                    <div key={obligation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                          <h4 className="font-semibold text-slate-900">{obligation.title}</h4>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(obligation.id, obligation.verified)}
                        >
                          {obligation.verified ? 'Unverify' : 'Verify'}
                        </Button>
                      </div>

                      <p className="text-sm text-slate-700 mb-3">{obligation.description}</p>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        {obligation.deadline && (
                          <div>
                            <span className="font-medium text-slate-600">Deadline: </span>
                            <span>{formatDeadline(new Date(obligation.deadline))}</span>
                            {obligation.deadlineText && (
                              <span className="text-slate-500 ml-1">({obligation.deadlineText})</span>
                            )}
                          </div>
                        )}
                        {obligation.responsibleParty && (
                          <div>
                            <span className="font-medium text-slate-600">Responsible: </span>
                            <span>{obligation.responsibleParty.name}</span>
                          </div>
                        )}
                      </div>

                      <Alert className="mb-3">
                        <AlertDescription>
                          <div className="text-xs font-medium text-slate-600 mb-1">
                            Source Excerpt {obligation.sourcePage && `(Page ${obligation.sourcePage})`}:
                          </div>
                          <div className="text-xs text-slate-700 italic">"{obligation.sourceExcerpt}"</div>
                        </AlertDescription>
                      </Alert>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div>
                          <span className="font-medium">AI Reasoning:</span> {obligation.reasoning}
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span> {(obligation.confidence * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <Link href={`/obligations/${obligation.id}`}>
                          <Button variant="ghost" size="sm">
                            View Full Details →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="document">
            <Card>
              <CardHeader>
                <CardTitle>Source Document</CardTitle>
                <CardDescription>
                  Full text extracted from judgment PDF ({judgment.pageCount} pages)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 font-mono">
                    {judgment.fullText || 'Text not available'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parties">
            <Card>
              <CardHeader>
                <CardTitle>Parties to the Case</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {judgment.parties.map(party => {
                    const partyObligations = judgment.obligations.filter(
                      o => o.responsibleParty?.id === party.id
                    )
                    return (
                      <div key={party.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-900">{party.name}</h4>
                            <p className="text-sm text-slate-600 capitalize">{party.role}</p>
                          </div>
                          <Badge>{partyObligations.length} obligations</Badge>
                        </div>
                        {partyObligations.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium text-slate-600 mb-2">Assigned Obligations:</div>
                            <ul className="text-sm text-slate-700 space-y-1">
                              {partyObligations.map(o => (
                                <li key={o.id} className="flex items-start gap-2">
                                  <span className="text-slate-400">•</span>
                                  <span>{o.title}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
