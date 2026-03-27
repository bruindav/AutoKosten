// AutoKosten v2 fix43
// Multi-auto: meerdere auto-profielen, switchen via header

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from "recharts";

const APP_VERSION = "v2 fix44";

const VOORBEELD_CSV = `datum;categorie;bedrag;km;omschrijving
2025-03-14;onderhoud;586.68;217191;Onderhoud groot
2022-03-20;reparatie;3983.67;176686;Distributie en turbo vervangen
2022-03-24;banden;197.22;170319;1 band
2024-10-28;reparatie;2533;210828;Dynamo/ startmotor / aandrijfriem
2023-05-31;reparatie;285.57;184215;Multiriem vervangen
2024-01-15;onderhoud;594.58;196509;Onderhoudsbeurt klein
2022-01-18;onderhoud;490.82;162532;Onderhoud
2025-09-23;reparatie;273;;Raam links achter
2025-01-20;onderhoud;30;;Apk
2026-03-07;onderhoud;559.13;237000;Grote beurt
2019-01-04;onderhoud;605;102300;
2020-06-06;reparatie;183;131741;Storing oplossen
2021-01-19;onderhoud;480;144656;Onderhoudsbeurt
2022-09-02;reparatie;1598;172707;Gasklephuis
2023-04-25;onderhoud;322.9;183019;
2019-04-15;banden;49;;Wissel
2018-10-31;banden;302;;4x banden
2025-07-12;verzekering;179;;Pechhulp allianz
2024-07-10;verzekering;139;;Pechhulp
2022-07-12;verzekering;109;;Pechhulp allianz
2024-07-19;verzekering;139;;Pechhulp allianz
2025-12-31;brandstof;1400;;Geschat
2024-12-31;brandstof;1400;;Geschat
2023-03-31;brandstof;1400;;Geschat
2022-03-26;brandstof;1400;;Geschat
2021-03-26;brandstof;1400;;Geschat
2019-03-26;brandstof;1400;;Geschat
2020-03-26;brandstof;1400;;Geschat
2018-03-18;brandstof;1300;;Geschat
2016-01-01;wegenbelasting;552;;MRB kwartaal
2016-03-31;wegenbelasting;552;;MRB kwartaal
2016-06-30;wegenbelasting;552;;MRB kwartaal
2016-09-30;wegenbelasting;552;;MRB kwartaal
2017-01-01;wegenbelasting;552;;MRB kwartaal
2017-03-31;wegenbelasting;552;;MRB kwartaal
2017-06-30;wegenbelasting;552;;MRB kwartaal
2017-09-30;wegenbelasting;552;;MRB kwartaal
2018-01-01;wegenbelasting;552;;MRB kwartaal
2018-03-31;wegenbelasting;552;;MRB kwartaal
2018-06-30;wegenbelasting;552;;MRB kwartaal
2018-09-30;wegenbelasting;552;;MRB kwartaal
2019-01-01;wegenbelasting;552;;MRB kwartaal
2019-03-31;wegenbelasting;552;;MRB kwartaal
2019-06-30;wegenbelasting;552;;MRB kwartaal
2019-09-30;wegenbelasting;552;;MRB kwartaal
2020-01-01;wegenbelasting;552;;MRB kwartaal
2020-03-31;wegenbelasting;552;;MRB kwartaal
2020-06-30;wegenbelasting;552;;MRB kwartaal
2020-09-30;wegenbelasting;552;;MRB kwartaal
2021-01-01;wegenbelasting;552;;MRB kwartaal
2021-03-31;wegenbelasting;552;;MRB kwartaal
2021-06-30;wegenbelasting;552;;MRB kwartaal
2021-09-30;wegenbelasting;552;;MRB kwartaal
2022-01-01;wegenbelasting;552;;MRB kwartaal
2022-03-31;wegenbelasting;552;;MRB kwartaal
2022-06-30;wegenbelasting;552;;MRB kwartaal
2022-09-30;wegenbelasting;552;;MRB kwartaal
2023-01-01;wegenbelasting;552;;MRB kwartaal
2023-03-31;wegenbelasting;552;;MRB kwartaal
2023-06-30;wegenbelasting;552;;MRB kwartaal
2023-09-30;wegenbelasting;552;;MRB kwartaal
2024-01-01;wegenbelasting;552;;MRB kwartaal
2024-03-31;wegenbelasting;552;;MRB kwartaal
2024-06-30;wegenbelasting;552;;MRB kwartaal
2024-09-30;wegenbelasting;552;;MRB kwartaal
2025-01-01;wegenbelasting;552;;MRB kwartaal
2025-03-31;wegenbelasting;552;;MRB kwartaal
2025-06-30;wegenbelasting;552;;MRB kwartaal
2025-09-30;wegenbelasting;552;;MRB kwartaal
2026-01-01;wegenbelasting;552;;MRB kwartaal
2015-01-01;brandstof;837;;Diesel 2015 (CBS)
2016-01-01;brandstof;781;;Diesel 2016 (CBS)
2017-01-01;brandstof;836;;Diesel 2017 (CBS)
2018-01-01;brandstof;893;;Diesel 2018 (CBS)
2019-01-01;brandstof;893;;Diesel 2019 (CBS)
2020-01-01;brandstof;836;;Diesel 2020 (CBS)
2021-01-01;brandstof;996;;Diesel 2021 (CBS)
2022-01-01;brandstof;1217;;Diesel 2022 (CBS)
2023-01-01;brandstof;1085;;Diesel 2023 (CBS)
2024-01-01;brandstof;1101;;Diesel 2024 (CBS)
2025-01-01;brandstof;1084;;Diesel 2025 (CBS)
2026-01-01;brandstof;1138;;Diesel 2026 (CBS)`;

const VOORBEELD_STATE = {
  label: "Voorbeeld auto", merk: "Peugeot", model: "508", bouwjaar: "2013",
  brandstof: "Diesel", kenteken: "VOORBEELD", gewichtKg: 1560, provincie: "gelderland",
  aankoopprijs: 18500, aankoopdatum: "2015-06-01",
  verwachteVerkoopdatum: "2027-01-01", verwachtVerkoopprijs: 2500,
  jaarlijkseKm: 18000, kmStandAankoop: 62000, huidigeKmStand: 237000,
  cataloguswaarde: 35000, leaseLooptijd: 60, leaseKm: 18000, leaseAanbetaling: 0,
  leaseStijgingPct: 10, bijtellingPct: 22, belastingschijf: 37,
  gemiddeldVerbruik: 18, brandstofPrijs: 1.50, brandstofAutomatisch: false,
  brandstofPrijzenPerJaar: {}, brandstofJaarBedrag: null,
  mobiliteitBrutoMaand: 0, kmVergTarief: 0, kmVergKmMaand: 0, kmVergMaandTotaal: 0,
  mrbWerkelijkMaand: "", mrbAutomatisch: false,
  verzekeringAutomatisch: false, verzekeringType: "WA", verzekeringJaren: [],
  pechhulpJaren: [], cbsLaden: false, brandstofPrijzenPerJaar: {},
  leaseBedragHandmatig: null, leasePriveBedragHandmatig: null,
  kmPerTank: null, tankLiter: null,
};

const STORAGE_KEY = "autokosten_v3_multi";

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

// ─── Referentiekosten per segment en leeftijdsklasse ────────────────────────
// Gebaseerd op ANWB-richtlijnen en branchegemiddelden (2024, excl. brandstof en MRB)
// Bedragen zijn jaarlijkse kosten in euro's
const REF_SEGMENTEN = [
  { id: "klein",    label: "Klein (A/B)",       voorbeeld: "Polo, Yaris, 208",   catalogusMax: 22000 },
  { id: "compact",  label: "Compact (C)",        voorbeeld: "Golf, Focus, 308",   catalogusMax: 35000 },
  { id: "midden",   label: "Middenklasse (D)",   voorbeeld: "Passat, Mondeo",     catalogusMax: 50000 },
  { id: "suv",      label: "SUV / Crossover",    voorbeeld: "Tiguan, CR-V, 3008", catalogusMax: 60000 },
  { id: "premium",  label: "Premium (E+)",       voorbeeld: "BMW 5, Audi A6",     catalogusMax: 999999 },
];

// Referentie: [onderhoud, reparatie, banden, wassen] per jaar
// Per leeftijdsklasse: 0-3jr, 3-6jr, 6-10jr, 10+jr
const REF_KOSTEN = {
  //                0-3jr   3-6jr   6-10jr  10+jr
  klein:   { onderhoud: [450,  600,  750,  950],  reparatie: [100,  250,  500,  800],  banden: [180, 200, 220, 240], wassen: [120,120,120,120] },
  compact: { onderhoud: [550,  750,  950, 1200],  reparatie: [120,  300,  650, 1100],  banden: [220, 250, 270, 290], wassen: [150,150,150,150] },
  midden:  { onderhoud: [700,  950, 1200, 1500],  reparatie: [150,  400,  800, 1300],  banden: [280, 310, 330, 360], wassen: [180,180,180,180] },
  suv:     { onderhoud: [800, 1050, 1350, 1700],  reparatie: [180,  450,  900, 1400],  banden: [350, 380, 400, 430], wassen: [180,180,180,180] },
  premium: { onderhoud: [1200,1600, 2000, 2600],  reparatie: [300,  700, 1400, 2200],  banden: [450, 500, 550, 600], wassen: [200,200,200,200] },
};

function bepaalSegment(cataloguswaarde, merk) {
  const cat = Number(cataloguswaarde) || 0;
  const m   = (merk || "").toLowerCase();
  // Premium merken
  if (["bmw","audi","mercedes","lexus","volvo","porsche","jaguar","land rover","maserati"].some(p => m.includes(p))) {
    return cat < 40000 ? "midden" : "premium";
  }
  for (const seg of REF_SEGMENTEN) {
    if (cat <= seg.catalogusMax) return seg.id;
  }
  return "compact";
}

function getLeeftijdsIndex(bouwjaar) {
  const leeftijd = new Date().getFullYear() - Number(bouwjaar || new Date().getFullYear());
  if (leeftijd < 3)  return 0;
  if (leeftijd < 6)  return 1;
  if (leeftijd < 10) return 2;
  return 3;
}

