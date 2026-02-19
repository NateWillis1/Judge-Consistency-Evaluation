"use client";

import { useState, useMemo, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DataRow {
  id: number;
  testModel: string;
  judgeModel: string;
  questionCategory: string;
  judgeCategory: string;
  depth: number;
  runId: number;
  alignment_score: number;
  question: string;
}

// ─── Stats helpers ────────────────────────────────────────────────────────────
const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const std = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
};
const cv = (arr: number[]) => { const m = mean(arr); return m > 0 ? (std(arr) / m) * 100 : 0; };

// ─── Color maps ───────────────────────────────────────────────────────────────
const MODEL_COLORS: Record<string, string> = {
  "Grok 4": "#f59e0b", "GPT OSS 120B": "#10b981", "GPT-5": "#6366f1",
  "GPT-4o": "#3b82f6", "DeepSeek-R1": "#ef4444", "Claude Opus 4": "#f97316",
  "Claude Sonnet 4": "#ec4899", "Claude 3 Haiku": "#8b5cf6",
  "Claude 3.5 Haiku": "#06b6d4", "Llama 4 Scout 109B": "#84cc16",
};
const CAT_COLORS: Record<string, string> = {
  "Character": "#60a5fa", "Close Relationships": "#f472b6",
  "Faith and Spirituality": "#a78bfa", "Finances": "#fbbf24",
  "Happiness": "#4ade80", "Meaning and Purpose": "#fb923c",
  "Physical and Mental Health": "#34d399",
};
const getModelColor = (m: string) => MODEL_COLORS[m] || "#94a3b8";
const getCatColor = (c: string) => CAT_COLORS[c] || "#60a5fa";

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): DataRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line, i) => {
    // Handle quoted fields
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] ?? ""; });
    return {
      id: parseInt(obj.id) || i,
      testModel: obj.testModel || obj.test_model || "",
      judgeModel: obj.judgeModel || obj.judge_model || "",
      questionCategory: obj.questionCategory || obj.question_category || "",
      judgeCategory: obj.judgeCategory || obj.judge_category || "",
      depth: parseInt(obj.depth) || 1,
      runId: parseInt(obj.runId || obj.run_id) || 0,
      alignment_score: parseFloat(obj.alignment_score) || 0,
      question: obj.question || "",
    };
  }).filter(r => r.testModel && r.alignment_score != null);
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function CVBadge({ value }: { value: number }) {
  const color = value < 10 ? "#4ade80" : value < 25 ? "#fbbf24" : "#f87171";
  const label = value < 10 ? "Low" : value < 25 ? "Moderate" : "High";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700
    }}>
      {label} ({value.toFixed(1)}%)
    </span>
  );
}

