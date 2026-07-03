"use client"

import { useState, useEffect } from "react"
import { Zap, Send, Download, Gem, Fuel } from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, delay = 0, Icon }) {
    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flex: 1,
                padding: "28px 24px",
                background: hovered ? `${accent}08` : "rgba(255,255,255,0.02)",
                border: `1px solid ${hovered ? accent + "40" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "16px",
                position: "relative",
                overflow: "hidden",
                cursor: "default",
                transition: "all 0.4s ease",
                transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
                opacity: visible ? 1 : 0,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: hovered ? "0%" : "50%",
                    width: hovered ? "100%" : "0%",
                    height: "2px",
                    background: accent,
                    transition: "all 0.5s ease",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "-30px",
                    right: "-30px",
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    color: hovered ? accent : "#475569",
                    marginBottom: "16px",
                    transition: "color 0.4s ease",
                }}
            >
                <Icon size={26} />
            </div>
            <div
                style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: hovered ? "#ffffff" : "#475569",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                    transition: "color 0.4s ease",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "22px",
                    fontWeight: "900",
                    color: hovered ? accent : "#94a3b8",
                    textShadow: hovered ? `0 0 12px ${accent}66` : "none",
                    transition: "all 0.4s ease",
                    wordBreak: "break-all",
                }}
            >
                {value}
            </div>
        </div>
    )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ tx, index }) {
    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)
    const isSent = Number(tx.txType) === 0
    const accent = isSent ? "#f59e0b" : "#22c55e"
    const label = isSent ? "SENT" : "RECEIVED"

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80 + index * 60)
        return () => clearTimeout(t)
    }, [index])

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 1fr 160px 100px",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "8px",
                background: hovered ? `${accent}10` : "rgba(255,255,255,0.02)",
                border: `1px solid ${hovered ? accent + "40" : "rgba(255,255,255,0.06)"}`,
                borderLeft: hovered ? `2px solid ${accent}` : "2px solid transparent",
                marginBottom: "8px",
                transform: visible ? "translateX(0)" : "translateX(-20px)",
                opacity: visible ? 1 : 0,
                transition: `all 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 40}ms`,
                cursor: "default",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: `${accent}18`,
                    border: `1px solid ${accent}55`,
                    fontFamily: "'Courier New', monospace",
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    color: accent,
                    textShadow: hovered ? `0 0 8px ${accent}` : "none",
                    transition: "text-shadow 0.3s ease",
                }}
            >
                {label}
            </div>
            <div>
                <div
                    style={{
                        fontSize: "9px",
                        color: "#475569",
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "2px",
                        marginBottom: "3px",
                    }}
                >
                    FROM
                </div>
                <div
                    style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "12px",
                        color: hovered ? "#ffffff" : "#475569",
                        transition: "color 0.2s",
                    }}
                >
                    {shortenAddr(tx.from)}
                </div>
            </div>
            <div>
                <div
                    style={{
                        fontSize: "9px",
                        color: "#475569",
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "2px",
                        marginBottom: "3px",
                    }}
                >
                    TO
                </div>
                <div
                    style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "12px",
                        color: hovered ? "#ffffff" : "#475569",
                        transition: "color 0.2s",
                    }}
                >
                    {shortenAddr(tx.to)}
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div
                    style={{
                        fontSize: "9px",
                        color: "#475569",
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "2px",
                        marginBottom: "3px",
                    }}
                >
                    AMOUNT
                </div>
                <div
                    style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: accent,
                        textShadow: hovered ? `0 0 10px ${accent}66` : "none",
                        transition: "all 0.2s ease",
                    }}
                >
                    {formatEth(tx.amount)} ETH
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div
                    style={{
                        fontSize: "9px",
                        color: "#475569",
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "2px",
                        marginBottom: "3px",
                    }}
                >
                    GAS
                </div>
                <div
                    style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "12px",
                        color: "#f59e0b",
                    }}
                >
                    <Fuel size={12} color="#f59e0b" /> ${tx.gasFeeUsd || "0.00"}
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div
                    style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: "11px",
                        color: "#334155",
                    }}
                >
                    {timeAgo(tx.timeStamp)}
                </div>
            </div>
        </div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 20px",
            }}
        >
            <div
                style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "11px",
                    letterSpacing: "4px",
                    color: "#38bdf8",
                    marginBottom: "12px",
                }}
            >
                // NO TRANSACTIONS FOUND
            </div>
            <div
                style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: "10px",
                    color: "#334155",
                    letterSpacing: "2px",
                }}
            >
                Your transaction history will appear here
            </div>
        </div>
    )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr 1fr 160px 100px",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderLeft: "2px solid transparent",
                marginBottom: "8px",
                animation: "pulse 1.5s ease-in-out infinite",
            }}
        >
            {[80, 120, 120, 100, 70].map((w, i) => (
                <div
                    key={i}
                    style={{
                        height: "14px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.06)",
                        width: `${w}px`,
                    }}
                />
            ))}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
        <div
            style={{
                minHeight: "100vh",
                padding: "0",
                fontFamily: "'Courier New', monospace",
                color: "#fff",
                position: "relative",
            }}
        >
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #f59e0b44; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #f59e0b88; }
            `}</style>

            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "linear-gradient(transparent, rgba(245,158,11,0.12), transparent)",
                    animation: "scanline 8s linear infinite",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            <div style={{ position: "relative", zIndex: 1, padding: "32px 40px 40px" }}>
                {/* ── Header ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "28px",
                        animation: "fadeInDown 0.5s ease",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontFamily: "'Orbitron', sans-serif",
                                fontSize: "22px",
                                fontWeight: "900",
                                letterSpacing: "3px",
                                background: "linear-gradient(135deg, #fff 0%, #aaa 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            TRANSACTION HISTORY
                        </div>
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#444",
                                letterSpacing: "2px",
                                marginTop: "4px",
                                fontFamily: "'Courier New', monospace",
                            }}
                        >
                            {walletAddress
                                ? `${shortenAddr(walletAddress)} · ${transactions.length} records`
                                : "Loading..."}
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
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

                {/* ── Table Header ── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "90px 1fr 1fr 160px 100px",
                        gap: "12px",
                        padding: "10px 20px",
                        marginBottom: "6px",
                    }}
                >
                    {["TYPE", "FROM", "TO", "AMOUNT", "GAS", "TIME"].map((h) => (
                        <div
                            key={h}
                            style={{
                                fontSize: "9px",
                                letterSpacing: "3px",
                                color: "#334155",
                                textTransform: "uppercase",
                                fontFamily: "'Courier New', monospace",
                                textAlign: h === "AMOUNT" || h === "TIME" ? "right" : "left",
                            }}
                        >
                            {h}
                        </div>
                    ))}
                </div>

                {/* ── Separator ── */}
                <div
                    style={{
                        height: "1px",
                        background:
                            "linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)",
                        marginBottom: "12px",
                    }}
                />

                {/* ── Content ── */}
                {error && (
                    <div
                        style={{
                            padding: "20px",
                            borderRadius: "8px",
                            background: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            color: "#f59e0b",
                            fontSize: "11px",
                            letterSpacing: "2px",
                            textAlign: "center",
                        }}
                    >
                        {error}
                    </div>
                )}
                {!error && loading && (
                    <div>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))}
                    </div>
                )}
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