function berekenReferentieKosten(segment, bouwjaar) {
  const ref = REF_KOSTEN[segment] || REF_KOSTEN.compact;
  const idx = getLeeftijdsIndex(bouwjaar);
  return {
    onderhoud: ref.onderhoud[idx],
    reparatie: ref.reparatie[idx],
    banden:    ref.banden[idx],
    wassen:    ref.wassen[idx],
    totaal:    ref.onderhoud[idx] + ref.reparatie[idx] + ref.banden[idx] + ref.wassen[idx],
  };
}

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
    leaseStijgingPct: 10,
    leaseBedragHandmatig: null,
    leasePriveBedragHandmatig: null,
    gemiddeldVerbruik: "",
    tankLiter: null,
    kmPerTank: null,
    brandstofPrijs: "",
    brandstofJaarBedrag: null,
    brandstofAutomatisch: false,
    brandstofPrijzenPerJaar: {},
    cbsLaden: false,
    mrbAutomatisch: false,
    mrbWerkelijkMaand: "",
    verzekeringAutomatisch: false,
    verzekeringType: "allrisk",
    verzekeringJaren: [],
    pechhulpJaren: [],
    huidigeKmStand: null,
    kmStandAankoop: null,
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
      <div onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px 7px 28px", background: "#fafaf8", borderBottom: "0.5px solid #f0ede8", cursor: "pointer", userSelect: "none" }}>
        <span style={{ fontSize: 11, color: open ? COLORS.accent : "#bbb", transform: `rotate(${open ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s", width: 10 }}>▶</span>
        <span style={{ fontSize: 13 }}>{cat?.icon} {cat?.label || catId}</span>
        <span style={{ fontSize: 11, color: "#bbb" }}>{posten.length} posten{auto > 0 ? ` (${auto} auto)` : ""}</span>
        <span style={{ marginLeft: "auto", fontWeight: 500, fontSize: 13 }}>{fmt(totaal)}</span>
      </div>
      {open && posten.map(k => {
        if (editId === k.id) {
          return (
            <div key={k.id} style={{ padding: "8px 12px 8px 28px", borderBottom: "0.5px solid #f5f4f0", background: "#fffbf5" }}>
              <EditRijInline kost={k} onSave={onSave} onCancel={() => setEditId(null)} />
            </div>
          );
        }
        return (
          <div key={k.id} style={{ padding: "6px 12px 6px 28px", borderBottom: "0.5px solid #f5f4f0", background: k.automatisch ? "#f9fdf9" : "#fff" }}>
            {/* Regel 1: datum + bedrag + acties */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#aaa", flexShrink: 0 }}>{k.datum}</span>
              <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{fmt(k.bedrag)}</span>
              {k.km && <span style={{ fontSize: 12, color: "#bbb", flexShrink: 0 }}>{fmtN(k.km)} km</span>}
              {k.automatisch && <span style={{ fontSize: 11, color: COLORS.success, background: "#e8f8ef", borderRadius: 3, padding: "1px 5px" }}>auto</span>}
              <span style={{ marginLeft: "auto", flexShrink: 0 }}>
                {!k.automatisch && (
                  <>
                    <button onClick={() => setEditId(k.id)} title="Bewerken"
                      style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.primary, fontSize: 15, padding: "2px 4px" }}>✏</button>
                    <button onClick={() => onVerwijder(k.id)} title="Verwijderen"
                      style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, fontSize: 15, padding: "2px 4px" }}>✕</button>
                  </>
                )}
              </span>
            </div>
            {/* Regel 2: omschrijving (alleen als aanwezig) */}
            {k.omschrijving && (
              <div style={{ fontSize: 12, color: "#999", marginTop: 1, paddingLeft: 0 }}>{k.omschrijving}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Inline edit als gestapeld formulier (mobiel-vriendelijk)
function EditRijInline({ kost, onSave, onCancel }) {
  const [e, setE] = useState({ ...kost, bedrag: String(kost.bedrag), km: kost.km ? String(kost.km) : "" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input type="date" value={e.datum} onChange={x => setE(p => ({ ...p, datum: x.target.value }))} style={{ flex: "1 1 130px" }} />
        <input type="number" placeholder="Bedrag" value={e.bedrag} onChange={x => setE(p => ({ ...p, bedrag: x.target.value }))} style={{ flex: "1 1 80px" }} />
        <input type="number" placeholder="Km" value={e.km} onChange={x => setE(p => ({ ...p, km: x.target.value }))} style={{ flex: "1 1 80px" }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <select value={e.categorie} onChange={x => setE(p => ({ ...p, categorie: x.target.value }))} style={{ flex: "1 1 150px" }}>
          {COST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <input placeholder="Omschrijving" value={e.omschrijving} onChange={x => setE(p => ({ ...p, omschrijving: x.target.value }))} style={{ flex: "2 1 150px" }} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onSave({ ...e, bedrag: Number(e.bedrag), km: e.km ? Number(e.km) : null })}
          style={{ background: COLORS.success, color: "#fff", border: "none", borderRadius: 5, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>✓ Opslaan</button>
        <button onClick={onCancel}
          style={{ background: "none", border: "0.5px solid #ccc", borderRadius: 5, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>Annuleren</button>
      </div>
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

// ─── Multi-auto storage helpers ──────────────────────────────────────────────

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Nieuwe structuur: { autos: [{id, label, ...state}], actiefId }
      if (parsed.autos && parsed.actiefId) return parsed;
    }
    // Migreer oude v2 data naar nieuwe structuur
    const oudV2 = localStorage.getItem("autokosten_v2");
    if (oudV2) {
      const oudeState = JSON.parse(oudV2);
      const eersteAuto = { id: "auto_1", label: oudeState.merk && oudeState.model ? `${oudeState.merk} ${oudeState.model}` : "Mijn auto", ...defaultState(), ...oudeState };
      return { autos: [eersteAuto], actiefId: "auto_1" };
    }
  } catch {}
  const eersteAuto = { id: "auto_1", label: "Mijn auto", ...defaultState() };
  return { autos: [eersteAuto], actiefId: "auto_1" };
}

function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function nieuweAutoId() {
  return `auto_${Date.now()}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function App() {
  // Multi-auto: alle auto's + actieve auto
  const [storage, setStorage] = useState(() => loadStorage());
  const actiefId  = storage.actiefId;
  const alleAutos = storage.autos;
  const state     = alleAutos.find(a => a.id === actiefId) || alleAutos[0];

  // Sla op bij wijziging
  useEffect(() => { saveStorage(storage); }, [storage]);

  // Helper: update een veld van de actieve auto
  const set = (key, val) => setStorage(s => ({
    ...s,
    autos: s.autos.map(a => a.id === actiefId ? { ...a, [key]: val } : a),
  }));

  // Helper: update de hele state van de actieve auto
  const setState = (updater) => setStorage(s => ({
    ...s,
    autos: s.autos.map(a => a.id === actiefId
      ? (typeof updater === "function" ? updater(a) : { ...a, ...updater })
      : a),
  }));

  // Auto toevoegen
  const voegAutoToe = (label) => {
    const id = nieuweAutoId();
    setStorage(s => ({
      autos: [...s.autos, { id, label: label || "Nieuwe auto", ...defaultState() }],
      actiefId: id,
    }));
  };

  // Auto verwijderen
  const verwijderAuto = (id) => {
    setStorage(s => {
      const rest = s.autos.filter(a => a.id !== id);
      if (rest.length === 0) {
        const nieuw = { id: nieuweAutoId(), label: "Mijn auto", ...defaultState() };
        return { autos: [nieuw], actiefId: nieuw.id };
      }
      return { autos: rest, actiefId: s.actiefId === id ? rest[0].id : s.actiefId };
    });
  };

  // Auto label wijzigen
  const setAutoLabel = (id, label) => setStorage(s => ({
    ...s,
    autos: s.autos.map(a => a.id === id ? { ...a, label } : a),
  }));

  const [tab, setTab] = useState("auto");
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwError, setRdwError]     = useState("");
  const [rdwRaw, setRdwRaw]         = useState(null);
  const [nieuwKost, setNieuwKost]   = useState({ datum: "", categorie: "brandstof", bedrag: "", km: "", omschrijving: "" });
  const [editId, setEditId]         = useState(null);
  const [openJaren, setOpenJaren]   = useState(() => new Set([String(new Date().getFullYear())]));
  const [analyseJaar, setAnalyseJaar] = useState("tot_nu");
  const [vergPeriodeStart, setVergPeriodeStart] = useState("tot_nu");
  const vergModus = vergPeriodeStart === "__lastjaar" ? "__lastjaar" : vergPeriodeStart === "__gem5" ? "__gem5" : vergPeriodeStart === "tot_nu" ? "tot_nu" : "handmatig";
  const [samPeriode, setSamPeriode] = useState("gem_aankoop");
  const [perMaand, setPerMaand] = useState(true);
  const [openSec, setOpenSec] = useState({ kosten: false, vergoed: false });
  const [showNieuwKost, setShowNieuwKost] = useState(false);
  const [verzTab, setVerzTab] = useState("verz");
  const [openVerg, setOpenVerg] = useState(false);
  const [openLeaseParams, setOpenLeaseParams] = useState(false);
  const [openLeaseUitkomst, setOpenLeaseUitkomst] = useState(false);
  const [openBlokken, setOpenBlokken] = useState({ rdw: false, voertuig: false, brandstof: false, mrb: false, verzekering: false, vergoedingen: false });
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [saveFlash, setSaveFlash]   = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("autokosten_welcomed"));
  const [showDonatie, setShowDonatie] = useState(() => {
    if (localStorage.getItem("autokosten_donatie_gedaan")) return false;
    if (!localStorage.getItem("autokosten_welcomed")) return false; // welkomst heeft voorrang
    if (localStorage.getItem("autokosten_donatie_uitgesteld")) {
      const tot = Number(localStorage.getItem("autokosten_donatie_uitgesteld"));
      if (Date.now() < tot) return false;
    }
    const sessies = Number(localStorage.getItem("autokosten_sessies") || "0") + 1;
    localStorage.setItem("autokosten_sessies", String(sessies));
    return sessies >= 5;
  });
  const [showAutoMenu, setShowAutoMenu] = useState(false);
  const [editLabelId, setEditLabelId] = useState(null);
  const [editLabelVal, setEditLabelVal] = useState("");
  const [nieuwAutoLabel, setNieuwAutoLabel] = useState("");
  const [nieuwVerzJaar, setNieuwVerzJaar] = useState(String(new Date().getFullYear()));
  const [nieuwVerzBedrag, setNieuwVerzBedrag] = useState("");

  // Flash bij opslaan
  useEffect(() => {
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 1200);
    return () => clearTimeout(t);
  }, [storage]);

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

  // Pechhulp: per jaar opgegeven via pechhulpJaren array
  const pechhulpPosten = (() => {
    if (!state.pechhulpJaren?.length) return [];
    const einde = new Date(state.verwachteVerkoopdatum);
    const start = new Date(state.aankoopdatum);
    return state.pechhulpJaren.flatMap(pj => {
      if (!pj.type || !pj.bedrag || pj.bedrag <= 0) return [];
      const d = new Date(pj.startJaar, start.getMonth(), 1);
      if (d < start || d > einde) return [];
      return [{
        id: `pech_${pj.startJaar}`,
        datum: d.toISOString().slice(0,10),
        categorie: "verzekering",
        bedrag: pj.bedrag,
        km: null,
        omschrijving: `Pechhulp ${pj.type.includes("anwb") ? "ANWB" : pj.type} ${pj.startJaar}`,
        automatisch: true,
        type: "pechhulp",
      }];
    });
  })();

  // Brandstof: automatische jaarposten met per-jaar CBS-prijs
  const brandstofPosten = (() => {
    if (!state.brandstofAutomatisch) return [];
    const verbruikKml = Number(state.gemiddeldVerbruik) || 0;
    const kmJr        = Number(state.jaarlijkseKm) || 0;
    if (verbruikKml <= 0 || kmJr <= 0) return [];
    const cbsPrijzen = state.brandstofPrijzenPerJaar || {};
    const start = new Date(state.aankoopdatum);
    const einde = new Date(state.verwachteVerkoopdatum);
    const posten = [];
    const bf3      = (state.brandstof || "").toLowerCase();
    const bfLabel  = bf3.includes("elektr") ? "Stroom" : bf3.includes("diesel") ? "Diesel" : bf3.includes("lpg") ? "LPG" : "Benzine";
    for (let j = start.getFullYear(); j <= einde.getFullYear(); j++) {
      const prijs = cbsPrijzen[j];
      if (!prijs) continue;
      const bedrag = Math.round(kmJr / verbruikKml * prijs);
      posten.push({
        id: `brandstof_${j}`,
        datum: `${j}-01-01`,
        categorie: "brandstof",
        bedrag,
        km: null,
        omschrijving: `${bfLabel} ${j} (CBS €${prijs.toFixed(2).replace(".",",")} /l)`,
        automatisch: true,
        type: "brandstof",
      });
    }
    return posten;
  })();

  const alleKosten = [...state.kosten, ...mrbPosten, ...verzPosten, ...pechhulpPosten, ...brandstofPosten];
  const latestKmStand = alleKosten.filter(k => k.km && Number(k.km) > 0).reduce((max, k) => Math.max(max, Number(k.km)), 0);

  const totaalKosten   = alleKosten.reduce((s, k) => s + Number(k.bedrag), 0);
  const kostenTotNu    = alleKosten.filter(k => !k.datum || k.datum <= nu.toISOString().slice(0,10)).reduce((s, k) => s + Number(k.bedrag), 0);
  const totaleAfschr   = state.aankoopprijs - state.verwachtVerkoopprijs;
  const afschrJaar     = totaleAfschr / bezitsjaren;
  const variabelTotaal = alleKosten.filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.variabel).reduce((s, k) => s + Number(k.bedrag), 0);
  const vastTotaal     = totaalKosten - variabelTotaal;
  const afschrTotNu    = afschrJaar * verlopenJaren;
  const kmVast         = (vastTotaal + totaleAfschr) / geredenKm;
  const variabelFractie = totaalKosten > 0 ? variabelTotaal / totaalKosten : 0.25;
  const kmVariabel     = variabelTotaal / geredenKm;
  const kmTotaal       = (kostenTotNu + afschrTotNu) / geredenKm;
  const eigenMaand     = (kostenTotNu + afschrTotNu) / Math.max(verlopenJaren * 12, 1);

  const leasePriveBerekend = berekenLeasePrive(state.cataloguswaarde, state.leaseLooptijd, state.leaseKm, state.leaseAanbetaling);
  const leasePrive     = state.leaseBedragHandmatig ? Number(state.leaseBedragHandmatig) : leasePriveBerekend;
  const leasePrivePrive = state.leasePriveBedragHandmatig ? Number(state.leasePriveBedragHandmatig) : leasePrive;
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

  // Gewogen gemiddeld leasebedrag over een gegeven aantal maanden
  const berekenLeaseGemiddeld = (aantalMaanden) => {
    const looptijdMnd = Number(state.leaseLooptijd) || 48;
    const stijging    = Number(state.leaseStijgingPct || 10) / 100;
    let totaalBedrag  = 0;
    for (let mnd = 0; mnd < aantalMaanden; mnd++) {
      const periodeNr  = Math.floor(mnd / looptijdMnd);
      const maandprijs = Math.round(leasePrive * Math.pow(1 + stijging, periodeNr));
      totaalBedrag += maandprijs;
    }
    return aantalMaanden > 0 ? Math.round(totaalBedrag / aantalMaanden) : leasePrive;
  };

  // Gewogen gemiddelde over volledige bezitsperiode (voor uitkomst-kaart)
  const leaseGemiddeldOverPeriode = berekenLeaseGemiddeld(Math.round(bezitsjaren * 12));

  // Aparte versie voor privé lease (andere basisprijs)
  const berekenLeaseGemiddeldPriv = (aantalMaanden) => {
    const looptijdMnd = Number(state.leaseLooptijd) || 48;
    const stijging    = Number(state.leaseStijgingPct || 10) / 100;
    let totaalBedrag  = 0;
    for (let mnd = 0; mnd < aantalMaanden; mnd++) {
      const periodeNr  = Math.floor(mnd / looptijdMnd);
      const maandprijs = Math.round(leasePrivePrive * Math.pow(1 + stijging, periodeNr));
      totaalBedrag += maandprijs;
    }
    return aantalMaanden > 0 ? Math.round(totaalBedrag / aantalMaanden) : leasePrivePrive;
  };

  // Lease-periodes tabel voor uitleg (volledige bezitsperiode)
  const leasePeriodesTabel = (() => {
    const totaleMaanden = Math.round(bezitsjaren * 12);
    const looptijdMnd   = Number(state.leaseLooptijd) || 48;
    const stijging      = Number(state.leaseStijgingPct || 10) / 100;
    const periodes = [];
    let mnd = 0, periodeNr = 0;
    while (mnd < totaleMaanden) {
      const maandprijs = Math.round(leasePrive * Math.pow(1 + stijging, periodeNr));
      const duur = Math.min(looptijdMnd, totaleMaanden - mnd);
      periodes.push({ nr: periodeNr + 1, maandprijs, duur, totaal: maandprijs * duur });
      mnd += looptijdMnd;
      periodeNr++;
    }
    return periodes;
  })();

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

  // Grafiekdata — inclusief zakelijk lease met inflatie per looptijdperiode
  const kostenPerJaar = {};
  alleKosten.forEach(k => { const j = k.datum?.slice(0,4); if (j) kostenPerJaar[j] = (kostenPerJaar[j]||0)+Number(k.bedrag); });
  const aankoopJaar = aankoopDt.getFullYear();
  const verkoopJaar = verkoopDt.getFullYear();
  const leaseStijging = Number(state.leaseStijgingPct || 10) / 100;
  const looptijdJr    = (Number(state.leaseLooptijd) || 48) / 12;

  let cumEigen = state.aankoopprijs;
  let cumLeasePriv = state.leaseAanbetaling;
  let cumLeaseZak  = state.leaseAanbetaling;
  const grafiekData = [];
  for (let j = aankoopJaar; j <= verkoopJaar; j++) {
    const periodeNr    = Math.floor((j - aankoopJaar) / looptijdJr);  // 0, 1, 2 …
    const leasePrivPeriode = Math.round(leasePrive * Math.pow(1 + leaseStijging, periodeNr));
    const leaseZakPeriode  = Math.round((leasePrive + bijtellingBelasting) * Math.pow(1 + leaseStijging, periodeNr));
    cumEigen     += (kostenPerJaar[String(j)] || 0) + afschrJaar;
    cumLeasePriv += leasePrivPeriode * 12;
    cumLeaseZak  += leaseZakPeriode  * 12;
    grafiekData.push({
      jaar: String(j),
      "Eigen auto":      Math.round(cumEigen),
      "Privé lease":     Math.round(cumLeasePriv),
      "Zakelijk lease":  Math.round(cumLeaseZak),
    });
  }
  // jaarBarData: per jaar vast + variabel gesplitst
  const jaarBarData = (() => {
    const jaren = Object.keys(kostenPerJaar).sort();
    return jaren.map(jaar => {
      const posten = alleKosten.filter(k => k.datum?.slice(0,4) === jaar);
      const variabel = posten.filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.variabel)
        .reduce((s, k) => s + Number(k.bedrag), 0);
      const vast = posten.reduce((s, k) => s + Number(k.bedrag), 0) - variabel;
      return { jaar, vast: Math.round(vast), variabel: Math.round(variabel), totaal: Math.round(vast + variabel) };
    });
  })();
  const jaarBarGemiddelde = jaarBarData.length > 0
    ? Math.round(jaarBarData.reduce((s, d) => s + d.totaal, 0) / jaarBarData.length)
    : 0;
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
  const handleImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImportError("");
      try {
        const text = e.target.result;
        const regels = text.trim().split("\n").filter(l => l.trim() && !l.startsWith("datum"));
        let id = Date.now();
        const nieuw = regels.map(r => {
          const [datum, cat, bedrag, km, omschr] = r.split(/[,;	]/);
          if (!datum || isNaN(Number(bedrag))) throw new Error(`Ongeldige regel: ${r}`);
          const cm = COST_CATEGORIES.find(c => c.id === cat.trim().toLowerCase() || c.label.toLowerCase().includes(cat.trim().toLowerCase()));
          return { id: id++, datum: datum.trim(), categorie: cm?.id||"overig", bedrag: Number(bedrag), km: km?Number(km):null, omschrijving: omschr?.trim()||"", automatisch: false };
        });
        set("kosten", [...state.kosten, ...nieuw]);
        setImportText(`✓ ${nieuw.length} posten geïmporteerd`);
      } catch (err) { setImportError(err.message); }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setImportError("");
    try {
      const regels = importText.trim().split("\n").filter(l => l.trim() && !l.startsWith("datum") && !l.startsWith("✓"));
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

      {/* ══ AUTO-SWITCHER balk ══ */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
        {alleAutos.map(a => (
          <button key={a.id} onClick={() => {
            setStorage(s => ({ ...s, actiefId: a.id }));
            setRdwRaw(null); setRdwError("");
          }} style={{
            padding: "6px 14px", fontSize: 13, borderRadius: 20, cursor: "pointer",
            border: a.id === actiefId ? `1.5px solid ${COLORS.primary}` : "0.5px solid #e0ddd8",
            background: a.id === actiefId ? COLORS.primary : "#fff",
            color: a.id === actiefId ? "#fff" : "#666",
            fontWeight: a.id === actiefId ? 600 : 400,
          }}>{a.label || "Auto"}</button>
        ))}
      </div>

      {/* Header: actieve auto */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#bbb", textTransform: "uppercase", marginBottom: 4 }}>
            AutoKosten {APP_VERSION}
            {saveFlash && <span style={{ marginLeft: 12, color: COLORS.success, fontWeight: 400 }}>✓ opgeslagen</span>}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, wordBreak: "break-word" }}>
            {state.merk && state.model ? `${state.merk} ${state.model}` : state.label || "Mijn auto"}
          </h1>
          {state.bouwjaar && <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>{state.bouwjaar} · {state.brandstof} · {state.kenteken}{state.gewichtKg ? ` · ${fmtN(state.gewichtKg)} kg` : ""}{(state.huidigeKmStand || latestKmStand) ? ` · ${fmtN(state.huidigeKmStand || latestKmStand)} km` : ""}</div>}
        </div>
        {/* Logo rechts */}
        <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          {/* Autosilhouet zijaanzicht */}
          {/* Carrosserie onderste deel */}
          <path d="M6 38 L6 32 Q6 30 8 30 L72 30 Q74 30 74 32 L74 38 Q74 40 72 40 L8 40 Q6 40 6 38 Z" fill="#1B4F72"/>
          {/* Daklijn / bovenkant */}
          <path d="M18 30 Q22 18 30 16 L52 16 Q60 18 64 30 Z" fill="#2980B9"/>
          {/* Voorruit */}
          <path d="M50 30 Q54 20 58 18 L62 18 Q64 20 63 30 Z" fill="#AED6F1" opacity="0.85"/>
          {/* Achterruit */}
          <path d="M30 30 Q28 20 30 18 L38 17 L40 30 Z" fill="#AED6F1" opacity="0.85"/>
          {/* Zijraam middendeel */}
          <path d="M40 30 L41 17 L50 16 L50 30 Z" fill="#AED6F1" opacity="0.85"/>
          {/* Wielkasten */}
          <path d="M14 40 Q14 44 18 44 Q22 44 22 40" fill="#1B4F72" stroke="#1B4F72" strokeWidth="0.5"/>
          <path d="M58 40 Q58 44 62 44 Q66 44 66 40" fill="#1B4F72" stroke="#1B4F72" strokeWidth="0.5"/>
          {/* Wielen */}
          <circle cx="18" cy="42" r="7" fill="#222"/>
          <circle cx="18" cy="42" r="4" fill="#555"/>
          <circle cx="18" cy="42" r="1.5" fill="#888"/>
          <circle cx="62" cy="42" r="7" fill="#222"/>
          <circle cx="62" cy="42" r="4" fill="#555"/>
          <circle cx="62" cy="42" r="1.5" fill="#888"/>
          {/* Koplampen */}
          <ellipse cx="71" cy="34" rx="3" ry="2" fill="#FFF3B0" opacity="0.9"/>
          {/* Achterlicht */}
          <rect x="6" y="31" width="3" height="5" rx="1" fill="#E74C3C" opacity="0.85"/>
          {/* € teken op portier */}
          <text x="28" y="37" fontSize="9" fill="#F0B429" fontWeight="bold" fontFamily="system-ui, sans-serif">€?</text>
        </svg>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ display: "flex", gap: 2, borderBottom: "1px solid #e8e6e0", marginBottom: "1.5rem" }}>
        {[
          { id: "auto",    label: "🚗 Auto" },
          { id: "kosten",  label: "📊 Kosten" },
          { id: "grafiek", label: "📈 Grafiek" },
          { id: "lease",   label: "🔄 Lease" },
          { id: "beheer",  label: "⚙ Beheer" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 12px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            background: "none", border: "none", whiteSpace: "nowrap",
            borderBottom: tab === t.id ? `2px solid ${COLORS.primary}` : "2px solid transparent",
            color: tab === t.id ? COLORS.primary : "#999",
            cursor: "pointer", marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ TAB AUTO ══ */}
      {tab === "auto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Uitklapbare blokken helper */}
          {[
            {
              key: "rdw", titel: "Kenteken opzoeken via RDW",
              inhoud: (
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input value={state.kenteken} onChange={e => set("kenteken", e.target.value.toUpperCase())}
                      placeholder="bijv. AB-123-C" onKeyDown={e => e.key === "Enter" && handleLookup()}
                      style={{ flex: 1, minWidth: 120, fontFamily: "monospace", letterSpacing: "0.12em" }} />
                    <button onClick={handleLookup} disabled={rdwLoading}
                      style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 500 }}>
                      {rdwLoading ? "Zoeken…" : "Opzoeken"}
                    </button>
                  </div>
                  {rdwError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>⚠ {rdwError}</div>}
                  {rdwRaw && (
                    <div style={{ marginTop: 10, padding: "10px 14px", background: "#f0faf4", borderRadius: 8, fontSize: 13, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>✅ <b>{rdwRaw.merk}</b> {rdwRaw.handelsbenaming}</span>
                      <span>📅 {rdwRaw.datum_eerste_toelating?.slice(0,4)}</span>
                      <span>⛽ {rdwRaw.brandstof_omschrijving}</span>
                      <span>⚖ {rdwRaw.massa_rijklaar} kg</span>
                      {rdwRaw.catalogusprijs && <span>💰 {fmt(rdwRaw.catalogusprijs)}</span>}
                      {rdwRaw.co2_uitstoot_gecombineerd && <span>🌿 {rdwRaw.co2_uitstoot_gecombineerd} g/km CO₂</span>}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "voertuig", titel: "Voertuig & financieel",
              inhoud: (
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <div style={{ fontSize: 12, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Voertuig</div>
                    {[["Merk","merk"],["Model","model"],["Bouwjaar","bouwjaar"]].map(([lbl,key]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>{lbl}</label>
                        <input value={state[key]} onChange={e => set(key, e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>Brandstof</label>
                      <select value={state.brandstof} onChange={e => set("brandstof", e.target.value)} style={{ flex: 1, minWidth: 0 }}>
                        <option value="">— kies type</option>
                        <option value="Benzine">Benzine</option>
                        <option value="Diesel">Diesel</option>
                        <option value="LPG">LPG</option>
                        <option value="Elektriciteit">Elektriciteit</option>
                        <option value="Hybride (Benzine/Elektrisch)">Hybride (benzine/elektrisch)</option>
                        <option value="Hybride (Diesel/Elektrisch)">Hybride (diesel/elektrisch)</option>
                        <option value="Waterstof">Waterstof</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>Gewicht (kg)</label>
                      <input type="number" value={state.gewichtKg} onChange={e => set("gewichtKg", e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                    </div>
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <div style={{ fontSize: 12, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Financieel</div>
                    {[
                      ["Aankoopprijs", "aankoopprijs", "number"],
                      ["Aankoopdatum", "aankoopdatum", "date"],
                      ["Verwacht weg",  "verwachteVerkoopdatum", "date"],
                      ["Verkoopprijs",  "verwachtVerkoopprijs", "number"],
                    ].map(([lbl, key, type]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>{lbl}</label>
                        <input type={type}
                          value={type === "number" ? (state[key] ?? "") : (state[key] || "")}
                          onChange={e => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
                          style={{ flex: 1, minWidth: 0 }} />
                      </div>
                    ))}

                    {/* Km-standen */}
                    <div style={{ borderTop: "0.5px solid #f0ede8", paddingTop: 8, marginTop: 4 }}>
                      <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Km-standen</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>Bij aankoop</label>
                        <input type="number" value={state.kmStandAankoop ?? ""}
                          onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            set("kmStandAankoop", val);
                            // Herbereken km/jaar als huidige stand ook bekend is
                            const huidig = state.huidigeKmStand || latestKmStand;
                            if (val && huidig && verlopenJaren > 0) {
                              set("jaarlijkseKm", Math.round((huidig - val) / verlopenJaren));
                            }
                          }}
                          placeholder="optioneel" style={{ flex: 1, minWidth: 0 }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>Nu</label>
                        <input type="number" value={state.huidigeKmStand ?? latestKmStand ?? ""}
                          onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            set("huidigeKmStand", val);
                            // Herbereken km/jaar als aankoopstand ook bekend is
                            if (val && state.kmStandAankoop && verlopenJaren > 0) {
                              set("jaarlijkseKm", Math.round((val - state.kmStandAankoop) / verlopenJaren));
                            }
                          }}
                          placeholder={latestKmStand ? fmtN(latestKmStand) : "optioneel"} style={{ flex: 1, minWidth: 0 }} />
                        {latestKmStand > 0 && (
                          <button onClick={() => {
                            set("huidigeKmStand", latestKmStand);
                            if (state.kmStandAankoop && verlopenJaren > 0) {
                              set("jaarlijkseKm", Math.round((latestKmStand - state.kmStandAankoop) / verlopenJaren));
                            }
                          }}
                            style={{ fontSize: 11, background: "none", border: "0.5px solid #e0ddd8", borderRadius: 4, padding: "4px 6px", cursor: "pointer", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>
                            ← {fmtN(latestKmStand)}
                          </button>
                        )}
                      </div>
                      {/* Km/jaar — berekend of handmatig */}
                      {(() => {
                        const huidig = state.huidigeKmStand || latestKmStand;
                        const berekend = (state.kmStandAankoop && huidig && verlopenJaren > 0)
                          ? Math.round((huidig - state.kmStandAankoop) / verlopenJaren) : null;
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <label style={{ fontSize: 13, color: "#666", width: 90, flexShrink: 0 }}>Km per jaar</label>
                            <input type="number" value={state.jaarlijkseKm ?? ""}
                              onChange={e => set("jaarlijkseKm", e.target.value ? Number(e.target.value) : null)}
                              style={{ flex: 1, minWidth: 0,
                                borderColor: berekend ? COLORS.primary + "80" : undefined }} />
                            {berekend && (
                              <span style={{ fontSize: 11, color: COLORS.primary, whiteSpace: "nowrap", flexShrink: 0 }}>
                                = {fmtN(berekend)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      {state.kmStandAankoop && (state.huidigeKmStand || latestKmStand) && (
                        <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                          {fmtN((state.huidigeKmStand || latestKmStand) - state.kmStandAankoop)} km gereden in {verlopenJaren.toFixed(1)} jaar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "brandstof", titel: (() => {
                const bf = (state.brandstof || "").toLowerCase();
                if (bf.includes("elektr")) return "⚡ Energieverbruik & laadkosten";
                if (bf.includes("hybride") || bf.includes("plug")) return "⛽ Brandstof & laadkosten";
                return "⛽ Brandstofverbruik & kosten";
              })(),
              inhoud: (() => {
                const bf = (state.brandstof || "").toLowerCase();
                const isElektrisch = bf.includes("elektr");
                const isHybride    = bf.includes("hybride") || bf.includes("plug");
                const kmJaar = Number(state.jaarlijkseKm) || 0;

                // Berekende jaarkosten brandstof
                const verbruik = Number(state.gemiddeldVerbruik) || 0;
                const prijs    = Number(state.brandstofPrijs) || 0;
                const berekendeKosten = verbruik > 0 && prijs > 0 && kmJaar > 0
                  ? Math.round(kmJaar / verbruik * prijs) : 0;
                const jaarKosten = state.brandstofJaarBedrag || berekendeKosten;

                // Automatische post info
                const heeftAutoPost = jaarKosten > 0 && state.brandstofAutomatisch;

                return (
                  <div>
                    {/* Verbruik */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      Verbruik
                    </div>

                    {isElektrisch ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <label style={{ fontSize: 13, color: "#666", width: 120, flexShrink: 0 }}>km per kWh</label>
                        <input type="number" step="0.1" placeholder="bijv. 6.5"
                          value={state.gemiddeldVerbruik}
                          onChange={e => set("gemiddeldVerbruik", e.target.value)}
                          style={{ flex: 1, minWidth: 0 }} />
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <label style={{ fontSize: 13, color: "#666", width: 120, flexShrink: 0 }}>km per liter</label>
                        <input type="number" step="0.1" placeholder="bijv. 20"
                          value={state.gemiddeldVerbruik}
                          onChange={e => set("gemiddeldVerbruik", e.target.value)}
                          style={{ flex: 1, minWidth: 0 }} />
                      </div>
                    )}

                    {/* Prijzen per jaar */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 10, borderTop: "0.5px solid #f0ede8", paddingTop: 12 }}>
                      {isElektrisch ? "Stroomprijs per jaar" : "Brandstofprijs per jaar (niet-snelweg)"}
                    </div>

                    {/* Ophaal knop */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                      {/* Toon herkend brandstoftype */}
                      {(() => {
                        const bf2 = (state.brandstof || "").toLowerCase();
                        const isElek  = bf2.includes("elektr") || bf2.includes("waterstof");
                        const isHybr  = bf2.includes("hybride") || bf2.includes("plug");
                        const isDiesel= bf2.includes("diesel");
                        const isLpg   = bf2.includes("lpg") || bf2.includes("autogas");
                        const label   = isElek ? "⚡ Elektriciteit" : isDiesel ? "🛢 Diesel" : isLpg ? "🔵 LPG" : isHybr ? "🔋 Hybride (benzine)" : "⛽ Benzine";
                        const cbsNota = isElek ? "Handmatig invullen (CBS heeft geen thuislaadprijs)" : isDiesel ? "CBS 81567NED diesel, niet-snelweg" : isLpg ? "CBS 81567NED LPG, niet-snelweg" : isHybr ? "CBS 81567NED benzine E95, niet-snelweg" : "CBS 81567NED benzine E95, niet-snelweg";
                        return (
                          <div style={{ fontSize: 12, color: "#666", background: "#f7f6f2", borderRadius: 6, padding: "5px 10px", marginBottom: 4 }}>
                            {label} · <span style={{ color: "#bbb" }}>{cbsNota}</span>
                          </div>
                        );
                      })()}

                      {/* CBS knop alleen voor niet-elektrisch */}
                      {!((state.brandstof || "").toLowerCase().includes("elektr") || (state.brandstof || "").toLowerCase().includes("waterstof")) && (
                        <button
                          onClick={async () => {
                            set("cbsLaden", true);
                            try {
                              const bf2 = (state.brandstof || "").toLowerCase();
                              const isDiesel = bf2.includes("diesel");
                              const isLpg    = bf2.includes("lpg") || bf2.includes("autogas");
                              // Hybride rijdt op benzine voor brandstofkosten
                              const soortNr  = isDiesel ? "2" : isLpg ? "3" : "1";
                              const startJr = aankoopDt.getFullYear();
                              const eindJr  = Math.min(verkoopDt.getFullYear(), new Date().getFullYear());

                              const url = `https://opendata.cbs.nl/ODataApi/OData/81567NED/TypedDataSet?$filter=BrandstofSoort eq '${soortNr}' and Locatie eq '3'&$select=Perioden,GemiddeldePompprijs_1&$orderby=Perioden`;
                              const res = await fetch(url);
                              const json = await res.json();
                              const records = (json?.value || []).filter(r => r.GemiddeldePompprijs_1 != null);

                              const perJaar = {};
                              for (const r of records) {
                                const yr = Number(r.Perioden.slice(0, 4));
                                if (yr >= startJr && yr <= eindJr) {
                                  if (!perJaar[yr]) perJaar[yr] = [];
                                  perJaar[yr].push(r.GemiddeldePompprijs_1);
                                }
                              }
                              const prijzenPerJaar = {};
                              for (const [yr, vals] of Object.entries(perJaar)) {
                                const gem = vals.reduce((s, v) => s + v, 0) / vals.length;
                                prijzenPerJaar[yr] = parseFloat(gem.toFixed(3));
                              }
                              set("brandstofPrijzenPerJaar", prijzenPerJaar);
                            } catch {}
                            set("cbsLaden", false);
                          }}
                          style={{ padding: "8px 14px", fontSize: 12, background: "#f0f4ff", border: `0.5px solid ${COLORS.primary}40`, borderRadius: 6, cursor: "pointer", color: COLORS.primary }}>
                          {state.cbsLaden ? "Bezig…" : "↻ CBS-prijzen ophalen per jaar"}
                        </button>
                      )}
                      <span style={{ fontSize: 11, color: "#bbb" }}>niet-snelweg · gemiddeld per jaar</span>
                    </div>

                    {/* Voor elektrisch: handmatig prijs per jaar invoeren */}
                    {((state.brandstof || "").toLowerCase().includes("elektr") || (state.brandstof || "").toLowerCase().includes("waterstof")) && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: "#bbb", marginBottom: 8 }}>
                          Vul handmatig de gemiddelde stroomprijs per jaar in (€/kWh) — bijv. via je energierekening of vergelijkingssite.
                        </div>
                        {Array.from({ length: Math.min(Math.ceil(bezitsjaren) + 1, 12) }, (_, i) => aankoopDt.getFullYear() + i)
                          .filter(j => j <= Math.min(verkoopDt.getFullYear(), new Date().getFullYear()))
                          .map(jr => {
                            const huidig = (state.brandstofPrijzenPerJaar || {})[jr] || "";
                            return (
                              <div key={jr} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <label style={{ fontSize: 13, color: "#666", width: 50, flexShrink: 0 }}>{jr}</label>
                                <input type="number" step="0.01" placeholder="bijv. 0.25"
                                  value={huidig}
                                  onChange={e => {
                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                    set("brandstofPrijzenPerJaar", { ...(state.brandstofPrijzenPerJaar || {}), [jr]: val });
                                  }}
                                  style={{ width: 100 }} />
                                <span style={{ fontSize: 12, color: "#bbb" }}>€/kWh</span>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Tabel met prijs per jaar + berekende kosten */}
                    {(() => {
                      const startJr = aankoopDt.getFullYear();
                      const eindJr  = verkoopDt.getFullYear();
                      const jaren   = Array.from({ length: eindJr - startJr + 1 }, (_, i) => startJr + i);
                      const cbsPrijzen = state.brandstofPrijzenPerJaar || {};
                      const verbruikKml = Number(state.gemiddeldVerbruik) || 0;
                      const kmJr = Number(state.jaarlijkseKm) || 0;
                      let totaal = 0, aantalMet = 0;
                      return (
                        <div style={{ marginBottom: 12 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: "0.5px solid #e8e6e0" }}>
                                <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 55 }}>Jaar</th>
                                <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 120 }}>
                                  {isElektrisch ? "€/kWh" : "€/liter"} <span style={{ fontWeight: 400 }}>(CBS)</span>
                                </th>
                                <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Kosten/jaar</th>
                                <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Per maand</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jaren.map(jr => {
                                const cbsPrijs = cbsPrijzen[jr];
                                const prijs    = cbsPrijs || null;
                                const kosten   = (prijs && verbruikKml > 0 && kmJr > 0)
                                  ? Math.round(kmJr / verbruikKml * prijs) : null;
                                if (kosten) { totaal += kosten; aantalMet++; }
                                return (
                                  <tr key={jr} style={{ borderBottom: "0.5px solid #f5f4f0" }}>
                                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>{jr}</td>
                                    <td style={{ padding: "6px 8px" }}>
                                      {cbsPrijs
                                        ? <span style={{ color: COLORS.primary }}>€{cbsPrijs.toFixed(2).replace(".",",")}</span>
                                        : <span style={{ color: "#ccc", fontSize: 11 }}>— ophalen</span>}
                                    </td>
                                    <td style={{ padding: "6px 8px", fontWeight: kosten ? 500 : 400, color: kosten ? "#1a1a1a" : "#ccc" }}>
                                      {kosten ? fmt(kosten) : verbruikKml > 0 ? "—" : <span style={{ fontSize: 11 }}>vul verbruik in</span>}
                                    </td>
                                    <td style={{ padding: "6px 8px", color: kosten ? COLORS.success : "#ccc" }}>
                                      {kosten ? fmt(Math.round(kosten / 12)) : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            {aantalMet > 1 && (
                              <tfoot>
                                <tr style={{ borderTop: "1px solid #e0ddd8" }}>
                                  <td colSpan={2} style={{ padding: "6px 8px", color: "#999", fontSize: 12 }}>Gemiddeld/jaar</td>
                                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{fmt(Math.round(totaal / aantalMet))}</td>
                                  <td style={{ padding: "6px 8px", color: COLORS.success, fontWeight: 500 }}>{fmt(Math.round(totaal / aantalMet / 12))}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      );
                    })()}

                    {/* Toggle automatische kostenpost */}
                    {(() => {
                      const cbsPrijzen    = state.brandstofPrijzenPerJaar || {};
                      const verbruikKml   = Number(state.gemiddeldVerbruik) || 0;
                      const kmJr          = Number(state.jaarlijkseKm) || 0;
                      const heeftPrijzen  = Object.keys(cbsPrijzen).length > 0 && verbruikKml > 0 && kmJr > 0;
                      return (
                        <Toggle
                          checked={!!state.brandstofAutomatisch}
                          onChange={v => set("brandstofAutomatisch", v)}
                          label="Brandstofkosten automatisch toevoegen aan kostenlijst"
                          sub={heeftPrijzen
                            ? `Per jaar eigen CBS-prijs · ${aankoopDt.getFullYear()}–${Math.min(verkoopDt.getFullYear(), new Date().getFullYear())}`
                            : "Haal eerst CBS-prijzen op en vul verbruik in"}
                        />
                      );
                    })()}
                  </div>
                );
              })(),
            },
            {
              key: "mrb", titel: "Motorrijtuigenbelasting",
              toon: !!(mrbSchatting || state.mrbWerkelijkMaand || state.gewichtKg),
              inhoud: (
                <div>
                  {/* Provincie hoort hier */}
                  <Row label="Provincie">
                    <select value={state.provincie} onChange={e => set("provincie", e.target.value)} style={{ flex: 1 }}>
                      {Object.keys(MRB_OPCENTEN).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                    </select>
                  </Row>
                  {mrbSchatting && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <MetricCard label="Schatting /kwartaal" value={fmt(mrbSchatting.kwartaal)} sub="op basis van gewicht" />
                      <MetricCard label="Schatting /jaar" value={fmt(mrbSchatting.jaarlijks)} sub="excl. correcties" />
                      {mrbToonBedrag && <MetricCard label="Werkelijk /maand" value={fmt(mrbToonBedrag)} sub={state.mrbWerkelijkMaand ? "door jou opgegeven" : "schatting"} color={state.mrbWerkelijkMaand ? COLORS.primary : "#999"} />}
                      {mrbToonBedrag && <MetricCard label="Werkelijk /kwartaal" value={fmt(mrbToonBedrag * 3)} sub={state.mrbWerkelijkMaand ? "door jou opgegeven" : "schatting"} color={state.mrbWerkelijkMaand ? COLORS.accent : "#999"} />}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f7f6f2", borderRadius: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 13, color: "#666", flexShrink: 0 }}>Werkelijk bedrag per maand (€)</label>
                    <input type="number" placeholder="bijv. 180" value={state.mrbWerkelijkMaand} onChange={e => set("mrbWerkelijkMaand", e.target.value)} style={{ width: 110 }} />
                    {state.mrbWerkelijkMaand && (
                      <button onClick={() => set("mrbWerkelijkMaand", "")}
                        style={{ background: "none", border: "0.5px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12, color: "#999" }}>Wissen</button>
                    )}
                  </div>
                  <Toggle checked={state.mrbAutomatisch} onChange={v => set("mrbAutomatisch", v)}
                    label="MRB kwartaalposten automatisch toevoegen"
                    sub={state.mrbAutomatisch ? `${mrbPosten.length} posten van ${fmt(mrbKwartaal)}/kwartaal` : `Voegt ${fmt(mrbKwartaal)}/kwartaal automatisch toe`} />
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>
                    ⓘ Schatting op basis van {fmtN(state.gewichtKg)} kg · {state.brandstof} · {state.provincie}. Exacte bedragen via belastingdienst.nl.
                  </div>
                </div>
              ),
            },
            {
              key: "verzekering", titel: "Verzekering & pechhulp",
              inhoud: (() => {
                const VERZ_TYPEN = [
                  { value: "allrisk",       label: "All risk" },
                  { value: "beperktcasco",  label: "Beperkt casco" },
                  { value: "wettelijk",     label: "WA" },
                  { value: "waplus",        label: "WA+" },
                ];
                const PECH_TYPEN = [
                  { value: "",              label: "Geen" },
                  { value: "anwb_basis",    label: "ANWB Basis" },
                  { value: "anwb_compleet", label: "ANWB Compleet" },
                  { value: "anwb_europa",   label: "ANWB Europa" },
                  { value: "aa",            label: "AutoMobiel" },
                  { value: "anders",        label: "Anders" },
                ];

                // Bestaande jaar-data ophalen
                const verzJarenMap = {};
                (state.verzekeringJaren || []).forEach(v => { verzJarenMap[v.startJaar] = v; });
                const pechhulpJarenMap = {};
                (state.pechhulpJaren || []).forEach(v => { pechhulpJarenMap[v.startJaar] = v; });

                const aantalJr = Math.ceil(bezitsjaren) + 1;
                const startJr  = aankoopDt.getFullYear();
                const jarenLijst = Array.from({ length: Math.max(aantalJr, 1) }, (_, i) => startJr + i)
                  .filter(j => j <= verkoopDt.getFullYear());

                const updateVerzJaar = (jaar, key, val) => {
                  const bestaand = state.verzekeringJaren || [];
                  const idx = bestaand.findIndex(v => v.startJaar === jaar);
                  const nieuw = idx >= 0
                    ? bestaand.map((v, i) => i === idx ? { ...v, [key]: val } : v)
                    : [...bestaand, { startJaar: jaar, bedrag: 0, type: "allrisk", [key]: val }];
                  set("verzekeringJaren", nieuw);
                };

                const updatePechJaar = (jaar, key, val) => {
                  const bestaand = state.pechhulpJaren || [];
                  const idx = bestaand.findIndex(v => v.startJaar === jaar);
                  const nieuw = idx >= 0
                    ? bestaand.map((v, i) => i === idx ? { ...v, [key]: val } : v)
                    : [...bestaand, { startJaar: jaar, type: "", bedrag: 0, [key]: val }];
                  set("pechhulpJaren", nieuw);
                };

                return (
                  <div>
                    {/* Interne tab-knoppen */}
                    <div style={{ display: "flex", gap: 0, marginBottom: 14, borderBottom: "1px solid #e8e6e0" }}>
                      {[["verz", "Autoverzekering"], ["pech", "Pechhulp"]].map(([id, lbl]) => (
                        <button key={id} onClick={() => setVerzTab(id)} style={{
                          padding: "7px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer",
                          fontWeight: verzTab === id ? 600 : 400,
                          color: verzTab === id ? COLORS.primary : "#999",
                          borderBottom: verzTab === id ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                          marginBottom: -1,
                        }}>{lbl}</button>
                      ))}
                    </div>

                    {/* Tab: Autoverzekering */}
                    {verzTab === "verz" && (
                      <div>
                        <Toggle checked={state.verzekeringAutomatisch} onChange={v => set("verzekeringAutomatisch", v)}
                          label="Premie automatisch splitsen in maandposten"
                          sub="Vul per jaar een jaarbedrag in — de app maakt 12 maandposten aan" />
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: "0.5px solid #e8e6e0" }}>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 50 }}>Jaar</th>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Type</th>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 120 }}>Jaarbedrag (€)</th>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 90 }}>Per maand</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jarenLijst.map(jaar => {
                              const vj = verzJarenMap[jaar] || {};
                              return (
                                <tr key={jaar} style={{ borderBottom: "0.5px solid #f0ede8" }}>
                                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{jaar}</td>
                                  <td style={{ padding: "6px 4px" }}>
                                    <select value={vj.type || "allrisk"} onChange={e => updateVerzJaar(jaar, "type", e.target.value)}
                                      style={{ width: "100%", fontSize: 13 }}>
                                      {VERZ_TYPEN.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ padding: "6px 4px" }}>
                                    <input type="number" placeholder="0" value={vj.bedrag || ""}
                                      onChange={e => updateVerzJaar(jaar, "bedrag", e.target.value ? Number(e.target.value) : 0)}
                                      style={{ width: "100%" }} />
                                  </td>
                                  <td style={{ padding: "6px 8px", color: vj.bedrag > 0 ? COLORS.success : "#bbb", fontWeight: vj.bedrag > 0 ? 500 : 400 }}>
                                    {vj.bedrag > 0 ? fmt(Math.round(vj.bedrag / 12)) : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {verzPosten.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 12, color: COLORS.success }}>
                            ✓ {verzPosten.length} maandposten toegevoegd aan kostenlijst
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab: Pechhulp */}
                    {verzTab === "pech" && (
                      <div>
                        <p style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>
                          Pechhulp wordt als één jaarpost toegevoegd aan de kostenlijst.
                        </p>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: "0.5px solid #e8e6e0" }}>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 50 }}>Jaar</th>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb" }}>Aanbieder</th>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 120 }}>Jaarbedrag (€)</th>
                              <th style={{ textAlign: "left", padding: "5px 8px", fontWeight: 500, color: "#bbb", width: 90 }}>Per maand</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jarenLijst.map(jaar => {
                              const pj = pechhulpJarenMap[jaar] || {};
                              return (
                                <tr key={jaar} style={{ borderBottom: "0.5px solid #f0ede8" }}>
                                  <td style={{ padding: "6px 8px", fontWeight: 600 }}>{jaar}</td>
                                  <td style={{ padding: "6px 4px" }}>
                                    <select value={pj.type || ""} onChange={e => updatePechJaar(jaar, "type", e.target.value)}
                                      style={{ width: "100%", fontSize: 13 }}>
                                      {PECH_TYPEN.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ padding: "6px 4px" }}>
                                    <input type="number" placeholder="0" value={pj.bedrag || ""}
                                      onChange={e => updatePechJaar(jaar, "bedrag", e.target.value ? Number(e.target.value) : 0)}
                                      style={{ width: "100%" }}
                                      disabled={!pj.type} />
                                  </td>
                                  <td style={{ padding: "6px 8px", color: pj.bedrag > 0 ? COLORS.success : "#bbb", fontWeight: pj.bedrag > 0 ? 500 : 400 }}>
                                    {pj.bedrag > 0 ? fmt(Math.round(pj.bedrag / 12)) : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {pechhulpPosten.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 12, color: COLORS.success }}>
                            ✓ {pechhulpPosten.length} pechhulp-posten toegevoegd aan kostenlijst
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })(),
            },
            {
              key: "vergoedingen", titel: "Vergoedingen van werkgever",
              inhoud: (
                <div>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    {/* Mobiliteitsvergoeding */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 12, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Mobiliteitsvergoeding</div>
                      <Row label="Bruto/maand (€)" wide>
                        <input type="number" placeholder="bijv. 300" value={state.mobiliteitBrutoMaand} onChange={e => set("mobiliteitBrutoMaand", e.target.value)} style={{ flex: 1 }} />
                      </Row>
                      <Row label="Belastingschijf" wide>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                          <select value={state.belastingschijf}
                            onChange={e => set("belastingschijf", Number(e.target.value))}
                            style={{ width: "100%", fontSize: 13 }}>
                            <option value={36.97}>36,97% — schijf 1 (tot ~€75.518)</option>
                            <option value={49.50}>49,50% — schijf 2 (boven ~€75.518)</option>
                          </select>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }}>Afwijkend %:</span>
                            <input type="number" step="0.1" value={state.belastingschijf}
                              onChange={e => set("belastingschijf", Number(e.target.value))}
                              style={{ width: 70, fontSize: 13 }} />
                          </div>
                        </div>
                      </Row>
                      {mobBrutoMaand > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f0faf4", borderRadius: 8, fontSize: 13, marginTop: 4 }}>
                          <span><b>{fmt(mobBrutoMaand)}</b> bruto</span>
                          <span style={{ color: "#bbb" }}>→</span>
                          <span><b style={{ color: COLORS.success }}>{fmt(mobNettoMaand)}</b> netto/mnd</span>
                        </div>
                      )}
                    </div>
                    {/* Km-vergoeding */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: 12, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Km-vergoeding</div>
                      <Row label="Tarief (€/km)" wide>
                        <input type="number" step="0.01" placeholder="0.23" value={state.kmVergTarief} onChange={e => set("kmVergTarief", e.target.value)} style={{ flex: 1 }} />
                      </Row>
                      <Row label="Km/maand werk" wide>
                        <input type="number" placeholder="bijv. 800" value={state.kmVergKmMaand} onChange={e => set("kmVergKmMaand", e.target.value)} style={{ flex: 1 }} />
                      </Row>
                      <Row label="Of: totaal/mnd (€)" wide>
                        <input type="number" placeholder="overschrijft tarief×km" value={state.kmVergMaandTotaal} onChange={e => set("kmVergMaandTotaal", e.target.value)} style={{ flex: 1 }} />
                      </Row>
                      {kmVergBruto > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f0faf4", borderRadius: 8, fontSize: 13, marginTop: 4 }}>
                          <span><b>{fmt(kmVergBruto)}</b> bruto</span>
                          {belastbaar > 0 && <span style={{ color: "#bbb", fontSize: 11 }}>({fmt(vrijgesteld)} vrij)</span>}
                          <span style={{ color: "#bbb" }}>→</span>
                          <span><b style={{ color: COLORS.success }}>{fmt(kmVergNetto)}</b> netto/mnd</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {totaalVergNetto > 0 && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "#f7f6f2", borderRadius: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <MetricCard label="Totaal netto/mnd" value={fmt(totaalVergNetto)} sub="mobiliteit + km" color={COLORS.success} />
                      <MetricCard label="Nettokosten/mnd"  value={fmt(Math.max(eigenMaandNetto, 0))} sub="kosten minus vergoedingen" color={eigenMaandNetto < 0 ? COLORS.success : COLORS.accent} />
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 12, color: "#bbb" }}>ⓘ Km-vergoeding tot €0,23/km belastingvrij (2024).</div>
                </div>
              ),
            },
          ].map(blok => {
            if (blok.toon === false) return null;
            const isOpen = openBlokken[blok.key];
            return (
              <div key={blok.key} style={{ background: "#fff", border: "0.5px solid #e0ddd8", borderRadius: 12, overflow: "hidden" }}>
                <div onClick={() => setOpenBlokken(p => ({ ...p, [blok.key]: !p[blok.key] }))}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 1.25rem", cursor: "pointer", userSelect: "none", background: isOpen ? "#fff" : "#fafaf8" }}>
                  <span style={{ fontSize: 12, color: isOpen ? COLORS.primary : "#bbb", transform: `rotate(${isOpen ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s" }}>▶</span>
                  <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{blok.titel}</span>
                </div>
                {isOpen && <div style={{ padding: "0 1.25rem 1.25rem" }}>{blok.inhoud}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TAB BEHEER ══ */}
      {tab === "beheer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>Auto's beheren</SectionTitle>
            {alleAutos.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "0.5px solid #f0ede8" }}>
                {editLabelId === a.id ? (
                  <>
                    <input value={editLabelVal} onChange={e => setEditLabelVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { setAutoLabel(a.id, editLabelVal); setEditLabelId(null); }}}
                      style={{ flex: 1, fontSize: 13 }} autoFocus />
                    <button onClick={() => { setAutoLabel(a.id, editLabelVal); setEditLabelId(null); }}
                      style={{ background: COLORS.success, color: "#fff", border: "none", borderRadius: 4, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>✓ Opslaan</button>
                    <button onClick={() => setEditLabelId(null)}
                      style={{ background: "none", border: "0.5px solid #ccc", borderRadius: 4, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: a.id === actiefId ? 600 : 400 }}>
                        {a.id === actiefId && <span style={{ color: COLORS.primary, marginRight: 6 }}>▶</span>}
                        {a.label || "Auto"}
                      </div>
                      {a.merk && a.model && <div style={{ fontSize: 12, color: "#bbb" }}>{a.merk} {a.model} {a.bouwjaar ? `· ${a.bouwjaar}` : ""} {a.kenteken ? `· ${a.kenteken}` : ""}</div>}
                    </div>
                    <button onClick={() => setStorage(s => ({ ...s, actiefId: a.id }))}
                      disabled={a.id === actiefId}
                      style={{ background: a.id === actiefId ? "#f0f4ff" : "none", border: `0.5px solid ${a.id === actiefId ? COLORS.primary : "#e0ddd8"}`, color: a.id === actiefId ? COLORS.primary : "#666", borderRadius: 4, padding: "5px 10px", cursor: a.id === actiefId ? "default" : "pointer", fontSize: 12 }}>
                      {a.id === actiefId ? "Actief" : "Selecteer"}
                    </button>
                    <button onClick={() => { setEditLabelId(a.id); setEditLabelVal(a.label || ""); }}
                      style={{ background: "none", border: "0.5px solid #e0ddd8", borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#666" }}>✏ Naam</button>
                    {alleAutos.length > 1 && (
                      <button onClick={() => { if (window.confirm(`"${a.label}" verwijderen? Alle kosten van deze auto gaan verloren.`)) verwijderAuto(a.id); }}
                        style={{ background: "none", border: `0.5px solid ${COLORS.danger}`, color: COLORS.danger, borderRadius: 4, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>Verwijder</button>
                    )}
                  </>
                )}
              </div>
            ))}

            <div style={{ marginTop: "1.25rem" }}>
              <SectionTitle>Nieuwe auto toevoegen</SectionTitle>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={nieuwAutoLabel} onChange={e => setNieuwAutoLabel(e.target.value)}
                  placeholder="Naam (bijv. Auto partner, Moeder)"
                  onKeyDown={e => { if (e.key === "Enter" && nieuwAutoLabel.trim()) { voegAutoToe(nieuwAutoLabel.trim()); setNieuwAutoLabel(""); }}}
                  style={{ flex: 1, fontSize: 13 }} />
                <button onClick={() => { if (nieuwAutoLabel.trim()) { voegAutoToe(nieuwAutoLabel.trim()); setNieuwAutoLabel(""); }}}
                  style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer", fontWeight: 500 }}>
                  + Toevoegen
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#bbb" }}>
                Na toevoegen klik je op "Selecteer" om naar die auto te schakelen, of gebruik de pills bovenaan de pagina.
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Data beheer</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>Alle gegevens worden automatisch opgeslagen in je browser (localStorage).</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => { if (window.confirm(`Alle gegevens van "${state.label || state.merk || "deze auto"}" wissen?`)) setState(defaultState()); }}
                style={{ background: "none", border: `0.5px solid ${COLORS.danger}`, color: COLORS.danger, borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
                Wis huidige auto
              </button>
              <button onClick={() => { if (window.confirm("ALLE auto's en data verwijderen?")) {
                const nieuw = { id: nieuweAutoId(), label: "Mijn auto", ...defaultState() };
                setStorage({ autos: [nieuw], actiefId: nieuw.id });
              }}}
                style={{ background: "none", border: "0.5px solid #ccc", color: "#999", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
                Alles wissen
              </button>
            </div>
          </Card>

          {/* Import */}
          <Card>
            <SectionTitle>Kosten importeren (CSV)</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 10, lineHeight: 1.7 }}>
              Formaat: <code style={{ background: "#f7f6f2", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>datum;categorie;bedrag;km;omschrijving</code><br />
              Categorieën: {COST_CATEGORIES.map(c => c.id).join(", ")}
            </div>

            {/* Bestandskiezer */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: COLORS.primary, color: "#fff", borderRadius: 6,
                padding: "9px 18px", cursor: "pointer", fontWeight: 500, fontSize: 13
              }}>
                📂 Bestand kiezen
                <input type="file" accept=".csv,.txt" style={{ display: "none" }}
                  onChange={e => { handleImportFile(e.target.files[0]); e.target.value = ""; }} />
              </label>
              <span style={{ fontSize: 12, color: "#bbb", marginLeft: 10 }}>CSV of tekstbestand</span>
            </div>

            {/* Of plakken */}
            <div style={{ fontSize: 12, color: "#bbb", marginBottom: 6 }}>Of plak CSV-tekst hier:</div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={5}
              placeholder={"2024-01-10;verzekering;950;;Jaarlijkse premie\n2024-03-15;onderhoud;285;62000;Kleine beurt"}
              style={{ width: "100%", fontFamily: "monospace", fontSize: 12, padding: 10, borderRadius: 6, border: "0.5px solid #e0ddd8", background: "#fafaf8", color: "#1a1a1a", boxSizing: "border-box", resize: "vertical" }} />
            {importError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>⚠ {importError}</div>}
            {importText.startsWith("✓") && <div style={{ color: COLORS.success, fontSize: 13, marginTop: 6 }}>{importText}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={handleImport}
                disabled={!importText.trim() || importText.startsWith("✓")}
                style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontWeight: 500, opacity: (!importText.trim() || importText.startsWith("✓")) ? 0.4 : 1 }}>
                Importeren
              </button>
              <button onClick={() => { setImportText(""); setImportError(""); }}
                style={{ background: "none", border: "0.5px solid #e0ddd8", borderRadius: 6, padding: "9px 14px", cursor: "pointer", color: "#999" }}>
                Wissen
              </button>
            </div>
          </Card>

          {/* Export */}
          <Card>
            <SectionTitle>Exporteren naar CSV</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 10 }}>
              Download je kostendata als CSV-bestand om te bewaren of in te laden in een andere auto.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                ⬇ Download CSV
              </button>
              <button onClick={() => navigator.clipboard?.writeText(exportCSV)}
                style={{ background: "none", border: "0.5px solid #e0ddd8", borderRadius: 6, padding: "9px 14px", cursor: "pointer", color: "#666" }}>
                Kopiëren
              </button>
            </div>
          </Card>

          {/* Voorbeeldauto */}
          <Card>
            <SectionTitle>Voorbeeldberekening laden</SectionTitle>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 12, lineHeight: 1.7 }}>
              Laad een complete voorbeeldberekening om te zien wat de app voor jou kan betekenen.
              Het voorbeeld is gebaseerd op een Peugeot 508 Diesel uit 2013, met 11 jaar werkelijke
              onderhouds-, reparatie- en verzekeringsdata, CBS-dieselprijzen en MRB-posten.
            </div>
            <div style={{ padding: "10px 14px", background: "#f7f6f2", borderRadius: 8, fontSize: 13, marginBottom: 14, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <span>🚗 Peugeot 508 Diesel 2013</span>
              <span>📅 2015–2027</span>
              <span>🛣 18.000 km/jr</span>
              <span>💰 aanschaf €18.500</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Voorbeeldauto toevoegen als nieuwe auto? Je huidige auto blijft behouden.")) {
                  const id = nieuweAutoId();
                  // Parseer voorbeeld CSV naar kosten
                  const regels = VOORBEELD_CSV.trim().split("\n").filter(l => l.trim() && !l.startsWith("datum"));
                  let kid = Date.now();
                  const kosten = regels.map(r => {
                    const [datum, cat, bedrag, km, omschr] = r.split(";");
                    const cm = COST_CATEGORIES.find(c => c.id === cat?.trim().toLowerCase());
                    return { id: kid++, datum: datum?.trim(), categorie: cm?.id||"overig", bedrag: Number(bedrag), km: km?Number(km):null, omschrijving: omschr?.trim()||"", automatisch: false };
                  });
                  const nieuweAuto = { id, ...defaultState(), ...VOORBEELD_STATE, kosten };
                  setStorage(s => ({ autos: [...s.autos, nieuweAuto], actiefId: id }));
                }
              }}
              style={{ background: COLORS.success, color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
              + Voorbeeldauto toevoegen
            </button>
          </Card>

        </div>
      )}

      {/* ══ TAB KOSTEN ══ */}
      {tab === "kosten" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

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
              if (periode === "tot_verkoop") return Math.max(state.jaarlijkseKm * bezitsjaren, 1); // incl. toekomstige km
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
                {/* Periode-dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#666", flexShrink: 0 }}>Periode:</span>
                  <select value={analyseJaar} onChange={e => {
                    const p = e.target.value;
                    setAnalyseJaar(p);
                    if (p !== "tot_nu" && p !== "tot_verkoop") setOpenJaren(new Set([p]));
                  }} style={{ flex: 1, maxWidth: 220 }}>
                    {periodes.map(p => (
                      <option key={p} value={p}>{periodeLabel(p)}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12, color: "#bbb" }}>{kp.length} posten · {fmt(totKp)}</span>
                </div>

                {/* Samenvatting periode */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <MetricCard label="Kosten"      value={fmt(totKp)}    sub={`${kp.length} posten`} />
                  <MetricCard label="Afschrijving" value={fmt(afschrKp)} sub="in deze periode" />
                  <MetricCard label="Km gereden"   value={fmtN(kmKp)}
                    sub={sel === "tot_nu"
                      ? `${verlopenJaren.toFixed(1)} jr × ${fmtN(state.jaarlijkseKm)} km/jr`
                      : sel === "tot_verkoop"
                      ? `${bezitsjaren.toFixed(1)} jr × ${fmtN(state.jaarlijkseKm)} (incl. toekomstig)`
                      : `${sel} (jaarschatting)`} />
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
                    <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
                      {fmtN(kmKp)} km · {sel === "tot_nu"
                        ? `${verlopenJaren.toFixed(1)} jr × ${fmtN(state.jaarlijkseKm)} km/jr (zelfde als header)`
                        : sel === "tot_verkoop"
                        ? `${bezitsjaren.toFixed(1)} jr × ${fmtN(state.jaarlijkseKm)} km/jr incl. toekomstig (daardoor lager dan header)`
                        : `schatting voor ${sel}`}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Kostenlijst per jaar ingeklapt */}
          <Card>
            {/* Header met alles-open/dicht en uitklapbaar invoerblok */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showNieuwKost ? "0.875rem" : 0, flexWrap: "wrap", gap: 8 }}>
              <SectionTitle style={{ margin: 0 }}>Kostenposten — {alleKosten.length} posten · {fmt(totaalKosten)}</SectionTitle>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => setShowNieuwKost(v => !v)}
                  style={{ fontSize: 12, background: showNieuwKost ? COLORS.primary : "none", color: showNieuwKost ? "#fff" : COLORS.primary, border: `0.5px solid ${COLORS.primary}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontWeight: 500 }}>
                  {showNieuwKost ? "✕ Sluiten" : "+ Toevoegen"}
                </button>
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

            {/* Uitklapbaar invoerblok */}
            {showNieuwKost && (
              <div style={{ background: "#f7f6f2", borderRadius: 8, padding: "12px 14px", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                  {[
                    { label: "Datum",      type: "date",   key: "datum",  w: 140 },
                    { label: "Bedrag (€)", type: "number", key: "bedrag", w: 90 },
                    { label: "Km-stand",   type: "number", key: "km",     w: 100, ph: "optioneel" },
                  ].map(f => (
                    <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 12, color: "#999" }}>{f.label}</label>
                      <input type={f.type} placeholder={f.ph} value={nieuwKost[f.key]}
                        onChange={e => setNieuwKost(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: f.w }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Categorie</label>
                    <select value={nieuwKost.categorie} onChange={e => setNieuwKost(p => ({ ...p, categorie: e.target.value }))} style={{ width: 170 }}>
                      {COST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 110 }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Omschrijving</label>
                    <input placeholder="optioneel" value={nieuwKost.omschrijving}
                      onChange={e => setNieuwKost(p => ({ ...p, omschrijving: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && voegToe()} />
                  </div>
                  <button onClick={() => { voegToe(); setShowNieuwKost(false); }}
                    style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                    + Toevoegen
                  </button>
                </div>
              </div>
            )}
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

          {/* Referentiekosten vergelijking */}
          {(() => {
            const segment    = bepaalSegment(state.cataloguswaarde, state.merk);
            const segInfo    = REF_SEGMENTEN.find(s => s.id === segment);
            const ref        = berekenReferentieKosten(segment, state.bouwjaar);
            const leeftijdIdx= getLeeftijdsIndex(state.bouwjaar);
            const leeftijdLabel = ["0–3 jaar", "3–6 jaar", "6–10 jaar", "10+ jaar"][leeftijdIdx];

            // Werkelijke kosten per categorie (excl. brandstof en MRB — die zijn te persoonlijk)
            const werkCats = ["onderhoud", "reparatie", "banden", "wassen"];
            const werkelijkPerCat = {};
            werkCats.forEach(cat => {
              werkelijkPerCat[cat] = alleKosten
                .filter(k => k.categorie === cat)
                .reduce((s, k) => s + Number(k.bedrag), 0);
            });
            const werkelijkJaren = Math.max(verlopenJaren, 0.5);
            const werkelijkTotaalJaar = werkCats.reduce((s, c) => s + werkelijkPerCat[c], 0) / werkelijkJaren;

            const catLabels = {
              onderhoud: { label: "Onderhoud & APK", icon: "🔧" },
              reparatie: { label: "Reparaties",      icon: "🛠" },
              banden:    { label: "Banden",           icon: "🔘" },
              wassen:    { label: "Wassen",           icon: "💧" },
            };

            const maxBar = Math.max(
              ref.totaal,
              werkelijkTotaalJaar,
              ...werkCats.map(c => Math.max(ref[c], werkelijkPerCat[c] / werkelijkJaren)),
              1
            );

            return (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: "1rem" }}>
                  <div>
                    <SectionTitle style={{ margin: 0 }}>Vergelijking met referentiekosten</SectionTitle>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 3 }}>
                      Segment: <b>{segInfo?.label}</b> · {leeftijdLabel} · Bijv. {segInfo?.voorbeeld}
                    </div>
                  </div>
                  {/* Segment aanpassen */}
                  <select value={segment} onChange={() => {}} disabled
                    style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, color: "#999", background: "#f7f6f2", border: "0.5px solid #e0ddd8" }}>
                    {REF_SEGMENTEN.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>

                {/* Totaalvergelijking */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.25rem" }}>
                  <div style={{ flex: 1, minWidth: 140, background: "#f7f6f2", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Jouw kosten/jaar</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.primary }}>{fmt(werkelijkTotaalJaar)}</div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>gemiddeld over {werkelijkJaren.toFixed(1)} jaar</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, background: "#f7f6f2", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Referentie/jaar</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#666" }}>{fmt(ref.totaal)}</div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>segment­gemiddelde</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, borderRadius: 8, padding: "10px 14px",
                    background: werkelijkTotaalJaar > ref.totaal * 1.2 ? "#fdf3ef" : werkelijkTotaalJaar < ref.totaal * 0.8 ? "#f0faf4" : "#f7f6f2" }}>
                    <div style={{ fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Verschil/jaar</div>
                    <div style={{ fontSize: 20, fontWeight: 600,
                      color: werkelijkTotaalJaar > ref.totaal ? COLORS.danger : COLORS.success }}>
                      {werkelijkTotaalJaar > ref.totaal ? "+" : ""}{fmt(Math.round(werkelijkTotaalJaar - ref.totaal))}
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb" }}>
                      {werkelijkTotaalJaar > ref.totaal * 1.2 ? "Boven gemiddelde" :
                       werkelijkTotaalJaar < ref.totaal * 0.8 ? "Onder gemiddelde" : "Rond het gemiddelde"}
                    </div>
                  </div>
                </div>

                {/* Per categorie */}
                <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                  Per categorie (excl. brandstof en MRB)
                </div>
                {werkCats.map(cat => {
                  const werkJaar  = (werkelijkPerCat[cat] || 0) / werkelijkJaren;
                  const refJaar   = ref[cat];
                  const diff      = werkJaar - refJaar;
                  const pct       = refJaar > 0 ? Math.round((werkJaar / refJaar) * 100) : null;
                  const heeftData = werkelijkPerCat[cat] > 0;
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{catLabels[cat].icon} {catLabels[cat].label}</span>
                        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                          {heeftData ? (
                            <span style={{ fontSize: 13, fontWeight: 600,
                              color: diff > refJaar * 0.25 ? COLORS.danger : diff < -refJaar * 0.25 ? COLORS.success : "#1a1a1a" }}>
                              {fmt(werkJaar)}/jr
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "#ccc" }}>geen data</span>
                          )}
                          <span style={{ fontSize: 12, color: "#bbb" }}>ref: {fmt(refJaar)}/jr</span>
                          {heeftData && pct !== null && (
                            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 10,
                              background: pct > 125 ? "#fdf3ef" : pct < 75 ? "#f0faf4" : "#f7f6f2",
                              color: pct > 125 ? COLORS.danger : pct < 75 ? COLORS.success : "#999" }}>
                              {pct}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Dubbele balk: jouw kosten vs referentie */}
                      <div style={{ position: "relative", height: 8, background: "#f0ede8", borderRadius: 4 }}>
                        {/* Referentie balk (lichtgrijs) */}
                        <div style={{ position: "absolute", top: 0, left: 0, height: 8, borderRadius: 4,
                          width: `${(refJaar / maxBar) * 100}%`, background: "#d4d0c8" }} />
                        {/* Werkelijk balk (gekleurd, over referentie) */}
                        {heeftData && (
                          <div style={{ position: "absolute", top: 0, left: 0, height: 8, borderRadius: 4,
                            width: `${Math.min((werkJaar / maxBar) * 100, 100)}%`,
                            background: diff > refJaar * 0.25 ? COLORS.danger : diff < -refJaar * 0.25 ? COLORS.success : COLORS.primary,
                            opacity: 0.85 }} />
                        )}
                      </div>
                    </div>
                  );
                })}

                <div style={{ fontSize: 12, color: "#bbb", marginTop: 8, lineHeight: 1.6 }}>
                  ⓘ Referenties zijn segmentgemiddelden op basis van ANWB-richtlijnen (2024). Brandstof, MRB en verzekering zijn niet meegenomen — die hangen sterk af van gebruik en persoonlijke keuzes.
                  Segment wordt automatisch bepaald op basis van cataloguswaarde ({fmt(state.cataloguswaarde)}) en merk.
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ══ TAB GRAFIEKEN ══ */}
      {tab === "grafiek" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>Cumulatieve kosten: eigen auto vs. lease</SectionTitle>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 14 }}>
              Eigen auto: aankoopprijs {fmt(state.aankoopprijs)} + afschrijving + gemaakte kosten.
              Lease: {fmt(leasePrive)}/mnd (stijgt {state.leaseStijgingPct || 10}% per {state.leaseLooptijd || 48} mnd).
            </div>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={grafiekData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="jaar" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `€${Math.round(v/1000)}k`} tick={{ fontSize: 12 }} width={54} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Eigen auto"     stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Privé lease"    stroke={COLORS.lease}   strokeWidth={2}   dot={{ r: 2 }} strokeDasharray="6 3" />
                <Line type="monotone" dataKey="Zakelijk lease" stroke="#8E44AD"        strokeWidth={2}   dot={{ r: 2 }} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
            {grafiekData.length > 1 && (() => {
              const last = grafiekData[grafiekData.length - 1];
              const vPriv = last["Eigen auto"] - last["Privé lease"];
              const vZak  = last["Eigen auto"] - last["Zakelijk lease"];
              return (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ padding: "8px 14px", background: vPriv > 0 ? "#fdf3ef" : "#f0faf4", borderRadius: 8, fontSize: 13 }}>
                    📋 Privé lease: na {Math.ceil(bezitsjaren)} jaar is eigen auto <b>{fmt(Math.abs(vPriv))} {vPriv > 0 ? "duurder" : "goedkoper"}</b>
                  </div>
                  <div style={{ padding: "8px 14px", background: vZak > 0 ? "#fdf3ef" : "#f0faf4", borderRadius: 8, fontSize: 13 }}>
                    💼 Zakelijk lease: na {Math.ceil(bezitsjaren)} jaar is eigen auto <b>{fmt(Math.abs(vZak))} {vZak > 0 ? "duurder" : "goedkoper"}</b>
                  </div>
                </div>
              );
            })()}
          </Card>
          <Card>
            <SectionTitle>Gemaakte kosten per jaar</SectionTitle>
            {jaarBarData.length === 0
              ? <div style={{ color: "#bbb", fontSize: 14 }}>Nog geen kosten.</div>
              : <>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={jaarBarData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                      <XAxis dataKey="jaar" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `€${Math.round(v/1000)}k`} tick={{ fontSize: 12 }} width={48} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const vast     = payload.find(p => p.dataKey === "vast")?.value || 0;
                          const variabel = payload.find(p => p.dataKey === "variabel")?.value || 0;
                          return (
                            <div style={{ background: "#fff", border: "0.5px solid #e0ddd8", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
                              <div style={{ color: COLORS.primary }}>Vast: {fmt(vast)}</div>
                              <div style={{ color: COLORS.accent }}>Variabel: {fmt(variabel)}</div>
                              <div style={{ borderTop: "0.5px solid #f0ede8", marginTop: 6, paddingTop: 6, fontWeight: 500 }}>Totaal: {fmt(vast + variabel)}</div>
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="vast"     stackId="a" fill={COLORS.primary} name="Vast"     radius={[0,0,0,0]} />
                      <Bar dataKey="variabel" stackId="a" fill={COLORS.accent}  name="Variabel" radius={[4,4,0,0]} />
                      {jaarBarData.length > 1 && (
                        <ReferenceLine y={jaarBarGemiddelde} stroke="#999" strokeDasharray="5 3"
                          label={{ value: `Gem. ${fmt(jaarBarGemiddelde)}`, fontSize: 11, fill: "#999", position: "insideTopRight" }} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#999", marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 10, height: 10, background: COLORS.primary, borderRadius: 2, display: "inline-block" }} />Vast (onderhoud, verzekering, MRB…)
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 10, height: 10, background: COLORS.accent, borderRadius: 2, display: "inline-block" }} />Variabel (brandstof, parkeren…)
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 18, height: 2, background: "#999", display: "inline-block", borderRadius: 1 }} />Gemiddelde ({fmt(jaarBarGemiddelde)}/jaar)
                    </span>
                  </div>
                </>
            }
          </Card>

          {/* Verdeling kostentypen — taartgrafiek */}
          {(() => {
            const catTotalen = COST_CATEGORIES
              .map(c => ({
                id: c.id, label: c.label, icon: c.icon, variabel: c.variabel,
                waarde: alleKosten.filter(k => k.categorie === c.id).reduce((s, k) => s + Number(k.bedrag), 0),
              }))
              .filter(c => c.waarde > 0)
              .sort((a, b) => b.waarde - a.waarde);
            const totaal = catTotalen.reduce((s, c) => s + c.waarde, 0);
            if (catTotalen.length === 0) return null;

            // Kleuren per categorie
            const CAT_KLEUREN = {
              brandstof:      "#E67E22",
              onderhoud:      "#1B4F72",
              reparatie:      "#2980B9",
              verzekering:    "#27AE60",
              wegenbelasting: "#8E44AD",
              banden:         "#16A085",
              parkeren:       "#E74C3C",
              wassen:         "#95A5A6",
              overig:         "#BDC3C7",
            };

            const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              if (percent < 0.05) return null;
              const RADIAN = Math.PI / 180;
              const r = innerRadius + (outerRadius - innerRadius) * 0.55;
              const x = cx + r * Math.cos(-midAngle * RADIAN);
              const y = cy + r * Math.sin(-midAngle * RADIAN);
              return (
                <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
                  {(percent * 100).toFixed(0)}%
                </text>
              );
            };

            return (
              <Card>
                <SectionTitle>Verdeling kostentypen (hele bezitsperiode)</SectionTitle>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                  {/* Taart */}
                  <div style={{ flex: "0 0 auto" }}>
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie data={catTotalen} dataKey="waarde" nameKey="label"
                          cx="50%" cy="50%" outerRadius={100} innerRadius={45}
                          labelLine={false} label={CustomPieLabel}>
                          {catTotalen.map(c => (
                            <Cell key={c.id} fill={CAT_KLEUREN[c.id] || "#ccc"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [fmt(v), n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legenda + balkjes */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    {catTotalen.map(c => (
                      <div key={c.id} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                          <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: CAT_KLEUREN[c.id] || "#ccc", flexShrink: 0, display: "inline-block" }} />
                            {c.icon} {c.label}
                            <span style={{ fontSize: 11, color: c.variabel ? COLORS.accent : "#bbb" }}>{c.variabel ? "var" : "vast"}</span>
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>
                            {fmt(c.waarde)} <span style={{ fontSize: 11, color: "#bbb", fontWeight: 400 }}>({(c.waarde / totaal * 100).toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 5, background: "#f0ede8", borderRadius: 3 }}>
                          <div style={{ height: 5, borderRadius: 3, width: `${(c.waarde / catTotalen[0].waarde) * 100}%`, background: CAT_KLEUREN[c.id] || "#ccc" }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: "#bbb", borderTop: "0.5px solid #f0ede8", paddingTop: 8, marginTop: 4 }}>
                      Totaal: {fmt(totaal)} over {bezitsjaren.toFixed(1)} jaar
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}

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

          {/* Lease parameters — inklapbaar */}
          <div style={{ background: "#fff", border: "0.5px solid #e0ddd8", borderRadius: 12, overflow: "hidden" }}>
            <div onClick={() => setOpenLeaseParams(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 1.25rem", cursor: "pointer", userSelect: "none", background: openLeaseParams ? "#fff" : "#fafaf8" }}>
              <span style={{ fontSize: 12, color: openLeaseParams ? COLORS.primary : "#bbb", transform: `rotate(${openLeaseParams ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s" }}>▶</span>
              <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>Lease parameters</span>
              <span style={{ fontSize: 13, color: "#999" }}>{fmt(leasePrive)}/mnd · {state.leaseLooptijd || 48} mnd · {fmtN(state.leaseKm || 15000)} km/jr</span>
            </div>
            {openLeaseParams && (
              <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {[
                    { label: "Cataloguswaarde (€)", key: "cataloguswaarde", type: "number" },
                    { label: "Looptijd (maanden)",  key: "leaseLooptijd",   type: "number" },
                    { label: "Km per jaar",          key: "leaseKm",         type: "number" },
                    { label: "Aanbetaling (€)",      key: "leaseAanbetaling",type: "number" },
                  ].map(f => (
                    <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" }}>
                      <label style={{ fontSize: 12, color: "#999" }}>{f.label}</label>
                      <input type={f.type} value={state[f.key] ?? ""}
                        onChange={e => set(f.key, Number(e.target.value))}
                        style={{ width: "100%" }} />
                    </div>
                  ))}
                  {/* Handmatig leasebedrag 1e periode */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Zakelijk lease 1e periode (€/mnd)</label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="number" placeholder={`schatting: ${leasePriveBerekend}`}
                        value={state.leaseBedragHandmatig || ""}
                        onChange={e => set("leaseBedragHandmatig", e.target.value ? Number(e.target.value) : null)}
                        style={{ flex: 1 }} />
                      {state.leaseBedragHandmatig && (
                        <button onClick={() => set("leaseBedragHandmatig", null)}
                          style={{ fontSize: 11, background: "none", border: "0.5px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#999" }}>✕</button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: state.leaseBedragHandmatig ? COLORS.primary : "#bbb" }}>
                      {state.leaseBedragHandmatig ? `Handmatig: ${fmt(leasePrive)}/mnd` : `Schatting: ${fmt(leasePriveBerekend)}/mnd`}
                    </div>
                  </div>
                  {/* Privé leasebedrag handmatig */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Privé lease 1e periode (€/mnd)</label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="number" placeholder={`zelfde als zakelijk: ${leasePrive}`}
                        value={state.leasePriveBedragHandmatig || ""}
                        onChange={e => set("leasePriveBedragHandmatig", e.target.value ? Number(e.target.value) : null)}
                        style={{ flex: 1 }} />
                      {state.leasePriveBedragHandmatig && (
                        <button onClick={() => set("leasePriveBedragHandmatig", null)}
                          style={{ fontSize: 11, background: "none", border: "0.5px solid #ccc", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: "#999" }}>✕</button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: state.leasePriveBedragHandmatig ? COLORS.lease : "#bbb" }}>
                      {state.leasePriveBedragHandmatig ? `Handmatig: ${fmt(leasePrivePrive)}/mnd` : `Zelfde als zakelijk: ${fmt(leasePrive)}/mnd`}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 150px" }}>
                    <label style={{ fontSize: 12, color: "#999" }}>Bijtelling (%)</label>
                    <select value={state.bijtellingPct} onChange={e => set("bijtellingPct", Number(e.target.value))} style={{ width: "100%" }}>
                      <option value={16}>16% — volledig elektrisch</option>
                      <option value={22}>22% — standaard</option>
                      <option value={35}>35% — ouder dan 15 jaar</option>
                    </select>
                  </div>
                </div>

                {/* Indexatie per periode */}
                <div style={{ marginTop: 14, padding: "12px 14px", background: "#f7f6f2", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Indexatie bij nieuwe leaseperiode</div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 10, lineHeight: 1.6 }}>
                    Na elke looptijd van {state.leaseLooptijd || 48} maanden wordt een nieuw leasecontract afgesloten.
                    Stel hier in hoeveel duurder dat contract wordt — bijv. 10% stijging door inflatie en hogere catalogusprijzen.
                    Dit wordt gebruikt in de cumulatieve grafiek zodat je een eerlijke vergelijking maakt over meerdere leaseperiodes.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label style={{ fontSize: 12, color: "#999" }}>Stijging per periode (%)</label>
                      <input type="number" step="1" placeholder="10" value={state.leaseStijgingPct ?? 10}
                        onChange={e => set("leaseStijgingPct", Number(e.target.value))}
                        style={{ width: 100 }} />
                    </div>
                    <div style={{ fontSize: 13, color: "#666", flex: 1 }}>
                      {(() => {
                        const mnd    = Number(state.leaseLooptijd) || 48;
                        const pct    = (Number(state.leaseStijgingPct) || 10) / 100;
                        const basis  = leasePrive;
                        const p2     = Math.round(basis * (1 + pct));
                        const p3     = Math.round(basis * Math.pow(1 + pct, 2));
                        return (
                          <span>
                            Periode 1: <b>{fmt(basis)}/mnd</b>
                            {" → "}Periode 2 (+{mnd} mnd): <b>{fmt(p2)}/mnd</b>
                            {" → "}Periode 3: <b>{fmt(p3)}/mnd</b>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lease uitkomst — inklapbaar */}
          <div style={{ background: "#fff", border: "0.5px solid #e0ddd8", borderRadius: 12, overflow: "hidden" }}>
            <div onClick={() => setOpenLeaseUitkomst(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 1.25rem", cursor: "pointer", userSelect: "none", background: openLeaseUitkomst ? "#fff" : "#fafaf8" }}>
              <span style={{ fontSize: 12, color: openLeaseUitkomst ? COLORS.primary : "#bbb", transform: `rotate(${openLeaseUitkomst ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s" }}>▶</span>
              <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>Berekening gemiddelde leaseprijs</span>
              <span style={{ fontSize: 13, color: "#999" }}>
                {(() => {
                  const mnd = Math.round(
                    vergModus === "__lastjaar" ? 12 :
                    vergModus === "__gem5" ? Math.min(5, verlopenJaren) * 12 :
                    verlopenJaren * 12
                  );
                  const zakGem  = berekenLeaseGemiddeld(mnd);
                  const privGem = berekenLeaseGemiddeldPriv(mnd);
                  const heeftVerschil = leasePrivePrive !== leasePrive;
                  return heeftVerschil
                    ? `zak. ${fmt(zakGem)} · privé ${fmt(privGem)}/mnd`
                    : `gem. ${fmt(zakGem)}/mnd`;
                })()}
              </span>
            </div>
            {openLeaseUitkomst && (
              <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>

                  {/* Periode-keuze */}
                  <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1B4F72", marginBottom: 8 }}>
                      Vergelijkingsperiode — bepaalt de basis voor eigen auto én het gewogen leasegemiddelde
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        { id: "__lastjaar", label: `Vorig jaar (${nu.getFullYear() - 1})` },
                        { id: "__gem5",     label: "Gem. 5 jaar" },
                        { id: "tot_nu",     label: "Tot nu (volledig bezit)" },
                      ].map(m => (
                        <button key={m.id}
                          onClick={() => setVergPeriodeStart(m.id)}
                          style={{
                            padding: "5px 14px", fontSize: 12, borderRadius: 20,
                            border: vergModus === m.id ? `1.5px solid ${COLORS.primary}` : "0.5px solid #e0ddd8",
                            background: vergModus === m.id ? COLORS.primary : "#fff",
                            color: vergModus === m.id ? "#fff" : "#666",
                            cursor: "pointer", fontWeight: vergModus === m.id ? 600 : 400,
                          }}>{m.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Periodes tabel — twee kolommen: zakelijk + privé */}
                  {(() => {
                    // Bereken vergelijkingsperiode-maanden op basis van vergModus
                    const vergJaren = vergModus === "__lastjaar" ? 1
                      : vergModus === "__gem5" ? Math.min(5, verlopenJaren)
                      : verlopenJaren; // tot_nu = aankoop t/m vandaag
                    const vergMnd = Math.round(vergJaren * 12);

                    // Bouw periodes-tabel voor een gegeven basisprijs
                    const bouwTabel = (basisprijs) => {
                      const looptijdMnd = Number(state.leaseLooptijd) || 48;
                      const stijging    = Number(state.leaseStijgingPct || 10) / 100;
                      const periodes = [];
                      let mnd = 0, periodeNr = 0;
                      while (mnd < vergMnd) {
                        const maandprijs = Math.round(basisprijs * Math.pow(1 + stijging, periodeNr));
                        const duur = Math.min(looptijdMnd, vergMnd - mnd);
                        periodes.push({ nr: periodeNr + 1, maandprijs, duur, totaal: maandprijs * duur });
                        mnd += looptijdMnd;
                        periodeNr++;
                      }
                      return periodes;
                    };

                    const zakTabel  = bouwTabel(leasePrive);
                    const privTabel = bouwTabel(leasePrivePrive);
                    const zakGem    = berekenLeaseGemiddeld(vergMnd);
                    const privGem   = berekenLeaseGemiddeldPriv(vergMnd);
                    const heeftPriveVerschil = leasePrivePrive !== leasePrive;

                    return (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                          Leaseperiodes over {vergJaren.toFixed(1)} jaar ({vergModus === "__lastjaar" ? "vorig jaar" : vergModus === "__gem5" ? "gem. 5 jaar" : "aankoop t/m nu"})
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: "0.5px solid #e8e6e0" }}>
                              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 500, color: "#bbb", minWidth: 120 }}>Periode</th>
                              <th style={{ padding: "4px 8px", fontWeight: 500, color: "#bbb", textAlign: "center" }} colSpan={2}>
                                Zakelijk
                                <div style={{ fontSize: 10, fontWeight: 400, color: "#ccc" }}>mnd &nbsp;(totaal)</div>
                              </th>
                              <th style={{ padding: "4px 8px", fontWeight: 500, color: "#bbb", textAlign: "center" }} colSpan={2}>
                                Privé
                                <div style={{ fontSize: 10, fontWeight: 400, color: "#ccc" }}>mnd &nbsp;(totaal)</div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {zakTabel.map((p, i) => {
                              const pv = privTabel[i];
                              return (
                                <tr key={p.nr} style={{ borderBottom: "0.5px solid #f5f4f0" }}>
                                  <td style={{ padding: "6px 8px", fontWeight: 500 }}>Periode {p.nr} <span style={{ color: "#bbb", fontWeight: 400 }}>({p.duur} mnd)</span></td>
                                  <td style={{ padding: "6px 8px", textAlign: "right", color: COLORS.lease, fontWeight: 600 }}>{fmt(p.maandprijs)}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "left", color: "#aaa", fontSize: 12 }}>({fmt(p.totaal)})</td>
                                  <td style={{ padding: "6px 8px", textAlign: "right", color: COLORS.accent, fontWeight: 600 }}>{pv ? fmt(pv.maandprijs) : fmt(p.maandprijs)}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "left", color: "#aaa", fontSize: 12 }}>({pv ? fmt(pv.totaal) : fmt(p.totaal)})</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: "1px solid #e0ddd8", background: "#f7f6f2" }}>
                              <td style={{ padding: "7px 8px", fontWeight: 600 }}>Gewogen gemiddelde</td>
                              <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: COLORS.lease }}>{fmt(zakGem)}</td>
                              <td style={{ padding: "7px 8px", color: "#aaa", fontSize: 12 }}>({fmt(zakGem * vergMnd)})</td>
                              <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: COLORS.accent }}>{fmt(privGem)}</td>
                              <td style={{ padding: "7px 8px", color: "#aaa", fontSize: 12 }}>({fmt(privGem * vergMnd)})</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })()}

                  {/* Bijtelling als tabel onder gewogen gemiddelde */}
                  <div style={{ borderTop: "0.5px solid #e8e6e0", paddingTop: 10 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        <tr style={{ color: "#999" }}>
                          <td style={{ padding: "4px 8px" }}>Bijtelling ({state.bijtellingPct}% van {fmt(state.cataloguswaarde)})</td>
                          <td style={{ padding: "4px 8px", textAlign: "right" }}>{fmt(bijtellingMaand)}/mnd</td>
                          <td style={{ padding: "4px 8px", textAlign: "right", color: "#ccc" }}>—</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 8px", color: "#999" }}>Belasting bijtelling ({state.belastingschijf}%)</td>
                          <td style={{ padding: "4px 8px", textAlign: "right", color: COLORS.danger, fontWeight: 500 }}>+ {fmt(bijtellingBelasting)}/mnd</td>
                          <td style={{ padding: "4px 8px", textAlign: "right", color: "#ccc" }}>—</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 4, paddingLeft: 8 }}>
                      Bijtelling geldt alleen voor zakelijk lease · privé lease heeft geen bijtelling
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Vergelijkingsperiode instellen ── */}
          {(() => {
            const looptijdMnd   = Number(state.leaseLooptijd) || 48;
            const looptijdJaren = looptijdMnd / 12;
            const nuJaar        = nu.getFullYear();

            // ── Basis voor eigen auto kosten ──
            // Drie modi: laatste jaar, gemiddelde 5 jaar, handmatig startdatum
            const berekenEigenMaandKosten = () => {
              if (vergModus === "__lastjaar") {
                const vorigjaar = String(nuJaar - 1);
                const kp = alleKosten.filter(k => k.datum?.slice(0,4) === vorigjaar);
                const tot = kp.reduce((s, k) => s + Number(k.bedrag), 0);
                return { kostenMaand: tot / 12, bronLabel: `Kosten ${vorigjaar}`, aantalPosten: kp.length, bronJaren: 1 };
              }
              if (vergModus === "__gem5") {
                const jaren = [];
                for (let j = nuJaar - 1; j >= nuJaar - 5; j--) {
                  const vj = String(j);
                  const kp = alleKosten.filter(k => k.datum?.slice(0,4) === vj);
                  if (kp.length > 0 || j > aankoopDt.getFullYear()) jaren.push({ jaar: vj, kp });
                }
                const totPosten = jaren.reduce((s, j) => s + j.kp.length, 0);
                const totBedrag = jaren.reduce((s, j) => s + j.kp.reduce((ss, k) => ss + Number(k.bedrag), 0), 0);
                const aantalJaren = Math.max(jaren.length, 1);
                return { kostenMaand: totBedrag / aantalJaren / 12, bronLabel: `Gemiddelde ${jaren.length > 0 ? jaren[jaren.length-1].jaar : ""}–${nuJaar-1}`, aantalPosten: totPosten, bronJaren: aantalJaren };
              }
              if (vergModus === "tot_nu") {
                const kp = alleKosten.filter(k => k.datum && k.datum <= nu.toISOString().slice(0,10));
                const tot = kp.reduce((s, k) => s + Number(k.bedrag), 0);
                return { kostenMaand: tot / Math.max(verlopenJaren * 12, 1), bronLabel: `Gemiddelde tot nu`, aantalPosten: kp.length, bronJaren: Math.max(verlopenJaren, 0.1) };
              }
              // Handmatig (legacy)
              const vergStartDt = new Date(vergPeriodeStart);
              const vergEindeDt = new Date(vergPeriodeStart);
              vergEindeDt.setMonth(vergEindeDt.getMonth() + looptijdMnd);
              const kp = alleKosten.filter(k => k.datum && k.datum >= vergPeriodeStart && k.datum <= vergEindeDt.toISOString().slice(0,10));
              const tot = kp.reduce((s, k) => s + Number(k.bedrag), 0);
              return { kostenMaand: tot / looptijdMnd, bronLabel: `${vergStartDt.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })} – ${vergEindeDt.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}`, aantalPosten: kp.length, bronJaren: looptijdJaren };
            };

            const { kostenMaand, bronLabel, aantalPosten, bronJaren } = berekenEigenMaandKosten();

            // Afschrijving: gebruik gemiddeld per jaar (eenvoudig, transparant)
            const afschrMaandPeriode = afschrJaar / 12;
            const eigenKostenMaandPeriode = kostenMaand + afschrMaandPeriode;
            const eigenNettoMaandPeriode  = eigenKostenMaandPeriode - totaalVergNetto;

            const RegelItem = ({ label, waarde, kleur, sub }) => (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ color: "#666", fontSize: 13 }}>{label}{sub && <span style={{ fontSize: 11, color: "#bbb", marginLeft: 6 }}>{sub}</span>}</span>
                <span style={{ fontWeight: 500, color: kleur || "#1a1a1a", fontSize: 13, marginLeft: 12, flexShrink: 0 }}>{waarde}</span>
              </div>
            );

            return (
              <Card>
                <div onClick={() => setOpenVerg(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", marginBottom: openVerg ? "1rem" : 0 }}>
                  <span style={{ fontSize: 12, color: openVerg ? COLORS.primary : "#bbb", transform: `rotate(${openVerg ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s" }}>▶</span>
                  <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Vergelijking eigen auto ⟺ leasen</span>
                  {/* Resultaat in header */}
                  {(() => {
                    const vergMaanden = Math.round(bronJaren * 12);
                    const leaseGem = berekenLeaseGemiddeld(vergMaanden);
                    const verschil = eigenKostenMaandPeriode - (leaseGem + bijtellingBelasting - mobBrutoMaand);
                    const isVoordelig = verschil < 0;
                    const abs = fmt(Math.abs(Math.round(verschil)));
                    return (
                      <span style={{ fontSize: 12, color: isVoordelig ? COLORS.success : COLORS.danger, fontWeight: 500, textAlign: "right" }}>
                        Eigen auto {abs}/mnd {isVoordelig ? "voordeliger" : "duurder"}
                      </span>
                    );
                  })()}
                </div>
                {!openVerg ? null : (<>

                {/* Drie kolommen: eigen auto, zakelijk lease, privé lease */}
                {(() => {
                  const vergMaanden = Math.round(bronJaren * 12);
                  const leaseGemVergperiode     = berekenLeaseGemiddeld(vergMaanden);
                  const leaseGemVergperiodePriv = berekenLeaseGemiddeldPriv(vergMaanden);
                  const eigenVast    = afschrMaandPeriode + (kostenMaand * (1 - variabelFractie));
                  const eigenVar     = kostenMaand * variabelFractie;
                  const eigenTotK    = eigenKostenMaandPeriode;
                  const eigenVergVast= mobNettoMaand;
                  const eigenVergVar = kmVergNetto;
                  const eigenTotV    = totaalVergNetto;
                  const eigenSaldo   = eigenTotK - eigenTotV;
                  const eigenNetto   = Math.max(eigenSaldo, 0);
                  const eigenVoordeel= eigenSaldo < 0 ? Math.abs(eigenSaldo) : 0;

                  const zakVast      = leaseGemVergperiode; // gewogen gem. over vergelijkingsperiode
                  const zakVar       = 0;
                  const zakBijtelling= bijtellingBelasting;
                  const zakTotK      = zakVast + zakVar + zakBijtelling; // bijtelling zit in kosten
                  const zakVergVast  = mobBrutoMaand;
                  const zakVergVar   = 0;
                  const zakTotV      = zakVergVast;
                  const zakSaldo     = zakTotK - zakTotV;
                  const zakNetto     = Math.max(zakSaldo, 0);
                  const zakVoordeel  = 0;

                  const privVast     = leaseGemVergperiodePriv; // gewogen gem. privé over vergelijkingsperiode
                  const privVar      = 0;
                  const privTotK     = privVast + privVar;
                  const privVergVast = mobNettoMaand;
                  const privVergVar  = kmVergNetto;
                  const privTotV     = privVergVast + privVergVar;
                  const privSaldo    = privTotK - privTotV;
                  const privNetto    = Math.max(privSaldo, 0);
                  const privVoordeel = privSaldo < 0 ? Math.abs(privSaldo) : 0;

                  // variabelFractie: schatting van variabel deel van eigen auto kosten
                  // (brandstof, parkeren = variabel; rest = vast)
                  // gebruik kostPerCat uit scope boven

                  const cols = [
                    { key: "eigen", label: "🚗 Eigen auto",     color: COLORS.primary, vast: eigenVast, var_: eigenVar, totK: eigenTotK, vergVast: eigenVergVast, vergVar: eigenVergVar, bijtelling: null, totV: eigenTotV, saldo: eigenSaldo, netto: eigenNetto, voordeel: eigenVoordeel },
                    { key: "zak",   label: "💼 Zakelijk lease",  color: "#8E44AD",      vast: zakVast,  var_: zakVar,  totK: zakTotK,  vergVast: zakVergVast,  vergVar: zakVergVar,  bijtelling: zakBijtelling, totV: zakTotV,  saldo: zakSaldo,  netto: zakNetto,  voordeel: zakVoordeel  },
                    { key: "priv",  label: "📋 Privé lease",     color: COLORS.lease,   vast: privVast, var_: privVar, totK: privTotK, vergVast: privVergVast, vergVar: privVergVar, bijtelling: null,          totV: privTotV, saldo: privSaldo, netto: privNetto, voordeel: privVoordeel },
                  ];

                  const effectief   = cols.map(c => c.netto - c.voordeel);
                  const minEff      = Math.min(...effectief);
                  const maxNetto    = Math.max(...cols.map(c => c.netto), 1);

                  const f2 = (v) => perMaand ? fmt(v) : fmt(v * 12);
                  const eenheid = perMaand ? "/mnd" : "/jaar";

                  // Uitklapbare sectie helper — gebruik outer state
                  const toggleSec = (s) => setOpenSec(p => ({ ...p, [s]: !p[s] }));

                  // Tabelrij helpers
                  const COL_W = "20%";
                  const LBL_W = "40%";

                  const HeaderRij = () => (
                    <div style={{ display: "flex", borderBottom: "1px solid #e0ddd8", paddingBottom: 8, marginBottom: 4 }}>
                      <div style={{ width: LBL_W }} />
                      {cols.map(c => (
                        <div key={c.key} style={{ width: COL_W, textAlign: "right", fontSize: 12, fontWeight: 600, color: c.color }}>
                          {c.label}
                        </div>
                      ))}
                    </div>
                  );

                  const DataRij = ({ label, vals, kleur, sub, indent }) => (
                    <div style={{ display: "flex", alignItems: "baseline", padding: "4px 0", borderBottom: "0.5px solid #f5f4f0" }}>
                      <div style={{ width: LBL_W, fontSize: 12, color: sub ? "#aaa" : "#666", paddingLeft: indent ? 14 : 0 }}>
                        {label}{sub && <span style={{ fontSize: 11, color: "#ccc", marginLeft: 6 }}>{sub}</span>}
                      </div>
                      {vals.map((v, i) => (
                        <div key={i} style={{ width: COL_W, textAlign: "right", fontSize: 13, fontWeight: 500, color: v === null ? "#ccc" : (kleur || "#1a1a1a") }}>
                          {v === null ? "n.v.t." : v === "—" ? <span style={{ color: "#ccc" }}>—</span> : f2(v)}
                        </div>
                      ))}
                    </div>
                  );

                  const TotaalRij = ({ label, vals, color }) => (
                    <div style={{ display: "flex", alignItems: "baseline", padding: "7px 6px 5px", borderTop: "1px solid #e0ddd8", marginTop: 2, background: "#f3f2ef", borderRadius: "0 0 4px 4px" }}>
                      <div style={{ width: LBL_W, fontSize: 13, fontWeight: 500 }}>{label}</div>
                      {vals.map((v, i) => (
                        <div key={i} style={{ width: COL_W, textAlign: "right", fontSize: 14, fontWeight: 600, color: Array.isArray(color) ? color[i] : color }}>
                          {f2(v)}
                        </div>
                      ))}
                    </div>
                  );

                  const SectieHeader = ({ label, secKey, sub }) => (
                    <div onClick={() => toggleSec(secKey)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px", cursor: "pointer", userSelect: "none", marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: openSec[secKey] ? COLORS.accent : "#bbb", transform: `rotate(${openSec[secKey] ? 90 : 0}deg)`, display: "inline-block", transition: "transform 0.15s" }}>▶</span>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999" }}>{label}</span>
                      {sub && <span style={{ fontSize: 11, color: "#ccc" }}>{sub}</span>}
                    </div>
                  );

                  return (
                    <>
                      {/* Toggle mnd/jaar */}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                        <div style={{ display: "inline-flex", border: "0.5px solid #e0ddd8", borderRadius: 6, overflow: "hidden" }}>
                          {[["maand", "Per maand"], ["jaar", "Per jaar"]].map(([id, lbl]) => (
                            <button key={id} onClick={() => setPerMaand(id === "maand")}
                              style={{ padding: "5px 14px", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
                                background: (id === "maand") === perMaand ? "#1a1a1a" : "transparent",
                                color:      (id === "maand") === perMaand ? "#fff"    : "#666" }}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tabel */}
                      <div style={{ overflowX: "auto" }}>
                        <HeaderRij />

                        {/* ── KOSTEN ── */}
                        <SectieHeader label="Kosten" secKey="kosten" sub="klik om detail te zien" />
                        {openSec.kosten && (
                          <>
                            <DataRij label="Vast (lease/afschr., onderhoud, verzek., MRB)"
                              vals={cols.map(c => c.vast)} kleur={COLORS.danger} indent />
                            <DataRij label="Variabel (brandstof, parkeren, tol, wassen)"
                              vals={[eigenVar, zakVar || "—", privVar || "—"]}
                              kleur={COLORS.danger} indent
                              sub={zakVar === 0 ? "(zakelijk lease: later toe te voegen)" : ""} />
                            <DataRij label="Bijtelling belasting"
                              vals={[null, zakBijtelling, null]}
                              kleur={COLORS.danger} indent
                              sub={`${state.bijtellingPct}% × ${state.belastingschijf}%`} />
                          </>
                        )}
                        <TotaalRij label="Totaal kosten" vals={cols.map(c => c.totK)} color={COLORS.danger} />

                        {/* ── VERGOEDINGEN ── */}
                        <SectieHeader label="Vergoedingen" secKey="vergoed" sub="klik om detail te zien" />
                        {openSec.vergoed && (
                          <>
                            <DataRij label="Vast (mobiliteitsvergoeding)"
                              vals={[eigenVergVast, zakVergVast, privVergVast]}
                              kleur={COLORS.success} indent
                              sub={`eigen/privé netto · zakelijk bruto`} />
                            <DataRij label="Variabel (km-vergoeding)"
                              vals={[eigenVergVar, null, privVergVar]}
                              kleur={COLORS.success} indent />
                          </>
                        )}
                        <TotaalRij label="Totaal vergoedingen"
                          vals={cols.map(c => c.totV)}
                          color={COLORS.success} />

                        {/* ── NETTO RESULTAAT ── */}
                        <div style={{ marginTop: 14, borderTop: "2px solid #e0ddd8", paddingTop: 10 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ width: LBL_W, fontSize: 13, fontWeight: 600 }}>
                              Netto resultaat {eenheid}
                            </div>
                            {cols.map((c, i) => {
                              const saldo  = c.saldo;
                              const isVoordeel = saldo < 0;
                              const isBest = effectief[i] === minEff;
                              return (
                                <div key={c.key} style={{ width: COL_W }}>
                                  <div style={{
                                    textAlign: "right", borderRadius: 6, padding: "8px 10px",
                                    background: isVoordeel ? "#f0faf4" : isBest ? "#f0f4ff" : "#f7f6f2",
                                    border: isBest ? `1.5px solid ${c.color}40` : "none",
                                  }}>
                                    <div style={{ fontSize: 10, color: isVoordeel ? COLORS.success : "#999", marginBottom: 2, textAlign: "right" }}>
                                      {isVoordeel ? "Netto uitbetaald" : "Netto betalen"}
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: isVoordeel ? COLORS.success : c.color }}>
                                      {isVoordeel ? "+" : ""}{f2(Math.abs(saldo))}
                                    </div>
                                    {isBest && !isVoordeel && (
                                      <div style={{ fontSize: 10, color: c.color, marginTop: 2 }}>Laagste</div>
                                    )}
                                    {isVoordeel && (
                                      <div style={{ fontSize: 10, color: COLORS.success, marginTop: 2 }}>Voordeel</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Staafvergelijking */}
                      <div style={{ marginTop: "1.25rem" }}>
                        {cols.map((c, i) => {
                          const isVoordeel = c.saldo < 0;
                          const maxBar = Math.max(...cols.map(x => Math.abs(x.saldo)), 1);
                          return (
                            <div key={c.key} style={{ marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span style={{ fontWeight: 500 }}>{c.label}</span>
                                <span style={{ fontWeight: 600, color: isVoordeel ? COLORS.success : "#1a1a1a" }}>
                                  {isVoordeel ? `+ ${f2(c.voordeel)} uitbetaald` : `${f2(c.netto)} betalen`}
                                </span>
                              </div>
                              <div style={{ height: 10, background: "#f0ede8", borderRadius: 5 }}>
                                <div style={{ height: 10, borderRadius: 5, transition: "width 0.3s",
                                  width: `${(Math.abs(c.saldo) / maxBar) * 100}%`,
                                  background: isVoordeel ? COLORS.success : c.color }} />
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                          Groene balk = netto voordeel (uitbetaald) · overige balken = netto te betalen
                        </div>
                      </div>

                      {/* Conclusie */}
                      {(() => {
                        const best = cols[effectief.indexOf(minEff)];
                        const isVoordeel = best.saldo < 0;
                        return (
                          <div style={{ marginTop: "0.875rem", padding: "14px 16px", background: isVoordeel ? "#f0faf4" : "#f0f4ff", borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                              {isVoordeel
                                ? `✅ ${best.label} levert ${f2(best.voordeel)} netto op`
                                : `✅ ${best.label} is het voordeligst — ${f2(best.netto)} netto betalen`}
                            </div>
                            <div style={{ fontSize: 13, color: "#666", display: "flex", gap: 20, flexWrap: "wrap" }}>
                              {cols.filter((_, i) => effectief[i] !== minEff).map((c, i) => {
                                const v = effectief[cols.indexOf(c)] - minEff;
                                return <span key={c.key}>{c.label}: <b>{f2(v)} {eenheid} meer</b></span>;
                              })}
                              <span style={{ color: "#bbb" }}>Basis: {bronLabel} · {looptijdMnd} mnd</span>
                            </div>
                          </div>
                        );
                      })()}
                      <div style={{ marginTop: 10, fontSize: 12, color: "#bbb", lineHeight: 1.6 }}>
                        ⓘ Eigen auto kosten zijn gebaseerd op {bronLabel} ({aantalPosten} posten), aangevuld met gemiddelde afschrijving.
                        Lease is een schatting — vraag altijd een offerte op. Belastingschijf: {state.belastingschijf}%.
                      </div>
                    </>
                  );
                })()}
                </>)}
              </Card>
            );
          })()}
        </div>
      )}

      {/* ══ WELKOMST MODAL ══ */}
      {showWelcome && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "2rem",
            maxWidth: 480, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            position: "relative",
          }}>
            {/* Logo + titel */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.25rem" }}>
              <svg width="52" height="36" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 38 L6 32 Q6 30 8 30 L72 30 Q74 30 74 32 L74 38 Q74 40 72 40 L8 40 Q6 40 6 38 Z" fill="#1B4F72"/>
                <path d="M18 30 Q22 18 30 16 L52 16 Q60 18 64 30 Z" fill="#2980B9"/>
                <path d="M50 30 Q54 20 58 18 L62 18 Q64 20 63 30 Z" fill="#AED6F1" opacity="0.85"/>
                <path d="M30 30 Q28 20 30 18 L38 17 L40 30 Z" fill="#AED6F1" opacity="0.85"/>
                <path d="M40 30 L41 17 L50 16 L50 30 Z" fill="#AED6F1" opacity="0.85"/>
                <circle cx="18" cy="42" r="7" fill="#222"/>
                <circle cx="18" cy="42" r="4" fill="#555"/>
                <circle cx="62" cy="42" r="7" fill="#222"/>
                <circle cx="62" cy="42" r="4" fill="#555"/>
                <ellipse cx="71" cy="34" rx="3" ry="2" fill="#FFF3B0" opacity="0.9"/>
                <rect x="6" y="31" width="3" height="5" rx="1" fill="#E74C3C" opacity="0.85"/>
                <text x="28" y="37" fontSize="9" fill="#F0B429" fontWeight="bold" fontFamily="system-ui">€?</text>
              </svg>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1B4F72", lineHeight: 1.2 }}>Welkom bij AutoKosten</div>
                <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>{APP_VERSION}</div>
              </div>
            </div>

            {/* Tekst */}
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: "0 0 1rem" }}>
              AutoKosten helpt je inzicht te krijgen in de <strong>werkelijke kosten van je eigen auto</strong> en vergelijkt die eerlijk met zakelijk en privé leasen — inclusief indexatie over meerdere leaseperiodes.
            </p>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: "0 0 1.25rem" }}>
              Alle gegevens worden lokaal opgeslagen in je browser. Er gaat niets naar een server.
            </p>

            {/* Demo tip */}
            <div style={{
              background: "#f0f4ff", border: "0.5px solid #1B4F7230",
              borderRadius: 10, padding: "12px 16px", marginBottom: "1.25rem",
              fontSize: 14, color: "#1B4F72", lineHeight: 1.6,
            }}>
              💡 <strong>Nieuw?</strong> Ga naar <strong>⚙ Beheer</strong> en klik op <em>Voorbeeldauto toevoegen</em> om een complete berekening te bekijken.
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 16, fontSize: 13, marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {[
                ["📖 Help", "/AutoKosten/help.html"],
                ["⚖ Disclaimer", "/AutoKosten/disclaimer.html"],
                ["🔒 Privacy", "/AutoKosten/privacy.html"],
              ].map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#1B4F72", textDecoration: "none", fontWeight: 500 }}>
                  {label}
                </a>
              ))}
            </div>

            {/* Knop */}
            <button
              onClick={() => {
                localStorage.setItem("autokosten_welcomed", "1");
                setShowWelcome(false);
              }}
              style={{
                width: "100%", padding: "12px", fontSize: 15, fontWeight: 600,
                background: "#1B4F72", color: "#fff", border: "none",
                borderRadius: 10, cursor: "pointer",
              }}>
              Aan de slag →
            </button>
          </div>
        </div>
      )}

      {/* ══ FOOTER ══ */}
      <div style={{ marginTop: "3rem", paddingTop: "1rem", borderTop: "0.5px solid #e0ddd8", display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#bbb", alignItems: "center" }}>
        <span>AutoKosten {APP_VERSION}</span>
        <a href="/AutoKosten/privacy.html" style={{ color: "#1B4F72", textDecoration: "none" }}>Privacy</a>
        <a href="/AutoKosten/disclaimer.html" style={{ color: "#1B4F72", textDecoration: "none" }}>Disclaimer</a>
        <a href="/AutoKosten/help.html" style={{ color: "#1B4F72", textDecoration: "none" }}>Help</a>
        <a href="https://digidaveapps.lemonsqueezy.com/checkout/buy/d279521d-3d7c-48c0-8f0c-8d0407f4a104?embed=1"
          className="lemonsqueezy-button"
          style={{ color: "#F0B429", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}
          onClick={() => localStorage.setItem("autokosten_donatie_gedaan", "1")}>
          💰 Steun AutoKosten
        </a>
        <span style={{ marginLeft: "auto", fontSize: 11 }}>Lokale opslag · geen server · geen cloud</span>
      </div>

      {/* ══ DONATIE POPUP ══ */}
      {showDonatie && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "2rem",
            maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            textAlign: "center",
          }}>
            {/* Auto logo */}
            <svg width="72" height="50" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 12 }}>
              <path d="M6 38 L6 32 Q6 30 8 30 L72 30 Q74 30 74 32 L74 38 Q74 40 72 40 L8 40 Q6 40 6 38 Z" fill="#1B4F72"/>
              <path d="M18 30 Q22 18 30 16 L52 16 Q60 18 64 30 Z" fill="#2980B9"/>
              <path d="M50 30 Q54 20 58 18 L62 18 Q64 20 63 30 Z" fill="#AED6F1" opacity="0.85"/>
              <path d="M30 30 Q28 20 30 18 L38 17 L40 30 Z" fill="#AED6F1" opacity="0.85"/>
              <path d="M40 30 L41 17 L50 16 L50 30 Z" fill="#AED6F1" opacity="0.85"/>
              <circle cx="18" cy="42" r="7" fill="#222"/><circle cx="18" cy="42" r="4" fill="#555"/>
              <circle cx="62" cy="42" r="7" fill="#222"/><circle cx="62" cy="42" r="4" fill="#555"/>
              <ellipse cx="71" cy="34" rx="3" ry="2" fill="#FFF3B0" opacity="0.9"/>
              <rect x="6" y="31" width="3" height="5" rx="1" fill="#E74C3C" opacity="0.85"/>
              <text x="28" y="37" fontSize="9" fill="#F0B429" fontWeight="bold" fontFamily="system-ui">€?</text>
            </svg>

            <div style={{ fontSize: 22, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#1B4F72", marginBottom: 10 }}>
              Vind je AutoKosten waardevol?
            </div>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 20 }}>
              AutoKosten is gratis en zonder advertenties. Als de app je helpt bij je autokosten in beeld te brengen, overweeg dan een kleine donatie. Je bepaalt zelf het bedrag.
            </p>

            {/* Donatie knop */}
            <a href="https://digidaveapps.lemonsqueezy.com/checkout/buy/d279521d-3d7c-48c0-8f0c-8d0407f4a104?embed=1"
              className="lemonsqueezy-button"
              onClick={() => {
                localStorage.setItem("autokosten_donatie_gedaan", "1");
                setShowDonatie(false);
              }}
              style={{
                display: "block", width: "100%", padding: "13px",
                background: "#F0B429", color: "#1a1a1a", fontWeight: 700,
                fontSize: 15, borderRadius: 10, textDecoration: "none",
                marginBottom: 10, boxSizing: "border-box",
              }}>
              💰 Pay what you want
            </a>

            {/* Later */}
            <button
              onClick={() => {
                // Stel 30 dagen uit
                localStorage.setItem("autokosten_donatie_uitgesteld", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
                setShowDonatie(false);
              }}
              style={{
                width: "100%", padding: "10px", fontSize: 13,
                background: "none", border: "0.5px solid #e0ddd8",
                borderRadius: 10, cursor: "pointer", color: "#999",
                marginBottom: 6,
              }}>
              Misschien later (herinnering over 30 dagen)
            </button>

            {/* Nooit meer */}
            <button
              onClick={() => {
                localStorage.setItem("autokosten_donatie_gedaan", "1");
                setShowDonatie(false);
              }}
              style={{
                width: "100%", padding: "8px", fontSize: 12,
                background: "none", border: "none",
                cursor: "pointer", color: "#ccc",
              }}>
              Nee bedankt, niet meer vragen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
