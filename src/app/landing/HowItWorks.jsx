"use client"
import { useEffect } from "react"
import { Wallet, FileText, BarChart2, Fuel } from "lucide-react"
const steps = [
    {
        num: "01",
        title: "Connect Wallet",
        desc: "Connect MetaMask or any EVM wallet in one click. No sign up needed.",
        icon: <Wallet size={28} color="#ffffff" />,
    },
    {
        num: "02",
        title: "Register Address",
        desc: "Your wallet address gets registered. No private keys required — read only.",
        icon: <FileText size={28} color="#ffffff" />,
    },
    {
        num: "03",
        title: "Track Transactions",
        desc: "Every transaction is automatically tracked — incoming and outgoing both.",
        icon: <BarChart2 size={28} color="#ffffff" />,
    },
    {
        num: "04",
        title: "Gas Fees in USD",
        desc: "Every transaction gas fee calculated in USD using real-time ETH price.",
        icon: <Fuel size={28} color="#ffffff" />,
    },
]

export default function HowItWorks({ isOpen, onClose }) {
    useEffect(() => {
        const fn = (e) => e.key === "Escape" && onClose()
        window.addEventListener("keydown", fn)
        return () => window.removeEventListener("keydown", fn)
    }, [onClose])

    return (
        <>
            {/* Dark overlay */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 200,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "all" : "none",
                    transition: "opacity 0.4s ease",
                }}
            />

            {/* Side Panel */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    width: "min(420px, 100vw)",
                    height: "100vh",
                    background: "#050505",
                    border: "1px solid rgba(168,85,247,0.2)",
                    zIndex: 201,
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    overflowY: "auto",
                    padding: "40px 32px",
                    fontFamily: "'Courier New', monospace",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "10px",
                                letterSpacing: "3px",
                                color: "hsl(250,66%,61%)",
                                marginBottom: "6px",
                            }}
                        >
                            // HOW IT WORKS
                        </div>
                        <div
                            style={{
                                fontSize: "22px",
                                fontWeight: "900",
                                color: "#fff",
                                letterSpacing: "1px",
                                fontFamily: "Georgia, serif",
                            }}
                        >
                            4 Simple Steps
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "50%",
                            width: "36px",
                            height: "36px",
                            color: "#64748b",
                            cursor: "pointer",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                padding: "16px 20px",
                                background: "rgba(168,85,247,0.04)",
                                border: "1px solid rgba(168,85,247,0.15)",
                                borderRadius: "12px",
                                transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.borderColor = "rgba(168,85,247,0.15)")
                            }
                        >
                            <div
                                style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
                            >
                                <div style={{ marginRight: "4px" }}>{s.icon}</div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "hsl(250,80%,75%)",
                                            letterSpacing: "2px",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        STEP {s.num}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            color: "#ffffff",
                                            marginBottom: "8px",
                                            fontFamily: "Georgia, serif",
                                        }}
                                    >
                                        {s.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#cbd5e1",
                                            lineHeight: "1.8",
                                            fontFamily: "Georgia, serif",
                                        }}
                                    >
                                        {s.desc}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom note */}
                <div
                    style={{
                        marginTop: "32px",
                        padding: "16px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.05)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#ffffff",
                            letterSpacing: "0.5px",
                            lineHeight: "1.7",
                        }}
                    >
                        Non-custodial • No private keys • Read-only access
                    </div>
                </div>
            </div>
        </>
    )
}
