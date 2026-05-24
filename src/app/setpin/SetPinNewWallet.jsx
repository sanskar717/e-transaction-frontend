"use client"
import { useState, useRef, useEffect } from "react"
import ShootingStars from "../../components/ShootingStars"
import "./Setpin.css"

export default function SetPinNewWallet({ onSuccess, onBack }) {
    const [pin, setPin] = useState(["", "", "", "", ""])
    const [confirmPin, setConfirmPin] = useState(["", "", "", "", ""])
    const [step, setStep] = useState("set")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [shake, setShake] = useState(false)
    const [showPin, setShowPin] = useState(false)
    const [btnHover, setBtnHover] = useState(false)
    const inputRefs = useRef([])
    const confirmRefs = useRef([])

    useEffect(() => {
        setTimeout(() => inputRefs.current[0]?.focus(), 200)
    }, [])

    useEffect(() => {
        if (step === "confirm") setTimeout(() => confirmRefs.current[0]?.focus(), 50)
    }, [step])

    const triggerShake = () => {
        setShake(true)
        setTimeout(() => setShake(false), 450)
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

    const handleConfirm = () => {
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
        setTimeout(() => {
            setLoading(false)
            setSuccess(true)
            setTimeout(() => onSuccess?.(), 1100)
        }, 1400)
    }

    const currentArr = step === "set" ? pin : confirmPin
    const currentRefs = step === "set" ? inputRefs : confirmRefs

    return (
        <div className="setpin-page">
            <ShootingStars />

            <div className="setpin-content">
                {success ? (
                    <div className="setpin-success">
                        <span className="setpin-success-check">✓</span>
                        <div className="setpin-success-title">PIN Secured</div>
                        <div className="setpin-success-sub">// WALLET PROTECTED</div>
                    </div>
                ) : (
                    <>
                        <div className="setpin-eyebrow">
                            // <span>WALLET REGISTRY</span>
                        </div>

                        <div className="setpin-title">
                            {step === "set" ? "Set your PIN" : "Confirm PIN"}
                        </div>

                        <div className="setpin-sub">
                            {step === "set"
                                ? "Choose a 5-digit PIN to secure your wallet."
                                : "Re-enter your PIN to confirm."}
                        </div>

                        <div className="setpin-steps">
                            <div className={`setpin-step ${step === "set" ? "active" : "done"}`}>
                                <div
                                    className={`setpin-step-num ${step === "set" ? "active" : "done"}`}
                                >
                                    {step === "confirm" ? "✓" : "1"}
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
                                    2
                                </div>
                                Confirm
                            </div>
                        </div>

                        {/* Circles + Eye toggle */}
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
                                        onKeyDown={(e) => handleKeyDown(e, i, step === "confirm")}
                                    />
                                ))}
                            </div>

                            <button
                                className={`setpin-eye-btn ${showPin ? "active" : ""}`}
                                onClick={() => setShowPin((v) => !v)}
                                tabIndex={-1}
                                aria-label={showPin ? "Hide PIN" : "Show PIN"}
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

                        <div>
                            {/* Main button — landing page wala hover effect */}
                            <div
                                className={`setpin-btn-skew ${loading ? "disabled" : ""}`}
                                onClick={
                                    !loading
                                        ? step === "set"
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
                                    ) : step === "set" ? (
                                        "CONTINUE →"
                                    ) : (
                                        "ACTIVATE PIN →"
                                    )}
                                </span>
                            </div>

                            {/* Change PIN ghost button */}
                            {step === "confirm" && (
                                <div>
                                    <button
                                        className="setpin-btn-ghost"
                                        onClick={() => {
                                            setStep("set")
                                            setPin(["", "", "", "", ""])
                                            setConfirmPin(["", "", "", "", ""])
                                            setError("")
                                            setShowPin(false)
                                        }}
                                    >
                                        ← CHANGE PIN
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
