import { useState, useRef, useEffect, useCallback } from "react";

// ── Palette & design tokens ──────────────────────────────────────
// Deep-ocean navy base, bioluminescent teal accent, danger amber/red
// Typeface: system-ui for data, with a bold tracking display for headings

const COLORS = {
  navy: "#05122b",
  navyMid: "#0a1f45",
  navyLight: "#112860",
  teal: "#00d4aa",
  tealDim: "#00a882",
  tealGlow: "rgba(0,212,170,0.15)",
  amber: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
  text: "#e2f0ff",
  textDim: "#7da8c8",
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.10)",
};

// ── Fake DB ──────────────────────────────────────────────────────
const SEED_REPORTS = [
  { id: 1, user: "Arjun Sharma", type: "Oil Spill", risk: "High", lat: 19.076, lng: 72.877, location: "Mumbai Coast", date: "2024-06-10", status: "Verified", score: 88 },
  { id: 2, user: "Priya Nair", type: "Plastic Waste", risk: "Medium", lat: 8.524, lng: 76.936, location: "Kerala Backwaters", date: "2024-06-09", status: "Pending", score: 55 },
  { id: 3, user: "Rahul Das", type: "Sewage", risk: "High", lat: 22.572, lng: 88.363, location: "Hooghly River, Kolkata", date: "2024-06-08", status: "Cleanup Done", score: 92 },
  { id: 4, user: "Sneha Kulkarni", type: "Industrial Waste", risk: "Medium", lat: 13.082, lng: 80.270, location: "Chennai Harbor", date: "2024-06-07", status: "Verified", score: 62 },
  { id: 5, user: "Vikram Mehta", type: "Plastic Waste", risk: "Low", lat: 15.299, lng: 74.123, location: "Goa Beach", date: "2024-06-06", status: "Pending", score: 28 },
];

// ── Risk badge ───────────────────────────────────────────────────
function RiskBadge({ risk }) {
  const map = {
    High: { color: COLORS.red, bg: "rgba(239,68,68,0.15)" },
    Medium: { color: COLORS.amber, bg: "rgba(245,158,11,0.15)" },
    Low: { color: COLORS.green, bg: "rgba(34,197,94,0.15)" },
  };
  const s = map[risk] || map.Low;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
      border: `1px solid ${s.color}44`, letterSpacing: ".03em"
    }}>{risk}</span>
  );
}

// ── Status badge ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Verified: COLORS.teal,
    Pending: COLORS.amber,
    "Cleanup Done": COLORS.green,
  };
  const c = map[status] || COLORS.textDim;
  return (
    <span style={{ color: c, fontSize: 12, fontWeight: 600 }}>● {status}</span>
  );
}

// ── Glass card ───────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: COLORS.glass,
      border: `1px solid ${COLORS.glassBorder}`,
      borderRadius: 16,
      padding: "20px 24px",
      ...style
    }}>{children}</div>
  );
}

// ── Stat tile ────────────────────────────────────────────────────
function StatTile({ label, value, accent, sub }) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <div style={{ color: COLORS.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>{label}</div>
      <div style={{ color: accent || COLORS.teal, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: COLORS.textDim, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// ── Pulse dot ────────────────────────────────────────────────────
function PulseDot({ color = COLORS.teal }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16 }}>
      <span style={{
        position: "absolute", width: 16, height: 16, borderRadius: "50%",
        background: color, opacity: .25,
        animation: "pulse 1.8s infinite"
      }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, position: "relative" }} />
    </span>
  );
}

