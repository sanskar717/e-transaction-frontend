"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Fuel } from "lucide-react"
import { checkIfRegistered, checkHasPinSet } from "../../../config/contracts"
import Navbar from "../walletNavbar"
import ShootingStars from "../../../components/ShootingStars"
import "./gas.css"

function shortenAddr(addr) {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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

function GasRow({ tx, index }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60 + index * 50)
        return () => clearTimeout(t)
    }, [index])

    return (
        <div
            className="gas-row"
            style={{
                transform: visible ? "translateX(0)" : "translateX(-32px)",
                opacity: visible ? 1 : 0,
                transition: `transform 0.45s cubic-bezier(0.16,1,0.3,1) ${index * 35}ms, opacity 0.4s ease ${index * 35}ms`,
            }}
        >
            <div className="gas-cell gas-addr">
                <div className="gas-col-label">FROM</div>
                <div className="gas-addr-val">{shortenAddr(tx.from)}</div>
            </div>

            <div className="gas-cell gas-addr">
                <div className="gas-col-label">TO</div>
                <div className="gas-addr-val">{shortenAddr(tx.to)}</div>
            </div>

            <div className="gas-cell gas-fee">
                <div className="gas-col-label">GAS FEE</div>
                <div className="gas-fee-val">
                    <Fuel size={14} />${tx.gasFeeUsd || "0.00"}
                </div>
            </div>

            <div className="gas-cell gas-time">
                <div className="gas-col-label">TIME</div>
                <div className="gas-time-val">{timeAgo(tx.timeStamp)}</div>
            </div>
        </div>
    )
}

function GasSkeleton() {
    return (
        <div className="gas-skeleton-row">
            {[100, 100, 90, 80].map((w, i) => (
                <div key={i} className="gas-skeleton-cell" style={{ width: w }} />
            ))}
        </div>
    )
}

function EmptyGas() {
    return (
        <div className="gas-empty">
            <div className="gas-empty-icon">◈</div>
            <div className="gas-empty-title">NO SENT TRANSACTIONS FOUND</div>
            <div className="gas-empty-sub">Gas fees will appear here once you send ETH</div>
        </div>
    )
}

export default function GasPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [walletAddress, setWalletAddress] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cardVisible, setCardVisible] = useState(false)

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

    useEffect(() => {
        const t = setTimeout(() => setCardVisible(true), 100)
        return () => clearTimeout(t)
    }, [])

    // Sirf SENT transactions — receiver gas pay nahi karta
    const sentTxs = transactions.filter((tx) => Number(tx.txType) === 0)

    const totalGasUsd = sentTxs.reduce((sum, tx) => sum + parseFloat(tx.gasFeeUsd || 0), 0)

    return (
        <>
            <ShootingStars />
            <Navbar activeTab="gas" setActiveTab={() => {}} />
            <div className="gas-page" style={{ paddingTop: "120px" }}>
                <div className="gas-inner">
                    <div className="gas-header">
                        <div>
                            <div className="gas-title">TOTAL GAS FEES</div>
                            <div className="gas-subtitle">
                                {walletAddress
                                    ? `${shortenAddr(walletAddress)} · ${sentTxs.length} records`
                                    : "connecting..."}
                            </div>
                        </div>
                    </div>

                    <div className="gas-layout">
                        {/* LEFT — scrollable transaction list */}
                        <div className="gas-list-col">
                            <div className="gas-table-header">
                                <div className="gas-th">FROM</div>
                                <div className="gas-th">TO</div>
                                <div className="gas-th">GAS FEE</div>
                                <div className="gas-th">TIME</div>
                            </div>
                            <div className="gas-sep" />

                            {error && <div className="gas-error">{error}</div>}
                            {!error &&
                                loading &&
                                Array.from({ length: 6 }).map((_, i) => <GasSkeleton key={i} />)}
                            {!error && !loading && sentTxs.length === 0 && <EmptyGas />}
                            {!error &&
                                !loading &&
                                sentTxs.map((tx, i) => (
                                    <GasRow
                                        key={tx.hash || `${tx.from}-${tx.timeStamp}-${i}`}
                                        tx={tx}
                                        index={i}
                                    />
                                ))}
                        </div>

                        {/* RIGHT — sticky total card */}
                        <div className="gas-total-col">
                            <div
                                className="gas-total-card"
                                style={{
                                    transform: cardVisible
                                        ? "translateY(0) scale(1)"
                                        : "translateY(24px) scale(0.96)",
                                    opacity: cardVisible ? 1 : 0,
                                }}
                            >
                                <div className="gas-total-corner" />
                                <div className="gas-total-icon">
                                    <Fuel size={30} />
                                </div>
                                <div className="gas-total-label">
                                    TOTAL GAS YOU SPENT IN SENT TRANSACTIONS
                                </div>
                                <div className="gas-total-value">
                                    {loading ? "—" : `$${totalGasUsd.toFixed(4)}`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
