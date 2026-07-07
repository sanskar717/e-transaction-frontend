"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Zap, Download, Gem, Fuel } from "lucide-react"
import { checkIfRegistered, checkHasPinSet } from "../../../config/contracts"
import Navbar from "../walletNavbar"
import ShootingStars from "../../../components/ShootingStars"
import "../Transactions.css"

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
    const accent = "#22c55e"
    const accentDim = "rgba(34,197,94,"

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60 + index * 50)
        return () => clearTimeout(t)
    }, [index])

    return (
        <div
            className={`tx-row tx-recv ${hovered ? "tx-row-hovered" : ""}`}
            onMouseEnter={() => setHovered(true)}
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
            <div className="tx-left-bar" />

            <div className="tx-badge-col">
                <div
                    className="tx-badge badge-recv"
                    style={
                        !hovered
                            ? {
                                  background: "transparent",
                                  borderColor: "#4a5568",
                                  color: "#4a5568",
                              }
                            : {}
                    }
                >
                    <span
                        className="badge-dot"
                        style={{
                            background: hovered ? accent : "#4a5568",
                            boxShadow: hovered ? `0 0 8px ${accent}` : "none",
                        }}
                    />
                    <span>RECV</span>
                </div>
                <div
                    className="tx-arrow-icon recv-arrow"
                    style={{ color: hovered ? undefined : "#4a5568" }}
                >
                    ↓
                </div>
            </div>

            <div className="tx-addr-col">
                <div className="tx-col-label label-from">FROM</div>
                <div className="tx-addr" style={{ color: hovered ? "#ffffff" : "#4a5568" }}>
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
                ←
            </div>

            <div className="tx-addr-col">
                <div className="tx-col-label label-to">TO</div>
                <div className="tx-addr" style={{ color: hovered ? "#ffffff" : "#4a5568" }}>
                    {shortenAddr(tx.to)}
                </div>
            </div>

            <div className="tx-amount-col">
                <div className="tx-col-label label-amount">AMOUNT</div>
                <div className="tx-amount" style={{ color: hovered ? "#ffffff" : "#4a5568" }}>
                    {formatEth(tx.amount)}
                    <span className="eth-label"> ETH</span>
                </div>
            </div>

            <div className="tx-gas-col">
                <div className="tx-col-label label-block">GAS</div>
                <div className="tx-gas" style={{ color: hovered ? "#ffffff" : "#4a5568" }}>
                    <Fuel size={15} color={hovered ? "#ffffff" : "#4a5568"} />
                    <span style={{ color: hovered ? "#f59e0b" : "#4a5568" }}>
                        ${tx.gasFeeUsd || "0.00"}
                    </span>
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
            <div className="empty-title">NO RECEIVED TRANSACTIONS FOUND</div>
            <div className="empty-sub">Transactions you receive will appear here</div>
        </div>
    )
}

export default function ReceivedPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [walletAddress, setWalletAddress] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem("wallet")
        if (saved) setWalletAddress(saved)
    }, [])

    useEffect(() => {
        const check = async () => {
            const token = sessionStorage.getItem("session")
            if (!token) {
                router.push("/enterpin")
                return
            }
            if (!window.ethereum) {
                router.push("/")
                return
            }
            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            if (!accounts || accounts.length === 0) {
                router.push("/")
                return
            }
            const address = accounts[0]
            try {
                const isRegistered = await checkIfRegistered(address)
                if (!isRegistered) {
                    router.push("/")
                    return
                }
                const hasPinSet = await checkHasPinSet(address)
                if (!hasPinSet) {
                    router.push("/setpin")
                    return
                }
                setWalletAddress(address)
                setChecking(false)
            } catch (e) {
                console.log(e)
                router.push("/")
            }
        }
        check()
    }, [])

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

    const receivedTxs = transactions.filter((tx) => Number(tx.txType) === 1)
    const totalEthReceived = receivedTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
    const totalGas = receivedTxs.reduce((sum, tx) => sum + parseFloat(tx.gasFeeUsd || 0), 0)

    return (
        <>
            <ShootingStars />
            <Navbar activeTab="received" setActiveTab={() => {}} />
            <div className="tx-page" style={{ paddingTop: "120px" }}>
                <div className="scan-beam" />

                <div className="tx-inner">
                    <div className="tx-header">
                        <div>
                            <div className="tx-title">RECEIVED TRANSACTIONS</div>
                            <div className="tx-subtitle">
                                {walletAddress
                                    ? `${shortenAddr(walletAddress)} · ${receivedTxs.length} records`
                                    : "connecting..."}
                            </div>
                        </div>
                        <div className="live-dot">LIVE</div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "20px",
                            marginBottom: "32px",
                        }}
                    >
                        <div style={{ width: "500px", flexShrink: 0 }}>
                            <StatCard
                                label="Total Received"
                                value={loading ? "—" : `${receivedTxs.length} txns`}
                                accent="#22c55e"
                                delay={0}
                                Icon={Download}
                            />
                        </div>
                        <div style={{ width: "500px", flexShrink: 0 }}>
                            <StatCard
                                label="ETH Received"
                                value={loading ? "—" : `${totalEthReceived.toFixed(4)} ETH`}
                                accent="#38bdf8"
                                delay={80}
                                Icon={Gem}
                            />
                        </div>
                    </div>

                    <div className="tx-table-header">
                        {["TYPE", "FROM", "", "TO", "AMOUNT", "GAS", "BLOCK", "TIME"].map(
                            (h, i) => (
                                <div key={i} className="th-label">
                                    {h}
                                </div>
                            ),
                        )}
                    </div>
                    <div className="tx-sep" />

                    {error && <div className="tx-error">{error}</div>}
                    {!error &&
                        loading &&
                        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                    {!error && !loading && receivedTxs.length === 0 && <EmptyState />}
                    {!error &&
                        !loading &&
                        receivedTxs.map((tx, i) => (
                            <TxRow
                                key={tx.hash || `${tx.from}-${tx.timeStamp}-${i}`}
                                tx={tx}
                                index={i}
                            />
                        ))}
                </div>
            </div>
        </>
    )
}
