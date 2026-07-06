"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import ShootingStars from "../../components/ShootingStars"
import { checkIfRegistered, checkHasPinSet } from "../../config/contracts"
import "../setpin/Setpin.css"

export default function EnterPinPage() {
    const router = useRouter()
    const [pin, setPin] = useState(["", "", "", "", ""])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [shake, setShake] = useState(false)
    const [showPin, setShowPin] = useState(false)
    const [btnHover, setBtnHover] = useState(false)
    const inputRefs = useRef([])

    useEffect(() => {
        const check = async () => {
            if (!window.ethereum) {
                router.push("/")
                return
            }

            try {
                const accounts = await window.ethereum.request({ method: "eth_accounts" })
                if (!accounts || accounts.length === 0) {
                    router.push("/")
                    return
                }
                const address = accounts[0]
                const isRegistered = await checkIfRegistered(address)

                if (!isRegistered) {
                    router.push("/setpin")
                    return
                }

                const hasPinSet = await checkHasPinSet(address)

                if (!hasPinSet) {
                    router.push("/setpin")
                    return
                }

                setChecking(false)
                setTimeout(() => inputRefs.current[0]?.focus(), 200)
            } catch (e) {
                console.log("check error:", e)
                setChecking(false)
                setTimeout(() => inputRefs.current[0]?.focus(), 200)
            }
        }
        check()
    }, [])

    const triggerShake = () => {
        setShake(true)
        setTimeout(() => setShake(false), 450)
    }

    const handleInput = (val, index) => {
        if (!/^[0-9]?$/.test(val)) return
        const arr = [...pin]
        arr[index] = val
        setPin(arr)
        setError("")
        if (val && index < 4) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            const arr = [...pin]
            if (!arr[index] && index > 0) {
                const newArr = [...arr]
                newArr[index - 1] = ""
                setPin(newArr)
                inputRefs.current[index - 1]?.focus()
            } else {
                const newArr = [...arr]
                newArr[index] = ""
                setPin(newArr)
            }
        }
        if (e.key === "Enter") handleVerify()
    }

    const handleVerify = async () => {
        if (pin.some((d) => d === "")) {
            setError("Enter all 5 digits")
            triggerShake()
            return
        }

        setLoading(true)
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            const address = accounts[0]

            const res = await fetch("/api/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, pin: pin.join("") }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                sessionStorage.setItem("session", data.token)
                router.push("/wallet")
            } else if (data.error === "NOT_REGISTERED" || data.error === "NO_PIN_SET") {
                router.push("/setpin")
            } else {
                setError("Wrong PIN — try again")
                setPin(["", "", "", "", ""])
                triggerShake()
                setTimeout(() => inputRefs.current[0]?.focus(), 50)
            }
        } catch (err) {
            console.log("Verify error:", err)
            setError("Something went wrong. Try again.")
            triggerShake()
        }
        setLoading(false)
    }

    if (checking) {
        return (
            <div className="setpin-page">
                <ShootingStars />
                <div
                    style={{
                        color: "rgba(255,255,255,0.3)",
                        fontSize: "12px",
                        letterSpacing: "3px",
                        fontFamily: "'Courier New', monospace",
                    }}
                >
                    VERIFYING...
                </div>
            </div>
        )
    }

    return (
        <div className="setpin-page">
            <ShootingStars />
            <div className="setpin-content">
                <div className="setpin-eyebrow">
                    <span>WALLET ACCESS</span>
                </div>

                <div className="setpin-title">Enter your PIN</div>

                <div className="setpin-sub">Enter your 5-digit PIN to access your wallet.</div>

                <div className="setpin-circles-wrapper">
                    <div className={`setpin-circles ${shake ? "shake" : ""}`}>
                        {pin.map((val, i) => (
                            <input
                                key={i}
                                ref={(el) => (inputRefs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={val}
                                autoComplete="off"
                                className={`setpin-circle ${val ? "filled" : ""} ${showPin ? "visible" : ""}`}
                                onChange={(e) => handleInput(e.target.value, i)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                            />
                        ))}
                    </div>

                    <button
                        className={`setpin-eye-btn ${showPin ? "active" : ""}`}
                        onClick={() => setShowPin((v) => !v)}
                        tabIndex={-1}
                    >
                        {showPin ? (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>

                {error && <div className="setpin-error">⚠ {error}</div>}

                <div className="setpin-divider" />

                <div
                    className={`setpin-btn-skew ${loading ? "disabled" : ""}`}
                    onClick={!loading ? handleVerify : undefined}
                    onMouseEnter={() => !loading && setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                >
                    <div
                        className="skew-fill-left"
                        style={{
                            transform: btnHover
                                ? "translateX(-110%) skewX(-8deg)"
                                : "skewX(-8deg)",
                        }}
                    />
                    <div
                        className="skew-fill-right"
                        style={{
                            transform: btnHover ? "translateX(110%) skewX(-8deg)" : "skewX(-8deg)",
                        }}
                    />
                    <span className="skew-btn-text" style={{ color: btnHover ? "#fff" : "#000" }}>
                        {loading ? (
                            <div className="setpin-loader">
                                <div
                                    className="setpin-dot"
                                    style={{ background: btnHover ? "#fff" : "#000" }}
                                />
                                <div
                                    className="setpin-dot"
                                    style={{ background: btnHover ? "#fff" : "#000" }}
                                />
                                <div
                                    className="setpin-dot"
                                    style={{ background: btnHover ? "#fff" : "#000" }}
                                />
                            </div>
                        ) : (
                            "UNLOCK WALLET →"
                        )}
                    </span>
                </div>

                <button
                    className="setpin-btn-ghost"
                    onClick={() => router.push("/")}
                    style={{ display: "block", margin: "16px auto 0" }}
                >
                    ← BACK TO HOME
                </button>
            </div>
        </div>
    )
}
