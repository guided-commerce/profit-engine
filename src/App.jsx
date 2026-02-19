import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Bar, Legend, ReferenceLine
} from "recharts";

/* ─── palette ─── */
const C = {
  bg: "#050508",
  card: "rgba(255,255,255,0.03)",
  glass: "rgba(255,255,255,0.045)",
  glassHover: "rgba(255,255,255,0.07)",
  glassActive: "rgba(255,255,255,0.09)",
  border: "rgba(255,255,255,0.06)",
  borderLt: "rgba(255,255,255,0.1)",
  borderGlow: "rgba(255,255,255,0.15)",
  text: "#f0f0f5",
  sub: "#8e8ea0",
  dim: "#505068",
  mint: "#6ee7b7",
  mintD: "rgba(110,231,183,0.1)",
  mintG: "rgba(110,231,183,0.2)",
  red: "#f87171",
  redD: "rgba(248,113,113,0.1)",
  amber: "#fbbf24",
  amberD: "rgba(251,191,36,0.1)",
  blue: "#60a5fa",
  blueD: "rgba(96,165,250,0.1)",
  purple: "#a78bfa",
  purpleD: "rgba(167,139,250,0.1)",
  cyan: "#22d3ee",
  cyanD: "rgba(34,211,238,0.1)",
};
const SCOL = ["#6ee7b7", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#22d3ee"];

/* ─── helpers ─── */
const fmt = n => { if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`; if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`; return `$${n.toFixed(0)}`; };
const fmtF = n => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtP = n => `${n.toFixed(1)}%`;

/* ─── decay ─── */
const decayFns = {
  linear: (b, r, s) => b * (1 + r * s),
  exponential: (b, r, s) => b * Math.pow(1 + r, s),
  logarithmic: (b, r, s) => b * (1 + r * Math.log(s + 1)),
};

const DECAY_INFO = {
  linear: { label: "Linear", desc: "CPA rises at a constant rate per step. Predictable, steady increase.", icon: "⟋" },
  exponential: { label: "Exponential", desc: "CPA accelerates faster at higher budgets. Most realistic for Facebook.", icon: "⤴" },
  logarithmic: { label: "Logarithmic", desc: "CPA rises quickly at first, then levels off. Optimistic scaling model.", icon: "⌒" },
};

/* ─── scenario ─── */
const mkScenario = (id, name) => ({
  id, name, aov: 49.95, expenses: 12,
  useDecay: true, startBudget: 5000, increment: 5000, numSteps: 12,
  startCpa: 15, decayRate: 0.12, decayType: "exponential",
  manualTiers: [
    { budget: 10000, cpa: 18 }, { budget: 15000, cpa: 22 },
    { budget: 20000, cpa: 28 }, { budget: 25000, cpa: 36 }, { budget: 30000, cpa: 48 },
  ],
  ltvEnabled: false, churnRate: 8, avgLifetimeMonths: 8, reorderRate: 65,
});

/* ─── calc ─── */
const calcTier = (budget, cpa, aov, expenses) => {
  const orders = budget / cpa;
  const revenue = orders * aov;
  const totalCost = budget + orders * expenses;
  const net = revenue - totalCost;
  const margin = revenue > 0 ? (net / revenue) * 100 : 0;
  const roas = budget > 0 ? revenue / budget : 0;
  return { budget, cpa, orders, revenue, totalCost, net, margin, roas };
};

const calcLtv = (tier, aov, expenses, churn, lifeMo, reorderPct) => {
  const ltv = aov * (reorderPct / 100) * lifeMo;
  const lifetimeExpenses = expenses * (reorderPct / 100) * lifeMo;
  const lifetimeProfit = ltv - lifetimeExpenses - tier.cpa;
  const monthlyNet = aov * (reorderPct / 100) - expenses * (reorderPct / 100);
  const paybackMonths = monthlyNet > 0 ? tier.cpa / monthlyNet : Infinity;
  return { ltv, lifetimeExpenses, lifetimeProfit, paybackMonths, monthlyNet };
};

/* ─── Mini CPA Decay Chart SVG ─── */
const MiniDecayChart = ({ type, active, rate = 0.12 }) => {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const val = decayFns[type](1, rate, i);
    return val;
  });
  const maxV = Math.max(...pts);
  const h = 32, w = 56;
  const path = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (v / maxV) * h * 0.85;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  const col = active ? C.cyan : C.dim;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={path} fill="none" stroke={col} strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "all 0.4s ease" }} />
      <line x1="0" y1={h} x2={w} y2={h} stroke={col} strokeWidth={0.5} opacity={0.3} />
    </svg>
  );
};

/* ─── Tooltip Info Icon ─── */
const InfoTip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 6 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 16, height: 16, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, cursor: "help",
          fontSize: 10, fontWeight: 700, color: C.sub, transition: "all 0.2s ease",
          ...(show ? { background: C.mintD, borderColor: C.mint + "40", color: C.mint } : {})
        }}
      >?</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          width: 260, padding: "12px 14px", background: "rgba(10,10,18,0.97)", backdropFilter: "blur(20px)",
          border: `1px solid ${C.borderLt}`, borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          fontSize: 12, lineHeight: 1.5, color: C.sub, zIndex: 100,
          animation: "tipIn 0.2s ease"
        }}>{text}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "rgba(10,10,18,0.97)", border: `1px solid ${C.borderLt}`, borderTop: "none", borderLeft: "none" }} />
        </div>
      )}
    </span>
  );
};

