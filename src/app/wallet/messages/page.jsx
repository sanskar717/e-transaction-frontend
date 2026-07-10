"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import ShootingStars from "../../../components/ShootingStars"
import Navbar from "../walletNavbar"
import { checkIfRegistered, checkHasPinSet } from "../../../config/contracts"
import {
    deriveMessagingKeypair,
    encryptMessage,
    decryptMessage,
} from "../../../../lib/messageCrypto"
import "./messages.css"

export default function MessagesPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [address, setAddress] = useState(null)
    const [keypair, setKeypair] = useState(null)
    const [keyLoading, setKeyLoading] = useState(false)
    const [keyError, setKeyError] = useState(null)

    const [otherWallet, setOtherWallet] = useState("")
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState("")
    const [sending, setSending] = useState(false)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const bottomRef = useRef(null)

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
                setAddress(addr)
                setChecking(false)
            } catch (e) {
                console.log(e)
                router.push("/")
            }
        }
        check()
    }, [])

    // Naya messaging keypair generate karke public key backend pe save karna
    const setupMessaging = async () => {
        if (!address) return
        setKeyLoading(true)
        setKeyError(null)
        try {
            const kp = await deriveMessagingKeypair(address)
            setKeypair(kp)

            await fetch("/api/save-public-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: address,
                    publicKey: kp.publicKey,
                }),
            })
        } catch (e) {
            console.log(e)
            setKeyError("Signature declined or failed. Try again.")
        }
        setKeyLoading(false)
    }

    const openChat = async (wallet) => {
        const clean = wallet.trim().toLowerCase()
        if (!clean || !clean.startsWith("0x") || clean.length !== 42) {
            alert("Enter a valid wallet address")
            return
        }
        setActiveChat(clean)
        setLoadingMsgs(true)
        setMessages([])
        try {
            const res = await fetch(`/api/get-messages?address=${address}&with=${clean}`)
            const data = await res.json()
            if (data.messages) {
                const decrypted = await Promise.all(
                    data.messages.map(async (m) => {
                        try {
                            const text = await decryptMessage(
                                keypair.privateKey,
                                m.encrypted_content,
                            )
                            return { ...m, text }
                        } catch {
                            return { ...m, text: "⚠ Could not decrypt" }
                        }
                    }),
                )
                setMessages(decrypted)
            }
        } catch (e) {
            console.log(e)
        }
        setLoadingMsgs(false)
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async () => {
        if (!newMsg.trim() || !activeChat) return
        setSending(true)
        try {
            const keyRes = await fetch(`/api/get-public-key?address=${activeChat}`)
            const keyData = await keyRes.json()
            if (!keyData.publicKey) {
                alert("This wallet hasn't set up messaging yet.")
                setSending(false)
                return
            }

            const encrypted = await encryptMessage(keyData.publicKey, newMsg.trim())

            await fetch("/api/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromWallet: address,
                    toWallet: activeChat,
                    encryptedContent: encrypted,
                }),
            })

            setMessages((prev) => [
                ...prev,
                {
                    from_wallet: address,
                    to_wallet: activeChat,
                    text: newMsg.trim(),
                    created_at: new Date().toISOString(),
                },
            ])
            setNewMsg("")
        } catch (e) {
            console.log(e)
            alert("Failed to send message.")
        }
        setSending(false)
    }

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
            <ShootingStars />
            <Navbar activeTab="messages" />
            <div className="msg-page">
                <div className="msg-inner">
                    {!keypair ? (
                        <div className="msg-setup">
                            <div className="msg-setup-title">ENABLE ENCRYPTED MESSAGING</div>
                            <div className="msg-setup-sub">
                                Sign a free message with your wallet to generate your private
                                messaging key. No gas required.
                            </div>
                            <button
                                className="msg-setup-btn"
                                onClick={setupMessaging}
                                disabled={keyLoading}
                            >
                                {keyLoading ? "WAITING FOR SIGNATURE..." : "ENABLE MESSAGING →"}
                            </button>
                            {keyError && <div className="msg-error">{keyError}</div>}
                        </div>
                    ) : (
                        <div className="msg-layout">
                            <div className="msg-sidebar">
                                <div className="msg-sidebar-title">NEW CONVERSATION</div>
                                <input
                                    className="msg-input-wallet"
                                    placeholder="0x wallet address"
                                    value={otherWallet}
                                    onChange={(e) => setOtherWallet(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && openChat(otherWallet)}
                                />
                                <button
                                    className="msg-open-btn"
                                    onClick={() => openChat(otherWallet)}
                                >
                                    OPEN CHAT →
                                </button>
                            </div>

                            <div className="msg-chat">
                                {!activeChat ? (
                                    <div className="msg-empty">
                                        Enter a wallet address to start a conversation
                                    </div>
                                ) : (
                                    <>
                                        <div className="msg-chat-header">
                                            {activeChat.slice(0, 6)}...{activeChat.slice(-4)}
                                        </div>
                                        <div className="msg-chat-body">
                                            {loadingMsgs && (
                                                <div className="msg-empty">Loading...</div>
                                            )}
                                            {!loadingMsgs && messages.length === 0 && (
                                                <div className="msg-empty">
                                                    No messages yet. Say hi!
                                                </div>
                                            )}
                                            {messages.map((m, i) => (
                                                <div
                                                    key={i}
                                                    className={`msg-bubble ${
                                                        m.from_wallet?.toLowerCase() ===
                                                        address.toLowerCase()
                                                            ? "msg-mine"
                                                            : "msg-theirs"
                                                    }`}
                                                >
                                                    {m.text}
                                                </div>
                                            ))}
                                            <div ref={bottomRef} />
                                        </div>
                                        <div className="msg-chat-footer">
                                            <input
                                                className="msg-input-text"
                                                placeholder="Type a message..."
                                                value={newMsg}
                                                onChange={(e) => setNewMsg(e.target.value)}
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" && handleSend()
                                                }
                                            />
                                            <button
                                                className="msg-send-btn"
                                                onClick={handleSend}
                                                disabled={sending}
                                            >
                                                {sending ? "..." : "SEND →"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
