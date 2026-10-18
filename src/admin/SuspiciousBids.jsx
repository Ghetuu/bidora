import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSyncAlt,
  FaSearch,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaGavel,
  FaUsers,
  FaChartLine,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import "../styles/suspiciousbids.css";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const money = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const levelLabel = (level) => {
  const normalized = String(level || "low").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

function RiskBadge({ level, score }) {
  return (
    <span className={`sb-risk-badge sb-risk-${String(level || "low").toLowerCase()}`}>
      <span className="sb-risk-dot" />
      {levelLabel(level)}{score !== undefined ? ` · ${score}/100` : ""}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, tone, hint }) {
  return (
    <div className={`sb-summary-card sb-tone-${tone}`}>
      <div className="sb-summary-icon"><Icon /></div>
      <div className="sb-summary-copy">
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}

export default function SuspiciousBids() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ high_risk: 0, medium_risk: 0, low_risk: 0, critical_signals: 0 });
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [minRisk, setMinRisk] = useState("0");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadReports = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await adminApi.get("/admin/suspicious-bids", {
        params: { status: statusFilter, min_risk: Number(minRisk) || 0 },
      });
      const data = response.data || {};
      setReports(Array.isArray(data.reports) ? data.reports : []);
      setSummary(data.summary || { high_risk: 0, medium_risk: 0, low_risk: 0, critical_signals: 0 });
      setTotal(Number(data.count || 0));
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load suspicious-bidding reports. Check that the backend is running and you are logged in as admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, minRisk]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const visibleReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      String(report.auction_id).includes(query) ||
      String(report.product_title || "").toLowerCase().includes(query) ||
      String(report.status || "").toLowerCase().includes(query) ||
      String(report.risk_level || "").toLowerCase().includes(query) ||
      (report.signals || []).some((signal) => String(signal.label || "").toLowerCase().includes(query))
    );
  }, [reports, search]);

  const openDetails = async (auctionId) => {
    setSelectedReport(null);
    setDetailLoading(true);
    try {
      const response = await adminApi.get(`/admin/suspicious-bids/${auctionId}`);
      setSelectedReport(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || `Unable to load details for auction #${auctionId}.`);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="suspicious-bids-page">
      <header className="sb-page-header">
        <div className="sb-heading-group">
          <div className="sb-heading-icon"><FaShieldAlt /></div>
          <div>
            <p className="sb-eyebrow">BIDORA ADMIN CENTER</p>
            <h1>Suspicious Bids</h1>
            <p className="sb-subtitle">Review unusual bidding patterns and auction integrity signals.</p>
          </div>
        </div>
        <button className="sb-refresh-btn" type="button" onClick={() => loadReports({ quiet: true })} disabled={loading || refreshing}>
          <FaSyncAlt className={refreshing ? "sb-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh analysis"}
        </button>
      </header>

      <div className="sb-notice" role="note">
        <FaInfoCircle />
        <p><strong>Review responsibly.</strong> These rule-based signals identify patterns that may deserve investigation; they are not proof of fraud and do not automatically block bids or users.</p>
      </div>

      {error && <div className="sb-error" role="alert">{error}</div>}

      <section className="sb-summary-grid" aria-label="Risk summary">
        <SummaryCard icon={FaChartLine} label="Auctions analyzed" value={total} tone="blue" hint="Matching current filters" />
        <SummaryCard icon={FaExclamationTriangle} label="High risk" value={summary.high_risk} tone="red" hint="Requires closer review" />
        <SummaryCard icon={FaShieldAlt} label="Medium risk" value={summary.medium_risk} tone="amber" hint="Review signals" />
        <SummaryCard icon={FaCheckCircle} label="Critical signals" value={summary.critical_signals} tone="purple" hint="Seller self-bidding flagged" />
      </section>

      <section className="sb-report-panel">
        <div className="sb-panel-heading">
          <div>
            <h2>Risk analysis reports</h2>
            <p>Reports are calculated from existing auction and bid records.</p>
          </div>
          <span className="sb-results-count">{visibleReports.length} result{visibleReports.length === 1 ? "" : "s"}</span>
        </div>

        <div className="sb-filter-row">
          <label className="sb-search-field">
            <FaSearch />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, auction ID, signal…" aria-label="Search reports" />
          </label>
          <label className="sb-filter-field">
            <span>Auction status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="sb-filter-field">
            <span>Minimum risk score</span>
            <select value={minRisk} onChange={(event) => setMinRisk(event.target.value)}>
              <option value="0">All scores</option>
              <option value="30">30+ · Medium and high</option>
              <option value="60">60+ · High risk</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="sb-state"><span className="sb-loader" /><strong>Analyzing auction records…</strong><p>This may take a moment if your database contains many auctions.</p></div>
        ) : visibleReports.length === 0 ? (
          <div className="sb-state sb-empty-state"><div className="sb-empty-icon"><FaShieldAlt /></div><strong>No reports match these filters</strong><p>Try another status, lower the minimum risk score, or clear the search.</p><button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setMinRisk("0"); }}>Clear filters</button></div>
        ) : (
          <div className="sb-table-wrap">
            <table className="sb-report-table">
              <thead><tr><th>Auction</th><th>Risk score</th><th>Bid activity</th><th>Signals detected</th><th>Analysis status</th><th>Action</th></tr></thead>
              <tbody>
                {visibleReports.map((report) => (
                  <tr key={report.auction_id}>
                    <td><div className="sb-auction-cell"><span className="sb-auction-icon"><FaGavel /></span><div><strong>{report.product_title || `Auction #${report.auction_id}`}</strong><small>Auction ID: #{report.auction_id}</small></div></div></td>
                    <td><RiskBadge level={report.risk_level} score={report.risk_score} /></td>
                    <td><div className="sb-activity-cell"><strong><FaGavel /> {report.bid_count ?? 0} bids</strong><small><FaUsers /> {report.bidder_count ?? 0} bidders</small></div></td>
                    <td><span className={`sb-signal-count ${(report.signals || []).length ? "has-signals" : ""}`}>{(report.signals || []).length} signal{(report.signals || []).length === 1 ? "" : "s"}</span>{report.critical_signal && <span className="sb-critical-tag">Critical</span>}</td>
                    <td><span className={`sb-status-tag sb-status-${String(report.status || "unknown").replace(/[^a-z_]/gi, "-")}`}>{String(report.status || "unknown").replaceAll("_", " ")}</span></td>
                    <td><button className="sb-view-btn" type="button" onClick={() => openDetails(report.auction_id)}><FaEye /> View analysis</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailLoading && <div className="sb-modal-backdrop" role="presentation"><div className="sb-modal-loading"><span className="sb-loader" /><p>Loading auction analysis…</p></div></div>}

      {selectedReport && (
        <div className="sb-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReport(null); }}>
          <section className="sb-detail-modal" role="dialog" aria-modal="true" aria-labelledby="sb-detail-title">
            <header className="sb-modal-header"><div><p className="sb-eyebrow">AUCTION #{selectedReport.auction_id}</p><h2 id="sb-detail-title">{selectedReport.product_title || "Auction analysis"}</h2></div><button className="sb-close-btn" type="button" onClick={() => setSelectedReport(null)} aria-label="Close details"><FaTimes /></button></header>
            <div className="sb-detail-score-row"><div className="sb-score-ring"><strong>{selectedReport.risk_score}</strong><span>/100</span></div><div><RiskBadge level={selectedReport.risk_level} /><p>{selectedReport.notice || "Review the signals below before taking action."}</p></div></div>
            <div className="sb-detail-stats"><div><span>Total bids</span><strong>{selectedReport.bid_count ?? 0}</strong></div><div><span>Distinct bidders</span><strong>{selectedReport.bidder_count ?? 0}</strong></div><div><span>Signals found</span><strong>{(selectedReport.signals || []).length}</strong></div></div>
            <h3 className="sb-section-title">Detected signals</h3>
            {(selectedReport.signals || []).length === 0 ? <div className="sb-no-signals"><FaCheckCircle /><span>No rule-based signals were detected in the available bid data.</span></div> : <div className="sb-signal-list">{selectedReport.signals.map((signal, index) => <article className="sb-signal-item" key={`${signal.label}-${index}`}><div className="sb-signal-item-top"><strong><FaExclamationTriangle /> {signal.label}</strong><span>+{signal.points} risk points</span></div><p>{signal.details}</p></article>)}</div>}
            {(selectedReport.flagged_bidders || []).length > 0 && <><h3 className="sb-section-title">Accounts flagged for review</h3><p className="sb-private-note">Visible only to authorized admins. Treat these flags as leads for manual review, not a conclusion about an account.</p><div className="sb-flagged-list">{selectedReport.flagged_bidders.map((bidder) => <div className="sb-flagged-row" key={bidder.user_id}><div><strong>Account #{bidder.user_id}</strong><small>{bidder.bid_count} bid{bidder.bid_count === 1 ? "" : "s"}</small></div><div className="sb-reason-tags">{(bidder.reasons || []).map((reason) => <span key={reason}>{reason}</span>)}</div></div>)}</div></>}
            <footer className="sb-modal-footer"><span><FaInfoCircle /> Analysis is advisory and does not automatically change auction status.</span><button type="button" onClick={() => setSelectedReport(null)}>Close</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
