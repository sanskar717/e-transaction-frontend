"use client"
import { useState, useEffect, useRef } from "react"
import { Fuel } from "lucide-react"

const mockTxns = [
    {
        hash: "0x64fa...b3c2 → 0x374d...6445",
        type: "SEND",
        eth: "0.25",
        gas: "$1.82",
        time: "2 min ago",
        block: "19,842,301",
    },
    {
        hash: "0xa31d...7e9f → 0xc82f...1d3b",
        type: "RECEIVE",
        eth: "1.00",
        gas: "$0.94",
        time: "1 hr ago",
        block: "19,841,988",
    },
    {
        hash: "0xf72c...1d4a → 0x9b3e...4f7c",
        type: "SEND",
        eth: "0.08",
        gas: "$2.31",
        time: "3 hrs ago",
        block: "19,841,204",
    },
    {
        hash: "0x2b89...c56e → 0xe14a...8d2f",
        type: "RECEIVE",
        eth: "0.50",
        gas: "$1.10",
        time: "5 hrs ago",
        block: "19,840,891",
    },
    {
        hash: "0x9e3a...48bf → 0x5d7c...b391",
        type: "SEND",
        eth: "0.73",
        gas: "$3.12",
        time: "8 hrs ago",
        block: "19,840,412",
    },
    {
        hash: "0xd14f...92a7 → 0x7f2e...c84d",
        type: "RECEIVE",
        eth: "2.15",
        gas: "$0.88",
        time: "12 hrs ago",
        block: "19,839,774",
    },
    {
        hash: "0x5c2e...f103 → 0x3a9b...d56e",
        type: "SEND",
        eth: "0.04",
        gas: "$1.45",
        time: "1 day ago",
        block: "19,838,201",
    },
]

function AnimatedNum({ target, prefix = "", suffix = "" }) {
    const [val, setVal] = useState(0)
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let step = 0
                    const total = 60
                    const timer = setInterval(() => {
                        step++
                        setVal(parseFloat(((target * step) / total).toFixed(2)))
                        if (step >= total) clearInterval(timer)
                    }, 25)
                }
            },
            { threshold: 0.3 },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [target])

    return (
        <span ref={ref}>
            {prefix}
            {typeof target === "number" && !Number.isInteger(target)
                ? val.toFixed(2)
                : Math.floor(val)}
            {suffix}
        </span>
    )
}

function TxRow({ tx }) {
    const [hovered, setHovered] = useState(false)
    const isOut = tx.type === "SEND"
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "grid",
                gridTemplateColumns: "2fr 80px 100px 80px 100px 80px 30px",
                alignItems: "center",
                padding: "14px 20px",
                background: hovered ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.015)",
                borderTop: `1px solid ${hovered ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.04)"}`,
                borderRight: `1px solid ${hovered ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.04)"}`,
                borderBottom: `1px solid ${hovered ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.04)"}`,
                borderLeft: `3px solid ${isOut ? "#ef4444" : "#22c55e"}`,
                borderRadius: "8px",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
        >
            <span
                style={{
                    fontSize: "12px",
                    color: hovered ? "#38bdf8" : "#f1f5f9",
                    transition: "color 0.2s",
                }}
            >
                {tx.hash}
            </span>

            <span
                style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "9px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    background: isOut ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                    color: isOut ? "#ef4444" : "#22c55e",
                    border: `1px solid ${isOut ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                    textAlign: "center",
                    display: "block",
                    margin: "0 auto",
                    width: "fit-content",
                }}
            >
                {tx.type}
            </span>

            <span style={{ fontSize: "13px", color: "#f1f5f9", fontWeight: "700" }}>
                {tx.eth} ETH
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Fuel size={15} color="#f8f8f8" />
                <span style={{ fontSize: "14px", fontFamily: "serif", color: "#f59e0b" }}>
                    {tx.gas}
                </span>
            </div>
            <span style={{ fontSize: "11px", color: "#475569" }}>#{tx.block}</span>
            <span style={{ fontSize: "13px", color: "#ffffff", fontWeight: "600" }}>
                {tx.time}
            </span>
            <span style={{ color: "#22c55e", fontSize: "14px" }}>✓</span>
        </div>
    )
}

function PreviewCard({ s }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: "20px",
                background: hovered ? "#000000" : "rgba(255,255,255,0.02)",
                border: `1px solid ${s.color}25`,
                borderRadius: "12px",
                borderTop: hovered ? "2px solid transparent" : `2px solid ${s.color}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: hovered ? `0 0 0 1px ${s.color}` : "none",
            }}
        >
            <div style={{
                position: "absolute",
                top: hovered ? "-4px" : "0px",
                left: 0,
                width: "100%",
                height: "2px",
                background: s.color,
                opacity: hovered ? 0 : 1,
                transition: "top 0.4s ease, opacity 0.4s ease",
            }} />
            
            <div
                style={{
                    fontSize: "clamp(20px,2.5vw,28px)",
                    fontWeight: "900",
                    color: s.color,
                    textShadow: `0 0 20px ${s.color}50`,
                }}
            >
                <AnimatedNum target={s.value} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <div
                style={{
                    fontSize: "9px",
                    color: hovered ? "#ffffff" : "#475569",
                    letterSpacing: "2px",
                    marginTop: "6px",
                    transition: "color 0.3s ease",
                }}
            >
                {s.label}
            </div>
        </div>
    )
}

export default function LivePreview() {
    return (
        <div
            style={{
                width: "100%",
                maxWidth: "960px",
                margin: "56px auto 0",
                position: "relative",
                zIndex: 2,
                fontFamily: "'Courier New', monospace",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        height: "1px",
                        flex: 1,
                        background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.3))",
                    }}
                />
                <span style={{ fontSize: "10px", letterSpacing: "4px", color: "#38bdf8" }}>
                    // DEMO TRANSACTION PREVIEW
                </span>
                <div
                    style={{
                        height: "1px",
                        flex: 1,
                        background: "linear-gradient(90deg, rgba(56,189,248,0.3), transparent)",
                    }}
                />
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: "14px",
                    marginBottom: "20px",
                }}
            >
                {[
                    { label: "TRANSACTIONS", value: 24, prefix: "", suffix: "", color: "#38bdf8" },
                    { label: "TOTAL GAS", value: 31.4, prefix: "$", suffix: "", color: "#f59e0b" },
                    {
                        label: "ETH MOVED",
                        value: 3.82,
                        prefix: "",
                        suffix: " ETH",
                        color: "#a78bfa",
                    },
                    {
                        label: "SUCCESS RATE",
                        value: 98,
                        prefix: "",
                        suffix: "%",
                        color: "#22c55e",
                    },
                ].map((s, i) => (
                    <PreviewCard key={i} s={s} />
                ))}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 80px 100px 80px 100px 80px 30px",
                    padding: "8px 20px",
                    gap: "8px",
                    marginBottom: "6px",
                }}
            >
                {["TX HASH", "TYPE", "AMOUNT", "GAS", "BLOCK", "TIME", ""].map((h, i) => (
                    <div
                        key={i}
                        style={{
                            fontSize: "12px",
                            fontFamily: "serif",
                            color: "#ffffff",
                            letterSpacing: "2px",
                        }}
                    >
                        {h}
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {mockTxns.map((tx, i) => (
                    <TxRow key={i} tx={tx} />
                ))}
            </div>

            <div
                style={{
                    marginTop: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#76ec36",
                    letterSpacing: "2px",
                }}
            >
                DEMO DATA — CONNECT WALLET TO SEE REAL TRANSACTIONS
            </div>
        </div>
    )
}
