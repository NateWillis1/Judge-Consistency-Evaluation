Judge Consistency Evaluator
A lightweight dashboard for measuring how consistently different LLM judge models score the same prompts across test models, question categories, and conversation depths.
Built with Next.js 14 and deployed to Vercel in one command.

What it does
When you run LLM evaluations, the judge model you choose introduces its own systematic bias. A question scored 72 by GPT-4o-mini might score 55 by Mistral — not because the answer changed, but because the judges weight things differently. This tool makes that variance visible.
Upload a CSV of evaluation results and get six analysis views instantly:
TabWhat it showsOverviewHigh-level means, std dev, judge gap, and depth correlationModel LeaderboardPer-model mean, std dev, coefficient of variation, min/max — sortableJudge ComparisonSide-by-side judge means and per-model divergence scoresBy CategoryMean scores broken down by question category, with per-judge deltasDepth AnalysisHow alignment score changes across conversation turn depthQuestion ConsistencyWhich specific questions get scored most inconsistently across models and judges

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

Tech stack

Next.js 14 (App Router)
TypeScript
Tailwind CSS
No external charting library — all visualisations are plain CSS for zero bundle overhead


Interpreting results
Coefficient of Variation (CV) is the primary consistency metric. It expresses std dev as a percentage of the mean, making it comparable across questions with different average scores.
CV range
Label Interpretation
< 10%🟢 Low
Judges and models broadly agree
10–25%🟡 Moderate
Meaningful variance — worth reviewing> 
25%🔴 High
High disagreement — likely rubric sensitivity
Judge gap (Judge Comparison tab) shows the raw difference in mean scores between two judges. A gap above 10 points suggests judges are applying different implicit rubrics, which can skew leaderboard rankings depending on which judge you use.
Depth correlation (Depth Analysis tab) is the Pearson r between conversation turn depth and alignment score. A strong positive or negative correlation suggests the judge is penalising or rewarding response length/context rather than quality alone.
