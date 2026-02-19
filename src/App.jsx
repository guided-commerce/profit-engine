import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Bar, Legend, ReferenceLine
} from "recharts";

/* ─── themes ─── */
const THEMES = {
  dark: {
    bg: "#050508", bgGradient: null,
    card: "rgba(255,255,255,0.03)",
    glass: "rgba(255,255,255,0.045)", glassHover: "rgba(255,255,255,0.07)", glassActive: "rgba(255,255,255,0.09)",
    border: "rgba(255,255,255,0.06)", borderLt: "rgba(255,255,255,0.1)", borderGlow: "rgba(255,255,255,0.15)",
    text: "#f0f0f5", sub: "#8e8ea0", dim: "#505068",
    mint: "#6ee7b7", mintD: "rgba(110,231,183,0.1)", mintG: "rgba(110,231,183,0.2)",
    red: "#f87171", redD: "rgba(248,113,113,0.1)",
    amber: "#fbbf24", amberD: "rgba(251,191,36,0.1)",
    blue: "#60a5fa", blueD: "rgba(96,165,250,0.1)",
    purple: "#a78bfa", purpleD: "rgba(167,139,250,0.1)",
    cyan: "#22d3ee", cyanD: "rgba(34,211,238,0.1)",
    inputBg: "rgba(255,255,255,0.02)", inputFocusBg: "rgba(110,231,183,0.02)",
    tooltipBg: "rgba(8,8,14,0.96)", infoBg: "rgba(10,10,18,0.97)",
    orbA: "radial-gradient(circle, rgba(110,231,183,0.06), rgba(110,231,183,0.02) 40%, transparent 70%)",
    orbB: "radial-gradient(circle, rgba(96,165,250,0.05), transparent 70%)",
    orbC: "radial-gradient(circle, rgba(167,139,250,0.04), transparent 65%)",
    gridLine: "rgba(255,255,255,0.03)", scrollThumb: "rgba(255,255,255,0.08)",
    topEdge: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.1) 80%, transparent 100%)",
    shadowBase: "rgba(0,0,0,0.2)", shadowHeavy: "rgba(0,0,0,0.5)",
    toggleOffBg: "rgba(255,255,255,0.04)", toggleKnobOff: "#505068",
    noiseOpacity: 0.015, tierHover: "rgba(255,255,255,0.025)",
    insetHighlight: "rgba(255,255,255,0.06)", insetShadow: "rgba(0,0,0,0.15)",
    glowMint: "rgba(110,231,183,0.06)",
  },
  light: {
    bg: "#f0f1f5", bgGradient: null,
    card: "rgba(255,255,255,0.5)",
    glass: "rgba(255,255,255,0.55)", glassHover: "rgba(255,255,255,0.72)", glassActive: "rgba(255,255,255,0.85)",
    border: "rgba(0,0,0,0.07)", borderLt: "rgba(0,0,0,0.1)", borderGlow: "rgba(0,0,0,0.15)",
    text: "#1a1a2e", sub: "#5a5a72", dim: "#9a9ab0",
    mint: "#059669", mintD: "rgba(5,150,105,0.08)", mintG: "rgba(5,150,105,0.15)",
    red: "#dc2626", redD: "rgba(220,38,38,0.06)",
    amber: "#d97706", amberD: "rgba(217,119,6,0.06)",
    blue: "#2563eb", blueD: "rgba(37,99,235,0.06)",
    purple: "#7c3aed", purpleD: "rgba(124,58,237,0.06)",
    cyan: "#0891b2", cyanD: "rgba(8,145,178,0.06)",
    inputBg: "rgba(0,0,0,0.02)", inputFocusBg: "rgba(5,150,105,0.04)",
    tooltipBg: "rgba(255,255,255,0.97)", infoBg: "rgba(255,255,255,0.98)",
    orbA: "radial-gradient(circle, rgba(5,150,105,0.08), rgba(5,150,105,0.02) 40%, transparent 70%)",
    orbB: "radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)",
    orbC: "radial-gradient(circle, rgba(124,58,237,0.06), transparent 65%)",
    gridLine: "rgba(0,0,0,0.05)", scrollThumb: "rgba(0,0,0,0.12)",
    topEdge: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 20%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 80%, transparent 100%)",
    shadowBase: "rgba(0,0,0,0.05)", shadowHeavy: "rgba(0,0,0,0.1)",
    toggleOffBg: "rgba(0,0,0,0.06)", toggleKnobOff: "#b0b0c0",
    noiseOpacity: 0.02, tierHover: "rgba(0,0,0,0.025)",
    insetHighlight: "rgba(255,255,255,0.7)", insetShadow: "rgba(0,0,0,0.04)",
    glowMint: "rgba(5,150,105,0.06)",
  },
  gradient: {
    bg: "#0f0c29", bgGradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    card: "rgba(255,255,255,0.04)",
    glass: "rgba(255,255,255,0.06)", glassHover: "rgba(255,255,255,0.1)", glassActive: "rgba(255,255,255,0.13)",
    border: "rgba(255,255,255,0.08)", borderLt: "rgba(255,255,255,0.13)", borderGlow: "rgba(255,255,255,0.2)",
    text: "#f5f0ff", sub: "#a399c0", dim: "#6a5f8a",
    mint: "#34d399", mintD: "rgba(52,211,153,0.12)", mintG: "rgba(52,211,153,0.25)",
    red: "#fb7185", redD: "rgba(251,113,133,0.1)",
    amber: "#fbbf24", amberD: "rgba(251,191,36,0.1)",
    blue: "#818cf8", blueD: "rgba(129,140,248,0.1)",
    purple: "#c084fc", purpleD: "rgba(192,132,252,0.12)",
    cyan: "#22d3ee", cyanD: "rgba(34,211,238,0.1)",
    inputBg: "rgba(255,255,255,0.03)", inputFocusBg: "rgba(52,211,153,0.04)",
    tooltipBg: "rgba(15,12,41,0.97)", infoBg: "rgba(15,12,41,0.98)",
    orbA: "radial-gradient(circle, rgba(192,132,252,0.1), rgba(129,140,248,0.04) 40%, transparent 70%)",
    orbB: "radial-gradient(circle, rgba(52,211,153,0.08), transparent 70%)",
    orbC: "radial-gradient(circle, rgba(251,191,36,0.06), transparent 65%)",
    gridLine: "rgba(255,255,255,0.04)", scrollThumb: "rgba(255,255,255,0.1)",
    topEdge: "linear-gradient(90deg, transparent 0%, rgba(192,132,252,0.15) 20%, rgba(129,140,248,0.2) 50%, rgba(192,132,252,0.15) 80%, transparent 100%)",
    shadowBase: "rgba(0,0,0,0.25)", shadowHeavy: "rgba(0,0,0,0.5)",
    toggleOffBg: "rgba(255,255,255,0.04)", toggleKnobOff: "#6a5f8a",
    noiseOpacity: 0.02, tierHover: "rgba(255,255,255,0.03)",
    insetHighlight: "rgba(255,255,255,0.08)", insetShadow: "rgba(0,0,0,0.2)",
    glowMint: "rgba(52,211,153,0.06)",
  },
};

