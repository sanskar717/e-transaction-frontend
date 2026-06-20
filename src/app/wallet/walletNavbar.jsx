"use client"
import { useState, useEffect } from "react"

export default function Navbar() {
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

    useEffect(() => {
        const saved = localStorage.getItem("wallet")

        if (saved && window.ethereum) {
            window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
                if (accounts.length > 0 && accounts[0].toLowerCase() === saved.toLowerCase()) {
                    setAccount(saved)
                } else {
                    localStorage.removeItem("wallet")
                }
            })
        }

        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length === 0) {
                    setAccount(null)
                    localStorage.removeItem("wallet")
                } else {
                    setAccount(accounts[0])
                    localStorage.setItem("wallet", accounts[0])
                }
            }

            window.ethereum.on("accountsChanged", handleAccountsChanged)

            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            }
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
                padding: "0 40px",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                borderBottom: "none",
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

            {account && (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                        className="animated-text"
                        style={{ fontSize: "17px", fontWeight: "900", letterSpacing: "3px" }}
                    >
                        CONNECTED-WALLET:&nbsp;
                    </span>
                    <div
                        style={{ display: "flex", cursor: "pointer" }}
                        onMouseEnter={() => setAddrHovered(true)}
                        onMouseLeave={() => setAddrHovered(false)}
                    >
                        {`${account.slice(0, 6)}...${account.slice(-4)}`.split("").map((l, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: "16px",
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
            )}
        </nav>
    )
}
