"use client"
import { useState } from "react"
import { Wallet, BarChart2, Fuel, Search, DollarSign, Lock } from "lucide-react"

const features = [
    {
        icon: Wallet,
        title: "Wallet Registration",
        desc: "Register your ETH wallet once and we automatically start tracking everything — no manual entry, no hassle.",
        color: "#38bdf8",
    },
    {
        icon: BarChart2,
        title: "Monthly Reports",
        desc: "Full monthly breakdown — how many transactions, how much ETH sent/received, and total gas spent. All in one place.",
        color: "#a78bfa",
    },
    {
        icon: Fuel,
        title: "Gas Fee Analytics",
        desc: "Every transaction's gas fee calculated in real-time and converted to USD using live ETH/USD rates. Know your real cost.",
        color: "#f59e0b",
    },
    {
        icon: Search,
        title: "Transaction Details",
        desc: "Full detail of every transaction — TX Hash, from/to address, value, gas used, gas price, and timestamp. All tracked.",
        color: "#22c55e",
    },
    {
        icon: DollarSign,
        title: "USD Cost Tracker",
        desc: "Exactly how many dollars you spent in gas fees — per transaction and total monthly. Perfect for smart budgeting.",
        color: "#ef4444",
    },
    {
        icon: Lock,
        title: "Private & Secure",
        desc: "Only you can see your data. Read-only access — we never make transactions, we only read public blockchain data.",
        color: "#38bdf8",
    },
]

function FeatureCard({ feature }) {
    const [hovered, setHovered] = useState(false)
    const Icon = feature.icon

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: "28px 24px",
                background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${hovered ? feature.color + "40" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "14px",
                cursor: "default",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(10px)",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    background: hovered
                        ? `linear-gradient(90deg, transparent, ${feature.color}, transparent)`
                        : "transparent",
                    transition: "all 0.3s ease",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(ellipse at top left, ${feature.color}08, transparent 60%)`,
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                    transition: "all 0.3s ease",
                    boxShadow: hovered ? `0 0 20px ${feature.color}30` : "none",
                }}
            >
                <Icon size={20} color={feature.color} strokeWidth={1.5} />
            </div>

            <div
                style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: hovered ? feature.color : "#94a3b8",
                    letterSpacing: "0.5px",
                    marginBottom: "10px",
                    fontFamily: "'Courier New', monospace",
                    transition: "color 0.3s ease",
                }}
            >
                {feature.title}
            </div>

            <div
                style={{
                    fontSize: "14px",
                    color: hovered ? "rgb(255, 255, 255)" : "rgba(255,255,255,0.35)",
                    lineHeight: "1.8",
                    fontFamily: "sans-serif",
                    fontWeight: "400",
                    letterSpacing: "0.3px",
                    transition: "color 0.3s ease",
                }}
            >
                {feature.desc}
            </div>
        </div>
    )
}

export default function FeaturesSection() {
    return (
            <div
                style={{
                    width: "100%",
                    maxWidth: "1100px",
                    margin: "100px auto 0",
                    padding: "0 40px",
                    position: "relative",
                    zIndex: 2,
                    fontFamily: "'Courier New', monospace",
                }}
            >
                <div
                    style={{
                        fontSize: "10px",
                        letterSpacing: "4px",
                        color: "#38bdf8",
                        marginBottom: "16px",
                    }}
                >
                    // PLATFORM FEATURES
                </div>

                <div
                    style={{
                        fontSize: "clamp(28px, 4vw, 48px)",
                        fontWeight: "900",
                        color: "#ffffff",
                        letterSpacing: "-1px",
                        marginBottom: "12px",
                        lineHeight: 1.2,
                    }}
                >
                    What Does This Platform Do?
                </div>

                <div
                    style={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.65)",
                        marginBottom: "48px",
                        lineHeight: "1.8",
                        maxWidth: "480px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "400",
                        letterSpacing: "0.3px",
                    }}
                >
                    Register your wallet once — everything else is automatic. Real blockchain data,
                    real-time USD conversion.
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "16px",
                    }}
                >
                    {features.map((f, i) => (
                        <FeatureCard key={i} feature={f} />
                    ))}
                </div>
            </div>
    )
}