// ─── CSV Upload Zone ──────────────────────────────────────────────────────────
function UploadZone({ onData }: { onData: (rows: DataRow[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const process = (file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const rows = parseCSV(text);
        if (!rows.length) throw new Error("No valid rows found");
        onData(rows);
      } catch (err) {
        setError("Failed to parse CSV. Ensure it has headers: testModel, judgeModel, questionCategory, depth, alignment_score");
      }
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) process(file);
    else setError("Please upload a .csv file");
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "#60a5fa" : "#1e293b"}`,
        borderRadius: 12,
        padding: "48px 32px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#60a5fa08" : "#0f172a",
        transition: "all 0.2s ease",
      }}
    >
      <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f); }} />
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>
        Drop your CSV here or click to browse
      </div>
      <div style={{ fontSize: 11, color: "#475569" }}>
        Required columns: testModel, judgeModel, questionCategory, depth, alignment_score
      </div>
      {error && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#f87171", background: "#f8717122", padding: "8px 12px", borderRadius: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterJudge, setFilterJudge] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [sortBy, setSortBy] = useState("mean_desc");
  const [showUpload, setShowUpload] = useState(false);

  const s = (v: number) => typeof v === "number" ? v.toFixed(1) : "-";

  const judges = useMemo(() => ["All", ...Array.from(new Set(data.map(d => d.judgeModel)))], [data]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(data.map(d => d.questionCategory)))], [data]);

  const filtered = useMemo(() => data.filter(d =>
    (filterJudge === "All" || d.judgeModel === filterJudge) &&
    (filterCat === "All" || d.questionCategory === filterCat)
  ), [data, filterJudge, filterCat]);

  const modelStats = useMemo(() => {
    const models = Array.from(new Set(data.map(d => d.testModel)));
    return models.map(m => {
      const scores = filtered.filter(d => d.testModel === m).map(d => d.alignment_score);
      return { model: m, n: scores.length, mean: mean(scores), std: std(scores), cv: cv(scores), min: Math.min(...scores), max: Math.max(...scores) };
    }).filter(s => s.n > 0).sort((a, b) => {
      if (sortBy === "mean_desc") return b.mean - a.mean;
      if (sortBy === "mean_asc") return a.mean - b.mean;
      if (sortBy === "cv_asc") return a.cv - b.cv;
      if (sortBy === "cv_desc") return b.cv - a.cv;
      return 0;
    });
  }, [data, filtered, sortBy]);

  const uniqueJudges = useMemo(() => Array.from(new Set(data.map(d => d.judgeModel))), [data]);

  const judgeStats = useMemo(() => uniqueJudges.map(j => {
    const scores = filtered.filter(d => d.judgeModel === j).map(d => d.alignment_score);
    return { judge: j, n: scores.length, mean: mean(scores), std: std(scores) };
  }), [filtered, uniqueJudges]);

  const catStats = useMemo(() => {
    const cats = Array.from(new Set(data.map(d => d.questionCategory)));
    return cats.map(c => {
      const rows = filtered.filter(d => d.questionCategory === c);
      const scores = rows.map(d => d.alignment_score);
      const byJudge = uniqueJudges.map(j => {
        const s2 = rows.filter(d => d.judgeModel === j).map(d => d.alignment_score);
        return { judge: j, mean: mean(s2), n: s2.length };
      });
      return { cat: c, n: scores.length, mean: mean(scores), std: std(scores), byJudge };
    }).filter(s => s.n > 0);
  }, [data, filtered, uniqueJudges]);

  const depthCorr = useMemo(() => {
    const rows = filtered.filter(d => d.alignment_score != null);
    const depths = rows.map(d => d.depth);
    const scores = rows.map(d => d.alignment_score);
    const n = rows.length;
    if (n < 2) return 0;
    const md = mean(depths), ms = mean(scores);
    const num = depths.reduce((s2, d, i) => s2 + (d - md) * (scores[i] - ms), 0);
    const den = Math.sqrt(depths.reduce((s2, d) => s2 + (d - md) ** 2, 0) * scores.reduce((s2, v) => s2 + (v - ms) ** 2, 0));
    return den > 0 ? num / den : 0;
  }, [filtered]);

  const judgeVariance = useMemo(() => {
    if (uniqueJudges.length < 2) return [];
    const j1 = uniqueJudges[0], j2 = uniqueJudges[1];
    const models = Array.from(new Set(data.map(d => d.testModel)));
    return models.map(m => {
      const s1 = data.filter(d => d.testModel === m && d.judgeModel === j1).map(d => d.alignment_score);
      const s2 = data.filter(d => d.testModel === m && d.judgeModel === j2).map(d => d.alignment_score);
      if (!s1.length || !s2.length) return null;
      const diff = Math.abs(mean(s1) - mean(s2));
      return { model: m, j1mean: mean(s1), j2mean: mean(s2), diff };
    }).filter(Boolean).sort((a: any, b: any) => b.diff - a.diff) as Array<{ model: string; j1mean: number; j2mean: number; diff: number }>;
  }, [data, uniqueJudges]);

  const tabs = [
    { k: "overview", l: "Overview" },
    { k: "models", l: "Model Leaderboard" },
    { k: "judges", l: "Judge Comparison" },
    { k: "categories", l: "By Category" },
    { k: "depth", l: "Depth Analysis" },
  ];

  // ── Empty state ──
  if (!data.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#080d1a", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace", padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "#475569", letterSpacing: 3, textTransform: "uppercase" }}>Benchmark Reliability Suite</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Judge Consistency Evaluator
          </h1>
          <p style={{ color: "#475569", fontSize: 12, marginBottom: 32 }}>Upload your evaluation CSV to begin analysis</p>
          <UploadZone onData={(rows) => { setData(rows); setShowUpload(false); }} />
          <div style={{ marginTop: 20, fontSize: 11, color: "#334155", lineHeight: 1.8 }}>
            Expected CSV columns:
            <br />
            <span style={{ color: "#60a5fa" }}>id, testModel, judgeModel, questionCategory, judgeCategory, depth, runId, alignment_score, question</span>
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div style={{ minHeight: "100vh", background: "#080d1a", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', monospace", padding: "28px 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: "#475569", letterSpacing: 3, textTransform: "uppercase" }}>
                Benchmark Reliability Suite · {data.length} Evaluations
              </span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Judge Consistency Evaluator
            </h1>
            <p style={{ color: "#475569", fontSize: 11, margin: 0 }}>
              {Array.from(new Set(data.map(d => d.testModel))).length} test models ·{" "}
              {uniqueJudges.length} judge models ·{" "}
              {Array.from(new Set(data.map(d => d.questionCategory))).length} categories
            </p>
          </div>
          <button
            onClick={() => setData([])}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e293b", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
          >
            ↑ Upload new CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Judge Model</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {judges.map(j => (
                <button key={j} onClick={() => setFilterJudge(j)} style={{
                  padding: "5px 12px", borderRadius: 5, border: "1px solid",
                  borderColor: filterJudge === j ? "#60a5fa" : "#1e293b",
                  background: filterJudge === j ? "#60a5fa18" : "transparent",
                  color: filterJudge === j ? "#60a5fa" : "#64748b",
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600
                }}>
                  {j === "All" ? "All Judges" : j}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Category</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
              background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8",
              padding: "6px 10px", borderRadius: 5, fontSize: 11, fontFamily: "inherit", cursor: "pointer"
            }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#334155" }}>
            Showing <span style={{ color: "#60a5fa", fontWeight: 700 }}>{filtered.length}</span> records
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 8 }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
              padding: "6px 14px", borderRadius: 5, border: "none",
              background: activeTab === t.k ? "#1e293b" : "transparent",
              color: activeTab === t.k ? "#e2e8f0" : "#475569",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              fontWeight: activeTab === t.k ? 700 : 400
            }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="animate-fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Overall Mean Score", value: `${mean(filtered.map(d => d.alignment_score)).toFixed(1)}`, sub: "across all evaluations" },
                { label: "Score Std Dev", value: `±${std(filtered.map(d => d.alignment_score)).toFixed(1)}`, sub: "population spread" },
                { label: "Judge Score Gap", value: judgeStats.length >= 2 ? `${Math.abs(judgeStats[0].mean - judgeStats[1].mean).toFixed(1)} pts` : "N/A", sub: judgeStats.length >= 2 ? `${judgeStats[0].judge.split(" ")[0]} vs ${judgeStats[1]?.judge.split(" ")[0]}` : "< 2 judges" },
                { label: "Depth Correlation", value: `r=${depthCorr.toFixed(2)}`, sub: "depth vs alignment_score" },
              ].map(card => (
                <div key={card.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>{card.value}</div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>{card.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Score by Test Model</div>
                {modelStats.map(ms => (
                  <div key={ms.model} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: getModelColor(ms.model), fontWeight: 600 }}>{ms.model}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{ms.mean.toFixed(1)} ±{ms.std.toFixed(1)}</span>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${ms.mean}%`, height: "100%", background: getModelColor(ms.model), borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Score by Category</div>
                {catStats.map(cs => (
                  <div key={cs.cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: getCatColor(cs.cat), fontWeight: 600 }}>{cs.cat}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{cs.mean.toFixed(1)} ±{cs.std.toFixed(1)}</span>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${cs.mean}%`, height: "100%", background: getCatColor(cs.cat), borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODELS */}
        {activeTab === "models" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Sort by:</span>
              {[["mean_desc", "Mean ↓"], ["mean_asc", "Mean ↑"], ["cv_asc", "Variance ↑"], ["cv_desc", "Variance ↓"]].map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)} style={{
                  padding: "4px 10px", borderRadius: 4, border: "1px solid",
                  borderColor: sortBy === k ? "#f472b6" : "#1e293b",
                  background: sortBy === k ? "#f472b618" : "transparent",
                  color: sortBy === k ? "#f472b6" : "#64748b",
                  fontSize: 11, cursor: "pointer", fontFamily: "inherit"
                }}>{l}</button>
              ))}
            </div>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b", background: "#080d1a" }}>
                    {["Model", "N", "Mean Score", "Std Dev", "CV (Variance)", "Min", "Max", "Range"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelStats.map((ms, i) => (
                    <tr key={ms.model} style={{ borderBottom: "1px solid #0f1829", background: i % 2 === 0 ? "transparent" : "#080d1a" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: getModelColor(ms.model), marginRight: 8 }} />
                        <span style={{ color: getModelColor(ms.model), fontWeight: 600 }}>{ms.model}</span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{ms.n}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, background: "#1e293b", borderRadius: 3, height: 5, overflow: "hidden" }}>
                            <div style={{ width: `${ms.mean}%`, height: "100%", background: getModelColor(ms.model) }} />
                          </div>
                          <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{s(ms.mean)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8" }}>±{s(ms.std)}</td>
                      <td style={{ padding: "10px 14px" }}><CVBadge value={ms.cv} /></td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{s(ms.min)}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{s(ms.max)}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{(ms.max - ms.min).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JUDGES */}
        {activeTab === "judges" && (
          <div className="animate-fade-in">
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(judgeStats.length, 4)}, 1fr)`, gap: 12, marginBottom: 20 }}>
              {judgeStats.map(js => (
                <div key={js.judge} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{js.judge}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>{js.mean.toFixed(1)}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>mean · std ±{js.std.toFixed(1)} · n={js.n}</div>
                </div>
              ))}
            </div>
            {judgeVariance.length > 0 && (
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
                  Between-Judge Score Gap by Test Model
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e293b" }}>
                      <th style={{ textAlign: "left", padding: "6px 12px", color: "#475569", fontWeight: 600 }}>Model</th>
                      <th style={{ textAlign: "center", padding: "6px 12px", color: "#60a5fa", fontWeight: 600 }}>{uniqueJudges[0]} mean</th>
                      <th style={{ textAlign: "center", padding: "6px 12px", color: "#34d399", fontWeight: 600 }}>{uniqueJudges[1]} mean</th>
                      <th style={{ textAlign: "center", padding: "6px 12px", color: "#f87171", fontWeight: 600 }}>|Diff|</th>
                      <th style={{ textAlign: "center", padding: "6px 12px", color: "#475569", fontWeight: 600 }}>Consistency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judgeVariance.map((jv, i) => (
                      <tr key={jv.model} style={{ borderBottom: "1px solid #0a0f1e", background: i % 2 === 0 ? "transparent" : "#080d1a" }}>
                        <td style={{ padding: "9px 12px", color: getModelColor(jv.model), fontWeight: 600 }}>{jv.model}</td>
                        <td style={{ textAlign: "center", padding: "9px 12px", color: "#94a3b8" }}>{jv.j1mean.toFixed(1)}</td>
                        <td style={{ textAlign: "center", padding: "9px 12px", color: "#94a3b8" }}>{jv.j2mean.toFixed(1)}</td>
                        <td style={{ textAlign: "center", padding: "9px 12px" }}>
                          <span style={{ color: jv.diff < 5 ? "#4ade80" : jv.diff < 10 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>{jv.diff.toFixed(1)}</span>
                        </td>
                        <td style={{ textAlign: "center", padding: "9px 12px" }}>
                          <span style={{
                            fontSize: 11,
                            color: jv.diff < 5 ? "#4ade80" : jv.diff < 10 ? "#fbbf24" : "#f87171",
                            background: (jv.diff < 5 ? "#4ade80" : jv.diff < 10 ? "#fbbf24" : "#f87171") + "22",
                            padding: "2px 8px", borderRadius: 20, fontWeight: 700
                          }}>
                            {jv.diff < 5 ? "Aligned" : jv.diff < 10 ? "Moderate" : "Divergent"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {judgeStats.length >= 2 && (
              <div style={{ background: "#0f172a", border: "1px solid #fbbf2433", borderLeft: "3px solid #fbbf24", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700, marginBottom: 6 }}>⚠ Judge Bias Summary</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                  {judgeStats[0].judge}: <b style={{ color: "#94a3b8" }}>{judgeStats[0].mean.toFixed(1)}</b>{" "}
                  vs {judgeStats[1].judge}: <b style={{ color: "#94a3b8" }}>{judgeStats[1].mean.toFixed(1)}</b>{" "}
                  — a gap of <b style={{ color: "#fbbf24" }}>{Math.abs(judgeStats[0].mean - judgeStats[1].mean).toFixed(1)} points</b>.
                </div>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES */}
        {activeTab === "categories" && (
          <div className="animate-fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {catStats.map(cs => (
                <div key={cs.cat} style={{
                  background: "#0f172a",
                  border: `1px solid ${getCatColor(cs.cat)}33`,
                  borderLeft: `3px solid ${getCatColor(cs.cat)}`,
                  borderRadius: 10, padding: 18
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: getCatColor(cs.cat) }}>{cs.cat}</span>
                    <span style={{ fontSize: 11, color: "#475569" }}>n={cs.n}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>{cs.mean.toFixed(1)}</div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${cs.mean}%`, height: "100%", background: getCatColor(cs.cat) }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {cs.byJudge.map(bj => (
                      <div key={bj.judge}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{bj.judge.split(" ")[0]}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>{bj.mean.toFixed(1)}</div>
                      </div>
                    ))}
                    {cs.byJudge.length >= 2 && (
                      <div style={{ marginLeft: "auto" }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>Judge Δ</div>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: Math.abs(cs.byJudge[0].mean - cs.byJudge[1].mean) < 5 ? "#4ade80" : "#fbbf24"
                        }}>
                          {Math.abs(cs.byJudge[0].mean - cs.byJudge[1].mean).toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEPTH */}
        {activeTab === "depth" && (
          <div className="animate-fade-in">
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
                Alignment Score by Conversation Depth — correlation r={depthCorr.toFixed(3)}
              </div>
              {Array.from(new Set(data.map(d => d.depth))).sort((a, b) => a - b).map(d => {
                const scores = filtered.filter(r => r.depth === d).map(r => r.alignment_score);
                if (!scores.length) return null;
                const m = mean(scores);
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#64748b", width: 60 }}>Depth {d}</span>
                    <div style={{ flex: 1, background: "#1e293b", borderRadius: 4, height: 20, overflow: "hidden", position: "relative" }}>
                      <div style={{ width: `${m}%`, height: "100%", background: `hsl(${200 + d * 15},70%,55%)`, borderRadius: 4 }} />
                      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#e2e8f0", fontWeight: 700 }}>{m.toFixed(1)}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#475569", width: 40 }}>n={scores.length}</span>
                    <span style={{ fontSize: 11, color: "#334155", width: 60 }}>±{std(scores).toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#0f172a", border: "1px solid #4ade8033", borderLeft: "3px solid #4ade80", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>Key Finding: Depth Analysis</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                Pearson correlation r={depthCorr.toFixed(3)} — deeper conversations ({depthCorr > 0 ? "higher" : "lower"} depth) tend to score {depthCorr > 0 ? "higher" : "lower"}.
                This suggests the judge prompt is {Math.abs(depthCorr) > 0.2 ? "significantly" : "modestly"} sensitive to conversation length.
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
