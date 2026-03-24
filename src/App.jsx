// AutoKosten v2 fix5
// Nieuw: kostenlijst ingeklapt per jaar, MRB overschrijfbaar bedrag,
//        verzekering als jaarbedrag -> 12 maandposten automatisch

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

const APP_VERSION = "v2 fix5";
const STORAGE_KEY = "autokosten_v2";

const COLORS = {
  primary: "#1B4F72", accent: "#E67E22", success: "#27AE60",
  danger: "#E74C3C", lease: "#8E44AD",
};

const COST_CATEGORIES = [
  { id: "brandstof",      label: "Brandstof / Laden",   variabel: true,  icon: "⛽" },
  { id: "onderhoud",      label: "Onderhoud & APK",      variabel: false, icon: "🔧" },
  { id: "reparatie",      label: "Reparaties",           variabel: false, icon: "🛠" },
  { id: "verzekering",    label: "Verzekering",          variabel: false, icon: "🛡" },
  { id: "wegenbelasting", label: "Wegenbelasting (MRB)", variabel: false, icon: "📋" },
  { id: "banden",         label: "Banden",               variabel: false, icon: "🔘" },
  { id: "parkeren",       label: "Parkeren & tol",       variabel: true,  icon: "🅿" },
  { id: "wassen",         label: "Wassen & poetsen",     variabel: false, icon: "💧" },
  { id: "overig",         label: "Overig",               variabel: false, icon: "📦" },
];

const MRB_OPCENTEN = {
  "groningen": 105.7, "friesland": 77.8, "drenthe": 83.2, "overijssel": 103.3,
  "gelderland": 91.5, "utrecht": 112.8, "noord-holland": 116.8, "zuid-holland": 101.0,
  "zeeland": 70.2, "noord-brabant": 96.3, "limburg": 92.4, "flevoland": 88.5,
};

const fmt  = (v) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v || 0);
const fmtC = (v) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat("nl-NL").format(Math.round(v || 0));

function mrbBenzineKwartaal(kg) {
  const tabel = [
    [500,40],[600,55],[700,67],[800,79],[900,91],[1000,103],
    [1100,116],[1200,128],[1300,140],[1400,153],[1500,165],
    [1600,177],[1700,190],[1800,202],[1900,214],[2000,227],
    [2100,239],[2500,299],
  ];
  const g = Number(kg);
  for (const [grens, bedrag] of tabel) { if (g <= grens) return bedrag; }
  return 299 + Math.ceil((g - 2500) / 100) * 12;
}

function berekenMRBSchatting(gewichtKg, brandstof, provincie) {
  if (!gewichtKg || Number(gewichtKg) < 100) return null;
  const opcenten = MRB_OPCENTEN[provincie?.toLowerCase()] ?? 91.5;
  const bf = (brandstof || "").toLowerCase();
  let basis = 0;
  if (!bf.includes("elektrisch") && !bf.includes("waterstof")) {
    basis = mrbBenzineKwartaal(gewichtKg);
    if (bf.includes("diesel"))   basis += 96;
    else if (bf.includes("lpg")) basis += 20;
  }
  const metOp = basis * (1 + opcenten / 100);
  return { kwartaal: Math.round(metOp), jaarlijks: Math.round(metOp * 4), basisBedrag: Math.round(basis), opcenten };
}

// MRB: gebruik werkelijk bedrag als opgegeven, anders schatting
function getMrbKwartaal(mrbSchatting, mrbWerkelijkMaand) {
  if (mrbWerkelijkMaand && Number(mrbWerkelijkMaand) > 0) {
    return Math.round(Number(mrbWerkelijkMaand) * 3);
  }
  return mrbSchatting?.kwartaal || 0;
}

// Genereer kwartaalposten MRB
function genereerMrbPosten(aankoopdatum, verkoopdatum, kwartaalBedrag) {
  if (!kwartaalBedrag || kwartaalBedrag <= 0) return [];
  const einde = new Date(verkoopdatum);
  const d = new Date(aankoopdatum);
  d.setDate(1);
  // Spring naar eerstvolgende kwartaalmaand (jan=0, apr=3, jul=6, okt=9)
  const kwartaalMaand = Math.ceil((d.getMonth() + 1) / 3) * 3 % 12;
  d.setMonth(kwartaalMaand === 0 ? 12 : kwartaalMaand);
  if (d <= new Date(aankoopdatum)) d.setMonth(d.getMonth() + 3);
  const posten = [];
  while (d <= einde) {
    posten.push({
      id: `mrb_${d.toISOString().slice(0,10)}`,
      datum: d.toISOString().slice(0,10),
      categorie: "wegenbelasting",
      bedrag: kwartaalBedrag,
      km: null,
      omschrijving: "MRB kwartaal",
      automatisch: true,
      type: "mrb",
    });
    d.setMonth(d.getMonth() + 3);
  }
  return posten;
}

// Genereer maandposten verzekering per jaar
function genereerVerzekeringPosten(aankoopdatum, verkoopdatum, verzekeringJaren) {
  // verzekeringJaren: [{startJaar, bedrag}]  bijv [{startJaar:2022, bedrag:1200}]
  if (!verzekeringJaren?.length) return [];
  const einde = new Date(verkoopdatum);
  const posten = [];
  for (const { startJaar, bedrag } of verzekeringJaren) {
    if (!bedrag || bedrag <= 0) continue;
    const maandBedrag = Math.round(bedrag / 12);
    for (let m = 0; m < 12; m++) {
      const d = new Date(startJaar, m, 1);
      if (d < new Date(aankoopdatum) || d > einde) continue;
      posten.push({
        id: `verz_${startJaar}_${m}`,
        datum: d.toISOString().slice(0,10),
        categorie: "verzekering",
        bedrag: maandBedrag,
        km: null,
        omschrijving: `Verzekering ${startJaar} (automatisch)`,
        automatisch: true,
        type: "verzekering",
      });
    }
  }
  return posten;
}

function berekenLeasePrive(catalogus, looptijdMnd, kmPerJaar, aanbetaling) {
  const restwaarde = catalogus * Math.max(0.15, 0.55 - looptijdMnd * 0.005);
  const afschr     = (catalogus - (aanbetaling || 0) - restwaarde) / looptijdMnd;
  const rente      = (catalogus * 0.038) / 12;
  const onderhoud  = 55 + (kmPerJaar / 12) * 0.022;
  const verz       = catalogus * 0.0017;
  return Math.max(Math.round(afschr + rente + onderhoud + verz), 199);
}

function afschrijvingsCurve(aankoopprijs, verkoopprijs, jaren) {
  const totaal = aankoopprijs - verkoopprijs;
  return Array.from({ length: Math.ceil(jaren) + 1 }, (_, j) => ({
    jaar: j,
    waarde: Math.round(verkoopprijs + totaal * (1 - Math.pow(j / Math.max(jaren, 1), 0.65))),
  }));
}

function defaultState() {
  return {
    kenteken: "", merk: "", model: "", bouwjaar: "",
    brandstof: "", gewichtKg: "", provincie: "gelderland",
    aankoopprijs: 25000, aankoopdatum: "2022-01-01",
    verwachteVerkoopdatum: "2027-01-01", verwachtVerkoopprijs: 12000,
    jaarlijkseKm: 15000, cataloguswaarde: 30000,
    leaseLooptijd: 48, leaseKm: 15000, leaseAanbetaling: 0,
    mrbAutomatisch: false,
    mrbWerkelijkMaand: "",
    verzekeringAutomatisch: false,
    verzekeringJaren: [],
    mobiliteitBrutoMaand: "",
    kmVergTarief: "0.23",
    kmVergKmMaand: "",
    kmVergMaandTotaal: "",
    belastingschijf: 36.9,
    bijtellingPct: 22,
    kosten: [],
  };
}

// ─── UI ──────────────────────────────────────────────────────────────────────

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", border: "0.5px solid #e0ddd8", borderRadius: 12, padding: "1.25rem", ...style }}>
    {children}
  </div>
);

const MetricCard = ({ label, value, sub, color }) => (
  <div style={{ background: "#f7f6f2", borderRadius: 8, padding: "0.875rem 1rem", flex: 1, minWidth: 110 }}>
    <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 21, fontWeight: 500, color: color || "#1a1a1a" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "#bbb", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
    {children}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #e8e6e0", marginBottom: "1.5rem", overflowX: "auto" }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: "10px 14px", fontSize: 13, fontWeight: active === t.id ? 600 : 400,
        background: "none", border: "none", whiteSpace: "nowrap",
        borderBottom: active === t.id ? `2px solid ${COLORS.primary}` : "2px solid transparent",
        color: active === t.id ? COLORS.primary : "#999",
        cursor: "pointer", marginBottom: -1,
      }}>{t.label}</button>
    ))}
  </div>
);

const Row = ({ label, children, wide }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    <label style={{ fontSize: 13, color: "#666", width: wide ? 160 : 120, flexShrink: 0 }}>{label}</label>
    {children}
  </div>
);

const Toggle = ({ checked, onChange, label, sub }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: checked ? "#f0faf4" : "#f7f6f2", borderRadius: 8, marginBottom: 8 }}>
    <label style={{ position: "relative", width: 36, height: 20, display: "inline-block", flexShrink: 0, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ position: "absolute", inset: 0, background: checked ? COLORS.success : "#ccc", borderRadius: 20, transition: "background 0.2s" }} />
      <span style={{ position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "left 0.2s", pointerEvents: "none" }} />
    </label>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#999" }}>{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "0.5px solid #ddd", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <div style={{ fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {fmt(p.value)}</div>)}
    </div>
  );
};