const SCOL_MAP = {
  dark: ["#6ee7b7", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#22d3ee"],
  light: ["#059669", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#0891b2"],
  gradient: ["#34d399", "#818cf8", "#c084fc", "#fbbf24", "#fb7185", "#22d3ee"],
};

/* ─── responsive hook ─── */
const useBreakpoint = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setW(window.innerWidth), 80); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024, isDesktop: w >= 1024, w };
};

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
  linear: { label: "Linear", desc: "CPA rises at a constant rate per step. Predictable, steady increase.", icon: "\u27CB" },
  exponential: { label: "Exponential", desc: "CPA accelerates faster at higher budgets. Most realistic for Facebook.", icon: "\u2934" },
  logarithmic: { label: "Logarithmic", desc: "CPA rises quickly at first, then levels off. Optimistic scaling model.", icon: "\u2312" },
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
const MiniDecayChart = ({ type, active, rate = 0.12, C }) => {
  const pts = Array.from({ length: 8 }, (_, i) => decayFns[type](1, rate, i));
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
const InfoTip = ({ text, C }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 6 }}>
      <span
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{
          width: 16, height: 16, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: C.inputBg, border: `1px solid ${C.border}`, cursor: "help",
          fontSize: 10, fontWeight: 700, color: C.sub, transition: "all 0.2s ease",
          ...(show ? { background: C.mintD, borderColor: C.mint + "40", color: C.mint } : {})
        }}
      >?</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          width: 260, padding: "12px 14px", background: C.infoBg, backdropFilter: "blur(20px)",
          border: `1px solid ${C.borderLt}`, borderRadius: 12, boxShadow: `0 20px 60px ${C.shadowHeavy}`,
          fontSize: 12, lineHeight: 1.5, color: C.sub, zIndex: 100, animation: "tipIn 0.2s ease"
        }}>{text}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: C.infoBg, border: `1px solid ${C.borderLt}`, borderTop: "none", borderLeft: "none" }} />
        </div>
      )}
    </span>
  );
};

/* ─── Glass ─── */
const Glass = ({ children, style = {}, glow, C }) => (
  <div style={{
    background: glow ? C.glowMint : C.glass,
    backdropFilter: "blur(40px) saturate(1.4)", WebkitBackdropFilter: "blur(40px) saturate(1.4)",
    border: `1px solid ${glow ? C.mint + "1e" : C.border}`,
    borderRadius: 20,
    boxShadow: glow
      ? `0 0 80px ${C.glowMint}, 0 1px 0 ${C.insetHighlight} inset, 0 -1px 0 ${C.insetShadow} inset`
      : `0 8px 40px ${C.shadowBase}, 0 1px 0 ${C.insetHighlight} inset, 0 -1px 0 ${C.insetShadow} inset`,
    transition: "all 0.5s cubic-bezier(0.2, 0, 0, 1)",
    position: "relative", overflow: "hidden", ...style,
  }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: C.topEdge, pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
  </div>
);

/* ─── Toggle ─── */
const Toggle = ({ value, onChange, label, color, C }) => {
  const c = color || C.mint;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }} onClick={() => onChange(!value)}>
      <div style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        background: value ? `linear-gradient(135deg, ${c}50, ${c}30)` : C.toggleOffBg,
        border: `1px solid ${value ? c + "50" : C.border}`,
        transition: "all 0.4s cubic-bezier(0.2, 0, 0, 1)",
        boxShadow: value ? `0 0 16px ${c}20, inset 0 1px 0 ${C.insetHighlight}` : `inset 0 1px 2px ${C.shadowBase}`,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: value ? "#fff" : C.toggleKnobOff,
          transform: value ? "translateX(20px)" : "translateX(0)",
          transition: "all 0.4s cubic-bezier(0.2, 0, 0, 1)",
          boxShadow: value ? `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${c}30` : "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: value ? c : C.sub, transition: "color 0.3s ease" }}>{label}</span>
    </div>
  );
};

