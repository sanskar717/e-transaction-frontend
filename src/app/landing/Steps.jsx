"use client"
import { useState } from "react"
import { Wallet, ClipboardList, Link, LayoutDashboard } from "lucide-react"

const steps = [
    {
        num: "01",
        title: "Wallet Connect",
        desc: "Connect MetaMask or any EVM wallet. Your private key is never shared.",
        color: "#38bdf8",
        icon: <Wallet size={28} />,
    },
    {
        num: "02",
        title: "Register",
        desc: "Register your wallet address once. Our backend stores it automatically.",
        color: "#a78bfa",
        icon: <ClipboardList size={28} />,
    },
    {
        num: "03",
        title: "Auto Tracking",
        desc: "All your transactions are fetched automatically via Etherscan/Alchemy API.",
        color: "#f59e0b",
        icon: <Link size={28} />,
    },
    {
        num: "04",
        title: "View Dashboard",
        desc: "Monthly summary, gas fees in USD, transaction history — all in one clean dashboard.",
        color: "#22c55e",
        icon: <LayoutDashboard size={28} />,
    },
]

const gasTxns = [
    { hash: "0x3f8a...c21b", eth: "0.000421 ETH", usd: "$1.37" },
    { hash: "0x7d2e...f09a", eth: "0.000289 ETH", usd: "$0.94" },
    { hash: "0x1c5b...8e3d", eth: "0.000710 ETH", usd: "$2.31" },
    { hash: "0x9a4c...2f7e", eth: "0.000195 ETH", usd: "$0.63" },
]

function StepCard({ step, index }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flex: 1,
                minWidth: 0,
                padding: "36px 28px",
                background: hovered ? `${step.color}08` : "rgba(255,255,255,0.02)",
                border: `1px solid ${hovered ? step.color + "40" : "rgba(255,255,255,0.06)"}`,

                borderRadius: "16px",
                position: "relative",
                overflow: "hidden",
                cursor: "default",
                transition: "all 0.4s ease",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: hovered ? "0%" : "50%",
                    width: hovered ? "100%" : "0%",
                    height: "2px",
                    background: step.color,
                    transition: "all 0.5s ease",
                }}
            />
            <div
                style={{
                    fontSize: "48px",
                    fontWeight: "900",
                    color: hovered ? step.color : "rgba(255,255,255,0.06)",
                    fontFamily: "'Courier New', monospace",
                    lineHeight: 1,
                    marginBottom: "24px",
                    transition: "color 0.4s ease",
                }}
            >
                {step.num}
                <div
                    style={{
                        color: hovered ? step.color : "#475569",
                        marginBottom: "16px",
                        transition: "color 0.4s ease",
                    }}
                >
                    {step.icon}
                </div>
            </div>
            <div
                style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: hovered ? step.color : "#94a3b8",
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "1px",
                    marginBottom: "14px",
                    transition: "color 0.4s ease",
                }}
            >
                {step.title}
            </div>
            <div
                style={{
                    fontSize: "14px",
                    color: hovered ? "#ffffff" : "#475569",
                    lineHeight: "1.8",
                    fontFamily: "sans-serif",
                    transition: "color 0.4s ease",
                }}
            >
                {step.desc}
            </div>
            {index < steps.length - 1 && (
                <div
                    style={{
                        position: "absolute",
                        right: "-14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: hovered ? step.color : "rgba(255,255,255,0.1)",
                        fontSize: "20px",
                        zIndex: 10,
                        transition: "color 0.4s ease",
                    }}
                >
                    ›
                </div>
            )}
        </div>
    )
}

