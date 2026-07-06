"use client"
import "./account.css"
import { useRouter } from "next/navigation"
import ShootingStars from "../../../components/ShootingStars"
import Navbar from "../walletNavbar"
import { useState, useEffect } from "react"
import {
    checkIfRegistered,
    checkHasPinSet,
    getUserProfile,
    updateUserName,
    removeWallet,
} from "../../../config/contracts"

export default function AccountPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [profile, setProfile] = useState(null)
    const [address, setAddress] = useState(null)
    const [newUsername, setNewUsername] = useState("")
    const [previewSuffix, setPreviewSuffix] = useState("")
    const [usernameLoading, setUsernameLoading] = useState(false)
    const [removeLoading, setRemoveLoading] = useState(false)
    const [usernameMsg, setUsernameMsg] = useState(null)
    const [removeMsg, setRemoveMsg] = useState(null)
    const [confirmRemove, setConfirmRemove] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const check = async () => {
            const token = sessionStorage.getItem("session")
            if (!token) {
                router.push("/enterpin")
                return
            }
            if (!window.ethereum) {
                router.push("/")
                return
            }
            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            if (!accounts || accounts.length === 0) {
                router.push("/")
                return
            }
            const addr = accounts[0]
            setAddress(addr)
            try {
                const isRegistered = await checkIfRegistered(addr)
                if (!isRegistered) {
                    router.push("/")
                    return
                }
                const hasPinSet = await checkHasPinSet(addr)
                if (!hasPinSet) {
                    router.push("/setpin")
                    return
                }
                const p = await getUserProfile(addr)
                setProfile(p)
                setChecking(false)
            } catch (e) {
                console.log(e)
                router.push("/")
            }
        }
        check()
    }, [])

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) return
        if (newUsername.trim().length < 5) {
            setUsernameMsg({ type: "error", text: "✕ MINIMUM 5 CHARACTERS REQUIRED" })
            return
        }
        if (newUsername.trim().length > 12) {
            setUsernameMsg({ type: "error", text: "✕ MAXIMUM 12 CHARACTERS ALLOWED" })
            return
        }
        setUsernameLoading(true)
        setUsernameMsg(null)
        try {
            const finalUsername = `${newUsername.trim()}_${previewSuffix}`
            await updateUserName(finalUsername)

            await fetch("/api/update-username", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: address,
                    newUsername: finalUsername,
                }),
            })

            setUsernameMsg({ type: "success", text: "✓ USERNAME UPDATED" })
            const p = await getUserProfile(address)
            setProfile(p)
            setNewUsername("")
            setPreviewSuffix("")
        } catch (e) {
            console.log(e)
            setUsernameMsg({ type: "error", text: "✕ TRANSACTION FAILED" })
        }
        setUsernameLoading(false)
    }

    const handleRemoveWallet = async () => {
        if (!confirmRemove) {
            setConfirmRemove(true)
            return
        }
        setRemoveLoading(true)
        setRemoveMsg(null)
        try {
            await removeWallet()

            await fetch("/api/delete-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address }),
            })
            sessionStorage.removeItem("pinVerified")
            router.push("/")
        } catch (e) {
            console.log(e)
            setRemoveMsg({ type: "error", text: "✕ TRANSACTION FAILED" })
        }
        setRemoveLoading(false)
    }

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const formatDate = (ts) => {
        const d = new Date(Number(ts) * 1000)
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    }

    const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""

    if (checking) {
        return (
            <div className="loading-screen">
                <ShootingStars />
                <span>VERIFYING...</span>
            </div>
        )
    }

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "#000",
                    zIndex: 0,
                }}
            >
                <ShootingStars />
            </div>
            <Navbar
                activeTab="account"
                setActiveTab={(tab) => {
                    if (tab === "transactions") router.push("/wallet")
                    else if (tab === "sent") router.push("/wallet/sent")
                    else if (tab === "received") router.push("/wallet/received")
                    else if (tab === "gas") router.push("/wallet/gas")
                    else if (tab === "subscription") router.push("/wallet/subscription")
                }}
            />

            <div className="acc-root" style={{ position: "relative", zIndex: 1 }}>
                <div className="acc-grid">
                    {/* ════ LEFT ════ */}
                    <div className="left-col acc-panel">
                        <div className="identity-card">
                            <div className="identity-corner" />
                            <div className="card-label">IDENTITY</div>
                            <div className="identity-avatar">
                                {profile?.userName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="identity-name">{profile?.userName || "—"}</div>
                            <div className="identity-sub">{shortAddr}</div>
                            <div className="identity-reg">REGISTERED</div>
                            <div className="identity-date">
                                {profile ? formatDate(profile.registeredAt) : "—"}
                            </div>
                        </div>

                        <div className="status-pill">
                            <div className="status-dot" />
                            <span className="status-text">WALLET ACTIVE</span>
                        </div>
                    </div>

                    {/* ════ RIGHT ════ */}
                    <div className="right-col acc-panel">
                        {/* Wallet Address */}
                        <div className="field-card wallet-card">
                            <div className="card-label">WALLET ADDRESS</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div className="wallet-addr">{address}</div>
                                <button className="copy-btn" onClick={handleCopy}>
                                    {copied ? "✓ COPIED" : "COPY"}
                                </button>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="field-card username-card">
                            <div className="section-title">UPDATE USERNAME</div>

                            <div className="card-label">CURRENT</div>
                            <div className="username-val">{profile?.userName || "—"}</div>

                            <div className="card-label">NEW USERNAME</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    className="update-input"
                                    value={newUsername}
                                    onChange={(e) => {
                                        setNewUsername(e.target.value)
                                        setUsernameMsg(null)
                                        const chars = "0123456789!@#$%^&*"
                                        const s = Array.from(
                                            { length: 4 },
                                            () => chars[Math.floor(Math.random() * chars.length)],
                                        ).join("")
                                        setPreviewSuffix(s)
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleUpdateUsername()}
                                    placeholder="ENTER NEW USERNAME"
                                    maxLength={12}
                                />
                                <button
                                    className="save-btn"
                                    onClick={handleUpdateUsername}
                                    disabled={usernameLoading || !newUsername.trim()}
                                >
                                    {usernameLoading ? "SAVING..." : "SAVE →"}
                                </button>
                            </div>
                            {newUsername && (
                                <div
                                    className="setpin-username-preview"
                                    style={{ color: "#ffffff", fontSize: "12px" }}
                                >
                                    will be saved as:{" "}
                                    <span style={{ color: "#ff6600" }}>
                                        {newUsername.trim()}_{previewSuffix}
                                    </span>
                                </div>
                            )}
                            {usernameMsg && (
                                <div
                                    className={
                                        usernameMsg.type === "success"
                                            ? "msg-success"
                                            : "msg-error"
                                    }
                                >
                                    {usernameMsg.text}
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="danger-card acc-panel">
                            <div className="danger-label">⚠ DANGER ZONE</div>
                            <div className="danger-desc">
                                These actions are permanent and cannot be undone. Proceed with
                                caution.
                            </div>

                            <hr className="card-divider" />

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "12px",
                                }}
                            >
                                <div className="tracking-tile">
                                    <div className="tile-label">TRACKING</div>
                                    <div className="tile-desc">
                                        Pause transaction tracking without removing your
                                        registration.
                                    </div>
                                    <button className="stop-btn">STOP TRACKING</button>
                                </div>

                                <div
                                    className={`remove-tile${confirmRemove ? " confirming" : ""}`}
                                >
                                    <div className="tile-label">REGISTRATION</div>
                                    <div className="tile-desc">
                                        Permanently removes your wallet from the blockchain.
                                        Irreversible.
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={handleRemoveWallet}
                                        disabled={removeLoading}
                                    >
                                        {removeLoading
                                            ? "REMOVING..."
                                            : confirmRemove
                                              ? "⚠ CONFIRM"
                                              : "REMOVE WALLET"}
                                    </button>
                                    {confirmRemove && !removeLoading && (
                                        <button
                                            className="cancel-txt"
                                            onClick={() => setConfirmRemove(false)}
                                        >
                                            CANCEL
                                        </button>
                                    )}
                                </div>
                            </div>

                            {confirmRemove && (
                                <div className="confirm-banner">
                                    ⚠ THIS WILL DELETE YOUR REGISTRATION FROM THE BLOCKCHAIN
                                </div>
                            )}
                            {removeMsg && (
                                <div className="msg-error" style={{ textAlign: "center" }}>
                                    {removeMsg.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