/* ─── NumInput with custom steppers ─── */
const NumInput = ({ label, value, onChange, prefix = "$", step = 1, min = 0, color, info, C }) => {
  const [focused, setFocused] = useState(false);
  const inc = () => onChange(Math.round((value + step) * 1000) / 1000);
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 1000) / 1000));
  const [hovL, setHovL] = useState(false);
  const [hovR, setHovR] = useState(false);
  const btnStyle = (side, hov) => ({
    width: 40, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
    background: hov ? C.glassHover : C.glass,
    border: `1px solid ${C.border}`,
    borderRadius: side === "left" ? "12px 0 0 12px" : "0 12px 12px 0",
    ...(side === "left" ? { borderRight: "none" } : { borderLeft: "none" }),
    color: hov ? C.mint : C.sub, fontSize: 20, fontWeight: 500, cursor: "pointer",
    transition: "all 0.2s ease", backdropFilter: "blur(8px)",
    fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
    padding: 0, outline: "none",
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center" }}>
          {label}{info && <InfoTip text={info} C={C} />}
        </label>
      )}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <button className="btn" onClick={dec}
          onMouseEnter={() => setHovL(true)} onMouseLeave={() => setHovL(false)}
          style={btnStyle("left", hovL)}
        >&minus;</button>
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.dim, fontSize: 13, fontWeight: 600, pointerEvents: "none", zIndex: 2 }}>{prefix}</span>}
          <input
            type="text" inputMode="decimal" value={value}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
            onBlur={e => { setFocused(false); const v = parseFloat(e.target.value); if (isNaN(v)) onChange(min); }}
            onFocus={() => setFocused(true)}
            style={{
              width: "100%", height: "100%", padding: `12px 14px 12px ${prefix ? 28 : 14}px`,
              background: focused ? C.inputFocusBg : C.inputBg,
              border: `1px solid ${focused ? C.mint : C.border}`,
              borderRadius: 0, borderLeft: "none", borderRight: "none",
              color: color || C.text, fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              outline: "none", textAlign: "center", boxSizing: "border-box",
              transition: "all 0.3s cubic-bezier(0.2,0,0,1)",
              boxShadow: focused ? `0 0 0 3px ${C.mintD}, 0 0 20px ${C.mintD}` : "none",
            }}
          />
        </div>
        <button className="btn" onClick={inc}
          onMouseEnter={() => setHovR(true)} onMouseLeave={() => setHovR(false)}
          style={btnStyle("right", hovR)}
        >+</button>
      </div>
    </div>
  );
};

/* ─── Metric ─── */
const Metric = ({ label, value, sub, color, small, C }) => {
  const c = color || C.mint;
  return (
    <div style={{
      padding: small ? "14px 16px" : "18px 20px",
      background: `linear-gradient(145deg, ${c}06, transparent)`,
      border: `1px solid ${c}15`, borderRadius: 16, backdropFilter: "blur(8px)", transition: "all 0.3s ease",
    }}>
      <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: small ? 18 : 24, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
};

/* ─── Chart Tooltip ─── */
const ChartTip = ({ active, payload, label, C: c }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: c.tooltipBg, backdropFilter: "blur(24px)",
      border: `1px solid ${c.borderLt}`, borderRadius: 14, padding: "14px 18px",
      boxShadow: `0 24px 64px ${c.shadowHeavy}, 0 1px 0 ${c.insetHighlight} inset`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.stroke, boxShadow: `0 0 6px ${p.color || p.stroke}40` }} />
          <span style={{ fontSize: 11, color: c.sub }}>{p.name}:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: p.color || p.stroke, fontFamily: "'JetBrains Mono', monospace" }}>
            {typeof p.value === "number" ? (p.name.includes("Margin") ? fmtP(p.value) : fmtF(Math.round(p.value))) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Theme Selector ─── */
const ThemeSelector = ({ theme, setTheme, C, isMobile }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 3, background: C.glass, borderRadius: 14, padding: 3,
    border: `1px solid ${C.border}`, backdropFilter: "blur(20px)",
  }}>
    {[
      { key: "dark", label: "Dark", preview: "#0a0a10" },
      { key: "light", label: "Light", preview: "#f0f1f5" },
      { key: "gradient", label: "Gradient", preview: "linear-gradient(135deg, #302b63, #24243e)" },
    ].map(t => (
      <button key={t.key} className="btn" onClick={() => setTheme(t.key)} style={{
        padding: isMobile ? "7px 10px" : "7px 14px", borderRadius: 11, fontSize: 11, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 6,
        background: theme === t.key ? C.mintD : "transparent",
        border: `1px solid ${theme === t.key ? C.mint + "30" : "transparent"}`,
        color: theme === t.key ? C.mint : C.sub, transition: "all 0.3s ease",
      }}>
        <span style={{
          width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
          background: t.preview, border: `1.5px solid ${theme === t.key ? C.mint + "60" : C.border}`,
          boxShadow: theme === t.key ? `0 0 8px ${C.mint}30` : "none", transition: "all 0.3s ease",
        }} />
        {!isMobile && t.label}
      </button>
    ))}
  </div>
);

