"use client"
import { useState, useEffect } from "react"
import ShootingStars from "../../components/ShootingStars"
import AnimateIn from "../../components/Animatein"
import HowItWorks from "./HowItWorks"
import LivePreview from "./LivePreview"
import StatsSection from "../StatsSection"
import FeaturesSection from "./FeaturesSection"
import Steps from "./Steps"
import { checkIfRegistered } from "../../config/contracts"
import { useRouter } from "next/navigation"
import "./landing.css"

export default function LandingPage() {
    const router = useRouter()
    const letters = ["E", "-", "W", "A", "L", "L", "E", "T"]
    const [hovered, setHovered] = useState(false)
    const [howHoverCAT, setHowHoverCAT] = useState(false)
    const [showHowItWorks, setShowHowItWorks] = useState(false)
    const [offsets] = useState(() =>
        letters.map((_, i) => ({
            x: (i - 3.5) * 5,
            y: (i % 2 === 0 ? -1 : 1) * 10,
            r: (i % 2 === 0 ? 1 : -1) * (8 + i * 2),
        })),
    )
    const [btnHover, setBtnHover] = useState(false)
    const [btnText, setBtnText] = useState("CONNECT WALLET")
    const [connecting, setConnecting] = useState(false)
    const [account, setAccount] = useState(null)
    const addrLetters = account
        ? `CONNECTED - WALLET: ${account.slice(0, 6)}...${account.slice(-4)}`.split("")
        : []
    const [addrHovered, setAddrHovered] = useState(false)
    const [addrOffsets] = useState(() =>
        Array.from({ length: 40 }, (_, i) => ({
            x: (i - 20) * 1,
            y: (i % 2 === 0 ? -1 : 1) * 10,
            r: (i % 2 === 0 ? 1 : -1) * (8 + i * 2),
        })),
    )

    const [showRegisterModal, setShowRegisterModal] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("wallet")

        if (saved && window.ethereum) {
            window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
                if (accounts.length > 0 && accounts[0].toLowerCase() === saved.toLowerCase()) {
                    setAccount(saved)
                    setBtnText("WALLET CONNECTED")
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
                    setBtnText("CONNECT WALLET")
                } else {
                    setAccount(accounts[0])
                    localStorage.setItem("wallet", accounts[0])
                    setBtnText("WALLET CONNECTED")
                }
            }

            window.ethereum.on("accountsChanged", handleAccountsChanged)

            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            }
        }
    }, [])

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Install MetaMask.")
            return
        }
        setConnecting(true)
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
            setAccount(accounts[0])
            setBtnText("WALLET CONNECTED")
            localStorage.setItem("wallet", accounts[0]) 

            const isRegistered = await checkIfRegistered(accounts[0])
            if (!isRegistered) {
                setShowRegisterModal(true)
            }
        } catch (e) {
            alert("Connection cancel")
        }
        setConnecting(false)
    }

    const disconnect = () => {
        setAccount(null)
        setBtnText("CONNECT WALLET")
        localStorage.removeItem("wallet")
    }

    useEffect(() => {
        if (showRegisterModal) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset" 
        }
    }, [showRegisterModal])

    return (
        <div
            style={{
                background: "#000000",
                minHeight: "50vh",
                color: "#f1f5f9",
                fontFamily: "'Courier New', monospace",
                overflowX: "hidden",
                position: "relative",
            }}
        >
            <ShootingStars />

            {showRegisterModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.85)",
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 999,
                    }}
                >
                    <div
                        style={{
                            background: "#0a0a0a",
                            border: "1px solid #a78bfa",
                            padding: "56px 48px",
                            textAlign: "center",
                            maxWidth: "460px",
                            borderRadius: "16px",
                            width: "90%",
                            position: "relative",
                            boxShadow: "0 0 40px rgba(167,139,250,0.15), 0 0 80px rgba(0,0,0,0.8)",
                        }}
                    >
                        {/* CROSS */}
                        <div
                            onClick={() => {
                                setShowRegisterModal(false)
                                router.push("/setpin")
                                disconnect()
                            }}
                            style={{
                                position: "absolute",
                                top: "20px",
                                right: "20px",
                                cursor: "pointer",
                                color: "#555",
                                fontSize: "18px",
                                fontWeight: "900",
                                fontFamily: "'Courier New', monospace",
                                transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) => (e.target.style.color = "#fff")}
                            onMouseLeave={(e) => (e.target.style.color = "#555")}
                        >
                            ✕
                        </div>

                        {/* TAG */}
                        <div
                            style={{
                                fontSize: "11px",
                                letterSpacing: "5px",
                                color: "#a78bfa",
                                marginBottom: "24px",
                                fontFamily: "'Courier New', monospace",
                            }}
                        >
                            // NOT REGISTERED
                        </div>

                        {/* TITLE */}
                        <h2
                            style={{
                                color: "#fff",
                                fontSize: "32px",
                                fontWeight: "900",
                                letterSpacing: "3px",
                                fontFamily: "'Courier New', monospace",
                                marginBottom: "16px",
                                lineHeight: 1.2,
                            }}
                        >
                            WALLET NOT
                            <br />
                            REGISTERED
                        </h2>

                        {/* DESC */}
                        <p
                            style={{
                                color: "#64748b",
                                fontSize: "14px",
                                lineHeight: "1.9",
                                marginBottom: "40px",
                                fontFamily: "'Courier New', monospace",
                                letterSpacing: "1px",
                            }}
                        >
                            Register your wallet to access full
                            <br />
                            transaction history & on-chain data.
                        </p>

                        {/* BUTTON */}
                        <div
                            onClick={() => {
                                setShowRegisterModal(false)
                                router.push("/setpin")
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.querySelector(".left-fill").style.transform =
                                    "translateX(-110%) skewX(-8deg)"
                                e.currentTarget.querySelector(".right-fill").style.transform =
                                    "translateX(110%) skewX(-8deg)"
                                e.currentTarget.querySelector(".btn-text").style.color = "#fff"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.querySelector(".left-fill").style.transform =
                                    "skewX(-8deg)"
                                e.currentTarget.querySelector(".right-fill").style.transform =
                                    "skewX(-8deg)"
                                e.currentTarget.querySelector(".btn-text").style.color = "#000"
                            }}
                            style={{
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: "8px",
                                border: "2px solid #fff",
                                cursor: "pointer",
                                padding: "16px 48px",
                                fontFamily: "'Courier New', monospace",
                                fontSize: "14px",
                                fontWeight: "900",
                                letterSpacing: "3px",
                                display: "inline-block",
                                userSelect: "none",
                            }}
                        >
                            <div
                                className="left-fill"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "-7%",
                                    width: "55%",
                                    height: "100%",
                                    background: "#fff",
                                    transform: "skewX(-8deg)",
                                    transition: "transform 0.5s ease",
                                    zIndex: 0,
                                }}
                            />
                            <div
                                className="right-fill"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: "-5%",
                                    width: "60%",
                                    height: "100%",
                                    background: "#fff",
                                    transform: "skewX(-8deg)",
                                    transition: "transform 0.5s ease",
                                    zIndex: 0,
                                }}
                            />
                            <span
                                className="btn-text"
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                    color: "#000",
                                    transition: "color 0.4s ease",
                                }}
                            >
                                REGISTER WALLET →
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {/* NAVBAR */}
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
                            {`${account.slice(0, 6)}...${account.slice(-4)}`
                                .split("")
                                .map((l, i) => (
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

            {/* HERO */}
            <section
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "130px 20px 60px",
                    position: "relative",
                    zIndex: 2,
                }}
            >
                <AnimateIn variant="fadeDown" delay={0.1}>
                    <h1
                        style={{
                            fontSize: "clamp(42px, 7vw, 80px)",
                            fontWeight: "900",
                            lineHeight: "1.15",
                            margin: 0,
                        }}
                    >
                        <span style={{ color: "#ffffff" }}>Track Every</span>
                        <br />
                        <span className="animated-text">Transaction</span>
                        <br />
                        <span style={{ color: "#ffffff" }}>Of Your Wallet.</span>
                    </h1>
                </AnimateIn>

                <AnimateIn variant="fadeUp" delay={0.2}>
                    <p
                        style={{
                            maxWidth: "520px",
                            margin: "32px auto 0",
                            fontSize: "15px",
                            lineHeight: "1.9",
                            color: "#64748b",
                            letterSpacing: "0.4px",
                        }}
                    >
                        Register your wallet once. Get full transaction history, monthly gas fees
                        in USD, and on-chain details — all in one place.{" "}
                        <span style={{ color: "#38bdf8" }}>you can see your data.</span>
                        <br />
                        <span style={{ color: "#dbf838" }}>&</span>
                        <br />
                        <span style={{ color: "#f83838" }}>Your app subscription key.</span>
                    </p>
                </AnimateIn>

                {/* BUTTONS*/}
                <AnimateIn variant="fadeUp" delay={0.4}>
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            justifyContent: "center",
                            marginTop: "40px",
                        }}
                    >
                        {/* BUTTON 1 */}
                        <div
                            onClick={account ? disconnect : connectWallet}
                            onMouseEnter={() => setBtnHover(true)}
                            onMouseLeave={() => setBtnHover(false)}
                            style={{
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: "8px",
                                border: "2px solid #fff",
                                cursor: "pointer",
                                padding: "14px 36px",
                                fontFamily: "serif",
                                fontSize: "14px",
                                fontWeight: "900",
                                letterSpacing: "2px",
                                color: btnHover ? "#fff" : "#000",
                                transition: "color 0.4s ease",
                                userSelect: "none",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "-7%",
                                    width: "55%",
                                    height: "100%",
                                    background: "#fff",
                                    transform: btnHover
                                        ? "translateX(-110%) skewX(-8deg)"
                                        : "skewX(-8deg)",
                                    transition: "transform 0.5s ease",
                                    zIndex: 0,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: "-5%",
                                    width: "60%",
                                    height: "100%",
                                    background: "#fff",
                                    transform: btnHover
                                        ? "translateX(110%) skewX(-8deg)"
                                        : "skewX(-8deg)",
                                    transition: "transform 0.5s ease",
                                    zIndex: 0,
                                }}
                            />
                            <span style={{ position: "relative", zIndex: 1 }}>
                                {connecting
                                    ? "CONNECTING..."
                                    : account
                                      ? `wallet~connected`
                                      : "CONNECT~WALLET →"}
                            </span>
                        </div>

                        {/* BUTTON 2 — Neon Pill */}
                        {/* <button className="how-btn">HOW IT WORKS</button> */}
                        <button className="how-btn" onClick={() => setShowHowItWorks(true)}>
                            HOW IT WORKS
                        </button>
                    </div>
                </AnimateIn>
                <AnimateIn variant="fadeUp" delay={0.3}>
                    {account && (
                        <p
                            style={{
                                marginLeft: "-250px",
                                color: "#ef4444",
                                fontSize: "12px",
                                fontFamily: "sans-serif",
                                marginTop: "8px",
                                cursor: "pointer",
                                letterSpacing: "1px",
                                textAlign: "center",
                                visibility: account ? "visible" : "hidden",
                            }}
                        >
                            press again to disconnect
                        </p>
                    )}
                </AnimateIn>
                <AnimateIn>
                    <LivePreview />
                </AnimateIn>
            </section>

            <HowItWorks isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

            <AnimateIn>
                <StatsSection />
            </AnimateIn>
            <AnimateIn>
                <FeaturesSection />
            </AnimateIn>

            <AnimateIn>
                <Steps />
            </AnimateIn>
            <AnimateIn>
                <div
                    style={{
                        width: "100%",

                        padding: "100px 50% 120px 1px",
                        textAlign: "center",
                        fontFamily: "'Courier New', monospace",
                        position: "relative",
                        zIndex: 3,
                    }}
                >
                    <div
                        style={{
                            fontSize: "11px",
                            letterSpacing: "4px",
                            color: "#a78bfa",
                            marginBottom: "24px",
                        }}
                    >
                        // GET STARTED
                    </div>

                    <div
                        style={{
                            fontSize: "clamp(32px, 5vw, 60px)",
                            fontWeight: "900",
                            color: "#ffffff",
                            marginBottom: "16px",
                            lineHeight: 1.2,
                        }}
                    >
                        Register Your Wallet
                        <br />
                        <span style={{ color: "#38bdf8" }}>And Start Tracking</span>
                    </div>

                    <div
                        style={{
                            fontSize: "14px",
                            color: "#ffffff",
                            marginBottom: "48px",
                            lineHeight: 1.8,
                        }}
                    >
                        Free. Private. No data sold.
                        <br />
                        Just your wallet's real on-chain picture.
                    </div>

                    <div
                        onClick={connectWallet}
                        onMouseEnter={() => setHowHoverCAT(true)}
                        onMouseLeave={() => setHowHoverCAT(false)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "16px 48px",
                            border: `2px solid ${howHoverCAT ? "#38bdf8" : "#fff"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "900",
                            letterSpacing: "2px",
                            position: "relative",
                            overflow: "hidden",
                            userSelect: "none",
                            transition: "border-color 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "-7%",
                                width: "55%",
                                height: "100%",
                                background: "#fff",
                                transform: howHoverCAT
                                    ? "translateX(-110%) skewX(-8deg)"
                                    : "skewX(-8deg)",
                                transition: "transform 0.5s ease",
                                zIndex: 0,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                right: "-5%",
                                width: "60%",
                                height: "100%",
                                background: "#fff",
                                transform: howHoverCAT
                                    ? "translateX(110%) skewX(-8deg)"
                                    : "skewX(-8deg)",
                                transition: "transform 0.5s ease",
                                zIndex: 0,
                            }}
                        />
                        <span
                            style={{
                                position: "relative",
                                zIndex: 1,
                                color: howHoverCAT ? "#fff" : "#000",
                                transition: "color 0.3s ease",
                            }}
                        >
                            {btnText}
                        </span>
                    </div>
                </div>
            </AnimateIn>
        </div>
    )
}