function GasSection() {
    const [hoveredRow, setHoveredRow] = useState(null)

    return (
        <div
            style={{
                display: "flex",
                gap: "80px",
                alignItems: "center",
                maxWidth: "1100px",
                margin: "120px auto 0",
                fontFamily: "'Courier New', monospace",
            }}
        >
            {/* LEFT */}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontSize: "11px",
                        letterSpacing: "4px",
                        color: "#a78bfa",
                        marginBottom: "16px",
                    }}
                >
                    // GAS FEE TRACKER
                </div>
                <div
                    style={{
                        fontSize: "clamp(28px, 4vw, 48px)",
                        fontWeight: "900",
                        color: "#ffffff",
                        marginBottom: "24px",
                        lineHeight: 1.2,
                    }}
                >
                    Exactly How Much Did <span style={{ color: "#f59e0b" }}>Gas</span> Cost You?
                </div>
                <div
                    style={{
                        fontSize: "13px",
                        color: "#475569",
                        lineHeight: "1.9",
                        marginBottom: "40px",
                    }}
                >
                    Every transaction costs gas. We calculate gas units × gas price, then apply the
                    live ETH/USD rate to show your exact dollar spend.
                </div>

                {[
                    { left: "Gas Used × Gas Price", right: "= Gas Fee (ETH)", color: "#38bdf8" },
                    {
                        left: "Gas Fee (ETH) × ETH/USD",
                        right: "= Gas Fee (USD)",
                        color: "#a78bfa",
                    },
                    { left: "Sum of all months", right: "= Total Spent", color: "#22c55e" },
                ].map((row, i) => (
                    <div
                        key={i}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 20px",
                            background:
                                hoveredRow === i ? `${row.color}10` : "rgba(255,255,255,0.02)",
                            border: `1px solid ${hoveredRow === i ? row.color + "40" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "8px",
                            marginBottom: "8px",
                            fontSize: "12px",
                            cursor: "default",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <span
                            style={{
                                color: hoveredRow === i ? "#ffffff" : "#64748b",
                                transition: "color 0.3s",
                            }}
                        >
                            {row.left}
                        </span>
                        <span style={{ color: row.color, fontWeight: "700" }}>{row.right}</span>
                    </div>
                ))}
            </div>

            {/* RIGHT */}
            <div
                style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "16px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        fontSize: "10px",
                        letterSpacing: "3px",
                        color: "#a78bfa",
                    }}
                >
                    MAY 2026 — GAS REPORT
                </div>

                {gasTxns.map((tx, i) => (
                    <div
                        key={i}
                        onMouseEnter={() => setHoveredRow(i + 10)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 24px",
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            fontSize: "12px",
                            background:
                                hoveredRow === i + 10 ? "rgba(245,158,11,0.05)" : "transparent",
                            borderLeft:
                                hoveredRow === i + 10
                                    ? "2px solid #f59e0b"
                                    : "2px solid transparent",
                            transition: "all 0.2s ease",
                            cursor: "default",
                        }}
                    >
                        <span
                            style={{
                                color: hoveredRow === i + 10 ? "#ffffff" : "#475569",
                                transition: "color 0.2s",
                            }}
                        >
                            {tx.hash}
                        </span>
                        <span
                            style={{
                                color: hoveredRow === i + 10 ? "#ef4444" : "#334155",
                                fontSize: "13px",
                                fontFamily: "serif",
                                textShadow:
                                    hoveredRow === i + 10
                                        ? "0 0 10px rgba(239,68,68,0.6)"
                                        : "none",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {tx.eth}
                        </span>
                        <span style={{ color: "#f59e0b", fontWeight: "700" }}>{tx.usd}</span>
                    </div>
                ))}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px 24px",
                        background: "rgba(245,158,11,0.06)",
                        borderTop: "1px solid rgba(245,158,11,0.2)",
                    }}
                >
                    <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#64748b" }}>
                        TOTAL GAS THIS MONTH
                    </span>
                    <span style={{ fontSize: "24px", fontWeight: "900", color: "#f59e0b" }}>
                        $31.40
                    </span>
                </div>
            </div>
        </div>
    )
}

export default function Steps() {
    return (
        <div
            style={{
                width: "100%",
                padding: "80px 40px",
                boxSizing: "border-box",
                background: "transparent",
                position: "relative",
                zIndex: 3,
            }}
        >
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div
                    style={{
                        fontSize: "11px",
                        letterSpacing: "4px",
                        color: "#38bdf8",
                        marginBottom: "16px",
                        fontFamily: "'Courier New', monospace",
                    }}
                >
                    // HOW IT WORKS
                </div>
                <div
                    style={{
                        fontSize: "clamp(28px, 4vw, 48px)",
                        fontWeight: "900",
                        color: "#ffffff",
                        marginBottom: "48px",
                        fontFamily: "'Courier New', monospace",
                    }}
                >
                    Get Started in 4 Steps
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
                    {steps.map((step, i) => (
                        <StepCard key={i} step={step} index={i} />
                    ))}
                </div>
            </div>
            <GasSection />
        </div>
    )
}
