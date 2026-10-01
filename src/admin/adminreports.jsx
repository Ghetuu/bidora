import "../styles/adminreports.css";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import axios from "axios";

import {
  FaBullseye,
  FaFilter,
  FaGavel,
  FaClock,
  FaRupeeSign,
  FaPercent,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaChevronDown,
  FaUsers,
  FaSyncAlt,
  FaUserPlus,
  FaStar,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaFileAlt,
  FaDownload,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaUser,
  FaCheck,
} from "react-icons/fa";


/* =========================================================
   CONFIG
========================================================= */

const API_URL = "http://127.0.0.1:8000";

const PERIODS = ["Last 4 Months", "This Month", "Last 7 Days", "Last 30 Days", "This Year", "Custom"];
const DEFAULT_PERIOD = "Last 4 Months";

const PALETTE = ["#7c4dff", "#4f8cff", "#19c3c0", "#22c58b", "#f2b04c", "#f0607a"];
const BAR_COLORS = ["#a78bfa", "#6d8bff", "#5b6cf2", "#7c5cf5"];


/* =========================================================
   HELPERS
========================================================= */

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const rangeFor = (period) => {
  const today = new Date();
  const to = toISO(today);

  if (period === "Last 7 Days") {
    const d = new Date(today); d.setDate(d.getDate() - 6);
    return { from: toISO(d), to };
  }
  if (period === "Last 30 Days") {
    const d = new Date(today); d.setDate(d.getDate() - 29);
    return { from: toISO(d), to };
  }
  if (period === "This Year") {
    return { from: `${today.getFullYear()}-01-01`, to };
  }
  if (period === "Last 4 Months") {
  // 1st day of the month, 3 months ago -> today (= 4 calendar months)
  return { from: toISO(new Date(today.getFullYear(), today.getMonth() - 3, 1)), to };
}
  return { from: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), to };
};

const rupees = (n) =>
  n === null || n === undefined ? "—" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const compact = (n) => {
  n = Number(n || 0);
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2).replace(/\.?0+$/, "") + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2).replace(/\.?0+$/, "") + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + n;
};

const errorMessage = (err) =>
  err.response?.data?.detail ||
  "Unable to load reports. Make sure the backend is running.";

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? `${API_URL}${path}` : `${API_URL}/${path}`;
};

