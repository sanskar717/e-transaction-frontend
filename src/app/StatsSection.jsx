"use client"
import { useState, useEffect, useRef } from "react"

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
                        setVal(Math.floor((target * step) / total))
                        if (step >= total) clearInterval(timer)
                    }, 20)
                }
            },
            { threshold: 0.1 },
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [target])

    return (
        <span ref={ref}>
            {prefix}
            {val.toLocaleString()}
            {suffix}
        </span>
    )
}

const stats = [
    { label: "WALLETS REGISTERED", value: 12840, prefix: "", suffix: "+" },
    { label: "TRANSACTIONS TRACKED", value: 948200, prefix: "", suffix: "+" },
    { label: "GAS FEES CALCULATED", value: 284000, prefix: "$", suffix: "+" },
    { label: "NETWORKS SUPPORTED", value: 1, prefix: "", suffix: "" },
]

function StatCard({ label, value, prefix, suffix, isLast, index }) {
    const [hovered, setHovered] = useState(false)

    const accentColors = ["#38bdf8", "#a78bfa", "#f59e0b", "#22c55e"]
    const accent = accentColors[index % accentColors.length]

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flex: 1,
                padding: "48px 28px",
                textAlign: "center",
                cursor: "default",
                position: "relative",
                transition: "all 0.4s ease",
                background: hovered
                    ? `rgba(${index === 0 ? "56,189,248" : index === 1 ? "167,139,250" : index === 2 ? "245,158,11" : "34,197,94"},0.05)`
                    : "rgba(0,0,0,0.2)",
                backdropFilter: "blur(12px)",
                borderRight: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
                overflow: "hidden",
            }}
        >
            {/* top accent line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: hovered ? "0%" : "50%",
                    width: hovered ? "100%" : "0%",
                    height: "1px",
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    transition: "all 0.5s ease",
                }}
            />

            {/* bottom accent line */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: hovered ? "0%" : "50%",
                    width: hovered ? "100%" : "0%",
                    height: "1px",
                    background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
                    transition: "all 0.5s ease",
                }}
            />

            {/* corner dots */}
            <div
                style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: hovered ? accent : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    boxShadow: hovered ? `0 0 8px ${accent}` : "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: hovered ? accent : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    boxShadow: hovered ? `0 0 8px ${accent}` : "none",
                }}
            />

            {/* index number */}
            <div
                style={{
                    position: "absolute",
                    top: "14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "9px",
                    letterSpacing: "3px",
                    color: hovered ? accent : "rgba(255,255,255,0.1)",
                    fontFamily: "'Courier New', monospace",
                    transition: "all 0.3s ease",
                }}
            >
                {String(index + 1).padStart(2, "0")}
            </div>

            {/* main number */}
            <div
                style={{
                    fontSize: "clamp(28px, 3.5vw, 48px)",
                    fontWeight: "900",
                    color: hovered ? accent : "#ffffff",
                    letterSpacing: "-1px",
                    fontFamily: "'Courier New', monospace",
                    textShadow: hovered
                        ? `0 0 40px ${accent}80`
                        : "0 0 20px rgba(255,255,255,0.1)",
                    transition: "all 0.3s ease",
                    position: "relative",
                    zIndex: 1,
                    marginTop: "8px",
                }}
            >
                <AnimatedNum target={value} prefix={prefix} suffix={suffix} />
            </div>

            {/* label */}
            <div
                style={{
                    fontSize: "10px",
                    color: hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                    letterSpacing: "3px",
                    marginTop: "12px",
                    fontFamily: "'Courier New', monospace",
                    transition: "color 0.3s ease",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {label}
            </div>

            {/* hover glow bg */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 100%, ${accent}08, transparent 70%)`,
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.4s ease",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

export default function StatsSection() {
    return (
        <div
            style={{
                width: "100%",
                margin: "80px 0 0",
                position: "relative",
                zIndex: 2,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {/* top label */}
            <div
                style={{
                    position: "absolute",
                    top: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#000",
                    padding: "0 16px",
                    fontSize: "9px",
                    letterSpacing: "4px",
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: "nowrap",
                }}
            >
                // PLATFORM STATS
            </div>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "stretch",
                }}
            >
                {stats.map((s, i) => (
                    <StatCard
                        key={i}
                        index={i}
                        label={s.label}
                        value={s.value}
                        prefix={s.prefix}
                        suffix={s.suffix}
                        isLast={i === stats.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}
