"use client"

import { useState, useEffect, useRef } from "react"
import { Zap, Send, Download, Gem, Fuel } from "lucide-react"
import "./Transactions.css"

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
                <div className="tx-col-label label-from">FROM</div>
                <div className="tx-addr" style={{ color: hovered ? "#22c55e" : "#4a5568" }}>
                    {shortenAddr(tx.from)}
                </div>
            </div>

            <div
                className="tx-arrow-col"
                style={{
                    textAlign: "center",
                    color: hovered ? accent : "#334155",
                    transform: "translateX(-100px)",
                }}
            >
                {isSent ? "→" : "←"}
            </div>

            <div className="tx-addr-col">
                <div className="tx-col-label label-to">TO</div>
                <div className="tx-addr" style={{ color: hovered ? "#ef4444" : "#4a5568" }}>
                    {shortenAddr(tx.to)}
                </div>
            </div>

            <div className="tx-amount-col">
                <div className="tx-col-label label-amount">AMOUNT</div>
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
                <div className="tx-col-label label-block">GAS</div>
                <div className="tx-gas" style={{ color: hovered ? "#fbbf24" : "#78716c" }}>
                    <Fuel size={15} color="#f59e0b" />
                    <span>${tx.gasFeeUsd || "0.00"}</span>
                </div>
            </div>

            <div className="tx-block-col">
                <div className="tx-col-label">BLOCK</div>
                <div className="tx-block">{tx.blockNum}</div>
            </div>

            <div className="tx-time-col">
                <div className="tx-col-label label-time">TIME</div>
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

        const cacheKey = `txCache_${walletAddress}`
        const cached = sessionStorage.getItem(cacheKey)

        if (cached) {
            setTransactions(JSON.parse(cached))
            setLoading(false)
            return
        }

        async function fetchData() {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch(`/api/transactions?address=${walletAddress}`)
                const data = await res.json()
                if (data.error) throw new Error(data.error)
                setTransactions(data.transactions)
                sessionStorage.setItem(cacheKey, JSON.stringify(data.transactions))
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
                    {["TYPE", "FROM", "", "TO", "AMOUNT", "GAS", "BLOCK", "TIME"].map((h, i) => (
                        <div key={i} className="th-label">
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