// Inline edit rij
function EditRij({ kost, onSave, onCancel }) {
  const [e, setE] = useState({ ...kost, bedrag: String(kost.bedrag), km: kost.km ? String(kost.km) : "" });
  return (
    <tr style={{ background: "#fffbf5" }}>
      <td style={{ padding: "4px 4px" }}><input type="date" value={e.datum} onChange={x => setE(p => ({ ...p, datum: x.target.value }))} style={{ width: 130 }} /></td>
      <td style={{ padding: "4px 4px" }}>
        <select value={e.categorie} onChange={x => setE(p => ({ ...p, categorie: x.target.value }))} style={{ width: 160 }}>
          {COST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </td>
      <td style={{ padding: "4px 4px" }}><input type="number" value={e.bedrag} onChange={x => setE(p => ({ ...p, bedrag: x.target.value }))} style={{ width: 80 }} /></td>
      <td style={{ padding: "4px 4px" }}><input type="number" placeholder="—" value={e.km} onChange={x => setE(p => ({ ...p, km: x.target.value }))} style={{ width: 90 }} /></td>
      <td style={{ padding: "4px 4px" }}><input value={e.omschrijving} onChange={x => setE(p => ({ ...p, omschrijving: x.target.value }))} style={{ width: "100%" }} /></td>
      <td style={{ padding: "4px 4px", whiteSpace: "nowrap" }}>
        <button onClick={() => onSave({ ...e, bedrag: Number(e.bedrag), km: e.km ? Number(e.km) : null })}
          style={{ background: COLORS.success, color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer", marginRight: 4, fontSize: 12 }}>✓</button>
        <button onClick={onCancel}
          style={{ background: "none", border: "0.5px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✕</button>
      </td>
    </tr>
  );
}

// Categorie-rij binnen een jaar: inklapbaar, toont posten als open
function CatGroep({ catId, posten, editId, setEditId, onSave, onVerwijder }) {
  const [open, setOpen] = useState(false);
  const cat    = COST_CATEGORIES.find(c => c.id === catId);
  const totaal = posten.reduce((s, k) => s + Number(k.bedrag), 0);
  const auto   = posten.filter(k => k.automatisch).length;
  return (
    <div>
      {/* Categorie-header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px 7px 28px", background: "#fafaf8", borderBottom: "0.5px solid #f0ede8", cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontSize: 11, color: open ? COLORS.accent : "#bbb", transform: `rotate(${open ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s", width: 10 }}>▶</span>
        <span style={{ fontSize: 13 }}>{cat?.icon} {cat?.label || catId}</span>
        <span style={{ fontSize: 11, color: "#bbb" }}>{posten.length} posten{auto > 0 ? ` (${auto} auto)` : ""}</span>
        <span style={{ marginLeft: "auto", fontWeight: 500, fontSize: 13 }}>{fmt(totaal)}</span>
      </div>
      {/* Posten binnen categorie */}
      {open && posten.map(k => {
        if (editId === k.id) {
          return (
            <table key={k.id} style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody><EditRij kost={k} onSave={onSave} onCancel={() => setEditId(null)} /></tbody>
            </table>
          );
        }
        return (
          <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 0, padding: "6px 12px 6px 52px", borderBottom: "0.5px solid #f5f4f0", background: k.automatisch ? "#f9fdf9" : "#fff", fontSize: 13 }}>
            <span style={{ color: "#aaa", width: 100, flexShrink: 0 }}>{k.datum}</span>
            <span style={{ fontWeight: 500, width: 80, flexShrink: 0 }}>{fmt(k.bedrag)}</span>
            <span style={{ color: "#bbb", width: 80, flexShrink: 0 }}>{k.km ? fmtN(k.km) : "—"}</span>
            <span style={{ color: "#999", flex: 1 }}>
              {k.omschrijving || "—"}
              {k.automatisch && <span style={{ marginLeft: 6, fontSize: 11, color: COLORS.success, background: "#e8f8ef", borderRadius: 3, padding: "1px 5px" }}>auto</span>}
            </span>
            <span style={{ flexShrink: 0, width: 52, textAlign: "right" }}>
              {!k.automatisch && (
                <>
                  <button onClick={() => setEditId(k.id)} title="Bewerken"
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.primary, fontSize: 13, marginRight: 2 }}>✏</button>
                  <button onClick={() => onVerwijder(k.id)} title="Verwijderen"
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, fontSize: 13 }}>✕</button>
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Jaargroep: niveau 1 (jaar) → niveau 2 (categorie) → niveau 3 (posten)
function JaarGroep({ jaar, posten, openJaren, setOpenJaren, editId, setEditId, onSave, onVerwijder }) {
  const open   = openJaren.has(jaar);
  const totaal = posten.reduce((s, k) => s + Number(k.bedrag), 0);
  const auto   = posten.filter(k => k.automatisch).length;

  // Groepeer posten per categorie, in volgorde van COST_CATEGORIES
  const perCat = {};
  posten.forEach(k => { if (!perCat[k.categorie]) perCat[k.categorie] = []; perCat[k.categorie].push(k); });
  const catVolgorde = COST_CATEGORIES.map(c => c.id).filter(id => perCat[id]);
  // Eventuele onbekende categorieën achteraan
  Object.keys(perCat).forEach(id => { if (!catVolgorde.includes(id)) catVolgorde.push(id); });

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Jaar-header */}
      <div
        onClick={() => setOpenJaren(prev => { const s = new Set(prev); s.has(jaar) ? s.delete(jaar) : s.add(jaar); return s; })}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f0ede8", borderRadius: open ? "8px 8px 0 0" : 8, cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontSize: 13, color: open ? COLORS.primary : "#666", transform: `rotate(${open ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s", width: 14 }}>▶</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{jaar}</span>
        <span style={{ fontSize: 12, color: "#999" }}>{posten.length} posten{auto > 0 ? ` (${auto} auto)` : ""}</span>
        <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: 14 }}>{fmt(totaal)}</span>
      </div>
      {/* Categorieën */}
      {open && (
        <div style={{ border: "0.5px solid #e8e6e0", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
          {catVolgorde.map(catId => (
            <CatGroep
              key={catId}
              catId={catId}
              posten={perCat[catId]}
              editId={editId}
              setEditId={setEditId}
              onSave={onSave}
              onVerwijder={onVerwijder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("auto");
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
    } catch { return defaultState(); }
  });
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwError, setRdwError]     = useState("");
  const [rdwRaw, setRdwRaw]         = useState(null);
  const [nieuwKost, setNieuwKost]   = useState({ datum: "", categorie: "brandstof", bedrag: "", km: "", omschrijving: "" });
  const [editId, setEditId]         = useState(null);
  const [openJaren, setOpenJaren]   = useState(() => new Set([String(new Date().getFullYear())]));
  const [analyseJaar, setAnalyseJaar] = useState("tot_nu");
  const [vergPeriodeStart, setVergPeriodeStart] = useState(() => new Date().toISOString().slice(0,10));
  const [samPeriode, setSamPeriode] = useState("gem_aankoop");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [saveFlash, setSaveFlash]   = useState(false);
  // Nieuwe verzekeringrij invoer
  const [nieuwVerzJaar, setNieuwVerzJaar] = useState(String(new Date().getFullYear()));
  const [nieuwVerzBedrag, setNieuwVerzBedrag] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveFlash(true);
      const t = setTimeout(() => setSaveFlash(false), 1400);
      return () => clearTimeout(t);
    } catch {}
  }, [state]);

  const set = (key, val) => setState(s => ({ ...s, [key]: val }));

  // RDW
  const handleLookup = async () => {
    setRdwLoading(true); setRdwError("");
    try {
      const k   = state.kenteken.replace(/-/g, "").toUpperCase();
      const res = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${k}`);
      const data = await res.json();
      if (!data.length) throw new Error("Kenteken niet gevonden");
      const d = data[0];
      setRdwRaw(d);
      setState(s => ({
        ...s,
        merk:            d.merk || s.merk,
        model:           d.handelsbenaming || s.model,
        bouwjaar:        d.datum_eerste_toelating?.slice(0, 4) || s.bouwjaar,
        brandstof:       d.brandstof_omschrijving || s.brandstof,
        gewichtKg:       d.massa_rijklaar || s.gewichtKg,
        cataloguswaarde: d.catalogusprijs ? parseInt(d.catalogusprijs) : s.cataloguswaarde,
      }));
    } catch (e) { setRdwError(e.message); }
    finally { setRdwLoading(false); }
  };

  // Berekeningen
  const nu            = new Date();
  const aankoopDt     = new Date(state.aankoopdatum);
  const verkoopDt     = new Date(state.verwachteVerkoopdatum);
  const bezitsjaren   = Math.max((verkoopDt - aankoopDt) / (365.25 * 864e5), 0.1);
  const verlopenJaren = Math.max((nu - aankoopDt)        / (365.25 * 864e5), 0.01);
  const totaleKm      = Math.round(state.jaarlijkseKm * bezitsjaren);
  const geredenKm     = Math.max(state.jaarlijkseKm * verlopenJaren, 1);

  const mrbSchatting = berekenMRBSchatting(state.gewichtKg, state.brandstof, state.provincie);
  const mrbKwartaal  = getMrbKwartaal(mrbSchatting, state.mrbWerkelijkMaand);

  const mrbPosten  = state.mrbAutomatisch
    ? genereerMrbPosten(state.aankoopdatum, state.verwachteVerkoopdatum, mrbKwartaal)
    : [];
  const verzPosten = state.verzekeringAutomatisch
    ? genereerVerzekeringPosten(state.aankoopdatum, state.verwachteVerkoopdatum, state.verzekeringJaren)
    : [];

  const alleKosten = [...state.kosten, ...mrbPosten, ...verzPosten];

  const totaalKosten   = alleKosten.reduce((s, k) => s + Number(k.bedrag), 0);
  const totaleAfschr   = state.aankoopprijs - state.verwachtVerkoopprijs;
  const afschrJaar     = totaleAfschr / bezitsjaren;
  const variabelTotaal = alleKosten.filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.variabel).reduce((s, k) => s + Number(k.bedrag), 0);
  const vastTotaal     = totaalKosten - variabelTotaal;
  const kmVast         = (vastTotaal + totaleAfschr) / geredenKm;
  const kmVariabel     = variabelTotaal / geredenKm;
  const kmTotaal       = (totaalKosten + totaleAfschr) / geredenKm;
  const eigenMaand     = (totaalKosten + afschrJaar) / Math.max(verlopenJaren * 12, 1);

  const leasePrive  = berekenLeasePrive(state.cataloguswaarde, state.leaseLooptijd, state.leaseKm, state.leaseAanbetaling);
  const leaseKmKost = (leasePrive * state.leaseLooptijd + state.leaseAanbetaling) / (state.leaseKm * state.leaseLooptijd / 12);

  // ── Vergoedingen berekening ──
  const schijf = Number(state.belastingschijf) / 100;

  // Mobiliteitsvergoeding: bruto -> netto
  const mobBrutoMaand = Number(state.mobiliteitBrutoMaand) || 0;
  const mobNettoMaand = Math.round(mobBrutoMaand * (1 - schijf));

  // Km-vergoeding: belastingvrij tot €0,23/km (2024), alles daarboven is belast
  const kmTarief      = Number(state.kmVergTarief) || 0;
  const kmPerMaand    = Number(state.kmVergKmMaand) || 0;
  const kmMaandTotaal = Number(state.kmVergMaandTotaal) || 0;
  // Gebruik maandtotaal als opgegeven, anders tarief × km
  const kmVergBruto   = kmMaandTotaal > 0 ? kmMaandTotaal : Math.round(kmTarief * kmPerMaand);
  const vrijgesteld   = Math.min(kmVergBruto, Math.round(0.23 * (kmMaandTotaal > 0 ? (kmVergBruto / Math.max(kmTarief, 0.01)) : kmPerMaand)));
  const belastbaar    = Math.max(kmVergBruto - vrijgesteld, 0);
  const kmVergNetto   = Math.round(kmVergBruto - belastbaar * schijf);

  // Totale maandelijkse vergoeding netto
  const totaalVergNetto = mobNettoMaand + kmVergNetto;

  // Nettokosten eigen auto per maand (kosten minus vergoedingen)
  const eigenMaandNetto = eigenMaand - totaalVergNetto;

  // Bijtelling lease
  const bijtellingMaand     = Math.round((state.cataloguswaarde * (Number(state.bijtellingPct) / 100)) / 12);
  const bijtellingBelasting = Math.round(bijtellingMaand * schijf);
  // Lease: maandbedrag + belasting op bijtelling - geen vergoedingen
  const leaseMaandNetto     = leasePrive + bijtellingBelasting;

  // Vergelijk netto: verschil per maand
  const verschilNettoMaand  = eigenMaandNetto - leaseMaandNetto;

  // Kosten gegroepeerd per jaar (gesorteerd nieuw→oud)
  const groepenPerJaar = {};
  alleKosten.forEach(k => {
    const j = k.datum?.slice(0,4) || "onbekend";
    if (!groepenPerJaar[j]) groepenPerJaar[j] = [];
    groepenPerJaar[j].push(k);
  });
  const jarenGesorteerd = Object.keys(groepenPerJaar).sort((a,b) => b.localeCompare(a));
  // Sorteer posten binnen elk jaar op datum (nieuwste eerst)
  jarenGesorteerd.forEach(j => groepenPerJaar[j].sort((a,b) => (b.datum||"").localeCompare(a.datum||"")));

  // Grafiekdata
  const kostenPerJaar = {};
  alleKosten.forEach(k => { const j = k.datum?.slice(0,4); if (j) kostenPerJaar[j] = (kostenPerJaar[j]||0)+Number(k.bedrag); });
  const aankoopJaar = aankoopDt.getFullYear();
  const verkoopJaar = verkoopDt.getFullYear();
  let cumEigen = state.aankoopprijs, cumLease = state.leaseAanbetaling;
  const grafiekData = [];
  for (let j = aankoopJaar; j <= verkoopJaar; j++) {
    cumEigen += (kostenPerJaar[String(j)] || 0) + afschrJaar;
    cumLease += leasePrive * 12;
    grafiekData.push({ jaar: String(j), "Eigen auto": Math.round(cumEigen), "Privé lease": Math.round(cumLease) });
  }
  const jaarBarData = Object.entries(kostenPerJaar).sort().map(([jaar, kosten]) => ({ jaar, kosten }));
  const afschrData  = afschrijvingsCurve(state.aankoopprijs, state.verwachtVerkoopprijs, bezitsjaren);
  const kostPerCat  = COST_CATEGORIES
    .map(c => ({ ...c, totaal: alleKosten.filter(k => k.categorie === c.id).reduce((s, k) => s + Number(k.bedrag), 0) }))
    .filter(c => c.totaal > 0).sort((a,b) => b.totaal - a.totaal);

  // Toevoegen
  const voegToe = () => {
    if (!nieuwKost.datum || !nieuwKost.bedrag) return;
    const jaar = nieuwKost.datum.slice(0,4);
    set("kosten", [...state.kosten, { ...nieuwKost, id: Date.now(), bedrag: Number(nieuwKost.bedrag), km: nieuwKost.km ? Number(nieuwKost.km) : null, automatisch: false }]);
    setOpenJaren(prev => new Set([...prev, jaar]));
    setNieuwKost({ datum: "", categorie: "brandstof", bedrag: "", km: "", omschrijving: "" });
  };

  const slaOpEdit = (gewijzigd) => {
    set("kosten", state.kosten.map(k => k.id === gewijzigd.id ? gewijzigd : k));
    setEditId(null);
  };

  const voegVerzJaarToe = () => {
    if (!nieuwVerzJaar || !nieuwVerzBedrag) return;
    const bestaand = state.verzekeringJaren.filter(v => v.startJaar !== Number(nieuwVerzJaar));
    set("verzekeringJaren", [...bestaand, { startJaar: Number(nieuwVerzJaar), bedrag: Number(nieuwVerzBedrag) }].sort((a,b) => a.startJaar - b.startJaar));
    setNieuwVerzBedrag("");
  };

  // Import
  const handleImport = () => {
    setImportError("");
    try {
      const regels = importText.trim().split("\n").filter(l => l.trim() && !l.startsWith("datum"));
      let id = Date.now();
      const nieuw = regels.map(r => {
        const [datum, cat, bedrag, km, omschr] = r.split(/[,;	]/);
        if (!datum || isNaN(Number(bedrag))) throw new Error(`Ongeldige regel: ${r}`);
        const cm = COST_CATEGORIES.find(c => c.id === cat.trim().toLowerCase() || c.label.toLowerCase().includes(cat.trim().toLowerCase()));
        return { id: id++, datum: datum.trim(), categorie: cm?.id||"overig", bedrag: Number(bedrag), km: km?Number(km):null, omschrijving: omschr?.trim()||"", automatisch: false };
      });
      set("kosten", [...state.kosten, ...nieuw]);
      setImportText("");
    } catch (e) { setImportError(e.message); }
  };

  const exportCSV = "datum;categorie;bedrag;km;omschrijving\n" +
    alleKosten.map(k => `${k.datum};${k.categorie};${k.bedrag};${k.km||""};${k.omschrijving}`).join("\n");

  // Huidige MRB bedrag tonen (werkelijk of schatting)
  const mrbToonBedrag = state.mrbWerkelijkMaand && Number(state.mrbWerkelijkMaand) > 0
    ? Number(state.mrbWerkelijkMaand)
    : mrbSchatting ? Math.round(mrbSchatting.kwartaal / 3) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1a1a1a", maxWidth: 940, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#bbb", textTransform: "uppercase", marginBottom: 4 }}>
            AutoKosten {APP_VERSION}
            {saveFlash && <span style={{ marginLeft: 12, color: COLORS.success, fontWeight: 400 }}>✓ opgeslagen</span>}
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>
            {state.merk && state.model ? `${state.merk} ${state.model}` : "Mijn auto"}
          </h1>
          {state.bouwjaar && <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>{state.bouwjaar} · {state.brandstof} · {state.kenteken}{state.gewichtKg ? ` · ${fmtN(state.gewichtKg)} kg` : ""}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <MetricCard label="Totaalkosten"  value={fmt(totaalKosten + totaleAfschr)} sub="incl. afschrijving" />
          <MetricCard label="Per maand"     value={fmt(eigenMaand)}  sub="incl. afschr." color={COLORS.accent} />
          <MetricCard label="Per km"        value={fmtC(kmTotaal)}   sub="vast + variabel" color={COLORS.primary} />
        </div>
      </div>

      <TabBar
        tabs={[
          { id: "auto",    label: "🚗 Mijn auto" },
          { id: "kosten",  label: "📊 Kosten" },
          { id: "grafiek", label: "📈 Grafieken" },
          { id: "lease",   label: "🔄 Lease vergelijk" },
          { id: "import",  label: "⬆ Import/Export" },
        ]}
        active={tab} onChange={setTab}
      />

      {/* ══ TAB AUTO ══ */}
      {tab === "auto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>Kenteken opzoeken via RDW</SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input value={state.kenteken} onChange={e => set("kenteken", e.target.value.toUpperCase())}
                placeholder="bijv. AB-123-C" onKeyDown={e => e.key === "Enter" && handleLookup()}
                style={{ flex: 1, minWidth: 120, fontFamily: "monospace", letterSpacing: "0.12em" }} />
              <button onClick={handleLookup} disabled={rdwLoading}
                style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 500 }}>
                {rdwLoading ? "Zoeken…" : "Opzoeken via RDW"}
              </button>
            </div>
            {rdwError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>⚠ {rdwError}</div>}
            {rdwRaw && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0faf4", borderRadius: 8, fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>✅ <b>{rdwRaw.merk}</b> {rdwRaw.handelsbenaming}</span>
                <span>📅 {rdwRaw.datum_eerste_toelating?.slice(0,4)}</span>
                <span>⛽ {rdwRaw.brandstof_omschrijving}</span>
                <span>⚖ {rdwRaw.massa_rijklaar} kg</span>
                {rdwRaw.catalogusprijs && <span>💰 {fmt(rdwRaw.catalogusprijs)}</span>}
                {rdwRaw.co2_uitstoot_gecombineerd && <span>🌿 {rdwRaw.co2_uitstoot_gecombineerd} g/km CO₂</span>}
              </div>
            )}
          </Card>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <SectionTitle>Voertuiggegevens</SectionTitle>
              {[["Merk","merk"],["Model","model"],["Bouwjaar","bouwjaar"],["Brandstof","brandstof"]].map(([lbl,key]) => (
                <Row key={key} label={lbl}><input value={state[key]} onChange={e => set(key, e.target.value)} style={{ flex: 1 }} /></Row>
              ))}
              <Row label="Gewicht (kg)"><input type="number" value={state.gewichtKg} onChange={e => set("gewichtKg", e.target.value)} style={{ flex: 1 }} /></Row>
              <Row label="Provincie">
                <select value={state.provincie} onChange={e => set("provincie", e.target.value)} style={{ flex: 1 }}>
                  {Object.keys(MRB_OPCENTEN).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </Row>
            </Card>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <SectionTitle>Financieel</SectionTitle>
              <Row label="Aankoopprijs"><input type="number" value={state.aankoopprijs} onChange={e => set("aankoopprijs", Number(e.target.value))} style={{ flex: 1 }} /></Row>
              <Row label="Aankoopdatum"><input type="date" value={state.aankoopdatum} onChange={e => set("aankoopdatum", e.target.value)} style={{ flex: 1 }} /></Row>
              <Row label="Verwacht weg"><input type="date" value={state.verwachteVerkoopdatum} onChange={e => set("verwachteVerkoopdatum", e.target.value)} style={{ flex: 1 }} /></Row>
              <Row label="Verkoopprijs"><input type="number" value={state.verwachtVerkoopprijs} onChange={e => set("verwachtVerkoopprijs", Number(e.target.value))} style={{ flex: 1 }} /></Row>
              <Row label="Km per jaar"><input type="number" value={state.jaarlijkseKm} onChange={e => set("jaarlijkseKm", Number(e.target.value))} style={{ flex: 1 }} /></Row>
            </Card>
          </div>

          {/* MRB */}
          {(mrbSchatting || state.mrbWerkelijkMaand) && (
            <Card>
              <SectionTitle>Motorrijtuigenbelasting</SectionTitle>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {mrbSchatting && <MetricCard label="Schatting /kwartaal" value={fmt(mrbSchatting.kwartaal)} sub="op basis van gewicht" />}
                {mrbSchatting && <MetricCard label="Schatting /jaar"     value={fmt(mrbSchatting.jaarlijks)} sub="excl. correcties" />}
                {mrbToonBedrag && <MetricCard label="Werkelijk /maand"   value={fmt(mrbToonBedrag)} sub={state.mrbWerkelijkMaand ? "door jou opgegeven" : "schatting"} color={state.mrbWerkelijkMaand ? COLORS.primary : "#999"} />}
                {mrbToonBedrag && <MetricCard label="Werkelijk /kwartaal" value={fmt(mrbToonBedrag * 3)} sub={state.mrbWerkelijkMaand ? "door jou opgegeven" : "schatting"} color={state.mrbWerkelijkMaand ? COLORS.accent : "#999"} />}
              </div>

              {/* Werkelijk bedrag invoeren */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f7f6f2", borderRadius: 8, marginBottom: 10 }}>
                <label style={{ fontSize: 13, color: "#666", flexShrink: 0 }}>Werkelijk bedrag per maand (€)</label>
                <input type="number" placeholder="bijv. 180"
                  value={state.mrbWerkelijkMaand}
                  onChange={e => set("mrbWerkelijkMaand", e.target.value)}
                  style={{ width: 110 }} />
                {state.mrbWerkelijkMaand && (
                  <button onClick={() => set("mrbWerkelijkMaand", "")}
                    style={{ background: "none", border: "0.5px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12, color: "#999" }}>
                    Wissen
                  </button>
                )}
              </div>

              <Toggle
                checked={state.mrbAutomatisch}
                onChange={v => set("mrbAutomatisch", v)}
                label="MRB kwartaalposten automatisch toevoegen"
                sub={state.mrbAutomatisch
                  ? `${mrbPosten.length} posten van ${fmt(mrbKwartaal)}/kwartaal toegevoegd aan kostenlijst`
                  : `Voegt ${fmt(mrbKwartaal)}/kwartaal automatisch toe voor de hele bezitsperiode`}
              />
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>
                ⓘ Schatting: {fmtN(state.gewichtKg)} kg · {state.brandstof} · {state.provincie}. Exacte bedragen via belastingdienst.nl.
              </div>
            </Card>
          )}

          {/* Verzekering */}
          <Card>
            <SectionTitle>Verzekering</SectionTitle>
            <Toggle
              checked={state.verzekeringAutomatisch}
              onChange={v => set("verzekeringAutomatisch", v)}
              label="Verzekering automatisch splitsen in maandposten"
              sub="Voer per jaar een jaarbedrag in — de app maakt 12 maandposten aan"
            />
            {state.verzekeringAutomatisch && (
              <div style={{ marginTop: 10 }}>
                {/* Ingevoerde jaren */}
                {state.verzekeringJaren.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 10 }}>
                    <thead>
                      <tr style={{ borderBottom: "0.5px solid #e8e6e0" }}>
                        <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Jaar</th>
                        <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Jaarbedrag</th>
                        <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Per maand</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {state.verzekeringJaren.map(v => (
                        <tr key={v.startJaar} style={{ borderBottom: "0.5px solid #f0ede8" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 500 }}>{v.startJaar}</td>
                          <td style={{ padding: "6px 8px" }}>{fmt(v.bedrag)}</td>
                          <td style={{ padding: "6px 8px", color: "#888" }}>{fmt(Math.round(v.bedrag / 12))}</td>
                          <td style={{ padding: "6px 8px" }}>
                            <button onClick={() => set("verzekeringJaren", state.verzekeringJaren.filter(x => x.startJaar !== v.startJaar))}
                              style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, fontSize: 14 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {/* Nieuw jaar toevoegen */}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Jaar</label>
                    <input type="number" value={nieuwVerzJaar} onChange={e => setNieuwVerzJaar(e.target.value)} style={{ width: 80 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Jaarbedrag verzekering (€)</label>
                    <input type="number" placeholder="bijv. 1200" value={nieuwVerzBedrag}
                      onChange={e => setNieuwVerzBedrag(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && voegVerzJaarToe()} style={{ width: 160 }} />
                  </div>
                  <button onClick={voegVerzJaarToe}
                    style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", cursor: "pointer", fontWeight: 500 }}>
                    + Toevoegen
                  </button>
                </div>
                {verzPosten.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: COLORS.success }}>
                    ✓ {verzPosten.length} maandposten verzekering toegevoegd aan kostenlijst
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Vergoedingen werkgever */}
          <Card>
            <SectionTitle>Vergoedingen van werkgever</SectionTitle>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {/* Mobiliteitsvergoeding */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Mobiliteitsvergoeding</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "#666", width: 160, flexShrink: 0 }}>Bruto per maand (€)</label>
                    <input type="number" placeholder="bijv. 300" value={state.mobiliteitBrutoMaand}
                      onChange={e => set("mobiliteitBrutoMaand", e.target.value)} style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "#666", width: 160, flexShrink: 0 }}>Belastingschijf (%)</label>
                    <input type="number" step="0.1" placeholder="36.9" value={state.belastingschijf}
                      onChange={e => set("belastingschijf", e.target.value)} style={{ flex: 1 }} />
                  </div>
                  {mobBrutoMaand > 0 && (
                    <div style={{ padding: "8px 12px", background: "#f0faf4", borderRadius: 8, fontSize: 13 }}>
                      <span style={{ color: "#666" }}>Bruto: </span><b>{fmt(mobBrutoMaand)}/mnd</b>
                      <span style={{ color: "#bbb", margin: "0 8px" }}>→</span>
                      <span style={{ color: "#666" }}>Netto: </span><b style={{ color: COLORS.success }}>{fmt(mobNettoMaand)}/mnd</b>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ width: "0.5px", background: "#e8e6e0", flexShrink: 0 }} />

              {/* Km-vergoeding */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Km-vergoeding</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "#666", width: 160, flexShrink: 0 }}>Tarief (€/km)</label>
                    <input type="number" step="0.01" placeholder="0.23" value={state.kmVergTarief}
                      onChange={e => set("kmVergTarief", e.target.value)} style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "#666", width: 160, flexShrink: 0 }}>Km/maand voor werk</label>
                    <input type="number" placeholder="bijv. 800" value={state.kmVergKmMaand}
                      onChange={e => set("kmVergKmMaand", e.target.value)} style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: "#666", width: 160, flexShrink: 0 }}>Of: totaal/maand (€)</label>
                    <input type="number" placeholder="overschrijft tarief×km" value={state.kmVergMaandTotaal}
                      onChange={e => set("kmVergMaandTotaal", e.target.value)} style={{ flex: 1 }} />
                  </div>
                  {kmVergBruto > 0 && (
                    <div style={{ padding: "8px 12px", background: "#f0faf4", borderRadius: 8, fontSize: 13 }}>
                      <span style={{ color: "#666" }}>Bruto: </span><b>{fmt(kmVergBruto)}/mnd</b>
                      <span style={{ color: "#bbb", margin: "0 4px" }}>·</span>
                      <span style={{ color: "#666" }}>Vrijgesteld: </span>{fmt(vrijgesteld)}
                      {belastbaar > 0 && <span style={{ color: "#bbb" }}> · belast: {fmt(belastbaar)}</span>}
                      <span style={{ color: "#bbb", margin: "0 8px" }}>→</span>
                      <span style={{ color: "#666" }}>Netto: </span><b style={{ color: COLORS.success }}>{fmt(kmVergNetto)}/mnd</b>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totaal vergoeding */}
            {totaalVergNetto > 0 && (
              <div style={{ marginTop: 14, padding: "12px 16px", background: "#f7f6f2", borderRadius: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <MetricCard label="Totaal netto/mnd" value={fmt(totaalVergNetto)} sub="mobiliteit + km" color={COLORS.success} />
                <MetricCard label="Nettokosten auto/mnd" value={fmt(Math.max(eigenMaandNetto, 0))} sub="kosten minus vergoedingen" color={eigenMaandNetto < 0 ? COLORS.success : COLORS.accent} />
                <MetricCard label="Totaal netto/jaar" value={fmt(totaalVergNetto * 12)} sub="schatting" />
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 12, color: "#bbb" }}>
              ⓘ Km-vergoeding tot €0,23/km is belastingvrij (2024). Daarboven wordt het verschil belast tegen jouw schijf.
            </div>
          </Card>

          {/* Samenvatting met periode-dropdown */}
          {(() => {
            const nuJaar     = nu.getFullYear();
            const aankoopJaarNum = aankoopDt.getFullYear();

            // Bereken kosten voor de geselecteerde samenvattingsperiode
            // Alleen historische jaren (t/m nu), niet toekomstige
            const samPeriodes = [
              { id: "huidig_jaar",   label: `Huidig jaar (${nuJaar})` },
              { id: "gem_5jaar",     label: "Gemiddelde laatste 5 jaar" },
              { id: "gem_aankoop",   label: "Gemiddelde sinds aankoop" },
            ];

            const kostenVoorSam = (periode) => {
              if (periode === "huidig_jaar") {
                return alleKosten.filter(k => k.datum?.slice(0,4) === String(nuJaar));
              }
              if (periode === "gem_5jaar") {
                const vanaf = String(nuJaar - 4);
                const tot   = String(nuJaar);
                return alleKosten.filter(k => k.datum?.slice(0,4) >= vanaf && k.datum?.slice(0,4) <= tot);
              }
              // gem_aankoop: alles t/m nu
              return alleKosten.filter(k => k.datum && k.datum <= nu.toISOString().slice(0,10));
            };

            const aantalJarenVoorSam = (periode) => {
              if (periode === "huidig_jaar") return 1;
              if (periode === "gem_5jaar")   return Math.min(5, Math.max(nuJaar - aankoopJaarNum, 1));
              return Math.max(verlopenJaren, 1);
            };

            const samKosten      = kostenVoorSam(samPeriode);
            const samTotaal      = samKosten.reduce((s, k) => s + Number(k.bedrag), 0);
            const samJaren       = aantalJarenVoorSam(samPeriode);
            const samPerJaar     = samTotaal / samJaren;
            const samPerMaand    = samPerJaar / 12;
            const samAfschrJaar  = afschrJaar; // afschrijving is al per jaar
            const samTotaalMaand = samPerMaand + samAfschrJaar / 12;

            const samVariabel = samKosten
              .filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.variabel)
              .reduce((s, k) => s + Number(k.bedrag), 0);
            const samVast     = samTotaal - samVariabel;
            const samKmJaar   = state.jaarlijkseKm;
            const samKmPeriode= samKmJaar * samJaren;
            const samKmVast   = (samVast / samJaren + samAfschrJaar) / samKmJaar;
            const samKmVar    = (samVariabel / samJaren) / samKmJaar;
            const samKmTotaal = samTotaalMaand * 12 / samKmJaar;

            return (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem", flexWrap: "wrap", gap: 8 }}>
                  <SectionTitle style={{ margin: 0 }}>Kostensamenvatting</SectionTitle>
                  <select value={samPeriode} onChange={e => setSamPeriode(e.target.value)}
                    style={{ fontSize: 13, padding: "5px 10px", borderRadius: 6 }}>
                    {samPeriodes.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <MetricCard label="Bezitsperiode"     value={`${bezitsjaren.toFixed(1)} jr`}    sub={`${fmtN(totaleKm)} km totaal`} />
                  <MetricCard label="Kosten in periode" value={fmt(samTotaal)}                    sub={`${samKosten.length} posten · ${samJaren.toFixed(1)} jaar`} />
                  <MetricCard label="Kosten/jaar"       value={fmt(samPerJaar)}                   sub="excl. afschrijving" />
                  <MetricCard label="Kosten/maand"      value={fmt(samTotaalMaand)}               sub="incl. afschr." color={COLORS.accent} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <MetricCard label="Vast per km"       value={fmtC(samKmVast)}     sub="incl. afschr." />
                  <MetricCard label="Variabel per km"   value={fmtC(samKmVar)}      sub="brandstof, parkeren" />
                  <MetricCard label="Totaal per km"     value={fmtC(samKmTotaal)}   sub="alles meegerekend" color={COLORS.primary} />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#bbb" }}>
                  ⓘ Toekomstige jaren zijn niet meegenomen — alleen werkelijk gemaakte kosten tot vandaag.
                  Afschrijving is gebaseerd op de hele bezitsperiode ({fmt(afschrJaar)}/jaar).
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ══ TAB KOSTEN ══ */}
      {tab === "kosten" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>Kostenpost toevoegen</SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              {[
                { label: "Datum",      type: "date",   key: "datum",  w: 145 },
                { label: "Bedrag (€)", type: "number", key: "bedrag", w: 90 },
                { label: "Km-stand",   type: "number", key: "km",     w: 110, ph: "optioneel" },
              ].map(f => (
                <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "#999" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={nieuwKost[f.key]}
                    onChange={e => setNieuwKost(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: f.w }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#999" }}>Categorie</label>
                <select value={nieuwKost.categorie} onChange={e => setNieuwKost(p => ({ ...p, categorie: e.target.value }))} style={{ width: 175 }}>
                  {COST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 12, color: "#999" }}>Omschrijving</label>
                <input placeholder="optioneel" value={nieuwKost.omschrijving}
                  onChange={e => setNieuwKost(p => ({ ...p, omschrijving: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && voegToe()} />
              </div>
              <button onClick={voegToe}
                style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                + Toevoegen
              </button>
            </div>
          </Card>

          {/* ── Jaar-selector voor analyse ── */}
          {(() => {
            const nuJaar = String(new Date().getFullYear());
            const verkoopJaarStr = String(verkoopDt.getFullYear());
            // Alle jaren van aankoop t/m verwachte verkoop
            const alleJaren = [];
            for (let j = aankoopDt.getFullYear(); j <= verkoopDt.getFullYear(); j++) alleJaren.push(String(j));
            // Periodes: elk jaar + "tot nu" + "alles tot verkoop"
            const periodes = [
              ...alleJaren,
              "tot_nu",
              "tot_verkoop",
            ];
            const periodeLabel = (p) => {
              if (p === "tot_nu")      return "Tot nu";
              if (p === "tot_verkoop") return "Hele periode";
              return p;
            };

            // Filter kosten voor geselecteerde periode
            const kostenVoorPeriode = (periode) => {
              if (periode === "tot_nu")      return alleKosten.filter(k => k.datum && k.datum <= nu.toISOString().slice(0,10));
              if (periode === "tot_verkoop") return alleKosten;
              return alleKosten.filter(k => k.datum?.slice(0,4) === periode);
            };

            // Km voor periode
            const kmVoorPeriode = (periode) => {
              if (periode === "tot_nu")      return Math.max(state.jaarlijkseKm * verlopenJaren, 1);
              if (periode === "tot_verkoop") return Math.max(state.jaarlijkseKm * bezitsjaren, 1);
              const jaarNum = Number(periode);
              const start   = new Date(Math.max(aankoopDt, new Date(jaarNum, 0, 1)));
              const einde   = new Date(Math.min(verkoopDt, new Date(jaarNum, 11, 31)));
              const fractie = Math.max((einde - start) / (365.25 * 864e5), 0);
              return Math.max(state.jaarlijkseKm * fractie, 1);
            };

            // Afschrijving voor periode
            const afschrVoorPeriode = (periode) => {
              if (periode === "tot_nu")      return afschrJaar * verlopenJaren;
              if (periode === "tot_verkoop") return totaleAfschr;
              return afschrJaar; // per jaar = gelijk
            };

            const sel       = analyseJaar;
            const kp        = kostenVoorPeriode(sel);
            const totKp     = kp.reduce((s, k) => s + Number(k.bedrag), 0);
            const kmKp      = kmVoorPeriode(sel);
            const afschrKp  = afschrVoorPeriode(sel);
            const varKp     = kp.filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.vastKp).reduce((s, k) => s + Number(k.bedrag), 0);
            const varKpReal = kp.filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.variabel).reduce((s, k) => s + Number(k.bedrag), 0);
            const vastKpReal= totKp - varKpReal;
            const catKp     = COST_CATEGORIES
              .map(c => ({ ...c, totaal: kp.filter(k => k.categorie === c.id).reduce((s, k) => s + Number(k.bedrag), 0) }))
              .filter(c => c.totaal > 0).sort((a,b) => b.totaal - a.totaal);

            const kmVastKp     = (vastKpReal + afschrKp) / kmKp;
            const kmVariabelKp = varKpReal / kmKp;
            const kmTotaalKp   = (totKp + afschrKp) / kmKp;

            return (
              <Card>
                {/* Periode-knoppen */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#999", flexShrink: 0 }}>Periode:</span>
                  {periodes.map(p => (
                    <button key={p} onClick={() => {
                      setAnalyseJaar(p);
                      // Als een specifiek jaar gekozen: dat jaar openklappen, rest dicht
                      if (p !== "tot_nu" && p !== "tot_verkoop") {
                        setOpenJaren(new Set([p]));
                      }
                    }}
                      style={{
                        padding: "4px 12px", fontSize: 12, borderRadius: 20,
                        border: analyseJaar === p ? `1.5px solid ${COLORS.primary}` : "0.5px solid #e0ddd8",
                        background: analyseJaar === p ? COLORS.primary : "#fff",
                        color: analyseJaar === p ? "#fff" : "#666",
                        cursor: "pointer", fontWeight: analyseJaar === p ? 600 : 400,
                      }}>{periodeLabel(p)}</button>
                  ))}
                </div>

                {/* Samenvatting periode */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <MetricCard label="Kosten"      value={fmt(totKp)}    sub={`${kp.length} posten`} />
                  <MetricCard label="Afschrijving" value={fmt(afschrKp)} sub="in deze periode" />
                  <MetricCard label="Km gereden"   value={fmtN(kmKp)}    sub="geschat" />
                  <MetricCard label="Totaal/mnd"   value={fmt((totKp + afschrKp) / Math.max(
                    sel === "tot_nu" ? verlopenJaren * 12 :
                    sel === "tot_verkoop" ? bezitsjaren * 12 : 12, 1))}
                    sub="incl. afschr." color={COLORS.accent} />
                </div>

                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {/* Per categorie */}
                  <div style={{ flex: 2, minWidth: 220 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Per categorie</div>
                    {catKp.length === 0 && <div style={{ color: "#bbb", fontSize: 13 }}>Geen kosten in deze periode.</div>}
                    {catKp.map(c => (
                      <div key={c.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                          <span>{c.icon} {c.label}
                            <span style={{ fontSize: 11, color: c.variabel ? COLORS.accent : "#bbb", marginLeft: 4 }}>{c.variabel ? "variabel" : "vast"}</span>
                          </span>
                          <span style={{ fontWeight: 600 }}>{fmt(c.totaal)}</span>
                        </div>
                        <div style={{ height: 6, background: "#f0ede8", borderRadius: 3 }}>
                          <div style={{ height: 6, borderRadius: 3, width: `${(c.totaal / (totKp || 1)) * 100}%`, background: c.variabel ? COLORS.accent : COLORS.primary }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div style={{ width: "0.5px", background: "#e8e6e0", flexShrink: 0 }} />

                  {/* Per km */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Kosten per km</div>
                    {[
                      { label: "Vast (incl. afschr.)", value: kmVastKp,     color: COLORS.primary },
                      { label: "Variabel",              value: kmVariabelKp, color: COLORS.accent },
                      { label: "Totaal",                value: kmTotaalKp,   color: COLORS.danger },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                          <span style={{ color: "#666" }}>{item.label}</span>
                          <span style={{ fontWeight: 600, color: item.color }}>{fmtC(item.value)}/km</span>
                        </div>
                        <div style={{ height: 6, background: "#f0ede8", borderRadius: 3 }}>
                          <div style={{ height: 6, borderRadius: 3, width: `${(item.value / (kmTotaalKp || 1)) * 100}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>{fmtN(kmKp)} km in periode</div>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Kostenlijst per jaar ingeklapt */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <SectionTitle style={{ margin: 0 }}>Kostenposten per jaar — {alleKosten.length} posten · {fmt(totaalKosten)}</SectionTitle>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setOpenJaren(new Set(jarenGesorteerd))}
                  style={{ fontSize: 12, background: "none", border: "0.5px solid #e0ddd8", borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: "#666" }}>
                  Alles open
                </button>
                <button onClick={() => setOpenJaren(new Set())}
                  style={{ fontSize: 12, background: "none", border: "0.5px solid #e0ddd8", borderRadius: 4, padding: "3px 10px", cursor: "pointer", color: "#666" }}>
                  Alles dicht
                </button>
              </div>
            </div>
            {jarenGesorteerd.length === 0 && <div style={{ color: "#bbb", fontSize: 14 }}>Nog geen kosten ingevoerd.</div>}
            {jarenGesorteerd.map(jaar => (
              <JaarGroep
                key={jaar}
                jaar={jaar}
                posten={groepenPerJaar[jaar]}
                openJaren={openJaren}
                setOpenJaren={setOpenJaren}
                editId={editId}
                setEditId={setEditId}
                onSave={slaOpEdit}
                onVerwijder={id => set("kosten", state.kosten.filter(k => k.id !== id))}
              />
            ))}
          </Card>
        </div>
      )}

      {/* ══ TAB GRAFIEKEN ══ */}
      {tab === "grafiek" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>Cumulatieve kosten: eigen auto vs. privé lease</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 14 }}>
              Eigen auto: aankoopprijs {fmt(state.aankoopprijs)} + afschrijving + gemaakte kosten. Lease: {fmt(leasePrive)}/maand.
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={grafiekData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="jaar" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `€${Math.round(v/1000)}k`} tick={{ fontSize: 12 }} width={54} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="Eigen auto"  stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Privé lease" stroke={COLORS.lease}   strokeWidth={2.5} dot={{ r: 3 }} strokeDasharray="6 3" />
              </LineChart>
            </ResponsiveContainer>
            {grafiekData.length > 1 && (() => {
              const v = grafiekData[grafiekData.length-1]["Eigen auto"] - grafiekData[grafiekData.length-1]["Privé lease"];
              return (
                <div style={{ marginTop: 12, padding: "10px 14px", background: v > 0 ? "#fdf3ef" : "#f0faf4", borderRadius: 8, fontSize: 13 }}>
                  {v > 0 ? `📊 Na ${Math.ceil(bezitsjaren)} jaar is eigen auto ${fmt(v)} duurder dan privé lease.`
                         : `📊 Na ${Math.ceil(bezitsjaren)} jaar is eigen auto ${fmt(Math.abs(v))} goedkoper dan privé lease.`}
                </div>
              );
            })()}
          </Card>
          <Card>
            <SectionTitle>Gemaakte kosten per jaar</SectionTitle>
            {jaarBarData.length === 0 ? <div style={{ color: "#bbb", fontSize: 14 }}>Nog geen kosten.</div>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={jaarBarData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                    <XAxis dataKey="jaar" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={v => `€${Math.round(v/1000)}k`} tick={{ fontSize: 12 }} width={48} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="kosten" fill={COLORS.primary} radius={[4,4,0,0]} name="Kosten" />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>
          <Card>
            <SectionTitle>Afschrijving voertuigwaarde</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={afschrData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="jaar" tickFormatter={v => `+${v}j`} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 12 }} width={74} />
                <Tooltip formatter={v => [fmt(v), "Waarde"]} labelFormatter={v => `Na ${v} jaar`} />
                <ReferenceLine x={Math.round(verlopenJaren)} stroke={COLORS.accent} strokeDasharray="4 2"
                  label={{ value: "Nu", fontSize: 11, fill: COLORS.accent, position: "insideTopRight" }} />
                <Line type="monotone" dataKey="waarde" stroke={COLORS.success} strokeWidth={2.5} dot={{ r: 3 }} name="Waarde" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ══ TAB LEASE ══ */}
      {tab === "lease" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <SectionTitle>Lease parameters</SectionTitle>
              <Row label="Cataloguswaarde" wide><input type="number" value={state.cataloguswaarde} onChange={e => set("cataloguswaarde", Number(e.target.value))} style={{ flex: 1 }} /></Row>
              <Row label="Looptijd (mnd)"  wide><input type="number" value={state.leaseLooptijd}   onChange={e => set("leaseLooptijd",   Number(e.target.value))} style={{ flex: 1 }} /></Row>
              <Row label="Km per jaar"     wide><input type="number" value={state.leaseKm}          onChange={e => set("leaseKm",          Number(e.target.value))} style={{ flex: 1 }} /></Row>
              <Row label="Aanbetaling"     wide><input type="number" value={state.leaseAanbetaling} onChange={e => set("leaseAanbetaling", Number(e.target.value))} style={{ flex: 1 }} /></Row>
              <Row label="Bijtelling (%)"  wide>
                <select value={state.bijtellingPct} onChange={e => set("bijtellingPct", Number(e.target.value))} style={{ flex: 1 }}>
                  <option value={16}>16% (volledig elektrisch)</option>
                  <option value={22}>22% (standaard)</option>
                  <option value={35}>35% (ouder dan 15 jaar)</option>
                </select>
              </Row>
            </Card>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <SectionTitle>Lease uitkomst (bruto)</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666", fontSize: 14 }}>Maandbedrag (schatting)</span>
                  <span style={{ fontWeight: 600, fontSize: 20, color: COLORS.lease }}>{fmt(leasePrive)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#999" }}>Totaal over {state.leaseLooptijd} mnd</span>
                  <span style={{ fontWeight: 500 }}>{fmt(leasePrive * state.leaseLooptijd + state.leaseAanbetaling)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#999" }}>Kosten per km</span>
                  <span style={{ fontWeight: 500 }}>{fmtC(leaseKmKost)}/km</span>
                </div>
                <div style={{ borderTop: "0.5px solid #e8e6e0", paddingTop: 10, marginTop: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#999" }}>Bijtelling ({state.bijtellingPct}% van {fmt(state.cataloguswaarde)})</span>
                    <span>{fmt(bijtellingMaand)}/mnd</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#999" }}>Belasting op bijtelling ({state.belastingschijf}%)</span>
                    <span style={{ color: COLORS.danger }}>+ {fmt(bijtellingBelasting)}/mnd</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600 }}>
                    <span>Lease netto maandlast</span>
                    <span style={{ color: COLORS.danger }}>{fmt(leaseMaandNetto)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>lease + belasting bijtelling, geen vergoedingen</div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Vergelijkingsperiode instellen ── */}
          {(() => {
            const looptijdMnd   = Number(state.leaseLooptijd) || 48;
            const looptijdJaren = looptijdMnd / 12;

            // Eigen auto kosten over vergelijkingsperiode
            // Kosten = werkelijk gemaakte kosten in die maanden + afschrijving over die periode
            // Afschrijving: degressief, we gebruiken gemiddeld afschrJaar over bezitsperiode
            const vergStartDt  = new Date(vergPeriodeStart);
            const vergEindeDt  = new Date(vergPeriodeStart);
            vergEindeDt.setMonth(vergEindeDt.getMonth() + looptijdMnd);

            const vergStartStr = vergStartDt.toISOString().slice(0,10);
            const vergEindeStr = vergEindeDt.toISOString().slice(0,10);

            // Filter werkelijk gemaakte kosten in de vergelijkingsperiode
            const kostenInPeriode = alleKosten.filter(k =>
              k.datum && k.datum >= vergStartStr && k.datum <= vergEindeStr
            );
            const kostenTotaalPeriode = kostenInPeriode.reduce((s, k) => s + Number(k.bedrag), 0);

            // Afschrijving over vergelijkingsperiode (degressief: meer in vroege jaren)
            // Positie binnen bezitsperiode
            const startOffset = Math.max((vergStartDt - aankoopDt) / (365.25 * 864e5), 0);
            const eindeOffset = startOffset + looptijdJaren;
            const waardeStart = state.aankoopprijs - (startOffset / bezitsjaren) * totaleAfschr;
            const waardeEinde = state.aankoopprijs - (Math.min(eindeOffset, bezitsjaren) / bezitsjaren) * totaleAfschr;
            const afschrPeriode = Math.max(waardeStart - waardeEinde, 0);
            const afschrMaandPeriode = afschrPeriode / looptijdMnd;

            // Eigen auto maandkosten over vergelijkingsperiode
            const eigenKostenMaandPeriode = (kostenTotaalPeriode / looptijdMnd) + afschrMaandPeriode;

            // Netto eigen auto = bruto - vergoedingen
            const eigenNettoMaandPeriode = eigenKostenMaandPeriode - totaalVergNetto;

            // Lease netto (ongewijzigd)
            const leaseNettoMaand = leaseMaandNetto;

            const verschilMaand    = eigenNettoMaandPeriode - leaseNettoMaand;
            const eigenGoedkoper   = verschilMaand < 0;
            const totaalEigen      = eigenNettoMaandPeriode * looptijdMnd;
            const totaalLease      = leaseNettoMaand * looptijdMnd;
            const totaalVerschil   = Math.abs(totaalEigen - totaalLease);

            const RegelItem = ({ label, waarde, kleur, sub }) => (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ color: "#666", fontSize: 13 }}>{label}{sub && <span style={{ fontSize: 11, color: "#bbb", marginLeft: 6 }}>{sub}</span>}</span>
                <span style={{ fontWeight: 500, color: kleur || "#1a1a1a", fontSize: 13, marginLeft: 12, flexShrink: 0 }}>{waarde}</span>
              </div>
            );

            return (
              <Card>
                <SectionTitle>Vergelijkingsperiode</SectionTitle>

                {/* Periode-instelling */}
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1.25rem", padding: "12px 14px", background: "#f7f6f2", borderRadius: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Startdatum vergelijking</label>
                    <input type="date" value={vergPeriodeStart}
                      onChange={e => setVergPeriodeStart(e.target.value)}
                      style={{ width: 150 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Looptijd</label>
                    <div style={{ fontSize: 14, fontWeight: 500, padding: "7px 0" }}>
                      {looptijdMnd} maanden ({looptijdJaren.toFixed(1)} jaar) → t/m {vergEindeDt.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#bbb", paddingBottom: 8 }}>
                    Looptijd instellen bij Lease parameters ↑
                  </div>
                </div>

                {/* Drie kolommen: eigen auto, zakelijk lease, privé lease */}
                {(() => {
                  // ── Zakelijk lease ──
                  const zakLeaseBruto  = leasePrive;
                  const zakNaMobBruto  = Math.max(zakLeaseBruto - mobBrutoMaand, 0);
                  const zakNetto       = zakNaMobBruto + bijtellingBelasting;
                  const zakTotaal      = zakNetto * looptijdMnd;

                  // ── Privé lease ──
                  // Vergoedingen kunnen het leasebedrag overtreffen → overschot netto uitbetaald
                  const privLeaseBruto   = leasePrive;
                  const privSaldo        = privLeaseBruto - mobNettoMaand - kmVergNetto; // kan negatief zijn
                  const privNetto        = Math.max(privSaldo, 0);
                  const privOverschot    = privSaldo < 0 ? Math.abs(privSaldo) : 0;
                  const privTotaal       = privNetto * looptijdMnd;

                  // ── Eigen auto ──
                  // eigenNettoMaandPeriode kan ook negatief zijn (vergoedingen > kosten)
                  const eigenSaldo       = eigenNettoMaandPeriode; // kan negatief zijn
                  const eigenNetto       = Math.max(eigenSaldo, 0);
                  const eigenOverschot   = eigenSaldo < 0 ? Math.abs(eigenSaldo) : 0;
                  const eigenTotaalP     = eigenNetto * looptijdMnd;

                  // Voor staafgrafiek: gebruik absolute netto last (0 bij overschot)
                  const scenario = [
                    { label: "🚗 Eigen auto",     netto: eigenNetto, overschot: eigenOverschot, totaal: eigenTotaalP, color: COLORS.primary },
                    { label: "💼 Zakelijk lease", netto: zakNetto,   overschot: 0,              totaal: zakTotaal,    color: "#8E44AD" },
                    { label: "📋 Privé lease",    netto: privNetto,  overschot: privOverschot,  totaal: privTotaal,   color: COLORS.lease },
                  ];
                  const maxNetto    = Math.max(...scenario.map(s => s.netto), 1);
                  // Goedkoopst = laagste netto last (overschot = nog beter dan 0)
                  const effectief   = scenario.map(s => ({ ...s, effectief: s.netto - s.overschot }));
                  const goedkoopste = effectief.reduce((a, b) => a.effectief <= b.effectief ? a : b);

                  const KolLabel = ({ children, color }) => (
                    <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 10 }}>{children}</div>
                  );
                  const Lijn = () => <div style={{ borderTop: "0.5px solid #e0ddd8", margin: "8px 0" }} />;

                  const Totaalrij = ({ netto, overschot, totaal, color }) => (
                    <>
                      <Lijn />
                      {overschot > 0 ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 14, color: COLORS.success }}>
                            <span>Netto uitbetaald/mnd</span>
                            <span>+ {fmt(overschot)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.success, marginTop: 2, marginBottom: 4 }}>
                            Vergoedingen overtreffen de autokosten
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
                            <span>Totaal {looptijdMnd} mnd uitbetaald</span>
                            <span style={{ color: COLORS.success, fontWeight: 500 }}>+ {fmt(overschot * looptijdMnd)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 15 }}>
                            <span>Netto/mnd</span>
                            <span style={{ color }}>{fmt(netto)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginTop: 4 }}>
                            <span>Totaal {looptijdMnd} mnd</span>
                            <span>{fmt(totaal)}</span>
                          </div>
                        </>
                      )}
                    </>
                  );

                  return (
                    <>
                      <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>

                        {/* Eigen auto */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <KolLabel color={COLORS.primary}>🚗 Eigen auto</KolLabel>
                          <div style={{ background: eigenOverschot > 0 ? "#f0faf4" : "#f7f6f2", borderRadius: 8, padding: "12px 14px", border: eigenOverschot > 0 ? `1px solid ${COLORS.success}30` : "none" }}>
                            <RegelItem label="Kosten/mnd"           waarde={`${fmt(kostenTotaalPeriode / looptijdMnd)}/mnd`} sub={`${kostenInPeriode.length} posten`} />
                            <RegelItem label="Afschrijving/mnd"     waarde={`${fmt(afschrMaandPeriode)}/mnd`} />
                            <Lijn />
                            <RegelItem label="Bruto maandlast"      waarde={`${fmt(eigenKostenMaandPeriode)}/mnd`} />
                            <RegelItem label="Mob.vergoeding netto" waarde={`− ${fmt(mobNettoMaand)}/mnd`} kleur={COLORS.success} />
                            <RegelItem label="Km-vergoeding netto"  waarde={`− ${fmt(kmVergNetto)}/mnd`}   kleur={COLORS.success} />
                            <Totaalrij netto={eigenNetto} overschot={eigenOverschot} totaal={eigenTotaalP} color={COLORS.primary} />
                          </div>
                          {kostenInPeriode.length === 0 && (
                            <div style={{ marginTop: 6, fontSize: 11, color: COLORS.accent, padding: "5px 8px", background: "#fdf8f0", borderRadius: 6 }}>
                              ⚠ Geen kosten voor deze periode — alleen afschrijving.
                            </div>
                          )}
                        </div>

                        {/* Zakelijk lease */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <KolLabel color="#8E44AD">💼 Zakelijk lease</KolLabel>
                          <div style={{ background: "#f7f6f2", borderRadius: 8, padding: "12px 14px" }}>
                            <RegelItem label="Lease maandbedrag"    waarde={`${fmt(zakLeaseBruto)}/mnd`} />
                            <RegelItem label="Mob.vergoeding (bruto)"
                              waarde={`− ${fmt(mobBrutoMaand)}/mnd`}
                              kleur={COLORS.success}
                              sub="werkgever → leasemij" />
                            <Lijn />
                            <RegelItem label="Eigen bijdrage"       waarde={`${fmt(zakNaMobBruto)}/mnd`} />
                            <RegelItem label="Bijtelling belasting"
                              waarde={`+ ${fmt(bijtellingBelasting)}/mnd`}
                              kleur={COLORS.danger}
                              sub={`${state.bijtellingPct}% × ${state.belastingschijf}%`} />
                            <RegelItem label="Km-vergoeding"        waarde="vervalt" kleur="#bbb" />
                            <Totaalrij netto={zakNetto} overschot={0} totaal={zakTotaal} color="#8E44AD" />
                          </div>
                        </div>

                        {/* Privé lease */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <KolLabel color={COLORS.lease}>📋 Privé lease</KolLabel>
                          <div style={{ background: privOverschot > 0 ? "#f0faf4" : "#f7f6f2", borderRadius: 8, padding: "12px 14px", border: privOverschot > 0 ? `1px solid ${COLORS.success}30` : "none" }}>
                            <RegelItem label="Lease maandbedrag"    waarde={`${fmt(privLeaseBruto)}/mnd`} />
                            <RegelItem label="Mob.vergoeding netto"
                              waarde={`− ${fmt(mobNettoMaand)}/mnd`}
                              kleur={COLORS.success}
                              sub="ontvang je als loon" />
                            <RegelItem label="Km-vergoeding netto"
                              waarde={`− ${fmt(kmVergNetto)}/mnd`}
                              kleur={COLORS.success}
                              sub="blijft van toepassing" />
                            <RegelItem label="Bijtelling"           waarde="n.v.t." kleur="#bbb" />
                            <Totaalrij netto={privNetto} overschot={privOverschot} totaal={privTotaal} color={COLORS.lease} />
                          </div>
                        </div>
                      </div>

                      {/* Visuele staafvergelijking */}
                      <div style={{ marginTop: "1.25rem" }}>
                        {scenario.map(s => {
                          const heeftOverschot = s.overschot > 0;
                          const maxBar = Math.max(maxNetto, 1);
                          return (
                            <div key={s.label} style={{ marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span style={{ fontWeight: 500 }}>{s.label}</span>
                                <span style={{ fontWeight: 600, color: heeftOverschot ? COLORS.success : "#1a1a1a" }}>
                                  {heeftOverschot
                                    ? `+ ${fmt(s.overschot)}/mnd uitbetaald`
                                    : `${fmt(s.netto)}/mnd · ${fmt(s.totaal)} totaal`}
                                </span>
                              </div>
                              <div style={{ height: 10, background: "#f0ede8", borderRadius: 5, position: "relative" }}>
                                {heeftOverschot ? (
                                  // Groene balk voor overschot (omgekeerd = voordeel)
                                  <div style={{ height: 10, borderRadius: 5, width: `${Math.min((s.overschot / maxBar) * 100, 100)}%`, background: COLORS.success }} />
                                ) : (
                                  <div style={{ height: 10, borderRadius: 5, width: `${(s.netto / maxBar) * 100}%`, background: s.color, transition: "width 0.3s" }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#bbb", marginTop: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 10, height: 10, background: COLORS.success, borderRadius: 2, display: "inline-block" }} />Groene balk = overschot (wordt uitbetaald)
                          </span>
                        </div>
                      </div>

                      {/* Conclusie */}
                      <div style={{ marginTop: "0.875rem", padding: "14px 16px", background: "#f0faf4", borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                          {goedkoopste.overschot > 0
                            ? `✅ ${goedkoopste.label} levert ${fmt(goedkoopste.overschot)}/mnd netto op`
                            : `✅ ${goedkoopste.label} is het goedkoopst — ${fmt(goedkoopste.netto)}/mnd netto`}
                        </div>
                        <div style={{ fontSize: 13, color: "#666", display: "flex", gap: 20, flexWrap: "wrap" }}>
                          {effectief.filter(s => s !== goedkoopste).map(s => {
                            const verschil = s.effectief - goedkoopste.effectief;
                            return (
                              <span key={s.label}>{s.label}: <b>{fmt(verschil)}/mnd duurder</b></span>
                            );
                          })}
                          <span>Periode: {vergStartDt.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })} – {vergEindeDt.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div style={{ marginTop: 10, fontSize: 12, color: "#bbb", lineHeight: 1.6 }}>
                  ⓘ Eigen auto kosten = werkelijk ingevoerde posten in de periode + afschrijving. Zijn er geen posten voor die periode, dan wordt alleen de afschrijving meegenomen.
                  Lease is een schatting — vraag altijd een offerte op. Belastingschijf: {state.belastingschijf}%.
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ══ TAB IMPORT ══ */}
      {tab === "import" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>CSV importeren</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 10, lineHeight: 1.7 }}>
              Formaat: <code style={{ background: "#f7f6f2", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>datum;categorie;bedrag;km;omschrijving</code><br />
              Categorieën: {COST_CATEGORIES.map(c => c.id).join(", ")}
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={7}
              placeholder={"datum;categorie;bedrag;km;omschrijving\n2024-01-10;verzekering;950;;Jaarlijkse premie\n2024-03-15;brandstof;85;62000;Tankbeurt"}
              style={{ width: "100%", fontFamily: "monospace", fontSize: 12, padding: 10, borderRadius: 6, border: "0.5px solid #e0ddd8", background: "#fafaf8", color: "#1a1a1a", boxSizing: "border-box", resize: "vertical" }} />
            {importError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>⚠ {importError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={handleImport} style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 500 }}>Importeren</button>
              <button onClick={() => setImportText("")} style={{ background: "none", border: "0.5px solid #e0ddd8", borderRadius: 6, padding: "9px 14px", cursor: "pointer", color: "#999" }}>Wissen</button>
            </div>
          </Card>
          <Card>
            <SectionTitle>Export naar CSV</SectionTitle>
            <textarea readOnly rows={Math.min(alleKosten.length + 2, 14)} value={exportCSV}
              style={{ width: "100%", fontFamily: "monospace", fontSize: 12, padding: 10, borderRadius: 6, border: "0.5px solid #e0ddd8", background: "#fafaf8", color: "#888", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => {
                  const blob = new Blob([exportCSV], { type: "text/csv;charset=utf-8;" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  const naam = `autokosten_${(state.merk || "auto").toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`;
                  a.href = url; a.download = naam; a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 500 }}>
                ⬇ Opslaan als bestand
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(exportCSV)}
                style={{ background: "none", border: "0.5px solid #e0ddd8", borderRadius: 6, padding: "9px 14px", cursor: "pointer", color: "#666" }}>
                Kopiëren
              </button>
            </div>
          </Card>
          <Card>
            <SectionTitle>Data beheer</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>Alle gegevens worden automatisch opgeslagen in je browser (localStorage).</div>
            <button onClick={() => { if (window.confirm("Weet je zeker dat je alle data wilt wissen?")) { localStorage.removeItem(STORAGE_KEY); setState(defaultState()); }}}
              style={{ background: "none", border: `0.5px solid ${COLORS.danger}`, color: COLORS.danger, borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
              Alle data wissen
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
