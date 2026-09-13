# ScamShield AI

**Stop. Check. Stay Safe.**

ScamShield AI is a production-style prototype that analyzes suspicious messages, URLs, screenshots, and QR codes to provide explainable scam-risk assessments.

## Features

- Message analyzer for urgency, threats, impersonation, payment, and credential-request signals.
- URL risk analyzer using safe static checks (no auto-visiting suspicious pages).
- Screenshot analyzer with optional AI vision extraction and QR detection.
- QR analyzer that decodes payloads and evaluates URL destinations.
- Guardian orchestration layer that combines analyzer evidence and applies deterministic risk scoring.
- Unified results page with risk level, score, findings, safe actions, and avoid list.
- Safety Assistant for defensive next-step guidance.
- Secure cookie-session authentication and per-user analysis history.
- Search/filter/delete history with strict ownership checks.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3`
- Zod request/AI output validation

## Environment

Create `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_VISION_MODEL=gpt-4.1-mini
```

If API keys are not configured, non-vision analysis still works with rule-based detection, and vision-dependent flows return a clear configuration error.

## Development

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Security Notes

- Never submit passwords, OTPs, PINs, CVVs, or banking credentials.
- API keys are server-side only.
- Input validation, upload validation, and rate limiting are enforced on backend routes.
- Authorization checks ensure users can only view/delete their own saved history.
- Risk results are indicators, not certainty.
