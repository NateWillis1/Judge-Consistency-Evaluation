# Judge Consistency Evaluator

A lightweight dashboard for measuring how consistently different LLM judge models score the same prompts across test models, question categories, and conversation depths.

Built with Next.js 14 and deployed to Vercel in one command.

---

## What it does

When you run LLM evaluations, the judge model you choose introduces its own systematic bias. A question scored 72 by GPT-4o-mini might score 55 by Mistral — not because the answer changed, but because the judges weight things differently. This tool makes that variance visible.

Upload a CSV of evaluation results and get six analysis views instantly:

| Tab | What it shows |
|-----|---------------|
| **Overview** | High-level means, std dev, judge gap, and depth correlation |
| **Model Leaderboard** | Per-model mean, std dev, coefficient of variation, min/max — sortable |
| **Judge Comparison** | Side-by-side judge means and per-model divergence scores |
| **By Category** | Mean scores broken down by question category, with per-judge deltas |
| **Depth Analysis** | How alignment score changes across conversation turn depth |
| **Question Consistency** | Which specific questions get scored most inconsistently across models and judges |

---

## Question Consistency tab

The Question Consistency tab surfaces individual questions that appear multiple times across your dataset and shows how consistently they were scored.

**Controls:**
- **Search** — filter questions by text
- **Min occurrences** — only show questions that appear 2+, 3+, 5+, or 10+ times (removes noise from one-off questions)
- **Sort** — rank by variance (CV), mean score, or total count

**Click any question** to open a detail panel showing:
- The full question text
- Mean score, std dev, and range across all evaluations
- Per-model score bars with std dev overlay
- Per-judge score breakdown

Questions with a high coefficient of variation (CV > 25%, shown in red) are the ones worth investigating — they indicate the benchmark is measuring judge sensitivity as much as model quality.

---

## CSV format

The app expects a CSV with these column names (order doesn't matter):

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Row identifier |
| `testModel` | string | The model being evaluated (e.g. `GPT-4o`) |
| `judgeModel` | string | The judge model (e.g. `GPT-4o-mini`) |
| `questionCategory` | string | Topic category of the question |
| `judgeCategory` | string | Category the judge assigned |
| `depth` | integer | Conversation turn depth |
| `runId` | integer | Run/batch identifier |
| `alignment_score` | float | Score from 0–100 |
| `question` | string | The question text |

Snake_case variants (`test_model`, `judge_model`, etc.) are also accepted.

**Questions are grouped by exact text match** (case-insensitive, whitespace-normalised), so slight variations in phrasing will appear as separate entries.

---

## Deploying to Vercel

### Option 1 — Vercel CLI (fastest)

```bash
npm install
npx vercel
```

Follow the prompts. Vercel auto-detects Next.js and deploys in under a minute.

### Option 2 — GitHub → Vercel dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. Leave all settings as default — Vercel detects Next.js automatically
5. Click **Deploy**

Every push to `main` will trigger a new deployment automatically.

### Option 3 — Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- No external charting library — all visualisations are plain CSS for zero bundle overhead

---

## Interpreting results

**Coefficient of Variation (CV)** is the primary consistency metric. It expresses std dev as a percentage of the mean, making it comparable across questions with different average scores.

| CV range | Label | Interpretation |
|----------|-------|----------------|
| < 10% | 🟢 Low | Judges and models broadly agree |
| 10–25% | 🟡 Moderate | Meaningful variance — worth reviewing |
| > 25% | 🔴 High | High disagreement — likely rubric sensitivity |

**Judge gap** (Judge Comparison tab) shows the raw difference in mean scores between two judges. A gap above 10 points suggests judges are applying different implicit rubrics, which can skew leaderboard rankings depending on which judge you use.

**Depth correlation** (Depth Analysis tab) is the Pearson r between conversation turn depth and alignment score. A strong positive or negative correlation suggests the judge is penalising or rewarding response length/context rather than quality alone.

---

## License

MIT
