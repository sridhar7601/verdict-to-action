# Verdict→Action

**From court judgments to verified action plans** — AI extracts obligations, deadlines, and owners with full traceability.

> **PanIIT AI for Bharat Hackathon** — Theme 11: Court Judgment Action Tracker

## Problem Statement

When courts issue judgments with directives for government departments, tracking and implementing these obligations is challenging. Key issues:

- **Manual extraction:** Officers must read lengthy judgments to identify actionable directives
- **Missed deadlines:** No centralized system to track compliance timelines
- **Lost context:** Lack of traceability between obligations and source text
- **No audit trail:** Difficulty proving compliance or explaining delays

## Solution

Verdict→Action automates the extraction of obligations from court judgments and provides a dashboard for government departments to track, verify, and execute them.

### Key Features

1. **AI-powered extraction** — Upload a judgment PDF, get structured obligations with:
   - Type (deadline-bound, continuous, reporting, policy change, etc.)
   - Priority (critical, high, medium, low)
   - Deadline (parsed from phrases like "within 90 days")
   - Responsible party (matched to petitioner/respondent/state)
   - **Verbatim source excerpt** — every obligation traces back to its paragraph

2. **Verification workflow** — Human officers verify AI extractions before execution

3. **Obligation tracker** — Cross-judgment view of all obligations, grouped by status or priority

4. **Deadline calendar** — Upcoming deadlines and overdue alerts

5. **Update history** — Timestamped notes and status changes for audit trail

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Generate sample PDFs and seed database
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Data

The seed script creates 3 sample judgments:

1. **Environmental Pollution** — High Court directives for pollution control with inspection deadlines
2. **Labor Rights** — Supreme Court minimum wage enforcement with periodic reporting
3. **Procurement Transparency** — High Court procurement reform with 90/120-day deadlines

These judgments demonstrate various obligation types and deadline parsing scenarios.

## Architecture

```
PDF → Text Extraction → AI Parsing → Deadline Parsing → Database
                                                            ↓
                                        Dashboard ← Verification ← Tracking
```

See [architecture diagram](docs/diagrams/architecture.png) for detailed flow.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** Prisma + SQLite
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **PDF parsing:** pdf-parse
- **AI:** Mock extractor with pattern-based rules (USE_MOCK_AI=true)
- **Date parsing:** date-fns

## Project Structure

```
theme11-court-action/
├── app/
│   ├── page.tsx                    # Dashboard with metrics
│   ├── judgments/
│   │   ├── page.tsx                # List all judgments
│   │   ├── new/page.tsx            # Upload form
│   │   └── [id]/page.tsx           # Judgment detail (4 tabs)
│   ├── obligations/
│   │   ├── page.tsx                # Cross-judgment obligation tracker
│   │   └── [id]/page.tsx           # Obligation detail + updates
│   └── api/
│       ├── judgments/              # Upload, list, detail
│       ├── obligations/            # Filter, verify, status update
│       └── dashboard/              # Stats, deadlines
├── lib/
│   ├── ai.ts                       # Mock AI extraction (regex-based)
│   ├── pdf.ts                      # PDF text extraction
│   ├── deadlines.ts                # Deadline parsing utilities
│   ├── db.ts                       # Prisma client singleton
│   └── utils.ts                    # cn() for Tailwind
├── prisma/
│   └── schema.prisma               # Judgment, Party, Obligation, ObligationUpdate
├── data/
│   └── sample-judgments/           # 3 synthetic judgment texts + PDFs
└── scripts/
    └── seed-demo.ts                # Populate database
```

## API Endpoints

- `POST /api/judgments/upload` — Upload PDF, extract obligations
- `GET /api/judgments` — List all judgments with obligation counts
- `GET /api/judgments/[id]` — Full judgment with obligations and parties
- `GET /api/obligations` — Filter by status, priority, or judgment
- `GET /api/obligations/[id]` — Full obligation with update history
- `PUT /api/obligations/[id]/verify` — Mark verified/unverified
- `PUT /api/obligations/[id]/status` — Change status, add note
- `GET /api/dashboard/stats` — Metrics for dashboard cards
- `GET /api/dashboard/deadlines` — Upcoming deadlines (next 30 days)

## Mock AI Implementation

The system uses pattern-based extraction (no LLM API calls):

- **Party extraction:** Regex for "Petitioner:", "Respondent:", "State of..."
- **Obligation triggers:** "shall", "must", "is directed to", "ought to"
- **Deadline patterns:** "within X days", "by [date]", "before [event]"
- **Priority assignment:** Based on urgency keywords and timeframe
- **Confidence scoring:** 0.72–0.95 based on pattern match strength

To swap in a real LLM, modify `lib/ai.ts` and set `USE_MOCK_AI=false`.

## Explainability & Traceability

Every extracted obligation includes:

- **Source excerpt** — verbatim paragraph (≤400 chars) from judgment
- **Source page** — page number in original PDF
- **AI reasoning** — why this was classified as an obligation
- **Confidence score** — 0.0–1.0
- **Verification flag** — human officer sign-off

This ensures audit compliance and allows legal review if needed.

## Environment Variables

Create a `.env` file (see `.env.example`):

```env
DATABASE_URL="file:./dev.db"
USE_MOCK_AI="true"
```

## Deployment

```bash
# Production build
npm run build

# Start production server
npm start
```

For production, replace SQLite with PostgreSQL:

```env
DATABASE_URL="postgresql://user:pass@host/dbname"
```

## Known Limitations (MVP Scope)

- **No OCR:** Scanned/image-based PDFs won't work (solution doc mentions Docling/PaddleOCR path)
- **Mock AI only:** Real LLM integration pending
- **Single-user:** No auth or role-based access control
- **No email alerts:** Deadline notifications not implemented

## Future Enhancements

1. **OCR pipeline** for scanned judgments (Docling + PaddleOCR)
2. **LLM integration** (Gemini/Claude) for improved extraction
3. **Multi-user auth** (judge, executor, auditor roles)
4. **Email/SMS notifications** for approaching deadlines
5. **Integration with eCourts APIs** for automatic judgment ingestion
6. **NLP-based summarization** of lengthy judgments

## License

MIT

## Acknowledgments

Built for **PanIIT AI for Bharat Hackathon 2026** — Theme 11: Court Judgment Action Tracker

Synthetic judgment data created for demo purposes only. No real case data used.
