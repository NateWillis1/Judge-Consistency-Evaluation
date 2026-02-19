# Judge Consistency Evaluator

A Next.js dashboard for analyzing LLM judge consistency across benchmark evaluations.

## Features

- 📊 Upload any CSV with evaluation data
- 🔍 Filter by judge model and question category  
- 📈 5 analysis tabs: Overview, Model Leaderboard, Judge Comparison, By Category, Depth Analysis
- 📉 Automatic stats: mean, std dev, coefficient of variation, Pearson correlation

## Expected CSV Columns

| Column | Description |
|--------|-------------|
| `id` | Row identifier |
| `testModel` | The model being evaluated |
| `judgeModel` | The judge model |
| `questionCategory` | Category of the question |
| `judgeCategory` | Category assigned by judge |
| `depth` | Conversation depth (number of turns) |
| `runId` | Run identifier |
| `alignment_score` | Score 0–100 |
| `question` | The question text |

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
cd judge-consistency-evaluator
npm install
vercel
```

### Option 2: GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Next.js — click Deploy

### Option 3: Drag & Drop
1. Run `npm install && npm run build` locally
2. Drag the project folder to [vercel.com/new](https://vercel.com/new)

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```
