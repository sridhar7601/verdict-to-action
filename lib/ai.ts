export interface ExtractedObligation {
  type: 'DEADLINE_BOUND' | 'CONTINUOUS' | 'REPORTING' | 'POLICY_CHANGE' | 'COMPENSATION' | 'OTHER'
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  deadlineText?: string
  deadlineDate?: string
  responsibleParty?: string
  sourceExcerpt: string
  sourcePage?: number
  reasoning: string
  confidence: number
}

export interface ExtractedParty {
  name: string
  role: string
}

export interface ExtractionResult {
  parties: ExtractedParty[]
  obligations: ExtractedObligation[]
  caseNumber?: string
  courtName?: string
  judgmentDate?: string
}

function mockExtract(fullText: string, pageCount: number): ExtractionResult {
  const parties: ExtractedParty[] = []
  const obligations: ExtractedObligation[] = []
  
  const petitionerMatch = fullText.match(/(?:Petitioner|Appellant)[:\s]+([A-Z][^\n,]+)/i)
  const respondentMatch = fullText.match(/(?:Respondent|State of [A-Z][a-z]+)[:\s]*([A-Z][^\n,]+)/i)
  const stateMatch = fullText.match(/(State of [A-Z][a-z]+|Government of [A-Z][a-z]+)/i)
  
  if (petitionerMatch) {
    parties.push({ name: petitionerMatch[1].trim(), role: 'petitioner' })
  }
  if (respondentMatch) {
    parties.push({ name: respondentMatch[1].trim(), role: 'respondent' })
  }
  if (stateMatch && !parties.some(p => p.name.includes('State'))) {
    parties.push({ name: stateMatch[1].trim(), role: 'state' })
  }
  
  const caseNumberMatch = fullText.match(/(?:Case|Petition|WP|SLP|Civil Appeal)\s+No\.?\s*(\d+)\s*(?:of)?\s*(\d{4})/i)
  const courtNameMatch = fullText.match(/(Supreme Court of India|High Court of [A-Z][a-z]+)/i)
  const judgmentDateMatch = fullText.match(/(?:Date|Pronounced on|Judgment Date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i)
  
  const lines = fullText.split('\n')
  const deadlinePatterns = [
    /within\s+(\d+)\s+(days?|weeks?|months?)/gi,
    /by\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s+\d{4})/gi,
    /before\s+the\s+(next|coming)\s+([a-z\s]+)/gi,
  ]
  
  const obligationTriggers = [
    /(?:shall|must|is\s+directed\s+to|ought\s+to|order(?:ed)?\s+to)\s+([^.]{20,300})/gi,
    /(?:respondent|state|petitioner|department|authority)\s+(?:shall|must)\s+([^.]{20,300})/gi,
  ]
  
  const processedObligations = new Set<string>()
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    for (const pattern of deadlinePatterns) {
      const matches = [...line.matchAll(pattern)]
      for (const match of matches) {
        const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ')
        const excerpt = context.slice(0, 400)
        
        const obligationMatch = excerpt.match(/(?:shall|must|directed to)\s+([^.]{10,150})/i)
        if (obligationMatch && !processedObligations.has(excerpt)) {
          processedObligations.add(excerpt)
          
          const deadlineText = match[0]
          let deadlineDate: string | undefined
          
          if (match[1] && match[2]) {
            const amount = parseInt(match[1])
            const unit = match[2].toLowerCase()
            const baseDate = new Date()
            if (unit.includes('day')) {
              baseDate.setDate(baseDate.getDate() + amount)
            } else if (unit.includes('week')) {
              baseDate.setDate(baseDate.getDate() + amount * 7)
            } else if (unit.includes('month')) {
              baseDate.setMonth(baseDate.getMonth() + amount)
            }
            deadlineDate = baseDate.toISOString()
          }
          
          const actionText = obligationMatch[1].trim()
          const title = actionText.length > 60 ? actionText.slice(0, 57) + '...' : actionText
          
          let responsibleParty: string | undefined
          for (const party of parties) {
            if (excerpt.toLowerCase().includes(party.name.toLowerCase().split(' ')[0])) {
              responsibleParty = party.name
              break
            }
          }
          
          obligations.push({
            type: 'DEADLINE_BOUND',
            priority: deadlineText.includes('immediate') || deadlineText.includes('forthwith') ? 'CRITICAL' :
                     deadlineText.match(/\d+\s+days?/) && parseInt(deadlineText.match(/(\d+)\s+days?/)![1]) <= 30 ? 'HIGH' :
                     'MEDIUM',
            title: title,
            description: actionText,
            deadlineText: deadlineText,
            deadlineDate: deadlineDate,
            responsibleParty: responsibleParty,
            sourceExcerpt: excerpt,
            sourcePage: Math.floor((i / lines.length) * pageCount) + 1,
            reasoning: `Extracted deadline obligation with explicit time constraint: "${deadlineText}". Identified directive language indicating mandatory action.`,
            confidence: 0.85 + Math.random() * 0.1
          })
        }
      }
    }
    
    for (const pattern of obligationTriggers) {
      const matches = [...line.matchAll(pattern)]
      for (const match of matches) {
        if (obligations.length >= 12) break
        
        const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ')
        const excerpt = context.slice(0, 400)
        
        if (processedObligations.has(excerpt)) continue
        processedObligations.add(excerpt)
        
        const actionText = match[1].trim()
        const title = actionText.length > 60 ? actionText.slice(0, 57) + '...' : actionText
        
        let responsibleParty: string | undefined
        for (const party of parties) {
          if (excerpt.toLowerCase().includes(party.name.toLowerCase().split(' ')[0])) {
            responsibleParty = party.name
            break
          }
        }
        
        const hasReport = /report|file|submit|provide/i.test(actionText)
        const hasPolicy = /policy|guideline|notification|circular|sop/i.test(actionText)
        const hasCompensation = /compensation|pay|damages|amount/i.test(actionText)
        
        obligations.push({
          type: hasReport ? 'REPORTING' : hasPolicy ? 'POLICY_CHANGE' : hasCompensation ? 'COMPENSATION' : 'CONTINUOUS',
          priority: hasCompensation || hasPolicy ? 'HIGH' : 'MEDIUM',
          title: title,
          description: actionText,
          responsibleParty: responsibleParty,
          sourceExcerpt: excerpt,
          sourcePage: Math.floor((i / lines.length) * pageCount) + 1,
          reasoning: `Identified mandatory obligation from directive language. Type classified as ${hasReport ? 'reporting requirement' : hasPolicy ? 'policy change' : hasCompensation ? 'compensation' : 'continuous obligation'}.`,
          confidence: 0.72 + Math.random() * 0.13
        })
      }
    }
  }
  
  if (obligations.length === 0) {
    obligations.push({
      type: 'OTHER',
      priority: 'MEDIUM',
      title: 'Comply with the directions of the Court',
      description: 'The respondent shall ensure compliance with all directions issued in this judgment and file a compliance report.',
      deadlineText: 'within 60 days',
      deadlineDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      responsibleParty: parties.find(p => p.role === 'respondent' || p.role === 'state')?.name,
      sourceExcerpt: fullText.slice(0, 400),
      sourcePage: 1,
      reasoning: 'Generic compliance obligation extracted from judgment conclusion. This is a fallback extraction.',
      confidence: 0.65
    })
  }
  
  return {
    parties,
    obligations: obligations.slice(0, 12),
    caseNumber: caseNumberMatch ? `${caseNumberMatch[1]} of ${caseNumberMatch[2]}` : undefined,
    courtName: courtNameMatch ? courtNameMatch[1] : undefined,
    judgmentDate: judgmentDateMatch ? judgmentDateMatch[1] : undefined
  }
}

export async function extractActionPlan(fullText: string, pageCount: number): Promise<ExtractionResult> {
  if (process.env.USE_MOCK_AI !== 'false') {
    return mockExtract(fullText, pageCount)
  }
  throw new Error('Real AI extraction not implemented - set USE_MOCK_AI=true')
}