// ── Simple map placeholder ───────────────────────────────────────
function MapView({ reports }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // Ocean gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#05122b");
    grad.addColorStop(1, "#0a2a4a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw India outline (simplified polygon)
    const indiaPts = [
      [0.42,0.10],[0.55,0.10],[0.65,0.18],[0.68,0.28],[0.72,0.35],
      [0.75,0.50],[0.72,0.60],[0.65,0.70],[0.58,0.80],[0.52,0.90],
      [0.50,0.95],[0.48,0.88],[0.42,0.78],[0.35,0.65],[0.30,0.55],
      [0.28,0.42],[0.30,0.30],[0.35,0.20],[0.42,0.12],
    ];
    ctx.beginPath();
    ctx.moveTo(indiaPts[0][0]*W, indiaPts[0][1]*H);
    indiaPts.forEach(p => ctx.lineTo(p[0]*W, p[1]*H));
    ctx.closePath();
    ctx.fillStyle = "rgba(17,40,96,0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,212,170,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = "rgba(0,212,170,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Map lat/lng → canvas (India approx bounds: lat 8-36, lng 68-97)
    function project(lat, lng) {
      const x = ((lng - 68) / (97 - 68)) * W;
      const y = ((36 - lat) / (36 - 8)) * H;
      return [x, y];
    }

    // Heat glow
    reports.forEach(r => {
      const [x, y] = project(r.lat, r.lng);
      const riskColor = r.risk === "High" ? "255,60,60" : r.risk === "Medium" ? "245,158,11" : "34,197,94";
      const radGrad = ctx.createRadialGradient(x, y, 0, x, y, 40);
      radGrad.addColorStop(0, `rgba(${riskColor},0.35)`);
      radGrad.addColorStop(1, `rgba(${riskColor},0)`);
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fillStyle = radGrad;
      ctx.fill();
    });

    // Markers
    reports.forEach(r => {
      const [x, y] = project(r.lat, r.lng);
      const riskColor = r.risk === "High" ? "#ef4444" : r.risk === "Medium" ? "#f59e0b" : "#22c55e";

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = riskColor;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = COLORS.text;
      ctx.font = "10px system-ui";
      ctx.fillText(r.location.split(",")[0], x + 8, y + 4);
    });

    // Title
    ctx.fillStyle = "rgba(0,212,170,0.7)";
    ctx.font = "bold 11px system-ui";
    ctx.fillText("POLLUTION HOTSPOT MAP — INDIA", 12, 18);

  }, [reports]);

  return (
    <canvas ref={canvasRef} width={520} height={380}
      style={{ width: "100%", height: "auto", borderRadius: 12, border: `1px solid ${COLORS.glassBorder}` }} />
  );
}