/* ─── Glass ─── */
const Glass = ({ children, style = {}, glow, hover }) => (
  <div style={{
    background: glow ? "rgba(110,231,183,0.02)" : C.glass,
    backdropFilter: "blur(40px) saturate(1.4)",
    WebkitBackdropFilter: "blur(40px) saturate(1.4)",
    border: `1px solid ${glow ? "rgba(110,231,183,0.12)" : C.border}`,
    borderRadius: 20,
    boxShadow: glow
      ? `0 0 80px rgba(110,231,183,0.06), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.2) inset`
      : `0 8px 40px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.15) inset`,
    transition: "all 0.5s cubic-bezier(0.2, 0, 0, 1)",
    position: "relative",
    overflow: "hidden",
    ...style,
  }}>
    {/* Top edge highlight — liquid glass refraction */}
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 1,
      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)",
      pointerEvents: "none",
    }} />
    <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
  </div>
);

const Toggle = ({ value, onChange, label, color = C.mint }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }} onClick={() => onChange(!value)}>
    <div style={{
      width: 44, height: 24, borderRadius: 12, padding: 2,
      background: value ? `linear-gradient(135deg, ${color}50, ${color}30)` : "rgba(255,255,255,0.04)",
      border: `1px solid ${value ? color + "50" : C.border}`,
      transition: "all 0.4s cubic-bezier(0.2, 0, 0, 1)",
      boxShadow: value ? `0 0 16px ${color}20, inset 0 1px 0 rgba(255,255,255,0.1)` : "inset 0 1px 2px rgba(0,0,0,0.2)",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: value ? "#fff" : C.dim,
        transform: value ? "translateX(20px)" : "translateX(0)",
        transition: "all 0.4s cubic-bezier(0.2, 0, 0, 1)",
        boxShadow: value ? `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${color}30` : "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color: value ? color : C.sub, transition: "color 0.3s ease" }}>{label}</span>
  </div>
);

const NumInput = ({ label, value, onChange, prefix = "$", step = 1, min = 0, color, info }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center" }}>
        {label}
        {info && <InfoTip text={info} />}
      </label>
    )}
    <div style={{ position: "relative" }}>
      {prefix && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.dim, fontSize: 13, fontWeight: 600 }}>{prefix}</span>}
      <input type="number" value={value} min={min} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: "100%", padding: `12px 14px 12px ${prefix ? 28 : 14}px`,
          background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: 12,
          color: color || C.text, fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          outline: "none", transition: "all 0.3s cubic-bezier(0.2,0,0,1)", boxSizing: "border-box",
        }}
        onFocus={e => { e.target.style.borderColor = C.mint; e.target.style.boxShadow = `0 0 0 3px ${C.mintD}, 0 0 20px ${C.mintD}`; e.target.style.background = "rgba(110,231,183,0.02)"; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; e.target.style.background = "rgba(255,255,255,0.02)"; }}
      />
    </div>
  </div>
);

