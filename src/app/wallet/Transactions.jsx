"use client"

import { useState, useEffect, useRef } from "react"
import { Zap, Send, Download, Gem, Fuel } from "lucide-react"

function shortenAddr(addr) {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatEth(val) {
    if (!val) return "0.000000"
    return parseFloat(val).toFixed(6)
}

function timeAgo(timestamp) {
    const now = Date.now()
    const ts = new Date(timestamp).getTime()
    const diff = now - ts
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(ts).toLocaleDateString()
}

function StatCard({ label, value, accent, delay = 0, Icon }) {
    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    return (
        <div
            className={`stat-card ${hovered ? "stat-hovered" : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                "--accent": accent,
                transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.94)",
                opacity: visible ? 1 : 0,
                transition: `transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.6s ease ${delay}ms`,
            }}
        >
            <div className="stat-glow" />
            <div className="stat-shimmer" />
            <div className="stat-border-top" />
            <div className="stat-icon" style={{ color: hovered ? accent : "#334155" }}>
                <Icon size={26} />
            </div>
            <div className="stat-label">{label}</div>
            <div
                className="stat-value"
                style={{
                    color: hovered ? accent : "#94a3b8",
                    textShadow: hovered ? `0 0 12px ${accent}66` : "none",
                }}
            >
                {value}
            </div>
        </div>
    )
}

function TxRow({ tx, index }) {
    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [ripple, setRipple] = useState(null)
    const rowRef = useRef(null)
    const isSent = Number(tx.txType) === 0
    const accent = isSent ? "#f59e0b" : "#22c55e"
    const accentDim = isSent ? "rgba(245,158,11," : "rgba(34,197,94,"

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60 + index * 50)
        return () => clearTimeout(t)
    }, [index])

    function handleMouseEnter(e) {
        setHovered(true)
        const rect = rowRef.current.getBoundingClientRect()
        setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setTimeout(() => setRipple(null), 700)
    }

    return (
        <div
            ref={rowRef}
            className={`tx-row ${isSent ? "tx-sent" : "tx-recv"} ${hovered ? "tx-row-hovered" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setHovered(false)}
            style={{
                "--accent": accent,
                "--accent-dim": accentDim,
                transform: visible
                    ? hovered
                        ? "translateX(4px) translateY(-1px)"
                        : "translateX(0)"
                    : "translateX(-32px)",
                opacity: visible ? 1 : 0,
                transition: `transform 0.45s cubic-bezier(0.16,1,0.3,1) ${index * 35}ms, opacity 0.4s ease ${index * 35}ms, box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease`,
            }}
        >
            {ripple && (
                <span
                    className="tx-ripple"
                    style={{ left: ripple.x, top: ripple.y, background: `${accent}22` }}
                />
            )}

            <div className="tx-left-bar" />

            <div className="tx-badge-col">
                <div className={`tx-badge ${isSent ? "badge-sent" : "badge-recv"}`}>
                    <span
                        className="badge-dot"
                        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                    />
                    <span>{isSent ? "SENT" : "RECV"}</span>
                </div>
                {isSent ? (
                    <div className="tx-arrow-icon sent-arrow">↑</div>
                ) : (
                    <div className="tx-arrow-icon recv-arrow">↓</div>
                )}
            </div>

            <div className="tx-addr-col">
                <div className="tx-col-label">FROM</div>
                <div className="tx-addr" style={{ color: hovered ? "#c0cfe8" : "#4a5568" }}>
                    {shortenAddr(tx.from)}
                </div>
            </div>

            <div className="tx-addr-col">
                <div className="tx-col-label">TO</div>
                <div className="tx-addr" style={{ color: hovered ? "#c0cfe8" : "#4a5568" }}>
                    {shortenAddr(tx.to)}
                </div>
            </div>

            <div className="tx-amount-col">
                <div className="tx-col-label">AMOUNT</div>
                <div
                    className="tx-amount"
                    style={{
                        color: accent,
                        textShadow: hovered
                            ? `0 0 16px ${accent}cc, 0 0 32px ${accent}44`
                            : "none",
                    }}
                >
                    {formatEth(tx.amount)}
                    <span className="eth-label"> ETH</span>
                </div>
            </div>

            <div className="tx-gas-col">
                <div className="tx-col-label">GAS</div>
                <div className="tx-gas" style={{ color: hovered ? "#fbbf24" : "#78716c" }}>
                    <Fuel size={11} color="#f59e0b" />
                    <span>${tx.gasFeeUsd || "0.00"}</span>
                </div>
            </div>

            <div className="tx-time-col">
                <div className="tx-col-label">TIME</div>
                <div className="tx-time">{timeAgo(tx.timeStamp)}</div>
            </div>

            <div className="tx-scan-line" />
        </div>
    )
}

function SkeletonRow() {
    return (
        <div className="skeleton-row">
            {[90, 110, 110, 130, 80, 70].map((w, i) => (
                <div key={i} className="skeleton-cell" style={{ width: w }} />
            ))}
        </div>
    )
}

function EmptyState() {
    return (
        <div className="empty-state">
            <div className="empty-icon">◈</div>
            <div className="empty-title"> NO TRANSACTIONS FOUND</div>
            <div className="empty-sub">Your on-chain history will appear here</div>
        </div>
    )
}

export default function Transactions({ walletAddress }) {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!walletAddress) return
        async function fetchData() {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch(`/api/transactions?address=${walletAddress}`)
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setTransactions(data.transactions)
            } catch (err) {
                console.error(err)
                setError("Failed to fetch transactions.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [walletAddress])

    const totalSent = transactions.filter((tx) => Number(tx.txType) === 0)
    const totalReceived = transactions.filter((tx) => Number(tx.txType) === 1)
    const totalEthSent = totalSent.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)

    return (
        <div className="tx-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');

                .tx-page {
                    min-height: 100vh;
                    padding: 0;
                    color: #fff;
                    position: relative;
                    font-family: 'Share Tech Mono', 'Courier New', monospace;
                    overflow-x: hidden;
                }

                .tx-page::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.03) 2px,
                        rgba(0,0,0,0.03) 4px
                    );
                    pointer-events: none;
                    z-index: 0;
                }

                .tx-inner { position: relative; z-index: 1; padding: 36px 44px 60px; }

                @keyframes scanBeam {
                    0% { transform: translateY(-100vh); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(200vh); opacity: 0; }
                }
                .scan-beam {
                    position: fixed;
                    left: 0; right: 0;
                    height: 120px;
                    background: linear-gradient(180deg, transparent 0%, rgba(56,189,248,0.03) 40%, rgba(56,189,248,0.06) 50%, rgba(56,189,248,0.03) 60%, transparent 100%);
                    animation: scanBeam 12s linear infinite;
                    pointer-events: none;
                    z-index: 0;
                }

                @keyframes fadeDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
                .tx-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:36px; animation: fadeDown 0.5s ease; }
                .tx-title {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 24px; font-weight: 900; letter-spacing: 4px;
                    background: linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #38bdf8 100%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .tx-subtitle { font-size: 10px; color: #334155; letter-spacing: 2.5px; margin-top: 6px; }

                @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
                .live-dot { display:inline-flex; align-items:center; gap:6px; font-size:9px; letter-spacing:2px; color:#22c55e; }
                .live-dot::before {
                    content:'';width:6px;height:6px;border-radius:50%;
                    background:#22c55e;box-shadow:0 0 8px #22c55e;
                    animation: livePulse 1.5s ease infinite;
                }

                /* ── Stat Cards ── */
                .stat-grid { display:flex; gap:20px; margin-bottom:40px; }

                .stat-card {
                    flex:1; padding:28px 24px;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    position: relative; overflow: hidden; cursor: default;
                    transition: all 0.4s ease;
                }
                .stat-card.stat-hovered {
                    background: color-mix(in srgb, var(--accent) 8%, transparent);
                    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
                    box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 15%, transparent);
                }
                .stat-glow {
                    position:absolute; top:-30px; right:-30px;
                    width:80px; height:80px; border-radius:50%;
                    background: radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%);
                    pointer-events:none;
                }
                .stat-shimmer {
                    position:absolute; inset:0;
                    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%);
                    background-size: 200% 100%;
                    pointer-events:none;
                }
                @keyframes shimmerSlide { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                .stat-hovered .stat-shimmer { animation: shimmerSlide 1.5s ease infinite; }

                .stat-border-top {
                    position:absolute; top:0; left:50%; width:0; height:2px;
                    background: var(--accent);
                    transition: left 0.5s ease, width 0.5s ease;
                    pointer-events:none;
                }
                .stat-hovered .stat-border-top { left:0; width:100%; }

                .stat-icon { margin-bottom:16px; transition: color 0.4s ease; }
                .stat-label { font-size:10px; letter-spacing:2px; color:#475569; text-transform:uppercase; margin-bottom:10px; transition: color 0.3s; }
                .stat-hovered .stat-label { color:#ffffff; }
                .stat-value { font-family:'Courier New',monospace; font-size:22px; font-weight:900; transition: all 0.4s ease; word-break:break-all; color:#94a3b8; }
                .stat-hovered .stat-value { text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 60%, transparent); }

                .tx-table-header {
                    display: grid;
                    grid-template-columns: 120px 1fr 1fr 160px 100px 80px;
                    gap: 12px; padding: 10px 24px; margin-bottom:6px;
                }
                .th-label { font-size:8px; letter-spacing:3px; color:#1e293b; text-transform:uppercase; }

                .tx-sep {
                    height:1px; margin-bottom:14px;
                    background: linear-gradient(90deg, transparent, rgba(56,189,248,0.25), rgba(168,139,250,0.15), transparent);
                }

                @keyframes rowIn { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
                @keyframes sentGlow { 0%,100%{box-shadow:0 2px 20px rgba(245,158,11,0.06)} 50%{box-shadow:0 2px 30px rgba(245,158,11,0.14)} }
                @keyframes recvGlow { 0%,100%{box-shadow:0 2px 20px rgba(34,197,94,0.06)} 50%{box-shadow:0 2px 30px rgba(34,197,94,0.14)} }

                .tx-row {
                    display: grid;
                    grid-template-columns: 120px 1fr 1fr 160px 100px 80px;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 24px;
                    border-radius: 10px;
                    margin-bottom: 8px;
                    position: relative; overflow: hidden; cursor: default;
                    border: 1px solid transparent;
                    border-left: 2px solid transparent;
                }
                .tx-sent {
                    background: rgba(245,158,11,0.04);
                    border-color: rgba(245,158,11,0.1);
                    border-left-color: rgba(245,158,11,0.4);
                }
                .tx-recv {
                    background: rgba(34,197,94,0.04);
                    border-color: rgba(34,197,94,0.1);
                    border-left-color: rgba(34,197,94,0.4);
                }
                .tx-sent.tx-row-hovered {
                    background: rgba(245,158,11,0.09);
                    border-color: rgba(245,158,11,0.3);
                    border-left-color: #f59e0b;
                    box-shadow: 0 4px 32px rgba(245,158,11,0.15), inset 0 0 40px rgba(245,158,11,0.03);
                    animation: sentGlow 2s ease infinite;
                }
                .tx-recv.tx-row-hovered {
                    background: rgba(34,197,94,0.09);
                    border-color: rgba(34,197,94,0.3);
                    border-left-color: #22c55e;
                    box-shadow: 0 4px 32px rgba(34,197,94,0.15), inset 0 0 40px rgba(34,197,94,0.03);
                    animation: recvGlow 2s ease infinite;
                }

                .tx-ripple {
                    position:absolute; border-radius:50%;
                    width:300px; height:300px;
                    margin-left:-150px; margin-top:-150px;
                    pointer-events:none;
                    animation: rippleOut 0.7s ease-out forwards;
                }
                @keyframes rippleOut { 0%{transform:scale(0);opacity:1} 100%{transform:scale(1);opacity:0} }

                .tx-left-bar {
                    position:absolute; left:0; top:10%; height:80%; width:2px;
                    background: var(--accent);
                    opacity:0; border-radius:0 2px 2px 0;
                    transition: opacity 0.3s, height 0.3s;
                    box-shadow: 0 0 8px var(--accent);
                }
                .tx-row-hovered .tx-left-bar { opacity:1; }

                @keyframes scanRow { 0%{left:-100%} 100%{left:200%} }
                .tx-scan-line {
                    position:absolute; top:0; left:-100%; width:40%; height:100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent);
                    pointer-events:none;
                }
                .tx-row-hovered .tx-scan-line { animation: scanRow 1.2s ease infinite; }

                .tx-badge-col { display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
                .tx-badge {
                    display:inline-flex; align-items:center; gap:6px;
                    padding:4px 12px; border-radius:20px;
                    font-size:10px; font-weight:700; letter-spacing:2px;
                    transition: all 0.3s;
                }
                .badge-sent {
                    background: rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.35); color:#f59e0b;
                }
                .badge-recv {
                    background: rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.35); color:#22c55e;
                }
                .tx-row-hovered .badge-sent { background:rgba(245,158,11,0.22); box-shadow:0 0 12px rgba(245,158,11,0.35); }
                .tx-row-hovered .badge-recv { background:rgba(34,197,94,0.22); box-shadow:0 0 12px rgba(34,197,94,0.35); }
                .badge-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

                .tx-arrow-icon { font-size:14px; font-weight:900; line-height:1; }
                .sent-arrow { color:rgba(245,158,11,0.5); }
                .recv-arrow { color:rgba(34,197,94,0.5); }
                .tx-row-hovered .sent-arrow { color:#f59e0b; text-shadow:0 0 8px #f59e0b; }
                .tx-row-hovered .recv-arrow { color:#22c55e; text-shadow:0 0 8px #22c55e; }

                .tx-col-label { font-size:8px; letter-spacing:2.5px; color:#1e293b; text-transform:uppercase; margin-bottom:4px; }
                .tx-addr { font-size:12px; transition:color 0.2s; }
                .tx-addr-col {}
                .tx-amount-col {}
                .tx-amount { font-size:14px; font-weight:700; transition:all 0.25s; letter-spacing:0.5px; }
                .eth-label { font-size:10px; letter-spacing:1px; opacity:0.7; }
                .tx-gas-col {}
                .tx-gas { display:flex; align-items:center; gap:5px; font-size:12px; transition:color 0.2s; }
                .tx-time-col {}
                .tx-time { font-size:11px; color:#334155; transition:color 0.2s; }
                .tx-row-hovered .tx-time { color:#475569; }

                @keyframes skeletonPulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
                .skeleton-row {
                    display:flex; align-items:center; gap:20px;
                    padding:18px 24px; border-radius:10px; margin-bottom:8px;
                    background:rgba(255,255,255,0.015); border:1px solid rgba(255,255,255,0.04);
                }
                .skeleton-cell {
                    height:13px; border-radius:4px;
                    background:rgba(255,255,255,0.07);
                    animation:skeletonPulse 1.6s ease infinite;
                    flex-shrink:0;
                }

                @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                .empty-state { display:flex; flex-direction:column; align-items:center; padding:80px 20px; }
                .empty-icon { font-size:40px; color:#1e293b; margin-bottom:20px; animation:floatUp 3s ease infinite; }
                .empty-title { font-size:11px; letter-spacing:4px; color:#38bdf8; margin-bottom:10px; }
                .empty-sub { font-size:10px; color:#1e293b; letter-spacing:2px; }

                .tx-error {
                    padding:20px; border-radius:8px;
                    background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2);
                    color:#f59e0b; font-size:11px; letter-spacing:2px; text-align:center;
                }

                ::-webkit-scrollbar { width:3px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:#f59e0b33; border-radius:3px; }
                ::-webkit-scrollbar-thumb:hover { background:#f59e0b66; }
            `}</style>

            <div className="scan-beam" />

            <div className="tx-inner">
                <div className="tx-header">
                    <div>
                        <div className="tx-title">TRANSACTION HISTORY</div>
                        <div className="tx-subtitle">
                            {walletAddress
                                ? `${shortenAddr(walletAddress)} · ${transactions.length} records`
                                : "connecting..."}
                        </div>
                    </div>
                    <div className="live-dot">LIVE</div>
                </div>

                <div className="stat-grid">
                    <StatCard
                        label="Total Transactions"
                        value={loading ? "—" : transactions.length}
                        accent="#a78bfa"
                        delay={0}
                        Icon={Zap}
                    />
                    <StatCard
                        label="Total Sent"
                        value={loading ? "—" : `${totalSent.length} txns`}
                        accent="#f59e0b"
                        delay={80}
                        Icon={Send}
                    />
                    <StatCard
                        label="Total Received"
                        value={loading ? "—" : `${totalReceived.length} txns`}
                        accent="#22c55e"
                        delay={160}
                        Icon={Download}
                    />
                    <StatCard
                        label="ETH Sent"
                        value={loading ? "—" : `${totalEthSent.toFixed(4)} ETH`}
                        accent="#38bdf8"
                        delay={240}
                        Icon={Gem}
                    />
                </div>

                <div className="tx-table-header">
                    {["TYPE", "FROM", "TO", "AMOUNT", "GAS", "TIME"].map((h) => (
                        <div key={h} className="th-label">
                            {h}
                        </div>
                    ))}
                </div>
                <div className="tx-sep" />

                {error && <div className="tx-error">{error}</div>}
                {!error &&
                    loading &&
                    Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                {!error && !loading && transactions.length === 0 && <EmptyState />}
                {!error &&
                    !loading &&
                    transactions.map((tx, i) => (
                        <TxRow
                            key={tx.hash || `${tx.from}-${tx.timeStamp}-${i}`}
                            tx={tx}
                            index={i}
                        />
                    ))}
            </div>
        </div>
    )
}