const smoothPath = (pts, minY = -Infinity, maxY = Infinity) => {
  const clamp = (v) => Math.min(Math.max(v, minY), maxY);
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* "nice" axis so any data range looks good */
const niceAxis = (max, parts = 4) => {
  const top = Math.max(parts, Math.ceil((max || 1) / parts) * parts);
  return { yMax: top, yStep: top / parts };
};


/* =========================================================
   CUSTOM DROPDOWN
========================================================= */

function Dropdown({ value, options, onChange, icon: Icon, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={`ar-dd ${open ? "open" : ""} ${className}`} ref={ref}>
      <button
        type="button"
        className="ar-dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {Icon && <Icon className="ar-dd-icon" />}
        <span className="ar-dd-value">{value}</span>
        <FaChevronDown className="ar-dd-caret" />
      </button>

      {open && (
        <ul className="ar-dd-menu" role="listbox">
          {options.map((o) => {
            const selected = o === value;
            return (
              <li key={o}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? "selected" : ""}
                  onClick={() => { onChange(o); setOpen(false); }}
                >
                  <span>{o}</span>
                  {selected && <FaCheck />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


/* =========================================================
   EXPORT MENU (own open/close state, used in header + download card)
========================================================= */

function ExportMenu({ onExport, disabled, variant = "outline", block = false, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const pick = (type) => {
    setOpen(false);
    // let the menu close before the print dialog / download starts
    setTimeout(() => onExport(type), 50);
  };

  return (
    <div className={`ar-export ${open ? "open" : ""} ${block ? "block" : ""}`} ref={ref}>
      <button
        type="button"
        className={`ar-btn-${variant} ${block ? "block" : ""}`}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        {children}
      </button>

      {open && (
        <div className="ar-export-menu">
          <button type="button" onClick={() => pick("pdf")}><FaFilePdf /> PDF</button>
          <button type="button" onClick={() => pick("excel")}><FaFileExcel /> Excel</button>
          <button type="button" onClick={() => pick("csv")}><FaFileCsv /> CSV</button>
        </div>
      )}
    </div>
  );
}


/* =========================================================
   CHART COMPONENTS (pure SVG, no libraries)
========================================================= */

function LineChart({ series, labels, yMin = 0, yMax = 100, yStep = 20, suffix = "%", height = 190, colorA = "#7c4dff", colorB = "#a78bfa" }) {
  const W = 480, H = height, L = 46, R = 30, T = 12, B = 30;
  const plotW = W - L - R, plotH = H - T - B;
  const gradId = "g" + useId().replace(/:/g, "");

  const ticks = [];
  for (let v = yMin; v <= yMax; v += yStep) ticks.push(v);

  const toPts = (arr) =>
    arr.map((v, i) => ({
      x: L + (plotW * i) / Math.max(arr.length - 1, 1),
      y: T + plotH - ((v - yMin) / (yMax - yMin)) * plotH,
    }));

  const lines = series.map((s, idx) => ({ pts: toPts(s.data), color: idx === 0 ? colorA : colorB }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ar-svg" role="img">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorA} stopOpacity="0.22" />
          <stop offset="100%" stopColor={colorA} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t) => {
        const y = T + plotH - ((t - yMin) / (yMax - yMin)) * plotH;
        return (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y} y2={y} className="ar-grid" />
            <text x={L - 8} y={y + 4} textAnchor="end" className="ar-axis">{t}{suffix}</text>
          </g>
        );
      })}

      {labels.map((lb, i) => (
        <text key={i} x={L + (plotW * i) / Math.max(labels.length - 1, 1)} y={H - 8} textAnchor="middle" className="ar-axis">{lb}</text>
      ))}

      {lines.map((ln, idx) => {
        const path = smoothPath(ln.pts, T, T + plotH);
        const last = ln.pts[ln.pts.length - 1];
        const first = ln.pts[0];
        return (
          <g key={idx}>
            {idx === 0 && (
              <path d={`${path} L ${last.x} ${T + plotH} L ${first.x} ${T + plotH} Z`} fill={`url(#${gradId})`} />
            )}
            <path d={path} fill="none" stroke={ln.color} strokeWidth="2.2" strokeLinecap="round" />
            {ln.pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3.6" fill="#fff" stroke={ln.color} strokeWidth="2" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function FunnelChart({ data }) {
  const W = 130, rowH = 30, gap = 3;
  const max = Math.max(...data.map((d) => d.value), 0);
  const widthOf = (v) => 44 + (W - 44) * (max ? v / max : 1);
  const H = data.length * (rowH + gap);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ar-funnel-svg" style={{ height: H }} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const wTop = widthOf(d.value);
        const wBot = widthOf((data[i + 1] || d).value);
        const y = i * (rowH + gap);
        const cx = W / 2;
        const pts = `${cx - wTop / 2},${y} ${cx + wTop / 2},${y} ${cx + wBot / 2},${y + rowH} ${cx - wBot / 2},${y + rowH}`;
        return <polygon key={d.label} points={pts} fill={d.color} />;
      })}
    </svg>
  );
}

function BarChart({ data, height = 210 }) {
  const W = 340, H = height, L = 40, R = 10, T = 20, B = 28;
  const plotW = W - L - R, plotH = H - T - B;
  const { yMax, yStep } = niceAxis(Math.max(...data.map((d) => d.value), 0));
  const slot = plotW / data.length;
  const barW = slot * 0.5;
  const ticks = [];
  for (let v = 0; v <= yMax; v += yStep) ticks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ar-svg" role="img">
      {ticks.map((t) => {
        const y = T + plotH - (t / yMax) * plotH;
        return (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y} y2={y} className="ar-grid" />
            <text x={L - 8} y={y + 4} textAnchor="end" className="ar-axis">{Math.round(t)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / yMax) * plotH;
        const x = L + slot * i + (slot - barW) / 2;
        const y = T + plotH - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={d.color} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="ar-bar-value">{d.value}</text>
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="ar-axis">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

function AdminReports() {

  /* ---------- DATA ---------- */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- FILTERS ---------- */
  const initial = rangeFor(DEFAULT_PERIOD);
const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);

  /* ---------- UI STATE ---------- */
  const [trendMetric, setTrendMetric] = useState("Success Rate");
  const [categoryTableMode, setCategoryTableMode] = useState("Auctions");
  const [sellerCategory, setSellerCategory] = useState("All Categories");
  const [sellerSort, setSellerSort] = useState("Revenue");
  const [activityTab, setActivityTab] = useState("Buyers");

  const [search, setSearch] = useState("");
  const [tableCategory, setTableCategory] = useState("All");
  const [tableStatus, setTableStatus] = useState("All");


  /* =====================================================
     LOAD REPORT FROM BACKEND
     GET /admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
  ===================================================== */

  const fetchReports = useCallback(async (from, to) => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/admin/reports`, {
        params: { from, to },
      });

      setData(response.data);
      setSellerCategory("All Categories");
      setTableCategory("All");
      setTableStatus("All");
    } catch (err) {
      console.error("Reports error:", err);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // first load (This Month)
  useEffect(() => {
  let cancelled = false;
  const r = rangeFor(DEFAULT_PERIOD);

    axios
      .get(`${API_URL}/admin/reports`, { params: { from: r.from, to: r.to } })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => {
        console.error("Reports error:", err);
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value !== "Custom") {
      const r = rangeFor(value);
      setFromDate(r.from);
      setToDate(r.to);
      fetchReports(r.from, r.to);
    }
  };

  const handleApply = () => {
    if (!fromDate || !toDate) return;
    if (fromDate > toDate) {
      setError("'From' date must not be after 'To' date.");
      return;
    }
    fetchReports(fromDate, toDate);
  };


  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const sellers = useMemo(() => {
    if (!data) return [];
    const list = [...(data.sellers[sellerCategory] || [])];
    if (sellerSort === "Revenue") list.sort((a, b) => b.revenue - a.revenue);
    else if (sellerSort === "Auctions") list.sort((a, b) => b.auctions - a.auctions);
    else list.sort((a, b) => b.success_rate - a.success_rate);
    return list;
  }, [data, sellerCategory, sellerSort]);

  const categories = useMemo(() => {
    if (!data) return [];
    const list = data.categories.map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length] }));
    if (categoryTableMode === "Avg Bids") list.sort((a, b) => b.avg_bids - a.avg_bids);
    else if (categoryTableMode === "Success") list.sort((a, b) => b.success_rate - a.success_rate);
    else list.sort((a, b) => b.auctions - a.auctions);
    return list;
  }, [data, categoryTableMode]);

  const tableRows = useMemo(() => (data ? data.table : []), [data]);

  const tableCategories = useMemo(
    () => ["All", ...new Set(tableRows.map((r) => r.category))],
    [tableRows]
  );

  const filteredReport = tableRows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(q) ||
      r.seller.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q);
    const matchesCat = tableCategory === "All" || r.category === tableCategory;
    const matchesStatus = tableStatus === "All" || r.status === tableStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });


  /* =====================================================
     EXPORT
  ===================================================== */

  const handleExport = (type) => {
    const head = ["Auction", "Category", "Seller", "Starting Price", "No. of Bids", "Highest Bid", "Final Price", "Price Increase %", "Duration", "Status"];
    const rows = filteredReport.map((r) => [
      r.name, r.category, r.seller, r.start_price, r.bids,
      r.highest_bid ?? "", r.final_price ?? "",
      r.increase_pct !== null ? `${r.increase_pct}%` : "",
      r.duration, r.status,
    ]);
    const stamp = new Date().toISOString().slice(0, 10);

    if (type === "csv") {
      const csv = [head, ...rows]
        .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      downloadFile("\ufeff" + csv, `bidora-report-${stamp}.csv`, "text/csv;charset=utf-8;");
    } else if (type === "excel") {
      const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const html =
        "<table><tr>" + head.map((h) => `<th>${esc(h)}</th>`).join("") + "</tr>" +
        rows.map((r) => "<tr>" + r.map((c) => `<td>${esc(c)}</td>`).join("") + "</tr>").join("") +
        "</table>";
      downloadFile(html, `bidora-report-${stamp}.xls`, "application/vnd.ms-excel");
    } else {
      window.print(); // choose "Save as PDF" in the print dialog
    }
  };


  /* =====================================================
     KPI CARDS
  ===================================================== */

  const kpiCards = data ? [
    { label: "Auction Success Rate", value: `${data.kpis.success_rate.value}%`, change: data.kpis.success_rate.change, icon: FaBullseye, color: "green" },
    { label: "Conversion Rate", value: `${data.kpis.conversion_rate.value}%`, change: data.kpis.conversion_rate.change, icon: FaFilter, color: "blue" },
    { label: "Avg. Bids / Auction", value: data.kpis.avg_bids.value, change: data.kpis.avg_bids.change, icon: FaGavel, color: "orange" },
    { label: "Avg. Auction Duration", value: data.kpis.avg_duration.value, change: data.kpis.avg_duration.change, icon: FaClock, color: "purple" },
    { label: "Avg. Final Price", value: rupees(data.kpis.avg_final_price.value), change: data.kpis.avg_final_price.change, icon: FaRupeeSign, color: "green" },
    { label: "Price Increase %", value: `${data.kpis.price_increase.value}%`, change: data.kpis.price_increase.change, icon: FaPercent, color: "pink" },
  ] : [];

  const changeBadge = (change) => {
    if (change === null || change === undefined) {
      return <p className="ar-flat">No previous data</p>;
    }
    const up = change >= 0;
    return (
      <p className={up ? "ar-up" : "ar-down"}>
        {up ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(change)}% <em>vs last period</em>
      </p>
    );
  };


  /* =====================================================
     RENDER
  ===================================================== */

  const lifecycle = data ? data.lifecycle.map((s, i) => ({ ...s, color: PALETTE[i % PALETTE.length] })) : [];
  const funnelHeight = lifecycle.length * 33;
  const maxPrice = data ? Math.max(...data.price.rows.map((r) => Math.max(r.start, r.final)), 1) : 1;
  const pay = data ? data.payments : null;

  return (
    <div className="admin-reports">

      {/* ================= HEADER ================= */}
      <div className="ar-header">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>
            Analyze auction performance, user activity, bidding trends and
            financial performance across Bidora.
          </p>
        </div>

        <div className="ar-filters">
          <Dropdown
            className="lg"
            icon={FaCalendarAlt}
            value={period}
            options={PERIODS}
            onChange={handlePeriodChange}
          />

          <div className="ar-daterange">
            <FaCalendarAlt />
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPeriod("Custom"); }} />
            <span>→</span>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPeriod("Custom"); }} />
          </div>

          <button className="ar-btn-primary" onClick={handleApply} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>

          <ExportMenu onExport={handleExport} disabled={!data}>
            Export Report <FaChevronDown />
          </ExportMenu>
        </div>
      </div>

      {error && (
        <div className="ar-error">
          <span>{error}</span>
          <button onClick={() => fetchReports(fromDate, toDate)}>Retry</button>
        </div>
      )}

      {!data && loading && <div className="ar-card ar-loading">Loading reports...</div>}

      {data && (
        <div className={loading ? "ar-body ar-refreshing" : "ar-body"}>

          {/* ================= KPI CARDS ================= */}
          <div className="ar-kpi-grid">
            {kpiCards.map((k) => {
              const Icon = k.icon;
              return (
                <div className="ar-card ar-kpi" key={k.label}>
                  <div className={`ar-kpi-icon ${k.color}`}><Icon /></div>
                  <span className="ar-kpi-label">{k.label}</span>
                  <h2>{k.value}</h2>
                  {changeBadge(k.change)}
                </div>
              );
            })}
          </div>


          {/* ================= ROW 1 ================= */}
          <div className="ar-row ar-row-3a">

            <div className="ar-card">
              <div className="ar-card-head">
                <h3>Auction Performance Trend</h3>
                <div className="ar-mini-select">
                  <Dropdown
                    value={trendMetric}
                    options={["Success Rate", "Conversion Rate"]}
                    onChange={setTrendMetric}
                  />
                </div>
              </div>
              <LineChart
                series={[{ data: trendMetric === "Success Rate" ? data.trend.success_rate : data.trend.conversion_rate }]}
                labels={data.trend.labels}
                yMin={0} yMax={100} yStep={20}
              />
            </div>

            <div className="ar-card">
              <div className="ar-card-head"><h3>Auction Lifecycle</h3></div>
              <div className="ar-lifecycle">
                <FunnelChart data={lifecycle} />
                <ul style={{ height: funnelHeight }}>
                  {lifecycle.map((s) => (
                    <li key={s.label}>
                      <span className="dot" style={{ background: s.color }} />
                      <span className="name">{s.label}</span>
                      <strong>{s.value.toLocaleString("en-IN")}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-card-head"><h3>Bidder Engagement</h3></div>
              <ul className="ar-stat-list">
                {[
                  { label: "Unique Bidders", value: data.bidders.unique, icon: FaUsers },
                  { label: "Returning Bidders", value: data.bidders.returning, icon: FaSyncAlt },
                  { label: "New Bidders", value: data.bidders.new, icon: FaUserPlus },
                  { label: "Avg. Bids / Bidder", value: data.bidders.avg_bids_per_bidder, icon: FaGavel },
                  { label: "Highest Bids / User", value: data.bidders.highest_bids_by_user, icon: FaStar },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.label}>
                      <span className="ico"><Icon /></span>
                      <span className="name">{s.label}</span>
                      <strong>{Number(s.value).toLocaleString("en-IN")}</strong>
                    </li>
                  );
                })}
              </ul>
            </div>

          </div>


          {/* ================= ROW 2 ================= */}
          <div className="ar-row ar-row-3b">

            <div className="ar-card">
              <div className="ar-card-head"><h3>Bid Behaviour Analysis</h3></div>
              <p className="ar-sub">Avg. Bids by Auction Duration</p>
              <BarChart data={data.bid_behavior.map((b, i) => ({ ...b, color: BAR_COLORS[i] }))} />
            </div>

            <div className="ar-card">
              <div className="ar-card-head"><h3>Price Analysis</h3></div>

              <div className="ar-price-stats">
                <div><span>Avg. Starting Price</span><strong>{rupees(data.price.avg_start)}</strong></div>
                <div><span>Avg. Final Price</span><strong>{rupees(data.price.avg_final)}</strong>{changeBadge(data.price.avg_final_change)}</div>
                <div><span>Avg. Price Increase</span><strong>{data.price.avg_increase}%</strong>{changeBadge(data.price.avg_increase_change)}</div>
              </div>

              <div className="ar-price-head">
                <h4>Starting vs Final Price</h4>
                <div className="ar-legend">
                  <span><i style={{ background: "#c4b5fd" }} /> Starting Price</span>
                  <span><i style={{ background: "#5b46e5" }} /> Final Price</span>
                </div>
              </div>

              {data.price.rows.length === 0 ? (
                <p className="ar-note">No sold auctions in this period.</p>
              ) : (
                <div className="ar-hbars">
                  {data.price.rows.map((r) => (
                    <div className="row" key={r.name}>
                      <span className="label" title={r.name}>{r.name}</span>
                      <div className="bars">
                        <div className="bar-line">
                          <div className="bar start" style={{ width: `${(r.start / maxPrice) * 80}%` }} />
                          <em>{compact(r.start)}</em>
                        </div>
                        <div className="bar-line">
                          <div className="bar final" style={{ width: `${(r.final / maxPrice) * 80}%` }} />
                          <em>{compact(r.final)}</em>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ar-card">
              <div className="ar-card-head">
                <h3>Category Performance</h3>
                <div className="ar-mini-select">
                  <Dropdown
                    value={categoryTableMode}
                    options={["Auctions", "Avg Bids", "Success"]}
                    onChange={setCategoryTableMode}
                  />
                </div>
              </div>
              <div className="ar-table-scroll">
                <table className="ar-table">
                  <thead>
                    <tr><th>Category</th><th>Auctions</th><th>Avg Bids</th><th>Avg Final Price</th><th>Success %</th></tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan="5" className="ar-empty">No ended auctions in this period.</td></tr>
                    ) : categories.map((c) => (
                      <tr key={c.name}>
                        <td><span className="dot" style={{ background: c.color }} />{c.name}</td>
                        <td>{c.auctions}</td>
                        <td>{c.avg_bids}</td>
                        <td>{rupees(c.avg_final_price)}</td>
                        <td>{c.success_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>


          {/* ================= ROW 3 ================= */}
          <div className="ar-row ar-row-2">

            <div className="ar-card">
              <div className="ar-card-head"><h3>Seller Performance</h3></div>

              <div className="ar-inline-filters">
                <Dropdown
                  value={sellerCategory}
                  options={Object.keys(data.sellers)}
                  onChange={setSellerCategory}
                />
                <Dropdown
                  value={sellerSort}
                  options={["Revenue", "Performance", "Auctions"]}
                  onChange={setSellerSort}
                />
              </div>

              <div className="ar-table-scroll">
                <table className="ar-table ar-table-sm">
                  <thead>
                    <tr><th>Seller</th><th>Auctions</th><th>Sold</th><th>Success %</th><th>Avg Bids</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {sellers.length === 0 ? (
                      <tr><td colSpan="6" className="ar-empty">No seller data in this period.</td></tr>
                    ) : sellers.map((s) => (
                      <tr key={s.name}>
                        <td><span className="ar-avatar">{initials(s.name)}</span>{s.name}</td>
                        <td>{s.auctions}</td>
                        <td>{s.sold}</td>
                        <td>{s.success_rate}%</td>
                        <td>{s.avg_bids}</td>
                        <td>{compact(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-card-head"><h3>User Activity Analysis</h3></div>

              <div className="ar-activity">
                <div className="ar-activity-left">
                  <div className="ar-tabs">
                    {Object.keys(data.user_activity).map((t) => (
                      <button key={t} className={activityTab === t ? "active" : ""} onClick={() => setActivityTab(t)}>{t}</button>
                    ))}
                  </div>
                  <ul className="ar-plain-list">
                    {data.user_activity[activityTab].map((r) => (
                      <li key={r.label}>
                        <span><FaUser /> {r.label}</span>
                        <strong>{Number(r.value).toLocaleString("en-IN")}</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="ar-activity-right">
                  <div className="ar-card-head">
                    <h4>User Engagement Trend</h4>
                    <div className="ar-legend">
                      <span><i style={{ background: "#7c4dff" }} /> New Users</span>
                      <span><i style={{ background: "#3b82f6" }} /> Active Users</span>
                    </div>
                  </div>
                  {(() => {
                    const { yMax, yStep } = niceAxis(Math.max(...data.engagement.new_users, ...data.engagement.active_users, 0));
                    return (
                      <LineChart
                        series={[{ data: data.engagement.new_users }, { data: data.engagement.active_users }]}
                        labels={data.engagement.labels}
                        yMin={0} yMax={yMax} yStep={yStep} suffix=""
                        height={170}
                        colorA="#7c4dff" colorB="#3b82f6"
                      />
                    );
                  })()}
                </div>
              </div>
            </div>

          </div>


          {/* ================= ROW 4 ================= */}
          <div className="ar-row ar-row-3c">

            <div className="ar-card">
              <div className="ar-card-head"><h3>Payment &amp; Financial Analysis</h3></div>

              <div className="ar-pay-stats">
                <div className="ar-pay-stat">
                  <span>Total Winning Value</span>
                  <strong>{rupees(pay.total_winning_value)}</strong>
                </div>
                <div className="ar-pay-stat green">
                  <span>Successfully Paid</span>
                  <strong>{pay.tracked ? rupees(pay.paid) : "Not tracked"}</strong>
                </div>
                <div className="ar-pay-stat orange">
                  <span>Pending Payments</span>
                  <strong>{pay.tracked ? rupees(pay.pending) : "Not tracked"}</strong>
                </div>
                <div className="ar-pay-stat red">
                  <span>Failed Payments</span>
                  <strong>{pay.tracked ? rupees(pay.failed) : "Not tracked"}</strong>
                </div>
              </div>

              <div className="ar-pay-bottom">
                <div className="ar-pay-box">
                  <h4>Payment Status</h4>
                  <p className="ar-note">
                    Payment tracking isn't set up yet. Once Bidora stores payments
                    (paid / pending / failed), the breakdown will appear here.
                  </p>
                </div>

                <div className="ar-pay-box">
                  <h4>Revenue by Month</h4>
                  <table className="ar-table ar-table-sm">
                    <thead><tr><th>Month</th><th>Auction Value</th><th>Successful Payment</th></tr></thead>
                    <tbody>
                      {pay.revenue_by_month.map((m) => (
                        <tr key={m.month}>
                          <td>{m.month}</td>
                          <td>{compact(m.auction_value)}</td>
                          <td>{m.paid === null ? "—" : compact(m.paid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-card-head"><h3>Approval / Rejection Analysis</h3></div>

              <div className="ar-approval-top"><h4>Auction Moderation</h4></div>

              <div className="ar-approval-stats">
                {[
                  { label: "Approved", value: data.approval.approved, tone: "green", icon: FaCheckCircle },
                  { label: "Rejected", value: data.approval.rejected, tone: "red", icon: FaTimesCircle },
                  { label: "Pending", value: data.approval.pending, tone: "orange", icon: FaHourglassHalf },
                ].map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.label} className={`ar-approval-stat ${a.tone}`}>
                      <Icon />
                      <div><span>{a.label}</span><strong>{a.value}</strong></div>
                    </div>
                  );
                })}
              </div>

              <h4 className="ar-reason-title">Rejection Reasons</h4>
              {data.approval.reasons.length === 0 ? (
                <p className="ar-note">No rejected auctions in this period.</p>
              ) : (
                <ul className="ar-reasons">
                  {data.approval.reasons.map((r) => (
                    <li key={r.label}>
                      <span className="name" title={r.label}>{r.label}</span>
                      <div className="track"><div style={{ width: `${r.pct}%` }} /></div>
                      <span className="cnt">{r.count}</span>
                      <span className="pct">{r.pct}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ar-card ar-download">
              <div className="ar-download-icon"><FaFileAlt /></div>
              <h3>Download Full Report</h3>
              <p>Get detailed reports in PDF, Excel or CSV format for further analysis.</p>
              <ExportMenu onExport={handleExport} variant="primary" block>
                <FaDownload /> Export Report
              </ExportMenu>
            </div>

          </div>


          {/* ================= AUCTION PERFORMANCE REPORT ================= */}
          <div className="ar-card ar-report">
            <div className="ar-report-head">
              <h3>Auction Performance Report</h3>

              <div className="ar-report-tools">
                <div className="ar-search">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search auction..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="ar-filter-pill">
                  Category:
                  <Dropdown
                    value={tableCategory}
                    options={tableCategories}
                    onChange={setTableCategory}
                  />
                </div>

                <div className="ar-filter-pill">
                  Status:
                  <Dropdown
                    value={tableStatus}
                    options={["All", "Completed", "Live"]}
                    onChange={setTableStatus}
                  />
                </div>

                <button className="ar-btn-outline" onClick={() => handleExport("csv")}>
                  <FaDownload /> Export
                </button>
              </div>
            </div>

            <div className="ar-table-scroll">
              <table className="ar-table ar-report-table">
                <thead>
                  <tr>
                    <th>Auction</th><th>Category</th><th>Seller</th><th>Starting Price</th>
                    <th>No. of Bids</th><th>Highest Bid</th><th>Final Price</th>
                    <th>Price Increase %</th><th>Duration</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReport.length === 0 ? (
                    <tr><td colSpan="10" className="ar-empty">No auctions match your filters.</td></tr>
                  ) : (
                    filteredReport.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="ar-thumb">
                            {r.image
                              ? <img src={imageUrl(r.image)} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              : <FaGavel />}
                          </span>
                          {r.name}
                        </td>
                        <td>{r.category}</td>
                        <td>{r.seller}</td>
                        <td>{rupees(r.start_price)}</td>
                        <td>{r.bids}</td>
                        <td>{rupees(r.highest_bid)}</td>
                        <td>{rupees(r.final_price)}</td>
                        <td className="ar-green-text">{r.increase_pct !== null ? `${r.increase_pct > 0 ? "+" : ""}${r.increase_pct}%` : "—"}</td>
                        <td>{r.duration}</td>
                        <td><span className={`ar-status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default AdminReports;