const Metric = ({ label, value, sub, color = C.mint, small }) => (
  <div style={{
    padding: small ? "14px 16px" : "18px 20px",
    background: `linear-gradient(145deg, ${color}06, transparent)`,
    border: `1px solid ${color}15`, borderRadius: 16,
    backdropFilter: "blur(8px)",
    transition: "all 0.3s ease",
  }}>
    <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: small ? 18 : 24, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{sub}</div>}
  </div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,8,14,0.96)", backdropFilter: "blur(24px)",
      border: `1px solid ${C.borderLt}`, borderRadius: 14, padding: "14px 18px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.stroke, boxShadow: `0 0 6px ${p.color || p.stroke}40` }} />
          <span style={{ fontSize: 11, color: C.sub }}>{p.name}:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: p.color || p.stroke, fontFamily: "'JetBrains Mono', monospace" }}>
            {typeof p.value === "number" ? (p.name.includes("Margin") ? fmtP(p.value) : fmtF(Math.round(p.value))) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════ MAIN ═══════════════════ */
export default function App() {
  const [scenarios, setScenarios] = useState([mkScenario(1, "Base Case")]);
  const [activeId, setActiveId] = useState(1);
  const [showCompare, setShowCompare] = useState(false);
  const [sensiAxis, setSensiAxis] = useState("cpa");
  const [sensiRange, setSensiRange] = useState(30);
  const [activeTab, setActiveTab] = useState("profit");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const sc = scenarios.find(s => s.id === activeId) || scenarios[0];
  const upSc = useCallback((f, v) => setScenarios(p => p.map(s => s.id === activeId ? { ...s, [f]: v } : s)), [activeId]);
  const upManTier = useCallback((i, f, v) => setScenarios(p => p.map(s => {
    if (s.id !== activeId) return s;
    const t = [...s.manualTiers]; t[i] = { ...t[i], [f]: v }; return { ...s, manualTiers: t };
  })), [activeId]);

  const tiers = useMemo(() => {
    if (!sc.useDecay) return sc.manualTiers;
    return Array.from({ length: sc.numSteps }, (_, i) => ({
      budget: sc.startBudget + sc.increment * i,
      cpa: Math.round(decayFns[sc.decayType](sc.startCpa, sc.decayRate, i) * 100) / 100
    }));
  }, [sc.useDecay, sc.startBudget, sc.increment, sc.numSteps, sc.startCpa, sc.decayRate, sc.decayType, sc.manualTiers]);

  const data = useMemo(() => tiers.map(t => calcTier(t.budget, t.cpa, sc.aov, sc.expenses)), [tiers, sc.aov, sc.expenses]);
  const peak = useMemo(() => data.reduce((b, d) => d.net > b.net ? d : b, data[0]), [data]);
  const breakeven = useMemo(() => data.find(d => d.net < 0), [data]);
  const breakevenCpa = useMemo(() => sc.aov - sc.expenses, [sc.aov, sc.expenses]);

  const ltvData = useMemo(() => {
    if (!sc.ltvEnabled) return [];
    return data.map(d => {
      const l = calcLtv(d, sc.aov, sc.expenses, sc.churnRate, sc.avgLifetimeMonths, sc.reorderRate);
      return { ...d, ...l, label: fmt(d.budget), firstOrderProfit: Math.round(d.net), lifetimeTotalProfit: Math.round(l.lifetimeProfit * d.orders) };
    });
  }, [data, sc]);

  const cashFlowData = useMemo(() => {
    if (!sc.ltvEnabled) return [];
    let cum = -peak.cpa;
    const months = [];
    for (let m = 0; m <= Math.min(Math.ceil(sc.avgLifetimeMonths * 1.5), 24); m++) {
      if (m === 0) { const fn = sc.aov - sc.expenses; cum = -peak.cpa + fn; months.push({ month: `M${m}`, cumProfit: Math.round(cum), monthly: Math.round(fn - peak.cpa) }); }
      else { const ret = Math.pow(1 - sc.churnRate / 100, m); const mn = sc.aov * (sc.reorderRate / 100) * ret - sc.expenses * (sc.reorderRate / 100) * ret; cum += mn; months.push({ month: `M${m}`, cumProfit: Math.round(cum), monthly: Math.round(mn) }); }
    }
    return months;
  }, [data, sc, peak]);

  const sensiData = useMemo(() => {
    const steps = 13;
    return Array.from({ length: steps }, (_, i) => {
      const pct = -sensiRange + (2 * sensiRange / (steps - 1)) * i;
      const mult = 1 + pct / 100;
      const tc = sensiAxis === "cpa" ? calcTier(peak.budget, peak.cpa * mult, sc.aov, sc.expenses) : calcTier(peak.budget, peak.cpa, sc.aov * mult, sc.expenses);
      return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, pct, netProfit: Math.round(tc.net), margin: tc.margin, isBase: Math.abs(pct) < 0.1 };
    });
  }, [sc, sensiAxis, sensiRange, peak]);

  const compData = useMemo(() => {
    if (!showCompare || scenarios.length < 2) return [];
    const maxS = Math.max(...scenarios.map(s => s.useDecay ? s.numSteps : s.manualTiers.length));
    return Array.from({ length: maxS }, (_, i) => {
      const row = {};
      scenarios.forEach(s => {
        const t = s.useDecay ? { budget: s.startBudget + s.increment * i, cpa: decayFns[s.decayType](s.startCpa, s.decayRate, i) } : (s.manualTiers[i] || null);
        if (t) { const d = calcTier(t.budget, t.cpa, s.aov, s.expenses); row.label = row.label || fmt(t.budget); row[s.name] = Math.round(d.net); }
      });
      return row;
    }).filter(r => r.label);
  }, [scenarios, showCompare]);

  const addScenario = () => { const id = Math.max(...scenarios.map(s => s.id)) + 1; setScenarios([...scenarios, mkScenario(id, `Scenario ${id}`)]); setActiveId(id); };
  const dupScenario = (src) => { const id = Math.max(...scenarios.map(s => s.id)) + 1; const dup = { ...JSON.parse(JSON.stringify(src)), id, name: `${src.name} (copy)` }; setScenarios([...scenarios, dup]); setActiveId(id); };
  const rmScenario = id => { if (scenarios.length <= 1) return; const f = scenarios.filter(s => s.id !== id); setScenarios(f); if (activeId === id) setActiveId(f[0].id); };
  const addManualTier = () => { const last = sc.manualTiers[sc.manualTiers.length - 1]; upSc("manualTiers", [...sc.manualTiers, { budget: last.budget + 5000, cpa: last.cpa + 8 }]); };
  const rmManualTier = i => { if (sc.manualTiers.length <= 2) return; upSc("manualTiers", sc.manualTiers.filter((_, j) => j !== i)); };
  const chartD = data.map(d => ({ ...d, label: fmt(d.budget), netProfit: Math.round(d.net) }));

  const isComparing = showCompare && scenarios.length > 1;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} body{background:${C.bg}}
        input[type="number"]::-webkit-inner-spin-button,input[type="number"]::-webkit-outer-spin-button{opacity:0.6}
        @keyframes orbA{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}33%{transform:translate(80px,-50px) scale(1.15) rotate(5deg)}66%{transform:translate(-30px,30px) scale(0.95) rotate(-3deg)}}
        @keyframes orbB{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-70px,60px) scale(0.9)}}
        @keyframes orbC{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,40px) scale(1.1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes breathe{0%,100%{opacity:0.35}50%{opacity:0.7}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tipIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeScale{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        .tier-row{transition:background 0.2s ease} .tier-row:hover{background:rgba(255,255,255,0.025)!important}
        .btn{cursor:pointer;border:none;outline:none;transition:all 0.35s cubic-bezier(0.2,0,0,1);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent}
        .btn:hover{transform:translateY(-1px)} .btn:active{transform:translateY(0) scale(0.98)}
        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:rgba(255,255,255,0.03)!important}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        .scenario-chip{transition:all 0.35s cubic-bezier(0.2,0,0,1)}.scenario-chip:hover{transform:translateY(-1px)}
        .decay-card{transition:all 0.4s cubic-bezier(0.2,0,0,1);cursor:pointer}.decay-card:hover{transform:translateY(-2px)}
      `}</style>

      {/* ─── AMBIENT BG ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,231,183,0.06), rgba(110,231,183,0.02) 40%, transparent 70%)", animation: "orbA 30s ease-in-out infinite", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.05), transparent 70%)", animation: "orbB 25s ease-in-out infinite", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", top: "35%", left: "60%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.04), transparent 65%)", animation: "orbC 20s ease-in-out infinite", filter: "blur(30px)" }} />
        {/* Noise texture overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }} />
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "44px 24px 100px",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(32px)",
        transition: "all 0.9s cubic-bezier(0.2, 0, 0, 1)",
      }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40, animation: "slideUp 0.6s cubic-bezier(0.2,0,0,1) 0.1s both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${C.mint}, ${C.cyan})`, boxShadow: `0 0 14px ${C.mintG}`, animation: "breathe 3s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.mint, textTransform: "uppercase", letterSpacing: "0.18em" }}>Facebook Ads Profit Simulator</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Budget → Profit<span style={{ background: `linear-gradient(135deg, ${C.mint}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> Engine</span>
          </h1>
          <p style={{ fontSize: 14, color: C.sub, marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>
            Model diminishing returns with auto-scaling CPA decay, simulate LTV payback curves, and stress-test your unit economics.
          </p>
        </div>

        {/* ─── SCENARIO BAR ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap", animation: "slideUp 0.6s cubic-bezier(0.2,0,0,1) 0.15s both" }}>
          {scenarios.map((s, i) => {
            const isActive = !isComparing && s.id === activeId;
            const col = SCOL[i % SCOL.length];
            return (
              <div key={s.id} className="scenario-chip" style={{
                display: "flex", alignItems: "center", gap: 0, borderRadius: 14,
                background: isActive ? `linear-gradient(135deg, ${col}12, ${col}06)` : C.glass,
                border: `1px solid ${isActive ? col + "30" : C.border}`,
                boxShadow: isActive ? `0 0 20px ${col}10, 0 1px 0 rgba(255,255,255,0.05) inset` : "0 1px 0 rgba(255,255,255,0.04) inset",
                overflow: "hidden",
              }}>
                {/* Select button */}
                <div
                  onClick={() => { if (isComparing) { setShowCompare(false); } setActiveId(s.id); }}
                  style={{
                    padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRight: `1px solid ${isActive ? col + "20" : C.border}`,
                    transition: "background 0.2s ease",
                    background: isActive ? `${col}10` : "transparent",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${col}15`}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? `${col}10` : "transparent"}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: isActive ? col : "transparent",
                    border: `2px solid ${col}`,
                    transition: "all 0.3s ease",
                    boxShadow: isActive ? `0 0 8px ${col}40` : "none",
                  }} />
                </div>
                {/* Name */}
                <input type="text" value={s.name}
                  onChange={e => setScenarios(p => p.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))}
                  style={{
                    background: "transparent", border: "none", color: isActive ? col : C.sub,
                    fontSize: 12, fontWeight: 600, padding: "10px 6px 10px 10px",
                    width: Math.max(72, s.name.length * 8), outline: "none", fontFamily: "'DM Sans', sans-serif",
                    cursor: "text",
                  }}
                />
                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", paddingRight: 8, gap: 2 }}>
                  <span onClick={(e) => { e.stopPropagation(); dupScenario(s); }} title="Duplicate"
                    style={{ color: C.dim, cursor: "pointer", fontSize: 13, padding: "2px 5px", borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                    onMouseEnter={e => { e.target.style.color = C.text; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { e.target.style.color = C.dim; e.target.style.background = "transparent"; }}
                  >⧉</span>
                  {scenarios.length > 1 && (
                    <span onClick={e => { e.stopPropagation(); rmScenario(s.id); }} title="Remove"
                      style={{ color: C.dim, cursor: "pointer", fontSize: 14, padding: "2px 5px", borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                      onMouseEnter={e => { e.target.style.color = C.red; e.target.style.background = C.redD; }}
                      onMouseLeave={e => { e.target.style.color = C.dim; e.target.style.background = "transparent"; }}
                    >×</span>
                  )}
                </div>
              </div>
            );
          })}
          <button className="btn" onClick={addScenario} style={{
            padding: "10px 16px", borderRadius: 14, background: C.glass, border: `1px dashed ${C.border}`,
            color: C.sub, fontSize: 12, fontWeight: 500,
          }}>+ New</button>
          {scenarios.length > 1 && (
            <button className="btn" onClick={() => setShowCompare(!showCompare)} style={{
              marginLeft: "auto", padding: "10px 20px", borderRadius: 14,
              background: isComparing ? `linear-gradient(135deg, ${C.purpleD}, ${C.blueD})` : C.glass,
              border: `1px solid ${isComparing ? C.purple + "35" : C.border}`,
              color: isComparing ? C.purple : C.sub, fontSize: 12, fontWeight: 700,
              boxShadow: isComparing ? `0 0 24px ${C.purpleD}` : "none",
            }}>{isComparing ? "◆ Comparing All" : "Compare Scenarios"}</button>
          )}
        </div>

        {/* ─── INPUTS (hidden in compare mode) ─── */}
        {!isComparing && (
          <>
            {/* ROW 1: Economics + Decay */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) both" }}>
              {/* UNIT ECONOMICS */}
              <Glass style={{ padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>◈</span> Unit Economics
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <NumInput label="Average Order Value" value={sc.aov} onChange={v => upSc("aov", v)} step={0.01} />
                  <NumInput label="Avg Expenses / Order" value={sc.expenses} onChange={v => upSc("expenses", v)} step={0.5}
                    info="Include ALL variable costs per order: COGS (product cost), shipping, fulfillment/pick-pack, payment processing fees (≈2.9%), packaging, and returns/refund allowance. Calculate your true per-order cost before ad spend." />
                </div>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Metric small label="Margin Before Ads" value={fmtP(((sc.aov - sc.expenses) / sc.aov) * 100)} color={C.mint} />
                  <Metric small label="Break-Even CPA" value={`$${breakevenCpa.toFixed(2)}`} sub="absolute max CPA" color={C.amber} />
                </div>
              </Glass>

              {/* CPA SCALING */}
              <Glass style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>◐</span> CPA Scaling Model
                  </div>
                  <Toggle value={sc.useDecay} onChange={v => upSc("useDecay", v)} label={sc.useDecay ? "Auto Decay" : "Manual"} />
                </div>
                {sc.useDecay ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <NumInput label="Starting Budget" value={sc.startBudget} onChange={v => upSc("startBudget", v)} step={1000} />
                      <NumInput label="Increment" value={sc.increment} onChange={v => upSc("increment", v)} step={500} />
                      <NumInput label="# of Steps" value={sc.numSteps} onChange={v => upSc("numSteps", Math.max(2, Math.min(30, Math.round(v))))} prefix="" step={1} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <NumInput label="Starting CPA" value={sc.startCpa} onChange={v => upSc("startCpa", v)} step={0.5} />
                      <NumInput label="Decay Rate" value={sc.decayRate} onChange={v => upSc("decayRate", v)} prefix="" step={0.01}
                        info="The rate at which CPA degrades per step. For exponential: 0.12 means CPA grows ~12% compounding per budget increment. Higher = faster degradation." />
                    </div>
                    {/* DECAY TYPE SELECTOR — visual cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {Object.entries(DECAY_INFO).map(([key, info]) => {
                        const active = sc.decayType === key;
                        return (
                          <div key={key} className="decay-card" onClick={() => upSc("decayType", key)} style={{
                            padding: "12px", borderRadius: 14,
                            background: active ? `linear-gradient(145deg, ${C.cyanD}, rgba(34,211,238,0.03))` : C.card,
                            border: `1px solid ${active ? C.cyan + "35" : C.border}`,
                            boxShadow: active ? `0 0 20px ${C.cyanD}, 0 1px 0 rgba(255,255,255,0.05) inset` : "0 1px 0 rgba(255,255,255,0.03) inset",
                          }}>
                            <MiniDecayChart type={key} active={active} rate={sc.decayRate} />
                            <div style={{ fontSize: 11, fontWeight: 700, color: active ? C.cyan : C.sub, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{info.label}</div>
                            <div style={{ fontSize: 10, color: C.dim, marginTop: 3, lineHeight: 1.4 }}>{info.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>Manually define each budget tier and CPA below. Toggle Auto Decay to generate tiers from a curve model.</div>
                )}
              </Glass>
            </div>

            {/* LTV */}
            <Glass style={{ padding: 24, marginBottom: 16, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) 0.05s both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>∞</span> Subscription / LTV Model
                </div>
                <Toggle value={sc.ltvEnabled} onChange={v => upSc("ltvEnabled", v)} label={sc.ltvEnabled ? "Enabled" : "Disabled"} color={C.purple} />
              </div>
              {sc.ltvEnabled && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 18 }}>
                  <NumInput label="Monthly Churn Rate %" value={sc.churnRate} onChange={v => upSc("churnRate", v)} prefix="%" step={0.5} />
                  <NumInput label="Avg Lifetime (months)" value={sc.avgLifetimeMonths} onChange={v => upSc("avgLifetimeMonths", v)} prefix="" step={1} />
                  <NumInput label="Reorder Rate %" value={sc.reorderRate} onChange={v => upSc("reorderRate", v)} prefix="%" step={1} />
                </div>
              )}
            </Glass>

            {/* MANUAL TIERS */}
            {!sc.useDecay && (
              <Glass style={{ padding: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>▤</span> Manual Budget Tiers
                  </div>
                  <button className="btn" onClick={addManualTier} style={{ padding: "7px 14px", borderRadius: 10, background: C.mintD, border: `1px solid ${C.mint}20`, color: C.mint, fontSize: 11, fontWeight: 600 }}>+ Tier</button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px" }}>
                    <thead><tr>{["Budget", "CPA", "Orders", "Revenue", "Net Profit", "Margin", "ROAS", ""].map(h => (
                      <th key={h} style={{ padding: "6px 10px", fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {sc.manualTiers.map((t, i) => {
                        const d = calcTier(t.budget, t.cpa, sc.aov, sc.expenses);
                        return (
                          <tr key={i} className="tier-row" style={{ animation: `slideUp 0.25s ease ${i * 0.04}s both` }}>
                            <td style={{ padding: "8px 10px" }}><input type="number" value={t.budget} onChange={e => upManTier(i, "budget", parseFloat(e.target.value) || 0)} step={1000} style={{ width: 90, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", padding: "6px 8px", outline: "none" }} /></td>
                            <td style={{ padding: "8px 10px" }}><input type="number" value={t.cpa} onChange={e => upManTier(i, "cpa", parseFloat(e.target.value) || 1)} step={1} style={{ width: 65, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.amber, fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", padding: "6px 8px", outline: "none" }} /></td>
                            <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: C.sub }}>{Math.round(d.orders).toLocaleString()}</td>
                            <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: C.blue }}>{fmtF(Math.round(d.revenue))}</td>
                            <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: d.net >= 0 ? C.mint : C.red }}>{fmtF(Math.round(d.net))}</td>
                            <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: d.margin >= 20 ? C.mint : d.margin >= 0 ? C.amber : C.red }}>{fmtP(d.margin)}</td>
                            <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: d.roas >= 2 ? C.mint : d.roas >= 1 ? C.amber : C.red }}>{d.roas.toFixed(2)}x</td>
                            <td>{sc.manualTiers.length > 2 && <span onClick={() => rmManualTier(i)} style={{ color: C.dim, cursor: "pointer", fontSize: 14, padding: "3px 6px" }}>×</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Glass>
            )}

            {/* AUTO TIERS */}
            {sc.useDecay && (
              <Glass style={{ padding: 24, marginBottom: 16, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) 0.1s both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>▤</span> {tiers.length} Steps · {DECAY_INFO[sc.decayType].label} Decay @ {(sc.decayRate * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 2px" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 2 }}><tr>{["#", "Budget", "CPA", "Orders", "Revenue", "Net Profit", "Margin", "ROAS"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left", whiteSpace: "nowrap", background: C.bg }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {data.map((d, i) => {
                        const isPk = d.budget === peak.budget && d.net === peak.net;
                        return (
                          <tr key={i} className="tier-row" style={{ background: isPk ? C.mintD : "transparent" }}>
                            <td style={{ padding: "6px 10px", fontSize: 11, color: C.dim, fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</td>
                            <td style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: C.text }}>{fmtF(d.budget)}</td>
                            <td style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: d.cpa > breakevenCpa ? C.red : C.amber }}>${d.cpa.toFixed(2)}</td>
                            <td style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: C.sub }}>{Math.round(d.orders).toLocaleString()}</td>
                            <td style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: C.blue }}>{fmtF(Math.round(d.revenue))}</td>
                            <td style={{ padding: "6px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: d.net >= 0 ? C.mint : C.red }}>{fmtF(Math.round(d.net))}</span>
                                {isPk && <span style={{ fontSize: 7, fontWeight: 800, background: `linear-gradient(135deg, ${C.mint}30, ${C.cyan}20)`, color: C.mint, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", border: `1px solid ${C.mint}20` }}>PEAK</span>}
                              </div>
                            </td>
                            <td style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: d.margin >= 20 ? C.mint : d.margin >= 0 ? C.amber : C.red }}>{fmtP(d.margin)}</td>
                            <td style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: d.roas >= 2 ? C.mint : d.roas >= 1 ? C.amber : C.red }}>{d.roas.toFixed(2)}x</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Glass>
            )}
          </>
        )}

        {/* SUMMARY */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 22, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) 0.15s both" }}>
          {!isComparing ? (
            <>
              <Metric label="Peak Net Profit" value={fmtF(Math.round(peak.net))} sub={`at ${fmt(peak.budget)} spend`} color={C.mint} />
              <Metric label="Peak Margin" value={fmtP(peak.margin)} sub={`${fmtF(Math.round(peak.revenue))} rev`} color={C.blue} />
              <Metric label="Optimal CPA" value={`$${peak.cpa.toFixed(2)}`} sub={`${Math.round(peak.orders).toLocaleString()} orders`} color={C.amber} />
              <Metric label="Peak ROAS" value={`${peak.roas.toFixed(2)}x`} color={C.purple} />
              {breakeven && <Metric label="Goes Negative" value={fmt(breakeven.budget)} sub={`CPA $${breakeven.cpa.toFixed(2)}`} color={C.red} />}
            </>
          ) : (
            scenarios.map((s, i) => {
              const sTiers = s.useDecay ? Array.from({ length: s.numSteps }, (_, j) => ({ budget: s.startBudget + s.increment * j, cpa: decayFns[s.decayType](s.startCpa, s.decayRate, j) })) : s.manualTiers;
              const sData = sTiers.map(t => calcTier(t.budget, t.cpa, s.aov, s.expenses));
              const sPeak = sData.reduce((b, d) => d.net > b.net ? d : b, sData[0]);
              return <Metric key={s.id} label={`${s.name} Peak`} value={fmtF(Math.round(sPeak.net))} sub={`at ${fmt(sPeak.budget)} · CPA $${sPeak.cpa.toFixed(2)}`} color={SCOL[i % SCOL.length]} />;
            })
          )}
        </div>

        {/* TAB NAV */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {[
            { key: "profit", label: "Profit Curve", icon: "◆" },
            ...(!isComparing && sc.ltvEnabled ? [{ key: "ltv", label: "LTV & Cash Flow", icon: "∞" }] : []),
            ...(!isComparing ? [{ key: "sensitivity", label: "Sensitivity", icon: "◎" }] : []),
          ].map(t => (
            <button key={t.key} className="btn" onClick={() => setActiveTab(t.key)} style={{
              padding: "11px 20px", borderRadius: 14, fontSize: 13, fontWeight: 600,
              background: activeTab === t.key ? `linear-gradient(135deg, ${C.mintD}, rgba(110,231,183,0.04))` : C.glass,
              border: `1px solid ${activeTab === t.key ? C.mint + "30" : C.border}`,
              color: activeTab === t.key ? C.mint : C.sub,
              boxShadow: activeTab === t.key ? `0 0 16px ${C.mintD}, 0 1px 0 rgba(255,255,255,0.05) inset` : "0 1px 0 rgba(255,255,255,0.04) inset",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ═══ PROFIT CURVE ═══ */}
        {activeTab === "profit" && (
          <>
            <Glass style={{ padding: 28, marginBottom: 16 }} glow>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>◆</span> {isComparing ? "Scenario Comparison" : "Profit Curve"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{isComparing ? "Net Profit — All Scenarios Overlaid" : "Net Profit vs. Ad Spend"}</div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                {isComparing ? (
                  <ComposedChart data={compData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<ChartTip />} />
                    <Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                    <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} />
                    {scenarios.map((s, i) => <Line key={s.id} type="monotone" dataKey={s.name} stroke={SCOL[i % SCOL.length]} strokeWidth={2.5} dot={{ fill: SCOL[i % SCOL.length], r: 4 }} activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} />)}
                  </ComposedChart>
                ) : (
                  <AreaChart data={chartD} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.mint} stopOpacity={0.25} /><stop offset="40%" stopColor={C.mint} stopOpacity={0.05} /><stop offset="100%" stopColor={C.red} stopOpacity={0.06} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<ChartTip />} />
                    <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Break-Even", fill: C.red, fontSize: 10, position: "insideTopLeft" }} />
                    <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke={C.mint} strokeWidth={2.5} fill="url(#pg)"
                      dot={p => {
                        const { cx, cy, payload } = p; const isPk = payload.budget === peak.budget && payload.net === peak.net;
                        return (<g key={p.index}><circle cx={cx} cy={cy} r={isPk ? 7 : 4} fill={payload.net >= 0 ? C.mint : C.red} opacity={isPk ? 1 : 0.7} />
                          {isPk && <circle cx={cx} cy={cy} r={14} fill="none" stroke={C.mint} strokeWidth={1.5} opacity={0.25}><animate attributeName="r" from="9" to="20" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.35" to="0" dur="2.5s" repeatCount="indefinite" /></circle>}</g>);
                      }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </Glass>
            {!isComparing && (
              <Glass style={{ padding: 28 }}>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>▦</span> Breakdown</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Revenue vs. Cost Composition</div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={chartD.map(d => ({ label: d.label, Revenue: Math.round(d.revenue), "Ad Spend": Math.round(d.budget), "Fulfillment": Math.round(d.orders * sc.expenses), "Net Profit": Math.round(d.net) }))} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<ChartTip />} />
                    <Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                    <Bar dataKey="Ad Spend" stackId="c" fill={C.red} fillOpacity={0.45} />
                    <Bar dataKey="Fulfillment" stackId="c" fill={C.amber} fillOpacity={0.4} radius={[4,4,0,0]} />
                    <Line type="monotone" dataKey="Revenue" stroke={C.blue} strokeWidth={2.5} dot={{ fill: C.blue, r: 3 }} />
                    <Line type="monotone" dataKey="Net Profit" stroke={C.mint} strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: C.mint, r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Glass>
            )}
          </>
        )}

        {/* ═══ LTV ═══ */}
        {activeTab === "ltv" && sc.ltvEnabled && !isComparing && (
          <>
            {(() => {
              const l = calcLtv(peak, sc.aov, sc.expenses, sc.churnRate, sc.avgLifetimeMonths, sc.reorderRate);
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
                  <Metric label="Customer LTV" value={`$${l.ltv.toFixed(2)}`} sub={`over ${sc.avgLifetimeMonths} mo`} color={C.purple} />
                  <Metric label="LTV Profit / Customer" value={`$${l.lifetimeProfit.toFixed(2)}`} sub="after CPA + expenses" color={C.mint} />
                  <Metric label="Payback Period" value={l.paybackMonths === Infinity ? "Never" : `${l.paybackMonths.toFixed(1)} mo`} sub="to recoup CPA" color={l.paybackMonths <= 3 ? C.mint : l.paybackMonths <= 6 ? C.amber : C.red} />
                  <Metric label="LTV : CPA Ratio" value={`${(l.ltv / peak.cpa).toFixed(1)}x`} sub={`$${l.ltv.toFixed(0)} / $${peak.cpa.toFixed(0)}`} color={C.cyan} />
                </div>
              );
            })()}
            <Glass style={{ padding: 28, marginBottom: 16 }} glow>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>∞</span> LTV Impact</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>First-Order vs. Lifetime Profit by Budget</div>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={ltvData.map(d => ({ label: d.label, "First-Order": d.firstOrderProfit, "Lifetime": d.lifetimeTotalProfit }))} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.2} /><stop offset="100%" stopColor={C.purple} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<ChartTip />} /><Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} />
                  <Area type="monotone" dataKey="Lifetime" stroke={C.purple} strokeWidth={2.5} fill="url(#lg)" dot={{ fill: C.purple, r: 4 }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="First-Order" stroke={C.mint} strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: C.mint, r: 4 }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 14, fontSize: 12, color: C.sub, padding: "12px 16px", background: `linear-gradient(135deg, ${C.purpleD}, transparent)`, borderRadius: 12, border: `1px solid ${C.purple}15`, lineHeight: 1.6 }}>
                The gap between the dashed line (first-order) and filled area (lifetime) is hidden profit from retention. Budget levels that look unprofitable on day one may be wildly profitable over the customer lifecycle.
              </div>
            </Glass>
            <Glass style={{ padding: 28 }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>◧</span> Cash Flow Timeline</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Cumulative Per-Customer Profit (at peak CPA ${peak.cpa.toFixed(2)})</div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={cashFlowData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.18} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTip />} /><Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Break-Even", fill: C.red, fontSize: 10, position: "insideTopLeft" }} />
                  <Area type="monotone" dataKey="cumProfit" name="Cumulative Profit" stroke={C.cyan} strokeWidth={2.5} fill="url(#cf)" dot={{ fill: C.cyan, r: 3 }} activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }} />
                  <Bar dataKey="monthly" name="Monthly Net" fill={C.mint} fillOpacity={0.25} radius={[4,4,0,0]} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 14, fontSize: 12, color: C.sub, padding: "12px 16px", background: `linear-gradient(135deg, ${C.cyanD}, transparent)`, borderRadius: 12, border: `1px solid ${C.cyan}15`, lineHeight: 1.6 }}>
                The valley of death — CPA paid upfront, recouped over months. The curve crossing zero = payback point. Everything above is pure profit.
              </div>
            </Glass>
          </>
        )}

        {/* ═══ SENSITIVITY ═══ */}
        {activeTab === "sensitivity" && !isComparing && (
          <Glass style={{ padding: 28 }} glow>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>◎</span> Sensitivity Analysis</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>What if {sensiAxis === "cpa" ? "CPA" : "AOV"} shifts at peak budget?</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>Stress Test:</span>
              {[["cpa", "CPA Variance", C.amber], ["aov", "AOV Variance", C.blue]].map(([k, l, c]) => (
                <button key={k} className="btn" onClick={() => setSensiAxis(k)} style={{
                  padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: sensiAxis === k ? `${c}15` : "transparent", border: `1px solid ${sensiAxis === k ? c + "40" : C.border}`, color: sensiAxis === k ? c : C.sub,
                }}>{l}</button>
              ))}
              <span style={{ fontSize: 12, color: C.dim, marginLeft: 6 }}>Range:</span>
              {[15, 30, 50].map(r => (
                <button key={r} className="btn" onClick={() => setSensiRange(r)} style={{
                  padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: sensiRange === r ? C.purpleD : "transparent", border: `1px solid ${sensiRange === r ? C.purple + "40" : C.border}`, color: sensiRange === r ? C.purple : C.sub,
                }}>±{r}%</button>
              ))}
            </div>
            <div style={{ marginBottom: 18, padding: "12px 16px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              Testing at <strong style={{ color: C.text }}>{fmt(peak.budget)} budget</strong> with base <strong style={{ color: C.text }}>{sensiAxis === "cpa" ? `CPA $${peak.cpa.toFixed(2)}` : `AOV $${sc.aov.toFixed(2)}`}</strong>. Break-even CPA: <strong style={{ color: C.amber }}>${breakevenCpa.toFixed(2)}</strong>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={sensiData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sensiAxis === "cpa" ? C.amber : C.blue} stopOpacity={0.18} /><stop offset="100%" stopColor={sensiAxis === "cpa" ? C.amber : C.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} label={{ value: `${sensiAxis === "cpa" ? "CPA" : "AOV"} Change`, position: "insideBottom", offset: -5, style: { fontSize: 10, fill: C.dim } }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} />
                <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke={sensiAxis === "cpa" ? C.amber : C.blue} strokeWidth={2.5} fill="url(#sg)"
                  dot={p => <circle key={p.index} cx={p.cx} cy={p.cy} r={p.payload.isBase ? 7 : 4} fill={p.payload.netProfit >= 0 ? (sensiAxis === "cpa" ? C.amber : C.blue) : C.red} stroke={p.payload.isBase ? "#fff" : "none"} strokeWidth={p.payload.isBase ? 2 : 0} opacity={0.85} />}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 18 }}>
              <Metric small label={`Worst (${sensiAxis === "cpa" ? "+" : "-"}${sensiRange}%)`} value={fmtF(sensiData[sensiAxis === "cpa" ? sensiData.length - 1 : 0].netProfit)} color={sensiData[sensiAxis === "cpa" ? sensiData.length - 1 : 0].netProfit >= 0 ? C.amber : C.red} />
              <Metric small label="Base Case" value={fmtF(sensiData[Math.floor(sensiData.length / 2)].netProfit)} color={C.mint} />
              <Metric small label={`Best (${sensiAxis === "cpa" ? "-" : "+"}${sensiRange}%)`} value={fmtF(sensiData[sensiAxis === "cpa" ? 0 : sensiData.length - 1].netProfit)} color={C.cyan} />
            </div>
          </Glass>
        )}

        <div style={{ textAlign: "center", color: C.dim, fontSize: 11, marginTop: 28, letterSpacing: "0.02em" }}>Find where profit peaks before diminishing returns erode your margins.</div>
      </div>
    </div>
  );
}
