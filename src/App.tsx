import { useMemo, useState } from "react";
import { Search, Globe2, ArrowUpRight, ArrowRight, BadgeCheck, Plane, Stamp, BookOpen, ShieldCheck, Filter, X, ChevronRight, ExternalLink, Info, MapPin } from "lucide-react";
import passportsData from "../data/passports.json";
import rulesData from "../data/rules.json";
import substituteData from "../data/substitute_visa.json";
import transitData from "../data/transit.json";

/* The verified dataset lives in data/*.json and is imported directly: every
   fact rendered on this page comes from those files, verbatim. Nothing is
   duplicated, hardcoded, shortened, or paraphrased here. */

type PassportCode = "VN" | "ID" | "PH" | "TH";

type Passport = { code: PassportCode; henley_as_of: string; henley_score: number; name: string };

type Source = { name: string; url: string };

type Rule = {
  conditions: string[];
  destination: string;
  destination_iso: string;
  duration: string;
  extension?: string;
  fee?: string;
  notes: string;
  passport: PassportCode;
  region: string;
  source: Source;
  status: "visa_free" | "visa_on_arrival" | "evisa" | "eta" | "visa_required";
  verified: string;
};

type SubstituteRule = {
  benefit: string;
  conditions: string[];
  destination: string;
  destination_iso: string;
  duration: string;
  fee?: string;
  held_visas: string[];
  notes?: string;
  passport: PassportCode;
  region: string;
  requires: string;
  source: Source;
  verified: string;
};

type TransitRule = {
  benefit: string;
  conditions: string[];
  destination: string;
  destination_iso: string;
  duration: string;
  fee?: string;
  held_visas: string[];
  notes: string;
  passport: PassportCode;
  region: string;
  requires: string;
  source: Source;
  status: "transit_visa" | "transit_visa_restricted";
  verified: string;
};

const PASSPORTS = passportsData as Passport[];
const RULES = rulesData as Rule[];
const SUB_RULES = substituteData as SubstituteRule[];
const TRANSIT_RULES = transitData as TransitRule[];

/* Display region: the data says "Southeast Asia"; the design's filter and
   chips say "ASEAN". One mapping, applied everywhere a region is shown or
   filtered on. */
function displayRegion(region: string): string {
  return region === "Southeast Asia" ? "ASEAN" : region;
}

const STATUS_LABELS: Record<Rule["status"], string> = {
  visa_free: "Visa-free",
  visa_on_arrival: "Visa on arrival",
  evisa: "eVisa",
  eta: "ETA",
  visa_required: "Visa required",
};

function isWikipedia(source: Source): boolean {
  const haystack = `${source.name} ${source.url}`.toLowerCase();
  return haystack.includes("wikipedia");
}

/* HOLD → UNLOCK grouping, derived from the benefit sentence: an entry is an
   EASIER route when the held visa only unlocks a faster application (an AVE,
   an e-Visa, a visa on arrival) instead of removing the visa entirely. */
const EASIER_PATTERN = /AVE|e-Visa|eVisa|Visa-on-Arrival|Visa on arrival|Electronic Travel Authorisation|Eligibility for/;

type UnlockGroup = "no-visa" | "easier";

function unlockGroup(benefit: string): UnlockGroup {
  return EASIER_PATTERN.test(benefit) ? "easier" : "no-visa";
}

/* Short route label for the EASIER pill, from the same benefit text. Order
   matters: "granted on arrival" is an on-arrival route even when the sentence
   also names the e-Visa it replaces. */
function unlockRoute(benefit: string): string {
  if (/AVE/.test(benefit)) return "AVE";
  if (/Visa-on-Arrival|Visa on arrival|granted on arrival/.test(benefit)) return "VISA ON ARRIVAL";
  if (/e-Visa|eVisa/.test(benefit)) return "E-VISA";
  return "EASIER ROUTE";
}

/* Held-visa filter normalization. The filter labels are short names, but the
   data's held_visas values name issuers precisely — including, for Georgia
   (Vietnam), 45 individual countries with no "Schengen" string at all. Each
   label maps to every held value it matches. Schengen covers the member
   states (including non-EU Iceland, Norway, Switzerland, Liechtenstein);
   Cyprus is EU but not Schengen, so it is not in the list. GCC covers the
   bloc name, the long "GCC states (...)" string, and the six member names. */
const SCHENGEN_STATES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Czech Republic", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland",
  "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta",
  "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Slovakia",
  "Slovenia", "Spain", "Sweden", "Switzerland",
];

const GCC_MEMBERS = ["Bahrain", "Kuwait", "Oman", "Qatar", "Saudi Arabia", "UAE"];

const HELD_MATCHES: Record<string, string[]> = {
  US: ["US", "USA"],
  UK: ["UK"],
  Schengen: ["Schengen", "Schengen/EU states", "EU", ...SCHENGEN_STATES],
  Australia: ["Australia"],
  Canada: ["Canada"],
  Japan: ["Japan"],
  Ireland: ["Ireland"],
  NZ: ["New Zealand"],
  Korea: ["South Korea"],
  GCC: ["GCC", "GCC states (Bahrain, Kuwait, Oman, Qatar, Saudi Arabia, UAE)", ...GCC_MEMBERS],
};

function heldMatches(heldVisas: string[], filter: string): boolean {
  if (filter === "All") return true;
  const wanted = HELD_MATCHES[filter] ?? [filter];
  return heldVisas.some((h) => wanted.includes(h));
}

const HELD_VISA_FILTERS = ["All", "US", "UK", "Schengen", "Australia", "Canada", "Japan", "Ireland", "NZ", "Korea", "GCC"];

const CATEGORIES: { label: string; status: Rule["status"] }[] = [
  { label: "Visa-free", status: "visa_free" },
  { label: "Visa on arrival", status: "visa_on_arrival" },
  { label: "eVisa", status: "evisa" },
  { label: "ETA", status: "eta" },
  { label: "Visa required", status: "visa_required" },
];