/* ══════════════════════════ MAIN ══════════════════════════ */
export default function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("pe-theme") || "dark"; } catch { return "dark"; }
  });
  const C = THEMES[theme];
  const SCOL = SCOL_MAP[theme];
  const bp = useBreakpoint();
  const r = (desktop, tablet, mobile) => {
    if (bp.isMobile) return mobile ?? tablet ?? desktop;
    if (bp.isTablet) return tablet ?? desktop;
    return desktop;
  };

  useEffect(() => { document.body.style.background = C.bg; document.body.style.transition = "background 0.5s ease"; }, [C.bg]);
  useEffect(() => { try { localStorage.setItem("pe-theme", theme); } catch {} }, [theme]);

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

  const gp = r(24, 20, 16); /* glass padding */
  const gpL = r(28, 22, 18); /* glass padding large */
  const chartH1 = r(400, 340, 270);
  const chartH2 = r(320, 280, 240);
  const chartH3 = r(380, 320, 270);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bgGradient || C.bg,
      color: C.text,
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
      transition: "background 0.5s ease, color 0.3s ease",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0} body{background:${C.bg};transition:background 0.5s ease}
        input[type="number"]::-webkit-inner-spin-button,input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type="number"]{-moz-appearance:textfield}
        @keyframes orbA{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}33%{transform:translate(80px,-50px) scale(1.15) rotate(5deg)}66%{transform:translate(-30px,30px) scale(0.95) rotate(-3deg)}}
        @keyframes orbB{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-70px,60px) scale(0.9)}}
        @keyframes orbC{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,40px) scale(1.1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes breathe{0%,100%{opacity:0.35}50%{opacity:0.7}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tipIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeScale{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        .tier-row{transition:background 0.2s ease} .tier-row:hover{background:${C.tierHover}!important}
        .btn{cursor:pointer;border:none;outline:none;transition:all 0.35s cubic-bezier(0.2,0,0,1);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent}
        .btn:hover{transform:translateY(-1px)} .btn:active{transform:translateY(0) scale(0.98)}
        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:${C.gridLine}!important}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.scrollThumb};border-radius:3px}
        .scenario-chip{transition:all 0.35s cubic-bezier(0.2,0,0,1)}.scenario-chip:hover{transform:translateY(-1px)}
        .decay-card{transition:all 0.4s cubic-bezier(0.2,0,0,1);cursor:pointer}.decay-card:hover{transform:translateY(-2px)}
      `}</style>

      {/* ─── AMBIENT BG ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-15%", width: r(700, 500, 350), height: r(700, 500, 350), borderRadius: "50%", background: C.orbA, animation: "orbA 30s ease-in-out infinite", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: r(600, 450, 300), height: r(600, 450, 300), borderRadius: "50%", background: C.orbB, animation: "orbB 25s ease-in-out infinite", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", top: "35%", left: "60%", width: r(500, 400, 250), height: r(500, 400, 250), borderRadius: "50%", background: C.orbC, animation: "orbC 20s ease-in-out infinite", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: C.noiseOpacity, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }} />
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto",
        padding: r("44px 24px 100px", "32px 18px 80px", "24px 14px 60px"),
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(32px)",
        transition: "all 0.9s cubic-bezier(0.2, 0, 0, 1)",
      }}>
        {/* HEADER */}
        <div style={{ marginBottom: r(40, 32, 24), animation: "slideUp 0.6s cubic-bezier(0.2,0,0,1) 0.1s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: `linear-gradient(135deg, ${C.mint}, ${C.cyan})`, boxShadow: `0 0 14px ${C.mintG}`, animation: "breathe 3s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.mint, textTransform: "uppercase", letterSpacing: "0.18em" }}>Facebook Ads Profit Simulator</span>
            </div>
            <ThemeSelector theme={theme} setTheme={setTheme} C={C} isMobile={bp.isMobile} />
          </div>
          <h1 style={{ fontSize: r(38, 30, 24), fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Budget \u2192 Profit<span style={{ background: `linear-gradient(135deg, ${C.mint}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> Engine</span>
          </h1>
          <p style={{ fontSize: r(14, 13, 12), color: C.sub, marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>
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
                boxShadow: isActive ? `0 0 20px ${col}10, 0 1px 0 ${C.insetHighlight} inset` : `0 1px 0 ${C.insetHighlight} inset`,
                overflow: "hidden",
              }}>
                <div onClick={() => { if (isComparing) setShowCompare(false); setActiveId(s.id); }}
                  style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${isActive ? col + "20" : C.border}`, transition: "background 0.2s ease", background: isActive ? `${col}10` : "transparent" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${col}15`}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? `${col}10` : "transparent"}
                >
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: isActive ? col : "transparent", border: `2px solid ${col}`, transition: "all 0.3s ease", boxShadow: isActive ? `0 0 8px ${col}40` : "none" }} />
                </div>
                <input type="text" value={s.name}
                  onChange={e => setScenarios(p => p.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))}
                  style={{ background: "transparent", border: "none", color: isActive ? col : C.sub, fontSize: 12, fontWeight: 600, padding: "10px 6px 10px 10px", width: Math.max(72, s.name.length * 8), outline: "none", fontFamily: "'DM Sans', sans-serif", cursor: "text" }}
                />
                <div style={{ display: "flex", alignItems: "center", paddingRight: 8, gap: 2 }}>
                  <span onClick={e => { e.stopPropagation(); dupScenario(s); }} title="Duplicate"
                    style={{ color: C.dim, cursor: "pointer", fontSize: 13, padding: "2px 5px", borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                    onMouseEnter={e => { e.target.style.color = C.text; e.target.style.background = C.glassHover; }}
                    onMouseLeave={e => { e.target.style.color = C.dim; e.target.style.background = "transparent"; }}
                  >{"\u29C9"}</span>
                  {scenarios.length > 1 && (
                    <span onClick={e => { e.stopPropagation(); rmScenario(s.id); }} title="Remove"
                      style={{ color: C.dim, cursor: "pointer", fontSize: 14, padding: "2px 5px", borderRadius: 6, transition: "color 0.2s, background 0.2s" }}
                      onMouseEnter={e => { e.target.style.color = C.red; e.target.style.background = C.redD; }}
                      onMouseLeave={e => { e.target.style.color = C.dim; e.target.style.background = "transparent"; }}
                    >{"\u00D7"}</span>
                  )}
                </div>
              </div>
            );
          })}
          <button className="btn" onClick={addScenario} style={{ padding: "10px 16px", borderRadius: 14, background: C.glass, border: `1px dashed ${C.border}`, color: C.sub, fontSize: 12, fontWeight: 500 }}>+ New</button>
          {scenarios.length > 1 && (
            <button className="btn" onClick={() => setShowCompare(!showCompare)} style={{
              marginLeft: bp.isMobile ? 0 : "auto", padding: "10px 20px", borderRadius: 14,
              background: isComparing ? `linear-gradient(135deg, ${C.purpleD}, ${C.blueD})` : C.glass,
              border: `1px solid ${isComparing ? C.purple + "35" : C.border}`,
              color: isComparing ? C.purple : C.sub, fontSize: 12, fontWeight: 700,
              boxShadow: isComparing ? `0 0 24px ${C.purpleD}` : "none",
              ...(bp.isMobile ? { width: "100%" } : {}),
            }}>{isComparing ? "\u25C6 Comparing All" : "Compare Scenarios"}</button>
          )}
        </div>

        {/* ─── INPUTS (hidden in compare mode) ─── */}
        {!isComparing && (
          <>
            {/* ROW 1: Economics + Decay */}
            <div style={{ display: "grid", gridTemplateColumns: r("1fr 1fr", "1fr 1fr", "1fr"), gap: 16, marginBottom: 16, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) both" }}>
              <Glass style={{ padding: gp }} C={C}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{"\u25C8"}</span> Unit Economics
                </div>
                <div style={{ display: "grid", gridTemplateColumns: r("1fr 1fr", "1fr 1fr", "1fr"), gap: 14 }}>
                  <NumInput label="Average Order Value" value={sc.aov} onChange={v => upSc("aov", v)} step={0.01} C={C} />
                  <NumInput label="Avg Expenses / Order" value={sc.expenses} onChange={v => upSc("expenses", v)} step={0.5} C={C}
                    info="Include ALL variable costs per order: COGS (product cost), shipping, fulfillment/pick-pack, payment processing fees, packaging, and returns/refund allowance." />
                </div>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Metric small label="Margin Before Ads" value={fmtP(((sc.aov - sc.expenses) / sc.aov) * 100)} color={C.mint} C={C} />
                  <Metric small label="Break-Even CPA" value={`$${breakevenCpa.toFixed(2)}`} sub="absolute max CPA" color={C.amber} C={C} />
                </div>
              </Glass>

              <Glass style={{ padding: gp }} C={C}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{"\u25D0"}</span> CPA Scaling Model
                  </div>
                  <Toggle value={sc.useDecay} onChange={v => upSc("useDecay", v)} label={sc.useDecay ? "Auto Decay" : "Manual"} C={C} />
                </div>
                {sc.useDecay ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: r("1fr 1fr 1fr", "1fr 1fr 1fr", "1fr"), gap: 12, marginBottom: 14 }}>
                      <NumInput label="Starting Budget" value={sc.startBudget} onChange={v => upSc("startBudget", v)} step={1000} C={C} />
                      <NumInput label="Increment" value={sc.increment} onChange={v => upSc("increment", v)} step={500} C={C} />
                      <NumInput label="# of Steps" value={sc.numSteps} onChange={v => upSc("numSteps", Math.max(2, Math.min(30, Math.round(v))))} prefix="" step={1} C={C} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: r("1fr 1fr", "1fr 1fr", "1fr"), gap: 12, marginBottom: 16 }}>
                      <NumInput label="Starting CPA" value={sc.startCpa} onChange={v => upSc("startCpa", v)} step={0.5} C={C} />
                      <NumInput label="Decay Rate" value={sc.decayRate} onChange={v => upSc("decayRate", v)} prefix="" step={0.01} C={C}
                        info="The rate at which CPA degrades per step. For exponential: 0.12 means CPA grows ~12% compounding per budget increment. Higher = faster degradation." />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: r("1fr 1fr 1fr", "1fr 1fr 1fr", "1fr"), gap: 8 }}>
                      {Object.entries(DECAY_INFO).map(([key, info]) => {
                        const active = sc.decayType === key;
                        return (
                          <div key={key} className="decay-card" onClick={() => upSc("decayType", key)} style={{
                            padding: "12px", borderRadius: 14,
                            background: active ? `linear-gradient(145deg, ${C.cyanD}, ${C.cyan}08)` : C.card,
                            border: `1px solid ${active ? C.cyan + "35" : C.border}`,
                            boxShadow: active ? `0 0 20px ${C.cyanD}, 0 1px 0 ${C.insetHighlight} inset` : `0 1px 0 ${C.insetHighlight} inset`,
                          }}>
                            <MiniDecayChart type={key} active={active} rate={sc.decayRate} C={C} />
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
            <Glass style={{ padding: gp, marginBottom: 16, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) 0.05s both" }} C={C}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{"\u221E"}</span> Subscription / LTV Model
                </div>
                <Toggle value={sc.ltvEnabled} onChange={v => upSc("ltvEnabled", v)} label={sc.ltvEnabled ? "Enabled" : "Disabled"} color={C.purple} C={C} />
              </div>
              {sc.ltvEnabled && (
                <div style={{ display: "grid", gridTemplateColumns: r("repeat(3, 1fr)", "repeat(3, 1fr)", "1fr"), gap: 14, marginTop: 18 }}>
                  <NumInput label="Monthly Churn Rate %" value={sc.churnRate} onChange={v => upSc("churnRate", v)} prefix="%" step={0.5} C={C} />
                  <NumInput label="Avg Lifetime (months)" value={sc.avgLifetimeMonths} onChange={v => upSc("avgLifetimeMonths", v)} prefix="" step={1} C={C} />
                  <NumInput label="Reorder Rate %" value={sc.reorderRate} onChange={v => upSc("reorderRate", v)} prefix="%" step={1} C={C} />
                </div>
              )}
            </Glass>

            {/* MANUAL TIERS */}
            {!sc.useDecay && (
              <Glass style={{ padding: gp, marginBottom: 16 }} C={C}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{"\u25A4"}</span> Manual Budget Tiers
                  </div>
                  <button className="btn" onClick={addManualTier} style={{ padding: "7px 14px", borderRadius: 10, background: C.mintD, border: `1px solid ${C.mint}20`, color: C.mint, fontSize: 11, fontWeight: 600 }}>+ Tier</button>
                </div>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px", minWidth: bp.isMobile ? 600 : "auto" }}>
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
                            <td>{sc.manualTiers.length > 2 && <span onClick={() => rmManualTier(i)} style={{ color: C.dim, cursor: "pointer", fontSize: 14, padding: "3px 6px" }}>{"\u00D7"}</span>}</td>
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
              <Glass style={{ padding: gp, marginBottom: 16, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) 0.1s both" }} C={C}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{"\u25A4"}</span> {tiers.length} Steps \u00B7 {DECAY_INFO[sc.decayType].label} Decay @ {(sc.decayRate * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 2px", minWidth: bp.isMobile ? 600 : "auto" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 2 }}><tr>{["#", "Budget", "CPA", "Orders", "Revenue", "Net Profit", "Margin", "ROAS"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", fontSize: 9, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left", whiteSpace: "nowrap", background: C.bgGradient ? C.bg : C.bg }}>{h}</th>
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
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${r(180, 160, 140)}px, 1fr))`, gap: 10, marginBottom: 22, animation: "fadeScale 0.5s cubic-bezier(0.2,0,0,1) 0.15s both" }}>
          {!isComparing ? (
            <>
              <Metric label="Peak Net Profit" value={fmtF(Math.round(peak.net))} sub={`at ${fmt(peak.budget)} spend`} color={C.mint} C={C} />
              <Metric label="Peak Margin" value={fmtP(peak.margin)} sub={`${fmtF(Math.round(peak.revenue))} rev`} color={C.blue} C={C} />
              <Metric label="Optimal CPA" value={`$${peak.cpa.toFixed(2)}`} sub={`${Math.round(peak.orders).toLocaleString()} orders`} color={C.amber} C={C} />
              <Metric label="Peak ROAS" value={`${peak.roas.toFixed(2)}x`} color={C.purple} C={C} />
              {breakeven && <Metric label="Goes Negative" value={fmt(breakeven.budget)} sub={`CPA $${breakeven.cpa.toFixed(2)}`} color={C.red} C={C} />}
            </>
          ) : (
            scenarios.map((s, i) => {
              const sTiers = s.useDecay ? Array.from({ length: s.numSteps }, (_, j) => ({ budget: s.startBudget + s.increment * j, cpa: decayFns[s.decayType](s.startCpa, s.decayRate, j) })) : s.manualTiers;
              const sData = sTiers.map(t => calcTier(t.budget, t.cpa, s.aov, s.expenses));
              const sPeak = sData.reduce((b, d) => d.net > b.net ? d : b, sData[0]);
              return <Metric key={s.id} label={`${s.name} Peak`} value={fmtF(Math.round(sPeak.net))} sub={`at ${fmt(sPeak.budget)} \u00B7 CPA $${sPeak.cpa.toFixed(2)}`} color={SCOL[i % SCOL.length]} C={C} />;
            })
          )}
        </div>

        {/* TAB NAV */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {[
            { key: "profit", label: bp.isMobile ? "Profit" : "Profit Curve", icon: "\u25C6" },
            ...(!isComparing && sc.ltvEnabled ? [{ key: "ltv", label: bp.isMobile ? "LTV" : "LTV & Cash Flow", icon: "\u221E" }] : []),
            ...(!isComparing ? [{ key: "sensitivity", label: bp.isMobile ? "Sensitivity" : "Sensitivity", icon: "\u25CE" }] : []),
          ].map(t => (
            <button key={t.key} className="btn" onClick={() => setActiveTab(t.key)} style={{
              padding: r("11px 20px", "10px 16px", "9px 14px"), borderRadius: 14, fontSize: r(13, 12, 12), fontWeight: 600,
              background: activeTab === t.key ? `linear-gradient(135deg, ${C.mintD}, ${C.mint}0a)` : C.glass,
              border: `1px solid ${activeTab === t.key ? C.mint + "30" : C.border}`,
              color: activeTab === t.key ? C.mint : C.sub,
              boxShadow: activeTab === t.key ? `0 0 16px ${C.mintD}, 0 1px 0 ${C.insetHighlight} inset` : `0 1px 0 ${C.insetHighlight} inset`,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* ═══ PROFIT CURVE ═══ */}
        {activeTab === "profit" && (
          <>
            <Glass style={{ padding: gpL, marginBottom: 16 }} glow C={C}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{"\u25C6"}</span> {isComparing ? "Scenario Comparison" : "Profit Curve"}
                </div>
                <div style={{ fontSize: r(20, 18, 16), fontWeight: 700, color: C.text }}>{isComparing ? "Net Profit \u2014 All Scenarios Overlaid" : "Net Profit vs. Ad Spend"}</div>
              </div>
              <ResponsiveContainer width="100%" height={chartH1}>
                {isComparing ? (
                  <ComposedChart data={compData} margin={{ top: 10, right: r(30, 20, 10), left: r(20, 10, 0), bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<ChartTip C={C} />} />
                    <Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                    <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} />
                    {scenarios.map((s, i) => <Line key={s.id} type="monotone" dataKey={s.name} stroke={SCOL[i % SCOL.length]} strokeWidth={2.5} dot={{ fill: SCOL[i % SCOL.length], r: 4 }} activeDot={{ r: 6, strokeWidth: 2, stroke: C.text }} />)}
                  </ComposedChart>
                ) : (
                  <AreaChart data={chartD} margin={{ top: 10, right: r(30, 20, 10), left: r(20, 10, 0), bottom: 10 }}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.mint} stopOpacity={0.25} /><stop offset="40%" stopColor={C.mint} stopOpacity={0.05} /><stop offset="100%" stopColor={C.red} stopOpacity={0.06} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<ChartTip C={C} />} />
                    <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Break-Even", fill: C.red, fontSize: 10, position: "insideTopLeft" }} />
                    <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke={C.mint} strokeWidth={2.5} fill="url(#pg)"
                      dot={p => {
                        const { cx, cy, payload } = p; const isPk = payload.budget === peak.budget && payload.net === peak.net;
                        return (<g key={p.index}><circle cx={cx} cy={cy} r={isPk ? 7 : 4} fill={payload.net >= 0 ? C.mint : C.red} opacity={isPk ? 1 : 0.7} />
                          {isPk && <circle cx={cx} cy={cy} r={14} fill="none" stroke={C.mint} strokeWidth={1.5} opacity={0.25}><animate attributeName="r" from="9" to="20" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.35" to="0" dur="2.5s" repeatCount="indefinite" /></circle>}</g>);
                      }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: C.text }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </Glass>
            {!isComparing && (
              <Glass style={{ padding: gpL }} C={C}>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{"\u25A6"}</span> Breakdown</div>
                  <div style={{ fontSize: r(20, 18, 16), fontWeight: 700, color: C.text }}>Revenue vs. Cost Composition</div>
                </div>
                <ResponsiveContainer width="100%" height={chartH2}>
                  <ComposedChart data={chartD.map(d => ({ label: d.label, Revenue: Math.round(d.revenue), "Ad Spend": Math.round(d.budget), "Fulfillment": Math.round(d.orders * sc.expenses), "Net Profit": Math.round(d.net) }))} margin={{ top: 10, right: r(30, 20, 10), left: r(20, 10, 0), bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                    <Tooltip content={<ChartTip C={C} />} />
                    <Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                    <Bar dataKey="Ad Spend" stackId="c" fill={C.red} fillOpacity={0.45} />
                    <Bar dataKey="Fulfillment" stackId="c" fill={C.amber} fillOpacity={0.4} radius={[4, 4, 0, 0]} />
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
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${r(180, 160, 140)}px, 1fr))`, gap: 10, marginBottom: 16 }}>
                  <Metric label="Customer LTV" value={`$${l.ltv.toFixed(2)}`} sub={`over ${sc.avgLifetimeMonths} mo`} color={C.purple} C={C} />
                  <Metric label="LTV Profit / Customer" value={`$${l.lifetimeProfit.toFixed(2)}`} sub="after CPA + expenses" color={C.mint} C={C} />
                  <Metric label="Payback Period" value={l.paybackMonths === Infinity ? "Never" : `${l.paybackMonths.toFixed(1)} mo`} sub="to recoup CPA" color={l.paybackMonths <= 3 ? C.mint : l.paybackMonths <= 6 ? C.amber : C.red} C={C} />
                  <Metric label="LTV : CPA Ratio" value={`${(l.ltv / peak.cpa).toFixed(1)}x`} sub={`$${l.ltv.toFixed(0)} / $${peak.cpa.toFixed(0)}`} color={C.cyan} C={C} />
                </div>
              );
            })()}
            <Glass style={{ padding: gpL, marginBottom: 16 }} glow C={C}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{"\u221E"}</span> LTV Impact</div>
                <div style={{ fontSize: r(20, 18, 16), fontWeight: 700, color: C.text }}>First-Order vs. Lifetime Profit by Budget</div>
              </div>
              <ResponsiveContainer width="100%" height={chartH3}>
                <ComposedChart data={ltvData.map(d => ({ label: d.label, "First-Order": d.firstOrderProfit, "Lifetime": d.lifetimeTotalProfit }))} margin={{ top: 10, right: r(30, 20, 10), left: r(20, 10, 0), bottom: 10 }}>
                  <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.2} /><stop offset="100%" stopColor={C.purple} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<ChartTip C={C} />} /><Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} />
                  <Area type="monotone" dataKey="Lifetime" stroke={C.purple} strokeWidth={2.5} fill="url(#lg)" dot={{ fill: C.purple, r: 4 }} activeDot={{ r: 6, stroke: C.text, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="First-Order" stroke={C.mint} strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: C.mint, r: 4 }} activeDot={{ r: 6, stroke: C.text, strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 14, fontSize: 12, color: C.sub, padding: "12px 16px", background: `linear-gradient(135deg, ${C.purpleD}, transparent)`, borderRadius: 12, border: `1px solid ${C.purple}15`, lineHeight: 1.6 }}>
                The gap between the dashed line (first-order) and filled area (lifetime) is hidden profit from retention. Budget levels that look unprofitable on day one may be wildly profitable over the customer lifecycle.
              </div>
            </Glass>
            <Glass style={{ padding: gpL }} C={C}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{"\u25E7"}</span> Cash Flow Timeline</div>
                <div style={{ fontSize: r(20, 18, 16), fontWeight: 700, color: C.text }}>Cumulative Per-Customer Profit (at peak CPA ${peak.cpa.toFixed(2)})</div>
              </div>
              <ResponsiveContainer width="100%" height={chartH2}>
                <ComposedChart data={cashFlowData} margin={{ top: 10, right: r(30, 20, 10), left: r(20, 10, 0), bottom: 10 }}>
                  <defs><linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.18} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTip C={C} />} /><Legend formatter={v => <span style={{ color: C.sub, fontSize: 11 }}>{v}</span>} />
                  <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Break-Even", fill: C.red, fontSize: 10, position: "insideTopLeft" }} />
                  <Area type="monotone" dataKey="cumProfit" name="Cumulative Profit" stroke={C.cyan} strokeWidth={2.5} fill="url(#cf)" dot={{ fill: C.cyan, r: 3 }} activeDot={{ r: 6, stroke: C.text, strokeWidth: 2 }} />
                  <Bar dataKey="monthly" name="Monthly Net" fill={C.mint} fillOpacity={0.25} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 14, fontSize: 12, color: C.sub, padding: "12px 16px", background: `linear-gradient(135deg, ${C.cyanD}, transparent)`, borderRadius: 12, border: `1px solid ${C.cyan}15`, lineHeight: 1.6 }}>
                The valley of death \u2014 CPA paid upfront, recouped over months. The curve crossing zero = payback point. Everything above is pure profit.
              </div>
            </Glass>
          </>
        )}

        {/* ═══ SENSITIVITY ═══ */}
        {activeTab === "sensitivity" && !isComparing && (
          <Glass style={{ padding: gpL }} glow C={C}>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{"\u25CE"}</span> Sensitivity Analysis</div>
              <div style={{ fontSize: r(20, 18, 16), fontWeight: 700, color: C.text }}>What if {sensiAxis === "cpa" ? "CPA" : "AOV"} shifts at peak budget?</div>
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
              {[15, 30, 50].map(rv => (
                <button key={rv} className="btn" onClick={() => setSensiRange(rv)} style={{
                  padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: sensiRange === rv ? C.purpleD : "transparent", border: `1px solid ${sensiRange === rv ? C.purple + "40" : C.border}`, color: sensiRange === rv ? C.purple : C.sub,
                }}>{"\u00B1"}{rv}%</button>
              ))}
            </div>
            <div style={{ marginBottom: 18, padding: "12px 16px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              Testing at <strong style={{ color: C.text }}>{fmt(peak.budget)} budget</strong> with base <strong style={{ color: C.text }}>{sensiAxis === "cpa" ? `CPA $${peak.cpa.toFixed(2)}` : `AOV $${sc.aov.toFixed(2)}`}</strong>. Break-even CPA: <strong style={{ color: C.amber }}>${breakevenCpa.toFixed(2)}</strong>
            </div>
            <ResponsiveContainer width="100%" height={chartH3}>
              <AreaChart data={sensiData} margin={{ top: 10, right: r(30, 20, 10), left: r(20, 10, 0), bottom: 10 }}>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={sensiAxis === "cpa" ? C.amber : C.blue} stopOpacity={0.18} /><stop offset="100%" stopColor={sensiAxis === "cpa" ? C.amber : C.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} label={{ value: `${sensiAxis === "cpa" ? "CPA" : "AOV"} Change`, position: "insideBottom", offset: -5, style: { fontSize: 10, fill: C.dim } }} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip content={<ChartTip C={C} />} />
                <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 4" strokeOpacity={0.4} />
                <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke={sensiAxis === "cpa" ? C.amber : C.blue} strokeWidth={2.5} fill="url(#sg)"
                  dot={p => <circle key={p.index} cx={p.cx} cy={p.cy} r={p.payload.isBase ? 7 : 4} fill={p.payload.netProfit >= 0 ? (sensiAxis === "cpa" ? C.amber : C.blue) : C.red} stroke={p.payload.isBase ? C.text : "none"} strokeWidth={p.payload.isBase ? 2 : 0} opacity={0.85} />}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: C.text }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: r("repeat(3, 1fr)", "repeat(3, 1fr)", "1fr"), gap: 10, marginTop: 18 }}>
              <Metric small label={`Worst (${sensiAxis === "cpa" ? "+" : "-"}${sensiRange}%)`} value={fmtF(sensiData[sensiAxis === "cpa" ? sensiData.length - 1 : 0].netProfit)} color={sensiData[sensiAxis === "cpa" ? sensiData.length - 1 : 0].netProfit >= 0 ? C.amber : C.red} C={C} />
              <Metric small label="Base Case" value={fmtF(sensiData[Math.floor(sensiData.length / 2)].netProfit)} color={C.mint} C={C} />
              <Metric small label={`Best (${sensiAxis === "cpa" ? "-" : "+"}${sensiRange}%)`} value={fmtF(sensiData[sensiAxis === "cpa" ? 0 : sensiData.length - 1].netProfit)} color={C.cyan} C={C} />
            </div>
          </Glass>
        )}

        <div style={{ textAlign: "center", color: C.dim, fontSize: 11, marginTop: 28, letterSpacing: "0.02em" }}>Find where profit peaks before diminishing returns erode your margins.</div>
      </div>
    </div>
  );
}
