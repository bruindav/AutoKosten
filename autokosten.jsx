// AutoKosten v1.0 - Volledig overzicht van autokosten vs. lease
import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  primary: "#1B4F72",
  accent: "#E67E22",
  success: "#27AE60",
  danger: "#E74C3C",
  muted: "#7F8C8D",
  surface: "var(--color-background-secondary)",
  card: "var(--color-background-primary)",
  border: "var(--color-border-tertiary)",
  text: "var(--color-text-primary)",
  textMuted: "var(--color-text-secondary)",
};

const COST_CATEGORIES = [
  { id: "brandstof", label: "Brandstof / Laden", variabel: true, icon: "⛽" },
  { id: "onderhoud", label: "Onderhoud & APK", variabel: false, icon: "🔧" },
  { id: "reparatie", label: "Reparaties", variabel: false, icon: "🛠" },
  { id: "verzekering", label: "Verzekering", variabel: false, icon: "🛡" },
  { id: "wegenbelasting", label: "Wegenbelasting", variabel: false, icon: "📋" },
  { id: "banden", label: "Banden", variabel: false, icon: "🔘" },
  { id: "parkeren", label: "Parkeren & tol", variabel: true, icon: "🅿" },
  { id: "wassen", label: "Wassen & poetsen", variabel: false, icon: "💧" },
  { id: "overig", label: "Overig", variabel: false, icon: "📦" },
];

const formatEuro = (val) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val || 0);

