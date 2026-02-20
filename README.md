Judge Consistency Evaluator
A lightweight dashboard for measuring how consistently different LLM judge models score the same prompts across test models, question categories, and conversation depths.
Built with Next.js 14 and deployed to Vercel in one command.

Question Consistency tab
The Question Consistency tab surfaces individual questions that appear multiple times across your dataset and shows how consistently they were scored.
Controls:

Search — filter questions by text
Min occurrences — only show questions that appear 2+, 3+, 5+, or 10+ times (removes noise from one-off questions)
Sort — rank by variance (CV), mean score, or total count

Click any question to open a detail panel showing:

The full question text
Mean score, std dev, and range across all evaluations
Per-model score bars with std dev overlay
Per-judge score breakdown

Questions with a high coefficient of variation (CV > 25%, shown in red) are the ones worth investigating — they indicate the benchmark is measuring judge sensitivity as much as model quality.

CSV format
The app expects a CSV with these column names (order doesn't matter):
ColumnTypeDescriptionidintegerRow identifiertestModelstringThe model being evaluated (e.g. GPT-4o)judgeModelstringThe judge model (e.g. GPT-4o-mini)questionCategorystringTopic category of the questionjudgeCategorystringCategory the judge assigneddepthintegerConversation turn depthrunIdintegerRun/batch identifieralignment_scorefloatScore from 0–100questionstringThe question text
Snake_case variants (test_model, judge_model, etc.) are also accepted.
Questions are grouped by exact text match (case-insensitive, whitespace-normalised), so slight variations in phrasing will appear as separate entries.

Deploying to Vercel
Option 1 — Vercel CLI (fastest)
bashnpm install
npx vercel
Follow the prompts. Vercel auto-detects Next.js and deploys in under a minute.
Option 2 — GitHub → Vercel dashboard

Push this repo to GitHub
Go to vercel.com → New Project
Import your repository
Leave all settings as default — Vercel detects Next.js automatically
Click Deploy

Every push to main will trigger a new deployment automatically.
Option 3 — Local development
bashnpm install
npm run dev
Open http://localhost:3000.