// ── AI Analysis result display ───────────────────────────────────
function AnalysisResult({ result, imageUrl }) {
  if (!result) return null;
  const riskColor = result.risk === "High" ? COLORS.red : result.risk === "Medium" ? COLORS.amber : COLORS.green;

  return (
    <Card style={{ marginTop: 16, borderColor: `${riskColor}44` }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        {imageUrl && (
          <img src={imageUrl} alt="Uploaded"
            style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.glassBorder}`, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>AI Analysis Complete</span>
            <RiskBadge risk={result.risk} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 2 }}>POLLUTION TYPE</div>
              <div style={{ color: COLORS.text, fontWeight: 600 }}>{result.type}</div>
            </div>
            <div>
              <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 2 }}>RISK SCORE</div>
              <div style={{ color: riskColor, fontWeight: 800, fontSize: 20 }}>{result.score}/100</div>
            </div>
          </div>
          {/* Score bar */}
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 6, marginBottom: 12 }}>
            <div style={{
              width: `${result.score}%`, height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${COLORS.teal}, ${riskColor})`,
              transition: "width .8s ease"
            }} />
          </div>
          <p style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.summary}</p>
          {result.recommendations && (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 4 }}>RECOMMENDATIONS</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.text, fontSize: 13, lineHeight: 1.8 }}>
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function BlueWatchAI() {
  const [tab, setTab] = useState("dashboard");
  const [reports, setReports] = useState(SEED_REPORTS);
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ name: "", email: "", password: "" });
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");

  // Report form
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [location, setLocation] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);

  // Fake user DB
  const [users, setUsers] = useState([
    { name: "Admin", email: "admin@bluewatch.ai", password: "admin123", role: "authority" }
  ]);

  const fileRef = useRef();

  // ── Auth ──────────────────────────────────────────────────────
  function handleAuth(e) {
    e.preventDefault();
    setAuthError("");
    if (authMode === "register") {
      if (!loginForm.name || !loginForm.email || !loginForm.password) {
        setAuthError("All fields required."); return;
      }
      const newUser = { ...loginForm, role: "user" };
      setUsers(u => [...u, newUser]);
      setUser(newUser);
    } else {
      const found = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
      if (!found) { setAuthError("Invalid email or password."); return; }
      setUser(found);
    }
    setTab("dashboard");
  }

  // ── Image upload ──────────────────────────────────────────────
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
    setReportSubmitted(false);
  }

  // ── Geolocation ───────────────────────────────────────────────
  function detectLocation() {
    if (!navigator.geolocation) { setLocation("Location not available"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setLocation("Permission denied")
    );
  }

  // ── AI Analysis via Anthropic ─────────────────────────────────
  async function analyzeImage() {
    if (!imageFile) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Convert image to base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(imageFile);
      });

      const mediaType = imageFile.type || "image/jpeg";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `You are BlueWatch AI, a marine pollution detection system. Analyze images of water bodies and return ONLY a valid JSON object (no markdown, no preamble) with these fields:
{
  "type": "Oil Spill | Plastic Waste | Sewage Contamination | Industrial Waste | General Pollution | Clean Water",
  "risk": "High | Medium | Low",
  "score": <integer 0-100>,
  "summary": "<2-3 sentence analysis>",
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"]
}
Be realistic. If the image doesn't show water pollution clearly, use "Clean Water" type with a low score.`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Analyze this image for marine/water pollution and return the JSON." }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysisResult(parsed);
    } catch (err) {
      setAnalysisResult({
        type: "General Pollution",
        risk: "Medium",
        score: 55,
        summary: "AI analysis could not fully process this image. Manual review is recommended by environmental authorities.",
        recommendations: ["Submit report for manual review", "Contact local environmental agency", "Document the area with additional photos"]
      });
    }
    setAnalyzing(false);
  }

  // ── Submit report ─────────────────────────────────────────────
  function submitReport() {
    if (!analysisResult) return;
    const newReport = {
      id: reports.length + 1,
      user: user.name,
      type: analysisResult.type,
      risk: analysisResult.risk,
      lat: geoCoords?.lat ?? (18 + Math.random() * 10),
      lng: geoCoords?.lng ?? (72 + Math.random() * 15),
      location: location || "Unknown Location",
      date: new Date().toISOString().slice(0, 10),
      status: "Pending",
      score: analysisResult.score
    };
    setReports(r => [newReport, ...r]);
    setReportSubmitted(true);
  }

  // ── Stats ─────────────────────────────────────────────────────
  const highRisk = reports.filter(r => r.risk === "High").length;
  const pending = reports.filter(r => r.status === "Pending").length;
  const avgScore = Math.round(reports.reduce((a, r) => a + r.score, 0) / reports.length);
  const healthScore = Math.max(0, 100 - avgScore);

  // ── NAV ───────────────────────────────────────────────────────
  const NAV = user
    ? [
        { id: "dashboard", icon: "◈", label: "Dashboard" },
        { id: "report", icon: "⊕", label: "Report Pollution" },
        { id: "map", icon: "◉", label: "Pollution Map" },
        { id: "alerts", icon: "◬", label: "Alerts" },
        ...(user.role === "authority" ? [{ id: "authority", icon: "⊞", label: "Authority Panel" }] : []),
      ]
    : [];

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, #071530 60%, #030d1e 100%)`,
      color: COLORS.text,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      fontSize: 14,
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.25} 50%{transform:scale(1.6);opacity:.05} }
        @keyframes shimmer { from{opacity:.6} to{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,170,0.3); border-radius: 99px; }
        button:focus-visible { outline: 2px solid #00d4aa; outline-offset: 2px; }
        input:focus { outline: none; border-color: #00d4aa !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: "rgba(5,18,43,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${COLORS.glassBorder}`,
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="none" stroke={COLORS.teal} strokeWidth="1.5" opacity=".4"/>
            <circle cx="16" cy="16" r="9" fill="none" stroke={COLORS.teal} strokeWidth="1.5" opacity=".7"/>
            <circle cx="16" cy="16" r="4" fill={COLORS.teal}/>
            <path d="M8 20 Q16 14 24 20" stroke={COLORS.teal} strokeWidth="1.5" fill="none" opacity=".5"/>
          </svg>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.01em", color: "#fff" }}>BlueWatch AI</div>
            <div style={{ fontSize: 10, color: COLORS.teal, letterSpacing: ".12em", marginTop: -2 }}>MARINE POLLUTION INTELLIGENCE</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                <PulseDot />
                <span style={{ color: COLORS.textDim, fontSize: 13 }}>Live</span>
              </div>
              <div style={{
                background: COLORS.tealGlow, border: `1px solid ${COLORS.teal}44`,
                borderRadius: 99, padding: "4px 14px", fontSize: 13, color: COLORS.teal
              }}>{user.name}</div>
              <button onClick={() => { setUser(null); setTab("login"); }}
                style={{ background: "transparent", border: `1px solid ${COLORS.glassBorder}`, color: COLORS.textDim,
                  borderRadius: 99, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Sign out</button>
            </>
          )}
        </div>
      </header>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", minHeight: "calc(100vh - 60px)" }}>

        {/* ── Sidebar ── */}
        {user && (
          <nav style={{
            width: 200, flexShrink: 0,
            borderRight: `1px solid ${COLORS.glassBorder}`,
            padding: "24px 12px",
            display: "flex", flexDirection: "column", gap: 4
          }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  border: "none", textAlign: "left", width: "100%", fontSize: 13,
                  background: tab === n.id ? COLORS.tealGlow : "transparent",
                  color: tab === n.id ? COLORS.teal : COLORS.textDim,
                  borderLeft: tab === n.id ? `2px solid ${COLORS.teal}` : "2px solid transparent",
                  transition: ".1s"
                }}
              >
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: "32px 24px", overflowY: "auto" }}>

          {!user ? (
            // ── Login/Register ──
            <div style={{ maxWidth: 400, margin: "60px auto" }}>
              <Card>
                <h2 style={{ textAlign: "center", margin: "0 0 24px 0", fontSize: 24, fontWeight: 700 }}>
                  {authMode === "login" ? "Sign In" : "Create Account"}
                </h2>
                <form onSubmit={handleAuth}>
                  {authMode === "register" && (
                    <input placeholder="Full Name" value={loginForm.name}
                      onChange={e => setLoginForm({...loginForm, name: e.target.value})}
                      style={{ width: "100%", padding: "10px 12px", marginBottom: 10, border: `1px solid ${COLORS.glassBorder}`, borderRadius: 8, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 13 }} />
                  )}
                  <input placeholder="Email" type="email" value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    style={{ width: "100%", padding: "10px 12px", marginBottom: 10, border: `1px solid ${COLORS.glassBorder}`, borderRadius: 8, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 13 }} />
                  <input placeholder="Password" type="password" value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: `1px solid ${COLORS.glassBorder}`, borderRadius: 8, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 13 }} />
                  {authError && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 12 }}>{authError}</div>}
                  <button type="submit" style={{
                    width: "100%", padding: "10px", background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDim})`,
                    color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13
                  }}>
                    {authMode === "login" ? "Sign In" : "Register"}
                  </button>
                </form>
                <div style={{ textAlign: "center", marginTop: 16, fontSize: 12 }}>
                  <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}
                    style={{ background: "transparent", border: "none", color: COLORS.teal, cursor: "pointer", textDecoration: "underline" }}>
                    {authMode === "login" ? "Need account?" : "Have account?"}
                  </button>
                </div>
              </Card>
            </div>
          ) : tab === "dashboard" ? (
            // ── Dashboard ──
            <div>
              <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
                <StatTile label="High Risk" value={highRisk} accent={COLORS.red} />
                <StatTile label="Pending" value={pending} accent={COLORS.amber} />
                <StatTile label="Avg Score" value={avgScore} />
                <StatTile label="Health" value={healthScore} accent={COLORS.green} />
              </div>
              <h2 style={{ margin: "24px 0 16px 0", fontSize: 18, fontWeight: 700 }}>Pollution Hotspot Map</h2>
              <MapView reports={reports} />
              <h2 style={{ margin: "24px 0 16px 0", fontSize: 18, fontWeight: 700 }}>Recent Reports</h2>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {reports.slice(0, 10).map(r => (
                  <Card key={r.id} style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: COLORS.text, fontWeight: 600 }}>{r.location}</div>
                      <div style={{ color: COLORS.textDim, fontSize: 12 }}>{r.type} • {r.date}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RiskBadge risk={r.risk} />
                      <StatusBadge status={r.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : tab === "report" ? (
            // ── Report Pollution ──
            <div style={{ maxWidth: 600 }}>
              <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 800 }}>Report Pollution</h1>
              {reportSubmitted && (
                <Card style={{ background: "rgba(34,197,94,0.1)", borderColor: COLORS.green, marginBottom: 16 }}>
                  <div style={{ color: COLORS.green, fontWeight: 700 }}>✓ Report submitted successfully!</div>
                </Card>
              )}
              <Card style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 6 }}>UPLOAD IMAGE</div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange}
                    style={{ width: "100%", padding: "8px", border: `1px dashed ${COLORS.tealGlow}`, borderRadius: 8, background: "transparent", color: COLORS.text, cursor: "pointer" }} />
                  {imageUrl && <img src={imageUrl} alt="Preview" style={{ width: "100%", marginTop: 12, borderRadius: 8, maxHeight: 300 }} />}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 6 }}>LOCATION</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Location (manual)" value={location} onChange={e => setLocation(e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", border: `1px solid ${COLORS.glassBorder}`, borderRadius: 8, background: "rgba(255,255,255,0.03)", color: COLORS.text, fontSize: 13 }} />
                    <button onClick={detectLocation}
                      style={{ padding: "8px 16px", background: COLORS.teal, color: "#000", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Detect</button>
                  </div>
                </div>
                <button onClick={analyzeImage} disabled={!imageFile || analyzing}
                  style={{
                    width: "100%", padding: "12px", background: analyzing ? COLORS.textDim : `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.tealDim})`,
                    color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13, opacity: analyzing ? 0.6 : 1
                  }}>
                  {analyzing ? "Analyzing..." : "Analyze with AI"}
                </button>
              </Card>
              {analysisResult && (
                <>
                  <AnalysisResult result={analysisResult} imageUrl={imageUrl} />
                  <button onClick={submitReport}
                    style={{
                      marginTop: 16, width: "100%", padding: "12px", background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.teal})`,
                      color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13
                    }}>
                    Submit Report
                  </button>
                </>
              )}
            </div>
          ) : tab === "map" ? (
            <div>
              <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 800 }}>Pollution Map</h1>
              <MapView reports={reports} />
            </div>
          ) : tab === "alerts" ? (
            <div>
              <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 800 }}>Alerts</h1>
              <Card>
                <div style={{ color: COLORS.textDim, textAlign: "center", padding: "40px 20px" }}>No critical alerts at this time.</div>
              </Card>
            </div>
          ) : tab === "authority" ? (
            <div>
              <h1 style={{ margin: "0 0 24px 0", fontSize: 28, fontWeight: 800 }}>Authority Panel</h1>
              <Card>
                <div style={{ color: COLORS.text, marginBottom: 16 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 4 }}>TOTAL REPORTS</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{reports.length}</div>
                </div>
                <div style={{ color: COLORS.text, marginBottom: 16 }}>
                  <div style={{ color: COLORS.textDim, fontSize: 11, marginBottom: 4 }}>HIGH RISK ZONES</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.red }}>{highRisk}</div>
                </div>
              </Card>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
} 