const formatEuroCt = (val) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: COLORS.card,
    border: `0.5px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: "1.25rem",
    ...style,
  }}>{children}</div>
);

const MetricCard = ({ label, value, sub, color }) => (
  <div style={{
    background: COLORS.surface,
    borderRadius: 8,
    padding: "0.875rem 1rem",
    flex: 1,
    minWidth: 120,
  }}>
    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 500, color: color || COLORS.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 4, borderBottom: `0.5px solid ${COLORS.border}`, marginBottom: "1.5rem" }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: active === t.id ? 500 : 400,
        background: "none",
        border: "none",
        borderBottom: active === t.id ? `2px solid ${COLORS.primary}` : "2px solid transparent",
        color: active === t.id ? COLORS.primary : COLORS.textMuted,
        cursor: "pointer",
        marginBottom: -1,
      }}>{t.label}</button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.75rem" }}>{children}</div>
);

// ─── RDW Lookup ───────────────────────────────────────────────────────────────
async function lookupKenteken(kenteken) {
  const k = kenteken.replace(/-/g, "").toUpperCase();
  const url = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${k}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("RDW niet bereikbaar");
  const data = await res.json();
  if (!data.length) throw new Error("Kenteken niet gevonden");
  return data[0];
}

// ─── Leaseberekening ──────────────────────────────────────────────────────────
function bereken_lease_prive(catalogus, looptijdMnd, kmPerJaar, aanbetaling = 0) {
  // Vuistregel operationele private lease NL markt
  const maandKm = kmPerJaar / 12;
  const restwaarde = catalogus * (0.5 - looptijdMnd * 0.004);
  const afschr = (catalogus - aanbetaling - Math.max(restwaarde, 0)) / looptijdMnd;
  const rente = (catalogus * 0.035) / 12;
  const onderhoud = 60 + maandKm * 0.02;
  const verzekering = catalogus * 0.0018;
  const basis = Math.round(afschr + rente + onderhoud + verzekering);
  return Math.max(basis, 200);
}

function bereken_lease_zakelijk(catalogus, looptijdMnd, kmPerJaar, bijtelling) {
  const maand = bereken_lease_prive(catalogus, looptijdMnd, kmPerJaar);
  const bijtellingMaand = (catalogus * bijtelling) / 12;
  return { maandBedrag: maand, bijtellingMaand };
}

// ─── Afschrijving ─────────────────────────────────────────────────────────────
function afschrijvingPerJaar(aankoopprijs, verwachtVerkoopprijs, jaarReden) {
  if (jaarReden <= 0) return 0;
  return (aankoopprijs - verwachtVerkoopprijs) / jaarReden;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AutoKosten() {
  const [tab, setTab] = useState("auto");

  // Auto-gegevens
  const [kenteken, setKenteken] = useState("");
  const [rdwData, setRdwData] = useState(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwError, setRdwError] = useState("");
  const [merk, setMerk] = useState("");
  const [model, setModel] = useState("");
  const [bouwjaar, setBouwjaar] = useState("");
  const [brandstof, setBrandstof] = useState("");

  // Financieel
  const [aankoopprijs, setAankoopprijs] = useState(25000);
  const [aankoopdatum, setAankoopdatum] = useState("2022-01-01");
  const [verwachteVerkoopdatum, setVerwachteVerkoopdatum] = useState("2027-01-01");
  const [verwachtVerkoopprijs, setVerwachtVerkoopprijs] = useState(12000);
  const [jaarlijkseKm, setJaarlijkseKm] = useState(15000);

  // Kosten per jaar (records: [{id, datum, categorie, bedrag, km, omschrijving}])
  const [kosten, setKosten] = useState([
    { id: 1, datum: "2022-06-01", categorie: "verzekering", bedrag: 900, km: null, omschrijving: "Jaarlijkse premie" },
    { id: 2, datum: "2022-06-15", categorie: "wegenbelasting", bedrag: 480, km: null, omschrijving: "MRB kwartaal x4" },
    { id: 3, datum: "2022-09-10", categorie: "onderhoud", bedrag: 320, km: 15000, omschrijving: "Grote beurt" },
    { id: 4, datum: "2023-01-15", categorie: "brandstof", bedrag: 2200, km: 15000, omschrijving: "Benzine jaarlijks" },
    { id: 5, datum: "2023-06-01", categorie: "verzekering", bedrag: 950, km: null, omschrijving: "Jaarlijkse premie" },
    { id: 6, datum: "2024-03-20", categorie: "banden", bedrag: 480, km: 45000, omschrijving: "4 nieuwe banden" },
  ]);
  const [nieuwKost, setNieuwKost] = useState({ datum: "", categorie: "brandstof", bedrag: "", km: "", omschrijving: "" });

  // Lease-vergelijking
  const [cataloguswaarde, setCataloguswaarde] = useState(30000);
  const [leaseLooptijd, setLeaseLooptijd] = useState(48);
  const [leaseKm, setLeaseKm] = useState(15000);
  const [leaseAanbetaling, setLeaseAanbetaling] = useState(0);
  const [bijtelling, setBijtelling] = useState(0.22);
  const [belastingschijf, setBelastingschijf] = useState(0.369);
  const [leaseType, setLeaseType] = useState("prive");

  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  // ─── RDW lookup ───
  const handleKentekenLookup = async () => {
    setRdwLoading(true);
    setRdwError("");
    try {
      const d = await lookupKenteken(kenteken);
      setRdwData(d);
      setMerk(d.merk || "");
      setModel(d.handelsbenaming || "");
      setBouwjaar(d.datum_eerste_toelating ? d.datum_eerste_toelating.slice(0, 4) : "");
      setBrandstof(d.brandstof_omschrijving || "");
      if (d.catalogusprijs) setCataloguswaarde(parseInt(d.catalogusprijs));
    } catch (e) {
      setRdwError(e.message);
    } finally {
      setRdwLoading(false);
    }
  };

  // ─── Berekeningen ───
  const nu = new Date();
  const aankoopDt = new Date(aankoopdatum);
  const verkoopDt = new Date(verwachteVerkoopdatum);
  const bezitsjaren = Math.max((verkoopDt - aankoopDt) / (1000 * 60 * 60 * 24 * 365.25), 0.1);
  const verlopenJaren = Math.max((nu - aankoopDt) / (1000 * 60 * 60 * 24 * 365.25), 0);
  const totaleKm = Math.round(jaarlijkseKm * bezitsjaren);

  const totaalGemaakteKosten = kosten.reduce((s, k) => s + Number(k.bedrag), 0);
  const afschr = afschrijvingPerJaar(aankoopprijs, verwachtVerkoopprijs, bezitsjaren);
  const totaleAfschrijving = aankoopprijs - verwachtVerkoopprijs;

  // Kosten per categorie
  const kostPerCategorie = COST_CATEGORIES.map(cat => ({
    ...cat,
    totaal: kosten.filter(k => k.categorie === cat.id).reduce((s, k) => s + Number(k.bedrag), 0),
  })).filter(c => c.totaal > 0);

  // Variabel vs vast
  const variabelTotaal = kosten
    .filter(k => COST_CATEGORIES.find(c => c.id === k.categorie)?.variabel)
    .reduce((s, k) => s + Number(k.bedrag), 0);
  const vastTotaal = totaalGemaakteKosten - variabelTotaal;

  // Kosten per km (op basis van ingevoerde km bij kosten)
  const kostenMKm = kosten.filter(k => k.km).reduce((s, k) => s + Number(k.bedrag), 0);
  const gemKm = kosten.filter(k => k.km).reduce((s, k) => s + Number(k.km), 0) / Math.max(kosten.filter(k => k.km).length, 1);
  const totaalIncAfschr = totaalGemaakteKosten + totaleAfschrijving;
  const totaleKmGereden = Math.max(jaarlijkseKm * verlopenJaren, 1);
  const kostenPerKmVariabel = variabelTotaal / totaleKmGereden;
  const kostenPerKmVast = (vastTotaal + totaleAfschrijving) / totaleKmGereden;
  const kostenPerKmTotaal = (totaalGemaakteKosten + totaleAfschrijving) / totaleKmGereden;

  // Lease
  const leasePrive = bereken_lease_prive(cataloguswaarde, leaseLooptijd, leaseKm, leaseAanbetaling);
  const leaseZakelijk = bereken_lease_zakelijk(cataloguswaarde, leaseLooptijd, leaseKm, bijtelling);
  const leaseTotaalPeriode = leasePrive * leaseLooptijd + leaseAanbetaling;
  const leaseKmKosten = leaseTotaalPeriode / (leaseKm * (leaseLooptijd / 12));

  // Zakelijk netto bijtelling
  const bijtellingNetto = leaseZakelijk.bijtellingMaand * belastingschijf;
  const leasZakelijkNetto = leaseZakelijk.maandBedrag + bijtellingNetto;

  // Vergelijk: eigen auto totaalkosten per maand
  const eigenMaand = (totaalGemaakteKosten + afschr) / Math.max(verlopenJaren * 12, 1);

  // ─── Import CSV ───
  const handleImport = () => {
    setImportError("");
    try {
      const lines = importText.trim().split("\n").filter(l => l.trim());
      const nieuweKosten = [];
      let id = Date.now();
      for (const line of lines) {
        const cols = line.split(/[,;	]/);
        if (cols.length < 3) throw new Error(`Regel niet geldig: ${line}`);
        const [datum, categorie, bedrag, km, omschrijving] = cols;
        if (!datum || isNaN(Number(bedrag))) throw new Error(`Ongeldige waarde in: ${line}`);
        const catMatch = COST_CATEGORIES.find(c =>
          c.id === categorie.trim().toLowerCase() ||
          c.label.toLowerCase().includes(categorie.trim().toLowerCase())
        );
        nieuweKosten.push({
          id: id++,
          datum: datum.trim(),
          categorie: catMatch?.id || "overig",
          bedrag: Number(bedrag),
          km: km ? Number(km) : null,
          omschrijving: omschrijving?.trim() || "",
        });
      }
      setKosten(prev => [...prev, ...nieuweKosten]);
      setImportText("");
    } catch (e) {
      setImportError(e.message);
    }
  };

  // ─── Grafiek: kosten per jaar ───
  const kostenPerJaar = {};
  kosten.forEach(k => {
    const jaar = k.datum?.slice(0, 4);
    if (jaar) kostenPerJaar[jaar] = (kostenPerJaar[jaar] || 0) + Number(k.bedrag);
  });
  const jaren = Object.keys(kostenPerJaar).sort();
  const maxBar = Math.max(...Object.values(kostenPerJaar), 1);

  // ─── Render ───
  return (
    <div style={{ fontFamily: "var(--font-sans)", color: COLORS.text, maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", color: COLORS.muted, textTransform: "uppercase", marginBottom: 4 }}>
          Autokosten Analyse
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500 }}>
              {merk && model ? `${merk} ${model}` : "Mijn auto"}
            </h1>
            {bouwjaar && <div style={{ fontSize: 13, color: COLORS.textMuted }}>{bouwjaar} · {brandstof} · {kenteken}</div>}
          </div>
          {/* Quick metrics */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <MetricCard label="Totaalkosten" value={formatEuro(totaalGemaakteKosten + totaleAfschrijving)} sub="incl. afschrijving" />
            <MetricCard label="Per km" value={formatEuroCt(kostenPerKmTotaal)} sub="variabel + vast" color={COLORS.accent} />
          </div>
        </div>
      </div>

      <TabBar
        tabs={[
          { id: "auto", label: "🚗 Mijn auto" },
          { id: "kosten", label: "📊 Kosten" },
          { id: "lease", label: "🔄 Lease vergelijk" },
          { id: "import", label: "⬆ Importeren" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ═══════════════ TAB: AUTO ═══════════════ */}
      {tab === "auto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>Kenteken opzoeken</SectionTitle>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={kenteken}
                onChange={e => setKenteken(e.target.value.toUpperCase())}
                placeholder="bijv. AB-123-C"
                style={{ flex: 1, minWidth: 120, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}
                onKeyDown={e => e.key === "Enter" && handleKentekenLookup()}
              />
              <button onClick={handleKentekenLookup} disabled={rdwLoading} style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}>
                {rdwLoading ? "Zoeken..." : "Opzoeken via RDW"}
              </button>
            </div>
            {rdwError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>{rdwError}</div>}
            {rdwData && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: COLORS.surface, borderRadius: 8, fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>✅ <b>{rdwData.merk}</b> {rdwData.handelsbenaming}</span>
                <span>📅 {rdwData.datum_eerste_toelating?.slice(0, 4)}</span>
                <span>⛽ {rdwData.brandstof_omschrijving}</span>
                {rdwData.catalogusprijs && <span>💰 {formatEuro(rdwData.catalogusprijs)} catalogus</span>}
                {rdwData.co2_uitstoot_gecombineerd && <span>🌿 {rdwData.co2_uitstoot_gecombineerd} g/km CO₂</span>}
              </div>
            )}
          </Card>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 250 }}>
              <SectionTitle>Voertuig</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Merk", merk, setMerk],
                  ["Model", model, setModel],
                  ["Bouwjaar", bouwjaar, setBouwjaar],
                  ["Brandstof", brandstof, setBrandstof],
                ].map(([label, val, setter]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: COLORS.textMuted, width: 80 }}>{label}</label>
                    <input value={val} onChange={e => setter(e.target.value)} style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ flex: 1, minWidth: 250 }}>
              <SectionTitle>Financieel</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, width: 120 }}>Aankoopprijs</label>
                  <input type="number" value={aankoopprijs} onChange={e => setAankoopprijs(Number(e.target.value))} style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, width: 120 }}>Aankoopdatum</label>
                  <input type="date" value={aankoopdatum} onChange={e => setAankoopdatum(e.target.value)} style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, width: 120 }}>Verwacht weg</label>
                  <input type="date" value={verwachteVerkoopdatum} onChange={e => setVerwachteVerkoopdatum(e.target.value)} style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, width: 120 }}>Verkoopprijs</label>
                  <input type="number" value={verwachtVerkoopprijs} onChange={e => setVerwachtVerkoopprijs(Number(e.target.value))} style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, width: 120 }}>Km per jaar</label>
                  <input type="number" value={jaarlijkseKm} onChange={e => setJaarlijkseKm(Number(e.target.value))} style={{ flex: 1 }} />
                </div>
              </div>
            </Card>
          </div>

          {/* Samenvatting */}
          <Card>
            <SectionTitle>Kostensamenvatting</SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
              <MetricCard label="Bezitsperiode" value={`${bezitsjaren.toFixed(1)} jaar`} sub={`${totaleKm.toLocaleString("nl")} km totaal`} />
              <MetricCard label="Afschrijving totaal" value={formatEuro(totaleAfschrijving)} sub={`${formatEuro(afschr)}/jaar`} />
              <MetricCard label="Overige kosten" value={formatEuro(totaalGemaakteKosten)} sub={`${formatEuro(totaalGemaakteKosten / Math.max(verlopenJaren, 1))}/jaar`} />
              <MetricCard label="Alles samen" value={formatEuro(totaalGemaakteKosten + totaleAfschrijving)} sub={`${formatEuro(eigenMaand)}/maand`} color={COLORS.accent} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <MetricCard label="Kosten/km variabel" value={formatEuroCt(kostenPerKmVariabel)} sub="brandstof, parkeren" />
              <MetricCard label="Kosten/km vast" value={formatEuroCt(kostenPerKmVast)} sub="incl. afschrijving" />
              <MetricCard label="Kosten/km totaal" value={formatEuroCt(kostenPerKmTotaal)} sub="alles meegerekend" color={COLORS.accent} />
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════ TAB: KOSTEN ═══════════════ */}
      {tab === "kosten" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Grafieken */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Card style={{ flex: 2, minWidth: 260 }}>
              <SectionTitle>Kosten per categorie</SectionTitle>
              {kostPerCategorie.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 14 }}>Nog geen kosten ingevoerd.</div>}
              {kostPerCategorie.map(c => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{c.icon} {c.label}</span>
                    <span style={{ fontWeight: 500 }}>{formatEuro(c.totaal)}</span>
                  </div>
                  <div style={{ height: 6, background: COLORS.surface, borderRadius: 3 }}>
                    <div style={{
                      height: 6, borderRadius: 3,
                      width: `${(c.totaal / (totaalGemaakteKosten || 1)) * 100}%`,
                      background: c.variabel ? COLORS.accent : COLORS.primary,
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: COLORS.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: COLORS.primary, borderRadius: 2, display: "inline-block" }} />Vast</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: COLORS.accent, borderRadius: 2, display: "inline-block" }} />Variabel</span>
              </div>
            </Card>

            <Card style={{ flex: 1, minWidth: 200 }}>
              <SectionTitle>Kosten per jaar</SectionTitle>
              {jaren.map(j => (
                <div key={j} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{j}</span>
                    <span style={{ fontWeight: 500 }}>{formatEuro(kostenPerJaar[j])}</span>
                  </div>
                  <div style={{ height: 6, background: COLORS.surface, borderRadius: 3 }}>
                    <div style={{
                      height: 6, borderRadius: 3,
                      width: `${(kostenPerJaar[j] / maxBar) * 100}%`,
                      background: COLORS.primary,
                    }} />
                  </div>
                </div>
              ))}
              {jaren.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 14 }}>Nog geen kosten.</div>}
            </Card>
          </div>

          {/* Kosten per km detail */}
          <Card>
            <SectionTitle>Kosten per km analyse</SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <MetricCard label="Vast per km" value={formatEuroCt(kostenPerKmVast)} sub="incl. afschrijving" />
              <MetricCard label="Variabel per km" value={formatEuroCt(kostenPerKmVariabel)} sub="rijgebonden kosten" />
              <MetricCard label="Totaal per km" value={formatEuroCt(kostenPerKmTotaal)} sub="alles incl." color={COLORS.accent} />
              <MetricCard label="Gereden km" value={(totaleKmGereden || 0).toLocaleString("nl")} sub={`${Math.round(verlopenJaren * 10) / 10} jaar in bezit`} />
            </div>
          </Card>

          {/* Kosten toevoegen */}
          <Card>
            <SectionTitle>Kostenpost toevoegen</SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: COLORS.textMuted }}>Datum</label>
                <input type="date" value={nieuwKost.datum} onChange={e => setNieuwKost(p => ({ ...p, datum: e.target.value }))} style={{ width: 140 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: COLORS.textMuted }}>Categorie</label>
                <select value={nieuwKost.categorie} onChange={e => setNieuwKost(p => ({ ...p, categorie: e.target.value }))} style={{ width: 160 }}>
                  {COST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: COLORS.textMuted }}>Bedrag (€)</label>
                <input type="number" placeholder="0" value={nieuwKost.bedrag} onChange={e => setNieuwKost(p => ({ ...p, bedrag: e.target.value }))} style={{ width: 90 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: COLORS.textMuted }}>Kilometerstand</label>
                <input type="number" placeholder="optioneel" value={nieuwKost.km} onChange={e => setNieuwKost(p => ({ ...p, km: e.target.value }))} style={{ width: 110 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 12, color: COLORS.textMuted }}>Omschrijving</label>
                <input placeholder="optioneel" value={nieuwKost.omschrijving} onChange={e => setNieuwKost(p => ({ ...p, omschrijving: e.target.value }))} />
              </div>
              <button
                onClick={() => {
                  if (!nieuwKost.datum || !nieuwKost.bedrag) return;
                  setKosten(prev => [...prev, { ...nieuwKost, id: Date.now(), bedrag: Number(nieuwKost.bedrag), km: nieuwKost.km ? Number(nieuwKost.km) : null }]);
                  setNieuwKost({ datum: "", categorie: "brandstof", bedrag: "", km: "", omschrijving: "" });
                }}
                style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}
              >+ Toevoegen</button>
            </div>
          </Card>

          {/* Kostenlijst */}
          <Card>
            <SectionTitle>Alle kostenposten ({kosten.length})</SectionTitle>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                    {["Datum", "Categorie", "Bedrag", "Km-stand", "Omschrijving", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500, color: COLORS.textMuted, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...kosten].sort((a, b) => (b.datum || "").localeCompare(a.datum || "")).map(k => {
                    const cat = COST_CATEGORIES.find(c => c.id === k.categorie);
                    return (
                      <tr key={k.id} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                        <td style={{ padding: "6px 8px" }}>{k.datum}</td>
                        <td style={{ padding: "6px 8px" }}>{cat?.icon} {cat?.label || k.categorie}</td>
                        <td style={{ padding: "6px 8px", fontWeight: 500 }}>{formatEuro(k.bedrag)}</td>
                        <td style={{ padding: "6px 8px", color: COLORS.textMuted }}>{k.km?.toLocaleString("nl") || "—"}</td>
                        <td style={{ padding: "6px 8px", color: COLORS.textMuted }}>{k.omschrijving || "—"}</td>
                        <td style={{ padding: "6px 8px" }}>
                          <button onClick={() => setKosten(prev => prev.filter(x => x.id !== k.id))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger, fontSize: 14, padding: "2px 4px" }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td colSpan={2} style={{ padding: "8px 8px", fontWeight: 500 }}>Totaal</td>
                    <td style={{ padding: "8px 8px", fontWeight: 500 }}>{formatEuro(totaalGemaakteKosten)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════ TAB: LEASE ═══════════════ */}
      {tab === "lease" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 260 }}>
              <SectionTitle>Lease parameters</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["Cataloguswaarde (€)", cataloguswaarde, setCataloguswaarde, "number"],
                  ["Looptijd (maanden)", leaseLooptijd, setLeaseLooptijd, "number"],
                  ["Km per jaar", leaseKm, setLeaseKm, "number"],
                  ["Aanbetaling (€)", leaseAanbetaling, setLeaseAanbetaling, "number"],
                ].map(([label, val, setter, type]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, color: COLORS.textMuted, flex: 1 }}>{label}</label>
                    <input type={type} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: 110 }} />
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ flex: 1, minWidth: 260 }}>
              <SectionTitle>Zakelijk lease</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, flex: 1 }}>Bijtelling %</label>
                  <select value={bijtelling} onChange={e => setBijtelling(Number(e.target.value))} style={{ width: 110 }}>
                    <option value={0.16}>16% (EV)</option>
                    <option value={0.22}>22% (standaard)</option>
                    <option value={0.35}>35% (>15 jaar)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: COLORS.textMuted, flex: 1 }}>Belastingschijf</label>
                  <select value={belastingschijf} onChange={e => setBelastingschijf(Number(e.target.value))} style={{ width: 110 }}>
                    <option value={0.369}>36,9% (schijf 1)</option>
                    <option value={0.495}>49,5% (schijf 2)</option>
                  </select>
                </div>
                <div style={{ padding: "10px 12px", background: COLORS.surface, borderRadius: 8, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: COLORS.textMuted }}>Lease maandbedrag</span>
                    <span style={{ fontWeight: 500 }}>{formatEuro(leaseZakelijk.maandBedrag)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: COLORS.textMuted }}>Bijtelling per maand</span>
                    <span>{formatEuro(leaseZakelijk.bijtellingMaand)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: COLORS.textMuted }}>Belasting op bijtelling</span>
                    <span style={{ color: COLORS.danger }}>+ {formatEuro(bijtellingNetto)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: `0.5px solid ${COLORS.border}`, paddingTop: 6, fontWeight: 500 }}>
                    <span>Netto maandlast</span>
                    <span style={{ color: COLORS.danger }}>{formatEuro(leasZakelijkNetto)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Vergelijkingstabel */}
          <Card>
            <SectionTitle>Vergelijking over {leaseLooptijd} maanden</SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <MetricCard label="Eigen auto / maand" value={formatEuro(eigenMaand)} sub="incl. afschrijving" />
              <MetricCard label="Privé lease / maand" value={formatEuro(leasePrive)} sub="all-in schatting" />
              <MetricCard label="Zakelijk lease netto" value={formatEuro(leasZakelijkNetto)} sub="incl. bijtelling" />
            </div>

            {/* Staafvergelijking */}
            {[
              { label: "Eigen auto", maand: eigenMaand, color: COLORS.primary },
              { label: "Privé lease", maand: leasePrive, color: COLORS.accent },
              { label: "Zakelijk lease", maand: leasZakelijkNetto, color: COLORS.success },
            ].map(item => {
              const maxMaand = Math.max(eigenMaand, leasePrive, leasZakelijkNetto, 1);
              return (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 500 }}>{formatEuro(item.maand)}/mnd · {formatEuro(item.maand * leaseLooptijd)} totaal</span>
                  </div>
                  <div style={{ height: 10, background: COLORS.surface, borderRadius: 5 }}>
                    <div style={{
                      height: 10, borderRadius: 5,
                      width: `${(item.maand / maxMaand) * 100}%`,
                      background: item.color,
                      transition: "width 0.3s",
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: "1.5rem", padding: "12px 14px", background: COLORS.surface, borderRadius: 8, fontSize: 13 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Kosten per km vergelijking</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>🚗 Eigen auto: <b>{formatEuroCt(kostenPerKmTotaal)}/km</b></span>
                <span>📝 Privé lease: <b>{formatEuroCt(leaseKmKosten)}/km</b></span>
                <span>💼 Zakelijk: <b>{formatEuroCt((leasZakelijkNetto * leaseLooptijd) / (leaseKm * (leaseLooptijd / 12)))}/km</b></span>
              </div>
            </div>

            <div style={{ marginTop: "1rem", fontSize: 12, color: COLORS.textMuted }}>
              ⚠️ Lease bedragen zijn schattingen op basis van marktgemiddelden. Vraag altijd een offerte op bij een leasemaatschappij. Zakelijke bijtelling is afhankelijk van je fiscale situatie.
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════ TAB: IMPORT ═══════════════ */}
      {tab === "import" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <SectionTitle>CSV / tekst importeren</SectionTitle>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
              Plak hieronder regels in het formaat: <code style={{ background: COLORS.surface, padding: "2px 6px", borderRadius: 4 }}>datum;categorie;bedrag;km;omschrijving</code><br />
              Categorie kan zijn: {COST_CATEGORIES.map(c => c.id).join(", ")}<br />
              Voorbeeld: <code style={{ background: COLORS.surface, padding: "2px 6px", borderRadius: 4 }}>2024-03-15;brandstof;85;62000;Tankbeurt</code>
            </div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={8}
              placeholder={"2024-01-10;verzekering;950;;Jaarlijkse premie\n2024-03-15;brandstof;85;62000;Tankbeurt\n2024-06-20;onderhoud;320;65000;Kleine beurt"}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 13, padding: 10, borderRadius: 6, border: `0.5px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, boxSizing: "border-box" }}
            />
            {importError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>{importError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={handleImport}
                style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 500 }}
              >Importeren</button>
              <button
                onClick={() => setImportText("")}
                style={{ background: "none", border: `0.5px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 16px", cursor: "pointer", color: COLORS.textMuted }}
              >Wissen</button>
            </div>
          </Card>

          <Card>
            <SectionTitle>Export (kopieren)</SectionTitle>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Kopieer onderstaande data voor gebruik in Excel of een ander systeem:</div>
            <textarea
              readOnly
              rows={Math.min(kosten.length + 1, 12)}
              value={"datum;categorie;bedrag;km;omschrijving\n" + kosten.map(k => `${k.datum};${k.categorie};${k.bedrag};${k.km || ""};${k.omschrijving}`).join("\n")}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 12, padding: 10, borderRadius: 6, border: `0.5px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.textMuted, boxSizing: "border-box" }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
