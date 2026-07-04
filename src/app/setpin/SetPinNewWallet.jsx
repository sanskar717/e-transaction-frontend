"use client"
import { useState, useRef, useEffect } from "react"
import ShootingStars from "../../components/ShootingStars"
import { registerWallet, setPinOnChain } from "../../config/contracts"
import "./Setpin.css"

export default function SetPinNewWallet({ onSuccess, onBack }) {
    const [pin, setPin] = useState(["", "", "", "", ""])
    const [confirmPin, setConfirmPin] = useState(["", "", "", "", ""])
    const [step, setStep] = useState("username")
    const [username, setUsername] = useState("")
    const [usernameError, setUsernameError] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [shake, setShake] = useState(false)
    const [showPin, setShowPin] = useState(false)
    const [btnHover, setBtnHover] = useState(false)
    const inputRefs = useRef([])
    const confirmRefs = useRef([])
    const usernameRef = useRef(null)
    const [previewSuffix, setPreviewSuffix] = useState("")

    useEffect(() => {
        if (step === "username") setTimeout(() => usernameRef.current?.focus(), 200)
        if (step === "set") setTimeout(() => inputRefs.current[0]?.focus(), 200)
        if (step === "confirm") setTimeout(() => confirmRefs.current[0]?.focus(), 50)
    }, [step])

    const triggerShake = () => {
        setShake(true)
        setTimeout(() => setShake(false), 450)
    }

    const handleUsernameNext = () => {
        const trimmed = username.trim()
        if (!trimmed) {
            setUsernameError("Enter a username first")
            triggerShake()
            return
        }
        if (trimmed.length < 5) {
            setUsernameError("Minimum 5 characters required")
            triggerShake()
            return
        }
        if (trimmed.length > 12) {
            setUsernameError("Maximum 12 characters allowed")
            triggerShake()
            return
        }
        setUsernameError("")
        setStep("set")
    }

    const handleInput = (val, index, isConfirm) => {
        if (!/^[0-9]?$/.test(val)) return
        const arr = isConfirm ? [...confirmPin] : [...pin]
        arr[index] = val
        isConfirm ? setConfirmPin(arr) : setPin(arr)
        setError("")
        if (val && index < 4) {
            const refs = isConfirm ? confirmRefs : inputRefs
            refs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (e, index, isConfirm) => {
        const arr = isConfirm ? [...confirmPin] : [...pin]
        if (e.key === "Backspace") {
            if (!arr[index] && index > 0) {
                const refs = isConfirm ? confirmRefs : inputRefs
                const newArr = [...arr]
                newArr[index - 1] = ""
                isConfirm ? setConfirmPin(newArr) : setPin(newArr)
                refs.current[index - 1]?.focus()
            } else {
                const newArr = [...arr]
                newArr[index] = ""
                isConfirm ? setConfirmPin(newArr) : setPin(newArr)
            }
        }
        if (e.key === "Enter") step === "set" ? handleNext() : handleConfirm()
    }

    const handleNext = () => {
        if (pin.some((d) => d === "")) {
            setError("Enter all 5 digits")
            triggerShake()
            return
        }
        setStep("confirm")
        setError("")
        setShowPin(false)
    }

    const handleConfirm = async () => {
        if (confirmPin.some((d) => d === "")) {
            setError("Enter all 5 digits")
            triggerShake()
            return
        }
        if (pin.join("") !== confirmPin.join("")) {
            setError("PINs don't match — try again")
            setConfirmPin(["", "", "", "", ""])
            triggerShake()
            setTimeout(() => confirmRefs.current[0]?.focus(), 50)
            return
        }

        setLoading(true)
        try {
            const chars = "0123456789!@#$%^&*"
            const suffix = Array.from(
                { length: 4 },
                () => chars[Math.floor(Math.random() * chars.length)],
            ).join("")
            const finalUsername = `${username.trim()}_${suffix}`

            await registerWallet(finalUsername)
            await setPinOnChain(pin.join(""))

            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            await fetch("/api/register-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: accounts[0],
                    username: finalUsername,
                }),
            })

            setLoading(false)
            setSuccess(true)
            setTimeout(() => {
                sessionStorage.setItem("pinVerified", "true")
                onSuccess?.()
            }, 1100)
        } catch (err) {
            console.log("Error:", err)
            if (err?.message?.includes("insufficient funds")) {
                setError("Insufficient ETH — add Sepolia ETH and try again.")
            } else {
                setError("Transaction failed. Try again.")
            }
            setLoading(false)
            triggerShake()
        }
    }

    const currentArr = step === "set" ? pin : confirmPin
    const currentRefs = step === "set" ? inputRefs : confirmRefs

    const stepIndex = { username: 0, set: 1, confirm: 2 }

    return (
        <div className="setpin-page">
            <ShootingStars />

            <div className="setpin-content">
                {success ? (
                    <div className="setpin-success">
                        <span className="setpin-success-check">✓</span>
                        <div className="setpin-success-title">PIN Secured</div>
                        <div className="setpin-success-sub"> WALLET PROTECTED</div>
                    </div>
                ) : (
                    <>
                        <div className="setpin-eyebrow">
                            <span>WALLET REGISTRY</span>
                        </div>

                        <div className="setpin-title">
                            {step === "username" && "Choose Username"}
                            {step === "set" && "Set your PIN"}
                            {step === "confirm" && "Confirm PIN"}
                        </div>

                        <div className="setpin-sub">
                            {step === "username" && "Pick a unique username for your wallet."}
                            {step === "set" && "Choose a 5-digit PIN to secure your wallet."}
                            {step === "confirm" && "Re-enter your PIN to confirm."}
                        </div>

                        {/* 3 step indicator */}
                        <div className="setpin-steps">
                            <div
                                className={`setpin-step ${step === "username" ? "active" : "done"}`}
                            >
                                <div
                                    className={`setpin-step-num ${step === "username" ? "active" : "done"}`}
                                >
                                    {stepIndex[step] > 0 ? "✓" : "1"}
                                </div>
                                Username
                            </div>
                            <div className="setpin-step-line">
                                <div
                                    className="setpin-step-line-fill"
                                    style={{ width: stepIndex[step] >= 1 ? "100%" : "0%" }}
                                />
                            </div>
                            <div
                                className={`setpin-step ${step === "set" ? "active" : stepIndex[step] > 1 ? "done" : ""}`}
                            >
                                <div
                                    className={`setpin-step-num ${step === "set" ? "active" : stepIndex[step] > 1 ? "done" : ""}`}
                                >
                                    {stepIndex[step] > 1 ? "✓" : "2"}
                                </div>
                                Set PIN
                            </div>
                            <div className="setpin-step-line">
                                <div
                                    className="setpin-step-line-fill"
                                    style={{ width: step === "confirm" ? "100%" : "0%" }}
                                />
                            </div>
                            <div className={`setpin-step ${step === "confirm" ? "active" : ""}`}>
                                <div
                                    className={`setpin-step-num ${step === "confirm" ? "active" : ""}`}
                                >
                                    3
                                </div>
                                Confirm
                            </div>
                        </div>

                        {/* USERNAME STEP */}
                        {step === "username" && (
                            <div
                                className={`setpin-circles-wrapper ${shake ? "shake" : ""}`}
                                style={{ flexDirection: "column", gap: "0" }}
                            >
                                <input
                                    ref={usernameRef}
                                    type="text"
                                    placeholder="e.g. sanskar"
                                    value={username}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z]/g, "")
                                        setUsername(val)
                                        setUsernameError("")
                                        const chars = "0123456789!@#$%^&*"
                                        const s = Array.from(
                                            { length: 4 },
                                            () => chars[Math.floor(Math.random() * chars.length)],
                                        ).join("")
                                        setPreviewSuffix(s)
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleUsernameNext()}
                                    maxLength={20}
                                    className="setpin-username-input"
                                />
                                {username && (
                                    <div className="setpin-username-preview">
                                        will be saved as:{" "}
                                        <span>
                                            {username}_{previewSuffix}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PIN STEPS */}
                        {(step === "set" || step === "confirm") && (
                            <div className="setpin-circles-wrapper">
                                <div className={`setpin-circles ${shake ? "shake" : ""}`}>
                                    {currentArr.map((val, i) => (
                                        <input
                                            key={`${step}-${i}`}
                                            ref={(el) => (currentRefs.current[i] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={val}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                            className={`setpin-circle ${val ? "filled" : ""} ${showPin ? "visible" : ""}`}
                                            onChange={(e) =>
                                                handleInput(e.target.value, i, step === "confirm")
                                            }
                                            onKeyDown={(e) =>
                                                handleKeyDown(e, i, step === "confirm")
                                            }
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
                        )}

                        {/* Errors */}
                        {(error || usernameError) && (
                            <div className="setpin-error">⚠ {error || usernameError}</div>
                        )}

                        <div className="setpin-divider" />

                        {/* Main button */}
                        <div
                            className={`setpin-btn-skew ${loading ? "disabled" : ""}`}
                            onClick={
                                !loading
                                    ? step === "username"
                                        ? handleUsernameNext
                                        : step === "set"
                                          ? handleNext
                                          : handleConfirm
                                    : undefined
                            }
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
                                    transform: btnHover
                                        ? "translateX(110%) skewX(-8deg)"
                                        : "skewX(-8deg)",
                                }}
                            />
                            <span
                                className="skew-btn-text"
                                style={{ color: btnHover ? "#fff" : "#000" }}
                            >
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
                                ) : step === "username" ? (
                                    "NEXT →"
                                ) : step === "set" ? (
                                    "CONTINUE →"
                                ) : (
                                    "ACTIVATE PIN →"
                                )}
                            </span>
                        </div>

                        {/* Back / Change PIN */}
                        {step !== "username" && (
                            <div>
                                <button
                                    className="setpin-btn-ghost"
                                    onClick={() => {
                                        if (step === "set") {
                                            setStep("username")
                                            setPin(["", "", "", "", ""])
                                        }
                                        if (step === "confirm") {
                                            setStep("set")
                                            setConfirmPin(["", "", "", "", ""])
                                        }
                                        setError("")
                                        setShowPin(false)
                                    }}
                                >
                                    ← {step === "set" ? "CHANGE USERNAME" : "CHANGE PIN"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
