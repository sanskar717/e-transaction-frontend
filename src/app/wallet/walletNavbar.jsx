"use client"
import { useState, useEffect } from "react"
import "../landing/landing.css"
import { getUserProfile } from "../../config/contracts"
import { useRouter } from "next/navigation"

const navItems = [
    { label: "Transactions", key: "transactions", color: "#38bdf8" },
    { label: "Sent", key: "sent", color: "#ef4444" },
    { label: "Received", key: "received", color: "#22c55e" },
    { label: "Total Gas Fees", key: "gas", color: "#f59e0b" },
    { label: "Subscription", key: "subscription", color: "#a78bfa" },
    { label: "Account", key: "account", color: "#ffffff" },
]

export default function Navbar({ activeTab, setActiveTab }) {
    const router = useRouter()
    const letters = ["E", "-", "W", "A", "L", "L", "E", "T"]
    const [hovered, setHovered] = useState(false)
    const [offsets] = useState(() =>
        letters.map((_, i) => ({
            x: (i - 3.5) * 5,
            y: (i % 2 === 0 ? -1 : 1) * 10,
            r: (i % 2 === 0 ? 1 : -1) * (8 + i * 2),
        })),
    )
    const [account, setAccount] = useState(null)
    const [addrHovered, setAddrHovered] = useState(false)
    const [addrOffsets] = useState(() =>
        Array.from({ length: 40 }, (_, i) => ({
            x: (i - 20) * 1,
            y: (i % 2 === 0 ? -1 : 1) * 10,
            r: (i % 2 === 0 ? 1 : -1) * (8 + i * 2),
        })),
    )
    const [userHovered, setUserHovered] = useState(false)
    const [userOffsets] = useState(() =>
        Array.from({ length: 30 }, (_, i) => ({
            x: (i - 15) * 0.5,
            y: (i % 2 === 0 ? -1 : 1) * 3,
            r: (i % 2 === 0 ? 1 : -1) * 3,
        })),
    )
    const [userName, setUserName] = useState(null)
    const [hoveredTab, setHoveredTab] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem("wallet")
        if (saved && window.ethereum) {
            window.ethereum.request({ method: "eth_accounts" }).then(async (accounts) => {
                if (accounts.length > 0 && accounts[0].toLowerCase() === saved.toLowerCase()) {
                    setAccount(saved)
                    try {
                        const profile = await getUserProfile(saved)
                        setUserName(profile.userName)
                    } catch (e) {
                        console.log("profile error:", e)
                    }
                } else {
                    localStorage.removeItem("wallet")
                }
            })
        }
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length === 0) {
                    setAccount(null)
                    setUserName(null)
                    localStorage.removeItem("wallet")
                } else {
                    setAccount(accounts[0])
                    localStorage.setItem("wallet", accounts[0])
                    getUserProfile(accounts[0])
                        .then((p) => setUserName(p.userName))
                        .catch((e) => console.log(e))
                }
            }
            window.ethereum.on("accountsChanged", handleAccountsChanged)
            return () => window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        }
    }, [])

    return (
        <nav
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
            }}
        >
            {/* TOP ROW — Logo + Wallet */}
            <div
                style={{
                    padding: "0 40px",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* LOGO */}
                <div
                    style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {letters.map((l, i) => (
                        <span
                            key={i}
                            style={{
                                fontSize: "20px",
                                fontWeight: "900",
                                letterSpacing: "3px",
                                color: l === "-" ? "#ff6b35" : "#fff",
                                display: "inline-block",
                                transition: "transform 0.4s ease",
                                transform: hovered
                                    ? `translate(${offsets[i].x}px, ${offsets[i].y}px) rotate(${offsets[i].r}deg)`
                                    : "translate(0,0) rotate(0deg)",
                            }}
                        >
                            {l}
                        </span>
                    ))}
                </div>

                {/* WALLET + USERNAME */}
                {account && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <span
                                className="animated-text"
                                style={{
                                    fontSize: "15px",
                                    fontWeight: "900",
                                    letterSpacing: "3px",
                                }}
                            >
                                CONNECTED-WALLET:&nbsp;
                            </span>
                            <div
                                style={{ display: "flex", cursor: "pointer" }}
                                onMouseEnter={() => setAddrHovered(true)}
                                onMouseLeave={() => setAddrHovered(false)}
                            >
                                {`${account.slice(0, 6)}...${account.slice(-4)}`
                                    .split("")
                                    .map((l, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "900",
                                                letterSpacing: "3px",
                                                color: "#fff",
                                                display: "inline-block",
                                                transition: "transform 0.4s ease",
                                                transform: addrHovered
                                                    ? `translate(${addrOffsets[i]?.x}px, ${addrOffsets[i]?.y}px) rotate(${addrOffsets[i]?.r}deg)`
                                                    : "translate(0,0) rotate(0deg)",
                                            }}
                                        >
                                            {l}
                                        </span>
                                    ))}
                            </div>
                        </div>

                        {userName && (
                            <div
                                style={{ display: "flex", alignItems: "center", marginTop: "2px" }}
                            >
                                <span
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: "900",
                                        letterSpacing: "3px",
                                        color: "white",
                                        fontFamily: "'Courier New', monospace",
                                    }}
                                >
                                    USERNAME:&nbsp;
                                </span>
                                <div
                                    style={{ display: "flex", cursor: "pointer" }}
                                    onMouseEnter={() => setUserHovered(true)}
                                    onMouseLeave={() => setUserHovered(false)}
                                >
                                    {userName.split("").map((l, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                fontSize: "15   px",
                                                fontWeight: "900",
                                                letterSpacing: "3px",
                                                color: "#ff6b35",
                                                display: "inline-block",
                                                transition: "transform 0.4s ease",
                                                transform: userHovered
                                                    ? `translate(${userOffsets[i]?.x}px, ${userOffsets[i]?.y}px) rotate(${userOffsets[i]?.r}deg)`
                                                    : "translate(0,0) rotate(0deg)",
                                            }}
                                        >
                                            {l}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOTTOM ROW — Tabs */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 40px",
                    overflowX: "auto",
                }}
            >
                {navItems.map((item) => {
                    const isActive = activeTab === item.key
                    const isHovered = hoveredTab === item.key

                    return (
                        <div
                            key={item.key}
                            onClick={() => {
                                if (item.key === "account") {
                                    router.push("/wallet/account")
                                } else if (item.key === "sent") {
                                    router.push("/wallet/sent")
                                } else if (item.key === "received") {
                                    router.push("/wallet/received")
                                } else if (item.key === "transactions") {
                                    router.push("/wallet")
                                } else if (item.key === "gas") {
                                    router.push("/wallet/gas")
                                } else if (item.key === "subscription") {
                                    router.push("/wallet/subscription")
                                } else {
                                    setActiveTab(item.key)
                                }
                            }}
                            onMouseEnter={() => setHoveredTab(item.key)}
                            onMouseLeave={() => setHoveredTab(null)}
                            style={{
                                padding: "16px 28px",
                                fontSize: "12px",
                                letterSpacing: "3px",
                                fontWeight: "900",
                                cursor: "pointer",
                                position: "relative",
                                whiteSpace: "nowrap",
                                color:
                                    isActive || isHovered ? item.color : "rgba(255,255,255,0.25)",
                                transition: "color 0.2s ease",
                                userSelect: "none",
                                fontFamily: "'Courier New', monospace",
                                textShadow:
                                    isActive || isHovered
                                        ? `0 0 20px ${item.color}, 0 0 40px ${item.color}88`
                                        : "none",
                            }}
                        >
                            {item.label}

                            {/* Neon bottom line */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: isHovered || isActive ? "0%" : "50%",
                                    width: isHovered || isActive ? "100%" : "0%",
                                    height: "2px",
                                    background: item.color,
                                    boxShadow:
                                        isHovered || isActive
                                            ? `0 0 8px ${item.color}, 0 0 20px ${item.color}`
                                            : "none",
                                    transition: "all 0.3s ease",
                                }}
                            />

                            {/* Neon glow bottom */}
                            {(isHovered || isActive) && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: "50px",
                                        background: `linear-gradient(to top, ${item.color}15, transparent)`,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </nav>
    )
}