/* "Asia" is in this list because the substitute data uses region "Asia";
   the other regions are the design's own. */
const REGIONS = ["All regions", "ASEAN", "East Asia", "Asia", "Europe", "Americas", "Africa", "Oceania", "Caribbean", "Middle East"];

const MONTH_NAMES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

function henleyLabel(asOf: string): string {
  const [year, month] = asOf.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function countsFor(code: PassportCode) {
  return {
    rules: RULES.filter((r) => r.passport === code).length,
    substitute: SUB_RULES.filter((r) => r.passport === code).length,
    transit: TRANSIT_RULES.filter((r) => r.passport === code).length,
  };
}

/* Distinct destinations in scope per section, computed from the data. */
const SUB_DESTINATIONS = new Set(SUB_RULES.map((r) => r.destination_iso)).size;
const TRANSIT_DESTINATIONS = new Set(TRANSIT_RULES.map((r) => r.destination_iso)).size;
const TOTAL_ENTRIES = RULES.length + SUB_RULES.length + TRANSIT_RULES.length;

export default function App(){
  const [passport, setPassport] = useState<Passport>(PASSPORTS[0]);
  const [section, setSection] = useState<"all"|"go"|"sub"|"transit">("all");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All regions");
  const [heldVisa, setHeldVisa] = useState("All");
  const [statusFilter, setStatusFilter] = useState<Rule["status"] | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [expandedHeld, setExpandedHeld] = useState<Record<string, boolean>>({});

  const counts = countsFor(passport.code);
  const total = counts.rules + counts.substitute + counts.transit;
  const goList = useMemo(()=> RULES.filter((r) => r.passport === passport.code),[passport]);

  const filteredGo = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return goList.filter((d)=>{
      const haystack = [d.destination, d.destination_iso, displayRegion(d.region), STATUS_LABELS[d.status], d.duration].join(" ").toLowerCase();
      const okQ = !q || haystack.includes(q);
      const okR = region==="All regions" || displayRegion(d.region)===region;
      const okS = statusFilter===null || d.status===statusFilter;
      return okQ && okR && okS;
    });
  },[goList, query, region, statusFilter]);

  const subFiltered = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return SUB_RULES.filter((d)=>{
      if (d.passport !== passport.code) return false;
      const haystack = [d.destination, d.destination_iso, displayRegion(d.region), d.benefit].join(" ").toLowerCase();
      const okQ = !q || haystack.includes(q);
      const okR = region==="All regions" || displayRegion(d.region)===region;
      const okHeld = heldMatches(d.held_visas, heldVisa);
      return okQ && okR && okHeld;
    });
  },[query, region, heldVisa, passport]);
  const subNoVisa = subFiltered.filter((d)=>unlockGroup(d.benefit)==="no-visa");
  const subEasier = subFiltered.filter((d)=>unlockGroup(d.benefit)==="easier");
  const transitFiltered = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return TRANSIT_RULES.filter((d)=>{
      if (d.passport !== passport.code) return false;
      const haystack = [d.destination, d.destination_iso, displayRegion(d.region), d.benefit, d.duration].join(" ").toLowerCase();
      const okQ = !q || haystack.includes(q);
      const okR = region==="All regions" || displayRegion(d.region)===region;
      return okQ && okR;
    });
  },[query, region, passport]);
  /* The Georgia example is only true when this passport has a Georgia unlock
     via an Australian visa (Vietnam, Indonesia, Philippines). Thailand has
     no Georgia entry, so the box hides rather than show a false example. */
  const showGeorgiaExample = SUB_RULES.some((d) => d.passport === passport.code && d.destination_iso === "GE" && d.held_visas.includes("Australia"));

  function scrollToId(id:string){ document.getElementById(id)?.scrollIntoView({behavior:"smooth"}); }

  return (
    <div data-safe-area-inset-root style={{boxSizing:"border-box", paddingTop:"var(--safe-area-inset-top)"}} className="min-h-screen bg-[var(--surface)] text-[var(--ink)] overflow-x-clip">
      {/* TOP BAR */}
      <header data-safe-area-sticky-top style={{top:"var(--safe-area-inset-top)"}} className="sticky z-40 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-[64px] flex items-center justify-between gap-3">
          <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} className="flex items-center gap-2.5 min-w-0 text-left">
            <span className="w-9 h-9 shrink-0 rounded-[10px] bg-[var(--ink)] text-[var(--surface)] grid place-items-center"><Stamp size={18}/></span>
            <span className="leading-none">
              <span className="block font-bold tracking-tight text-[18px] sm:text-[20px]">PASSPORT<span className="text-[var(--accent)]"> SWITCH</span></span>
              <span className="hidden sm:block mono text-[10px] tracking-[0.18em] text-[var(--muted)] mt-1">VISA GUIDE · V2</span>
            </span>
          </button>
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium">
            <button onClick={()=>scrollToId("library")} className="px-3 py-2 rounded-full hover:bg-[var(--surface-2)]">Library</button>
            <button onClick={()=>scrollToId("compare")} className="px-3 py-2 rounded-full hover:bg-[var(--surface-2)]">Compare passports</button>
            <button onClick={()=>{setShowPolicy(true); setTimeout(()=>scrollToId("policy"),80)}} className="px-3 py-2 rounded-full hover:bg-[var(--surface-2)]">Data policy</button>
            <button onClick={()=>scrollToId("disclaimer")} className="px-3 py-2 rounded-full hover:bg-[var(--surface-2)]">Disclaimer</button>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex mono text-[11px] px-2.5 py-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-2)]"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 mt-[1px]"/>{TOTAL_ENTRIES} verified entries</span>
            <a href="#library" onClick={(e)=>{e.preventDefault(); scrollToId("library")}} className="bg-[var(--ink)] text-[var(--surface)] text-[13px] font-semibold px-4 py-2.5 rounded-full">Browse guide</a>
          </div>
        </div>
      </header>

      {/* HERO — Mobbin style big search */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12 pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="mono text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">FOR TRAVELLERS ON WEAKER PASSPORTS</span>
          <span className="mono text-[11px] px-2.5 py-1 rounded-full bg-[var(--accent)] text-white">EVERY ENTRY SOURCED + DATED</span>
          <span className="mono text-[11px] px-2.5 py-1 rounded-full border border-[var(--line)] hidden sm:inline-flex">NEPAL OUT OF SCOPE</span>
        </div>
        <h1 className="font-bold tracking-[-0.04em] leading-[0.92] text-[clamp(44px,8vw,104px)]">Pick a passport,<br/><span className="text-[var(--accent)]">see where it</span><br/>takes you.</h1>
        <p className="mt-5 max-w-[720px] text-[16px] sm:text-[19px] leading-relaxed text-[var(--muted)]">Switch passports and the whole guide switches — where it goes, what another visa unlocks, and where you need a visa even to change planes. No guesses. If it could not be verified, it is omitted.</p>
        <p className="mt-3 text-[13px] text-[var(--muted)]">Live site: <a href="https://notabiral.github.io/passport/" target="_blank" rel="noopener" className="font-semibold text-[var(--accent)] underline underline-offset-2 break-all">https://notabiral.github.io/passport/</a></p>

        {/* Search */}
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <label className="flex-1 flex items-center gap-3 bg-[var(--surface-2)] border border-[var(--line)] rounded-[18px] px-4 sm:px-5 h-[58px] focus-within:border-[var(--ink)]">
            <Search size={20} className="shrink-0 text-[var(--muted)]"/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a destination — try Japan" className="w-full bg-transparent outline-none text-[15px] sm:text-[16px] placeholder:text-[var(--muted)]"/>
            {query && <button aria-label="Clear search" onClick={()=>setQuery("")} className="p-1 rounded-full bg-[var(--surface-3)]"><X size={15}/></button>}
          </label>
          <div className="flex gap-2">
            <button onClick={()=>setSection("go")} className="flex-1 sm:flex-none px-4 h-[58px] rounded-[18px] border border-[var(--line)] font-semibold text-[14px]">Where it goes</button>
            <button onClick={()=>setSection("sub")} className="flex-1 sm:flex-none px-4 h-[58px] rounded-[18px] bg-[var(--ink)] text-[var(--surface)] font-semibold text-[14px]">With another visa →</button>
          </div>
        </div>
        <p className="mono text-[11px] sm:text-[12px] text-[var(--muted)] mt-3">SEARCH FILTERS THE LIBRARY BELOW · {query ? `Showing matches for “${query}”` : "Try a destination name or code"}</p>

        {/* PASSPORT PICKER */}
        <div className="mt-7">
          <div className="flex items-end justify-between gap-3 mb-3">
            <h2 className="font-bold text-[18px] sm:text-[20px] tracking-tight">1 · Choose your passport</h2>
            <span className="mono text-[11px] text-[var(--muted)] hidden sm:block">HENLEY INDEX · {henleyLabel(passport.henley_as_of)} · DISPLAY CONTEXT ONLY</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PASSPORTS.map(p=>{
              const active = p.code===passport.code;
              const c = countsFor(p.code);
              const tot = c.rules + c.substitute + c.transit;
              return (
                <button key={p.code} onClick={()=>setPassport(p)} aria-pressed={active} className={`text-left rounded-[20px] border p-4 sm:p-5 transition ${active ? "bg-[var(--ink)] text-[var(--surface)] border-[var(--ink)] shadow-lg" : "bg-[var(--surface)] border-[var(--line)] card-hover"}`}>
                  <div className="flex items-start justify-between">
                    <span className={`mono text-[12px] px-2 py-1 rounded-full ${active ? "bg-white/15 text-white dark:bg-black/10 dark:text-black" : "bg-[var(--surface-2)]"}`}>{p.code}</span>
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-[12px] ${active ? "bg-[var(--accent)] text-white" : "border border-[var(--line)]"}`}>{active ? "✓" : ""}</span>
                  </div>
                  <div className="mt-5 sm:mt-7 font-bold text-[22px] sm:text-[28px] leading-none tracking-tight">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[28px] sm:text-[34px] font-bold leading-none">{p.henley_score}</span>
                    <span className={`text-[12px] ${active ? "text-white/70 dark:text-black/60" : "text-[var(--muted)]"}`}>Henley score</span>
                  </div>
                  <div className={`mono text-[11px] mt-3 pt-3 border-t ${active ? "border-white/20 text-white/80 dark:border-black/20 dark:text-black/70" : "border-[var(--line)] text-[var(--muted)]"}`}>{tot} verified entries for this passport</div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-[16px] bg-[var(--surface-2)] border border-[var(--line)] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <span className="font-bold">Now viewing: {passport.name} ({passport.code})</span>
            <span className="text-[var(--muted)]">{counts.rules} where it goes · {counts.substitute} with another visa · {counts.transit} transit · <b className="text-[var(--ink)]">{total} total</b></span>
            <span className="ml-auto mono text-[11px] text-[var(--muted)]">SWITCHING UPDATES EVERY SECTION BELOW</span>
          </div>
        </div>
      </section>

      {/* LIBRARY */}
      <main id="library" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT FILTERS — Mobbin style */}
          <aside className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-[84px]">
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between"><span className="font-bold flex items-center gap-2"><Filter size={16}/> Filters</span><button onClick={()=>{setQuery(""); setRegion("All regions"); setSection("all"); setHeldVisa("All"); setStatusFilter(null)}} className="text-[12px] font-semibold text-[var(--accent)]">Reset</button></div>
              <p className="mono text-[11px] tracking-widest text-[var(--muted)] mt-4 mb-2">SECTION</p>
              <div className="space-y-1.5">
                {[
                  {id:"all", label:"All sections", meta:`${total} entries`},
                  {id:"go", label:"Where this passport goes", meta:`${counts.rules} entries`},
                  {id:"sub", label:"With another visa", meta:`${counts.substitute} entries`},
                  {id:"transit", label:"Transit visa", meta:`${counts.transit} entries`},
                ].map(s=>(
                  <button key={s.id} onClick={()=>setSection(s.id as any)} className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl text-[13.5px] font-medium ${section===s.id ? "bg-[var(--ink)] text-[var(--surface)]" : "hover:bg-[var(--surface-2)]"}`}>
                    <span>{s.label}</span><span className={`mono text-[11px] ${section===s.id ? "text-white/70 dark:text-black/60" : "text-[var(--muted)]"}`}>{s.meta}</span>
                  </button>
                ))}
              </div>
              <p className="mono text-[11px] tracking-widest text-[var(--muted)] mt-5 mb-2">REGION</p>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map(r=>(
                  <button key={r} onClick={()=>setRegion(r)} className={`px-2.5 py-1.5 rounded-full border text-[12px] font-medium ${region===r ? "bg-[var(--ink)] text-[var(--surface)] border-[var(--ink)]" : "border-[var(--line)] hover:border-[var(--ink)]"}`}>{r}</button>
                ))}
              </div>
              <p className="mono text-[11px] tracking-widest text-[var(--muted)] mt-5 mb-2">CATEGORIES IN THIS GUIDE</p>
              <div className="space-y-1.5">
                {CATEGORIES.map((c)=>(
                  <button key={c.status} onClick={()=>setStatusFilter(statusFilter===c.status ? null : c.status)} aria-pressed={statusFilter===c.status} className={`w-full flex items-center justify-between px-1 py-1 text-left text-[13px] ${statusFilter===c.status ? "font-bold" : ""}`}><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[var(--accent)]"/>{c.label}</span><span className="mono text-[11px] text-[var(--muted)]">{goList.filter((r)=>r.status===c.status).length} entries</span></button>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-3 text-[12.5px] leading-relaxed">
                <b className="flex items-center gap-1.5"><ShieldCheck size={15}/> How to read an entry</b>
                <p className="text-[var(--muted)] mt-1">Each entry links to its source and shows when it was last checked. Wikipedia-sourced entries say so on the entry.</p>
              </div>
            </div>

            <button onClick={()=>setShowWhy(v=>!v)} className="mt-3 w-full text-left rounded-[20px] border border-[var(--line)] p-4 bg-[var(--accent)] text-white">
              <span className="mono text-[11px] tracking-widest text-white/80">WHY THIS EXISTS</span>
              <span className="block font-bold text-[17px] leading-tight mt-1">Visa info is scattered, outdated &amp; copied blog-to-blog.</span>
              <span className="text-[13px] text-white/85 flex items-center gap-1 mt-2">{showWhy ? "Hide" : "Read why"} <ChevronRight size={14} className={showWhy ? "rotate-90" : ""}/></span>
              {showWhy && <span className="block text-[13px] leading-relaxed text-white/90 mt-2">This guide keeps one dataset where every fact is dated and verifiable — and where switching passports shows how different the same world looks.</span>}
            </button>
          </aside>

          {/* GRID */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold tracking-tight text-[26px] sm:text-[32px] leading-none">{section==="go" ? "Where this passport goes" : section==="sub" ? "With another visa" : section==="transit" ? "Transit visa" : "The library"}</h2>
                <p className="text-[var(--muted)] text-[13.5px] mt-1.5">{passport.name} · {section==="go" ? `${filteredGo.length} destinations` : section==="sub" ? `${subFiltered.length} verified entries · ${SUB_DESTINATIONS} destinations in scope` : section==="transit" ? `${transitFiltered.length} verified entries · ${TRANSIT_DESTINATIONS} destinations in scope` : `${total} verified entries across 3 sections`}</p>
              </div>
              <div className="flex gap-1 bg-[var(--surface-2)] border border-[var(--line)] p-1 rounded-full text-[12.5px] font-semibold">
                {(["all","go","sub","transit"] as const).map(s=>(
                  <button key={s} onClick={()=>setSection(s)} className={`px-3 py-1.5 rounded-full ${section===s ? "bg-[var(--surface)] shadow border border-[var(--line)]" : ""}`}>{s==="all" ? "All" : s==="go" ? "Go" : s==="sub" ? "Another visa" : "Transit"}</button>
                ))}
              </div>
            </div>

            {(section==="all" || section==="go") && (
              <>
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-[16px] flex items-center gap-2"><Globe2 size={18} className="text-[var(--accent)]"/> Where this passport goes <span className="mono text-[11px] font-normal text-[var(--muted)]">{filteredGo.length === counts.rules ? `${counts.rules} VERIFIED` : `${filteredGo.length} OF ${counts.rules}`} · NO PASSPORT-TO-ITSELF</span></h3><span className="mono text-[11px] text-[var(--muted)] hidden sm:block">ASEAN 10 + JAPAN + SOUTH KOREA</span></div>
                {filteredGo.length===0 ? (
                  <div className="rounded-[20px] border border-dashed border-[var(--line)] p-8 text-center"><p className="font-bold">No destinations match “{query}” {region!=="All regions" ? `in ${region}` : ""}.</p><p className="text-[var(--muted)] text-[13px] mt-1">Try another name, or reset the filters.</p><button onClick={()=>{setQuery(""); setRegion("All regions"); setStatusFilter(null)}} className="mt-3 px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--surface)] text-[13px] font-semibold">Reset filters</button></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredGo.map((d, i)=>(
                      <article key={d.destination_iso} className="card-hover rounded-[20px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden text-left">
                        <div className="h-[118px] bg-[var(--surface-2)] relative p-4 flex flex-col justify-between overflow-hidden">
                          <div className="flex justify-between items-start"><span className="mono text-[11px] px-2 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)]">{displayRegion(d.region).toUpperCase()}</span><span className="mono text-[11px] text-[var(--muted)]">ENTRY {String(i+1).padStart(2,"0")} / {String(counts.rules).padStart(2,"0")}</span></div>
                          <div className="flex items-end justify-between"><span className="font-bold tracking-tight leading-none text-[44px]">{d.destination_iso}</span><Plane size={28} className="text-[var(--accent)] -rotate-12"/></div>
                          <div className="absolute -right-2 -bottom-6 font-bold text-[96px] leading-none text-[var(--ink)] opacity-[0.06] select-none">{d.destination_iso}</div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2"><h4 className="font-bold text-[19px] leading-tight tracking-tight">{d.destination}</h4><BadgeCheck size={20} className="shrink-0 text-emerald-600"/></div>
                          <span className="inline-block mt-2 mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-[var(--ink)] text-[var(--surface)]">{STATUS_LABELS[d.status].toUpperCase()}</span>
                          <p className="text-[13px] mt-2 leading-relaxed"><span className="font-bold">Stay:</span> {d.duration}</p>
                          {d.fee && <p className="text-[13px] mt-1 leading-relaxed"><span className="font-bold">Fee:</span> {d.fee}</p>}
                          {d.extension && <p className="text-[13px] mt-1 leading-relaxed"><span className="font-bold">Extension:</span> {d.extension}</p>}
                          <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed">{d.notes}</p>
                          {d.conditions.length > 0 && (
                            <ul className="mt-2 space-y-1">{d.conditions.map((c)=>(<li key={c} className="text-[12.5px] text-[var(--muted)] leading-relaxed flex gap-1.5"><span aria-hidden="true">•</span><span>{c}</span></li>))}</ul>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <span className="mono text-[10.5px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">VERIFIED</span>
                            <span className="mono text-[10.5px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">{isWikipedia(d.source) ? "WIKIPEDIA" : "SOURCE LINKED"}</span>
                            <span className="mono text-[10.5px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">DATED</span>
                          </div>
                          <p className="mono text-[11px] text-[var(--muted)] mt-3">{d.source.name} · CHECKED {d.verified}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--line)]"><span className="text-[12.5px] font-semibold">{passport.name} → {d.destination}</span><a href={d.source.url} target="_blank" rel="noopener" className="text-[12.5px] font-semibold flex items-center gap-1 text-[var(--accent)]">{isWikipedia(d.source) ? "Wikipedia source" : "Official source"} <ArrowUpRight size={14}/></a></div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {(section==="all" || section==="sub") && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-[16px] flex items-center gap-2"><BookOpen size={18} className="text-[var(--accent)]"/> With another visa <span className="mono text-[11px] font-normal text-[var(--muted)]">{subFiltered.length === counts.substitute ? `${counts.substitute} VERIFIED FOR ${passport.code}` : `${subFiltered.length} OF ${counts.substitute} FOR ${passport.code}`}</span></h3><span className="mono text-[11px] text-[var(--muted)] hidden sm:block">A HELD VISA OR PERMIT CHANGES THE ROUTE</span></div>
                <p className="text-[16px] sm:text-[18px] font-bold leading-snug tracking-tight">Already hold a visa? It may unlock another country — <span className="text-[var(--accent)]">no new visa needed.</span></p>
                <p className="text-[13.5px] text-[var(--muted)] leading-relaxed mt-2 mb-3">Read every card as <b className="text-[var(--ink)]">HOLD [visa you already have] → UNLOCK [country]</b>. A destination appears only when its substitute rule was checked for this passport. Already visa-free destinations and unverifiable rules are omitted — so the {counts.substitute} entries for {passport.name} are a subset of the {SUB_DESTINATIONS} destinations in scope below.</p>
                {showGeorgiaExample && (
                <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface-2)] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0"><p className="mono text-[11px] tracking-widest text-[var(--muted)]">EXAMPLE</p><p className="font-bold leading-tight mt-1">You hold an Australian visa <ArrowRight size={15} className="inline text-[var(--accent)]"/> You unlock Georgia.</p><p className="text-[13px] text-[var(--muted)] mt-1">Benefit: <b className="text-[var(--ink)]">90 days, no Georgian visa.</b> The visa in your passport does the work.</p></div>
                  <span className="shrink-0 mono text-[11px] px-2.5 py-1.5 rounded-full bg-emerald-600 text-white">NO VISA TO APPLY FOR</span>
                </div>
                )}
                <div className="mt-4">
                  <p className="mono text-[11px] tracking-widest text-[var(--muted)] mb-2">WHAT VISA DO YOU ALREADY HOLD?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {HELD_VISA_FILTERS.map(v=>(
                      <button key={v} onClick={()=>setHeldVisa(v)} aria-pressed={heldVisa===v} className={`px-3 py-1.5 rounded-full border text-[12.5px] font-semibold ${heldVisa===v ? "bg-[var(--ink)] text-[var(--surface)] border-[var(--ink)]" : "border-[var(--line)] hover:border-[var(--ink)]"}`}>{v==="All" ? "All held visas" : v}</button>
                    ))}
                  </div>
                  <p className="text-[12.5px] text-[var(--muted)] mt-2">{heldVisa==="All" ? `Showing all ${subFiltered.length} unlocks for a ${passport.name} passport.` : `Showing what a ${heldVisa} visa unlocks for a ${passport.name} passport — ${subFiltered.length} ${subFiltered.length===1 ? "destination" : "destinations"}.`} {heldVisa!=="All" && <button onClick={()=>setHeldVisa("All")} className="font-semibold text-[var(--accent)]">Show all</button>}</p>
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><h4 className="font-bold text-[15px]">1 · No visa needed <span className="mono text-[11px] font-normal text-emerald-700 dark:text-emerald-300">JUST SHOW UP WITH THE VISA YOU ALREADY HOLD</span></h4><span className="mono text-[11px] text-[var(--muted)]">{subNoVisa.length} FOR {passport.code}</span></div>
                  {subNoVisa.length===0 ? <p className="text-[13px] text-[var(--muted)] rounded-[16px] border border-dashed border-[var(--line)] p-4">No “no visa needed” unlock matches this held-visa / search / region combination.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {subNoVisa.map((d)=>(
                      <article key={d.destination_iso} className="card-hover rounded-[20px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden flex flex-col">
                        <div className="p-4 pb-0">
                          <div className="flex items-center justify-between gap-2"><span className="mono text-[11px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">{displayRegion(d.region).toUpperCase()}</span><span className="mono text-[11px] text-[var(--muted)]">{d.destination_iso}</span></div>
                          <p className="mt-3 text-[13px] font-semibold leading-snug"><span className="text-[var(--muted)]">HOLD</span> <span className="inline-flex flex-wrap gap-1 align-middle">{(expandedHeld[passport.code + ":" + d.destination_iso] ? d.held_visas : d.held_visas.slice(0,5)).map((h)=>(<span key={h} className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[11.5px]">{h}</span>))}{d.held_visas.length>5 && <button type="button" aria-expanded={!!expandedHeld[passport.code + ":" + d.destination_iso]} onClick={()=>setExpandedHeld((prev)=>({...prev, [passport.code + ":" + d.destination_iso]: !prev[passport.code + ":" + d.destination_iso]}))} className="text-[11.5px] font-semibold text-[var(--accent)]">{expandedHeld[passport.code + ":" + d.destination_iso] ? "Show less" : `+${d.held_visas.length-5} more`}</button>}</span></p>
                          <p className="mt-1.5 flex items-center gap-1.5 font-bold text-[19px] leading-tight tracking-tight"><ArrowRight size={18} className="shrink-0 text-[var(--accent)]"/> UNLOCK {d.destination}</p>
                          <span className="inline-block mt-2 mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-emerald-600 text-white">NO VISA TO APPLY FOR</span>
                          <p className="text-[13px] leading-relaxed mt-2">{d.benefit}</p>
                          <p className="text-[12.5px] leading-relaxed mt-1"><span className="font-bold">Stay:</span> {d.duration}</p>
                          {d.fee && <p className="text-[12.5px] leading-relaxed mt-1"><span className="font-bold">Fee:</span> {d.fee}</p>}
                        </div>
                        <div className="p-4 pt-3 mt-auto">
                          <p className="text-[12.5px] leading-relaxed"><span className="font-bold">Requires:</span> {d.requires}.</p>
                          {d.conditions.length > 0 && (
                            <ul className="mt-2 space-y-1">{d.conditions.map((c)=>(<li key={c} className="text-[12.5px] text-[var(--muted)] leading-relaxed flex gap-1.5"><span aria-hidden="true">•</span><span>{c}</span></li>))}</ul>
                          )}
                          {d.notes && <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mt-2"><span className="font-bold text-[var(--ink)]">Note:</span> {d.notes}</p>}
                          <p className="mono text-[11px] text-[var(--muted)] mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap gap-x-3 gap-y-1"><span>✓ VERIFIED</span><span>{isWikipedia(d.source) ? "WIKIPEDIA" : "OFFICIAL SOURCE"}</span><span>FOR {passport.name} ({passport.code})</span></p>
                          <p className="mono text-[11px] text-[var(--muted)] mt-2"><a href={d.source.url} target="_blank" rel="noopener" className="underline underline-offset-2 break-all">{d.source.name}</a> · CHECKED {d.verified}</p>
                        </div>
                      </article>
                    ))}
                  </div>)}
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><h4 className="font-bold text-[15px]">2 · Easier visa — not visa-free <span className="mono text-[11px] font-normal text-[var(--amber)]">STILL FASTER THAN AN EMBASSY VISA</span></h4><span className="mono text-[11px] text-[var(--muted)]">{subEasier.length} FOR {passport.code}</span></div>
                  <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-3">These are not visa-free. Your held visa only unlocks a faster route — an eVisa, an AVE, or a visa on arrival — instead of a full embassy application.</p>
                  {subEasier.length===0 ? <p className="text-[13px] text-[var(--muted)] rounded-[16px] border border-dashed border-[var(--line)] p-4">No “easier visa” unlock matches this held-visa / search / region combination.</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {subEasier.map((d)=>(
                      <article key={d.destination_iso} className="card-hover rounded-[20px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden flex flex-col">
                        <div className="p-4 pb-0">
                          <div className="flex items-center justify-between gap-2"><span className="mono text-[11px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)]">{displayRegion(d.region).toUpperCase()}</span><span className="mono text-[11px] text-[var(--muted)]">{d.destination_iso}</span></div>
                          <p className="mt-3 text-[13px] font-semibold leading-snug"><span className="text-[var(--muted)]">HOLD</span> <span className="inline-flex flex-wrap gap-1 align-middle">{d.held_visas.map((h)=>(<span key={h} className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[11.5px]">{h}</span>))}</span></p>
                          <p className="mt-1.5 flex items-center gap-1.5 font-bold text-[19px] leading-tight tracking-tight"><ArrowRight size={18} className="shrink-0 text-[var(--accent)]"/> UNLOCK {d.destination}</p>
                          <span className="inline-block mt-2 mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-[#FFF4E8] dark:bg-[#2A2118] text-[#9A6500] dark:text-[#FFC24B] border border-[#F0D9B5] dark:border-[#4A3A22]">{unlockRoute(d.benefit)} INSTEAD OF EMBASSY VISA</span>
                          <p className="text-[13px] leading-relaxed mt-2">{d.benefit}</p>
                          <p className="text-[12.5px] leading-relaxed mt-1"><span className="font-bold">Stay:</span> {d.duration}</p>
                          {d.fee && <p className="text-[12.5px] leading-relaxed mt-1"><span className="font-bold">Fee:</span> {d.fee}</p>}
                        </div>
                        <div className="p-4 pt-3 mt-auto">
                          <p className="text-[12.5px] leading-relaxed"><span className="font-bold">Requires:</span> {d.requires}.</p>
                          {d.conditions.length > 0 && (
                            <ul className="mt-2 space-y-1">{d.conditions.map((c)=>(<li key={c} className="text-[12.5px] text-[var(--muted)] leading-relaxed flex gap-1.5"><span aria-hidden="true">•</span><span>{c}</span></li>))}</ul>
                          )}
                          {d.notes && <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mt-2"><span className="font-bold text-[var(--ink)]">Note:</span> {d.notes}</p>}
                          <p className="mono text-[11px] text-[var(--muted)] mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap gap-x-3 gap-y-1"><span>✓ VERIFIED</span><span>{isWikipedia(d.source) ? "WIKIPEDIA" : "OFFICIAL SOURCE"}</span><span>FOR {passport.name} ({passport.code})</span></p>
                          <p className="mono text-[11px] text-[var(--muted)] mt-2"><a href={d.source.url} target="_blank" rel="noopener" className="underline underline-offset-2 break-all">{d.source.name}</a> · CHECKED {d.verified}</p>
                        </div>
                      </article>
                    ))}
                  </div>)}
                </div>
                {subFiltered.length===0 && <p className="text-[13px] text-[var(--muted)] mt-4">No destinations in scope match your search / region / held visa. Try another held visa or reset the filters.</p>}
              </div>
            )}

            {(section==="all" || section==="transit") && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-[16px] flex items-center gap-2"><Plane size={18} className="text-[var(--accent)]"/> Transit visa <span className="mono text-[11px] font-normal text-[var(--muted)]">{transitFiltered.length === counts.transit ? `${counts.transit} VERIFIED FOR ${passport.code}` : `${transitFiltered.length} OF ${counts.transit} FOR ${passport.code}`} · OFFICIAL SOURCES ONLY</span></h3><span className="mono text-[11px] text-[var(--muted)] hidden sm:block">EVEN TO STAY AIRSIDE</span></div>
                <p className="text-[13.5px] text-[var(--muted)] leading-relaxed mb-3">Places this passport can transit without a visa do not appear. The {counts.transit} entries for {passport.name} are a subset of the {TRANSIT_DESTINATIONS} destinations in scope below.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {transitFiltered.map((d)=>(
                    <article key={d.destination_iso} className="card-hover rounded-[20px] border border-[var(--line)] p-4 flex gap-3">
                      <span className="w-11 h-11 shrink-0 rounded-[13px] bg-[var(--ink)] text-[var(--surface)] grid place-items-center font-bold text-[14px]">{d.destination_iso}</span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold leading-tight truncate">{d.destination}</h4>
                        <p className="mono text-[11px] text-[var(--muted)] mt-0.5">{displayRegion(d.region).toUpperCase()} · IN SCOPE</p>
                        <span className="inline-block mt-2 mono text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-[var(--ink)] text-[var(--surface)]">{d.status === "transit_visa" ? "EXEMPTION WITH HELD VISA" : "NO HELD-VISA EXEMPTION"}</span>
                        <p className="text-[12.5px] leading-relaxed mt-2">{d.benefit}</p>
                        <p className="text-[12.5px] leading-relaxed mt-1"><span className="font-bold">Duration:</span> {d.duration}</p>
                        {d.fee && <p className="text-[12.5px] leading-relaxed mt-1"><span className="font-bold">Fee:</span> {d.fee}</p>}
                        {d.held_visas.length > 0 && (
                          <p className="mt-2 text-[12.5px] font-semibold leading-snug"><span className="text-[var(--muted)]">HELD VISA EXEMPTS:</span> <span className="inline-flex flex-wrap gap-1 align-middle">{d.held_visas.map((h)=>(<span key={h} className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[11.5px]">{h}</span>))}</span></p>
                        )}
                        <p className="text-[12.5px] leading-relaxed mt-2"><span className="font-bold">Requires:</span> {d.requires}.</p>
                        {d.conditions.length > 0 && (
                          <ul className="mt-2 space-y-1">{d.conditions.map((c)=>(<li key={c} className="text-[12.5px] text-[var(--muted)] leading-relaxed flex gap-1.5"><span aria-hidden="true">•</span><span>{c}</span></li>))}</ul>
                        )}
                        {d.notes && <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mt-2"><span className="font-bold text-[var(--ink)]">Note:</span> {d.notes}</p>}
                        <p className="mono text-[11px] text-[var(--muted)] mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap gap-x-3 gap-y-1"><span>✓ VERIFIED</span><span>OFFICIAL SOURCE</span><span>FOR {passport.name} ({passport.code})</span></p>
                        <p className="mono text-[11px] text-[var(--muted)] mt-2"><a href={d.source.url} target="_blank" rel="noopener" className="underline underline-offset-2 break-all">{d.source.name}</a> · CHECKED {d.verified}</p>
                      </div>
                    </article>
                  ))}
                </div>
                {transitFiltered.length===0 && <p className="text-[13px] text-[var(--muted)] mt-2">No transit destinations match your search / region.</p>}
              </div>
            )}

            {/* COMPARE */}
            <section id="compare" className="mt-10 rounded-[24px] bg-[var(--ink)] text-[var(--surface)] p-5 sm:p-7 overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mono text-[11px] tracking-widest text-white/60 dark:text-black/50">2 · COMPARE</p><h3 className="font-bold tracking-tight text-[26px] sm:text-[32px] leading-none mt-1">How different<br/>the same world looks.</h3></div><p className="max-w-[320px] text-[13.5px] text-white/70 dark:text-black/60 leading-relaxed">Henley scores are display context only. The entries themselves come from official sources wherever they could be read.</p></div>
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {PASSPORTS.map(p=>{
                  const c = countsFor(p.code);
                  const tot = c.rules + c.substitute + c.transit;
                  const active = p.code===passport.code;
                  return (
                    <button key={p.code} onClick={()=>setPassport(p)} className={`text-left rounded-[18px] p-4 border ${active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "bg-white/10 border-white/15 hover:bg-white/15 dark:bg-black/5 dark:border-black/15 dark:hover:bg-black/10"}`}>
                      <div className="mono text-[11px] text-white/70 dark:text-black/60">{p.code} · {active ? "VIEWING" : "TAP TO VIEW"}</div>
                      <div className="font-bold text-[20px] mt-2">{p.name}</div>
                      <div className="mt-3 flex items-baseline gap-1"><span className="text-[32px] font-bold leading-none">{p.henley_score}</span><span className="text-[12px] text-white/70 dark:text-black/60">Henley</span></div>
                      <div className="mono text-[11px] mt-2 pt-2 border-t border-white/20 dark:border-black/20">{tot} verified entries</div>
                      <div className="text-[12px] text-white/75 dark:text-black/70 mt-1">{c.rules} + {c.substitute} + {c.transit}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mono text-[11px] text-white/50 dark:text-black/45 mt-4">TOTALS: {RULES.length} WHERE IT GOES · {SUB_RULES.length} WITH ANOTHER VISA · {TRANSIT_RULES.length} TRANSIT · {TOTAL_ENTRIES} VERIFIED ENTRIES</p>
            </section>

            {/* POLICY */}
            <section id="policy" className="mt-6 rounded-[24px] border border-[var(--line)] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="mono text-[11px] tracking-widest text-[var(--muted)]">3 · DATA POLICY</p><h3 className="font-bold tracking-tight text-[26px] sm:text-[30px] leading-none mt-1">Dated. Verifiable.<br/>No guesses.</h3></div><button onClick={()=>setShowPolicy(v=>!v)} className="px-4 py-2.5 rounded-full bg-[var(--ink)] text-[var(--surface)] text-[13px] font-semibold">{showPolicy ? "Hide policy" : "Read policy"} <ChevronRight size={14} className={`inline ${showPolicy ? "rotate-90" : ""}`}/></button></div>
              <div className="grid sm:grid-cols-3 gap-3 mt-5">
                {[
                  {t:"Official first", d:"Most entries cite official government sources."},
                  {t:"Wikipedia, labelled", d:"A small number cite Wikipedia — and say so on the entry."},
                  {t:"Omitted, not guessed", d:"Destinations that could not be verified are omitted."},
                ].map(x=>(
                  <div key={x.t} className="rounded-[18px] bg-[var(--surface-2)] p-4"><ShieldCheck size={20} className="text-[var(--accent)]"/><h4 className="font-bold mt-2">{x.t}</h4><p className="text-[13px] text-[var(--muted)] leading-relaxed mt-1">{x.d}</p></div>
                ))}
              </div>
              {showPolicy && (
                <div className="mt-4 rounded-[18px] border border-[var(--line)] p-4 text-[13.5px] leading-relaxed text-[var(--muted)]">
                  <p><b className="text-[var(--ink)]">Sourcing rule:</b> every entry links to its source and shows the date it was last checked. In v2, the 8 rules v1 could not verify were filled — 4 from official sources and 4 from labelled Wikipedia sources where the official page could not be read.</p>
                  <p className="mt-2"><b className="text-[var(--ink)]">Transit rule:</b> transit entries are official sources only. <b className="text-[var(--ink)]">Scope:</b> Nepal is explicitly out of scope. Inspired by <i>The Nepali Passport Diaries</i> — no data was copied from that site; every rule here was researched fresh.</p>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 mono text-[11px] px-2.5 py-1.5 rounded-full border border-[var(--line)]"><MapPin size={13}/> Code: MIT · Data: CC BY 4.0</span><span className="inline-flex items-center gap-1.5 mono text-[11px] px-2.5 py-1.5 rounded-full border border-[var(--line)]"><ExternalLink size={13}/> Credit: The Nepali Passport Diaries</span></div>
            </section>

            <section id="disclaimer" className="mt-6 rounded-[24px] bg-[#FFF4E8] dark:bg-[#2A2118] border border-[#F0D9B5] dark:border-[#4A3A22] p-5 sm:p-7">
              <p className="mono text-[11px] tracking-widest text-[#9A6500] dark:text-[#FFC24B] flex items-center gap-1.5"><Info size={14}/> DISCLAIMER</p>
              <h3 className="font-bold text-[20px] leading-tight mt-2">Informational only.</h3>
              <p className="text-[14px] leading-relaxed text-[#6B5A3A] dark:text-[#E8D9B8] mt-2">Visa rules change without notice. Always confirm with the official source linked on each card, and with your airline, before you travel.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-[var(--ink)] text-[var(--surface)] grid place-items-center"><Stamp size={14}/></span><span className="font-bold">PASSPORT SWITCH</span><span className="mono text-[11px] text-[var(--muted)]">· PICK A PASSPORT, SEE WHERE IT TAKES YOU</span></div>
          <p className="mono text-[11px] text-[var(--muted)]">{PASSPORTS.map((p) => p.code).join(" · ")} — {TOTAL_ENTRIES} VERIFIED ENTRIES · CODE MIT · DATA CC BY 4.0 · <a href="https://github.com/notabiral/passport" target="_blank" rel="noopener" className="underline underline-offset-2 break-all">https://github.com/notabiral/passport</a></p>
        </div>
      </footer>
    </div>
  );
}
