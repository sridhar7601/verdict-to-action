import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { extractActionPlan } from '../lib/ai'
import { parseDeadlineText } from '../lib/deadlines'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  console.log('🗑️  Clearing existing data...')
  await prisma.obligationUpdate.deleteMany()
  await prisma.obligation.deleteMany()
  await prisma.party.deleteMany()
  await prisma.judgment.deleteMany()
  
  const txtDir = path.join(__dirname, '../data/sample-judgments')
  const txtFiles = fs.readdirSync(txtDir).filter(f => f.endsWith('.txt'))
  
  console.log(`📄 Processing ${txtFiles.length} judgment text files...`)
  
  for (const txtFile of txtFiles) {
    const txtPath = path.join(txtDir, txtFile)
    const text = fs.readFileSync(txtPath, 'utf-8')
    
    console.log(`\n📋 Processing ${txtFile}...`)
    
    const numpages = Math.ceil(text.length / 2000)
    
    const extractionResult = await extractActionPlan(text, numpages)
    
    const judgment = await prisma.judgment.create({
      data: {
        title: txtFile.replace('.txt', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        fileName: txtFile.replace('.txt', '.pdf'),
        fullText: text,
        pageCount: numpages,
        status: 'PARSED',
        caseNumber: extractionResult.caseNumber,
        courtName: extractionResult.courtName,
        judgmentDate: extractionResult.judgmentDate ? new Date(extractionResult.judgmentDate) : null,
      },
    })
    
    console.log(`  ✓ Created judgment: ${judgment.title}`)
    console.log(`    Court: ${judgment.courtName || 'N/A'}`)
    console.log(`    Case: ${judgment.caseNumber || 'N/A'}`)
    
    for (const party of extractionResult.parties) {
      await prisma.party.create({
        data: {
          judgmentId: judgment.id,
          name: party.name,
          role: party.role,
        },
      })
    }
    console.log(`  ✓ Created ${extractionResult.parties.length} parties`)
    
    const parties = await prisma.party.findMany({
      where: { judgmentId: judgment.id },
    })
    
    for (const obl of extractionResult.obligations) {
      const responsibleParty = parties.find(p => p.name === obl.responsibleParty)
      
      const deadline = obl.deadlineDate 
        ? new Date(obl.deadlineDate)
        : obl.deadlineText 
          ? parseDeadlineText(obl.deadlineText, judgment.judgmentDate || new Date())
          : null
      
      let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' = 'PENDING'
      if (deadline && deadline < new Date()) {
        status = 'OVERDUE'
      } else if (Math.random() > 0.7) {
        status = 'IN_PROGRESS'
      }
      
      const obligation = await prisma.obligation.create({
        data: {
          judgmentId: judgment.id,
          type: obl.type,
          status: status,
          priority: obl.priority,
          title: obl.title,
          description: obl.description,
          deadline: deadline,
          deadlineText: obl.deadlineText,
          responsiblePartyId: responsibleParty?.id,
          sourceExcerpt: obl.sourceExcerpt,
          sourcePage: obl.sourcePage,
          reasoning: obl.reasoning,
          confidence: obl.confidence,
          verified: Math.random() > 0.5,
        },
      })
      
      if (status === 'IN_PROGRESS' || status === 'OVERDUE') {
        await prisma.obligationUpdate.create({
          data: {
            obligationId: obligation.id,
            status: 'IN_PROGRESS',
            note: 'Initial progress update - assigned to concerned department and timeline established.',
            updatedBy: 'System Administrator',
            updatedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
          },
        })
      }
    }
    console.log(`  ✓ Created ${extractionResult.obligations.length} obligations`)
  }
  
  const summary = await prisma.judgment.count()
  const obligationCount = await prisma.obligation.count()
  const partyCount = await prisma.party.count()
  const overdueCount = await prisma.obligation.count({
    where: { status: 'OVERDUE' }
  })
  
  console.log('\n✅ Seed complete!')
  console.log(`📊 Summary:`)
  console.log(`   - Judgments: ${summary}`)
  console.log(`   - Parties: ${partyCount}`)
  console.log(`   - Obligations: ${obligationCount}`)
  console.log(`   - Overdue: ${overdueCount}`)
  console.log('\n🚀 Start the app: npm run dev')
  console.log('🌐 Then open: http://localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
