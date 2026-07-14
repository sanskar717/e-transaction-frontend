"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, Fragment } from "react"
import { createPortal } from "react-dom"
import ShootingStars from "../../../components/ShootingStars"
import Navbar from "../walletNavbar"
import { checkIfRegistered, checkHasPinSet } from "../../../config/contracts"
import {
    deriveMessagingKeypair,
    encryptMessage,
    decryptMessage,
} from "../../../../lib/messageCrypto"
import "./messages.css"

function timeAgo(timestamp) {
    const now = Date.now()
    const ts = new Date(timestamp).getTime()
    const diff = now - ts
    if (diff < 60000) return "now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`
    return new Date(ts).toLocaleDateString()
}

function formatMessageTime(timestamp) {
    const d = new Date(timestamp)
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `${h}:${m}`
}

function formatDateLabel(timestamp) {
    const d = new Date(timestamp)
    const day = String(d.getDate()).padStart(2, "0")
    const month = d.toLocaleDateString("en-GB", { month: "short" })
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

export default function MessagesPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [address, setAddress] = useState(null)
    const [keypair, setKeypair] = useState(null)
    const [keyLoading, setKeyLoading] = useState(false)
    const [keyError, setKeyError] = useState(null)

    const [conversations, setConversations] = useState([])
    const [otherWallet, setOtherWallet] = useState("")
    const [activeChat, setActiveChat] = useState(null)
    const [activeChatUsername, setActiveChatUsername] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMsg, setNewMsg] = useState("")
    const [sending, setSending] = useState(false)
    const [sendHover, setSendHover] = useState(false)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showDisableConfirm, setShowDisableConfirm] = useState(false)
    const [alertMsg, setAlertMsg] = useState(null)
    const [inboxTab, setInboxTab] = useState("inbox")
    const [requests, setRequests] = useState([])

    // NEW: block feature state
    const [blockedList, setBlockedList] = useState([])
    const [blockStatus, setBlockStatus] = useState({ iBlockedThem: false, theyBlockedMe: false })
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false)
    const [showBlockConfirm, setShowBlockConfirm] = useState(false)

    const bottomRef = useRef(null)
    const chatBodyRef = useRef(null)
    const pollRef = useRef(null)
    const blockSeqRef = useRef(0)

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

                const cached = localStorage.getItem(`msgKey_${addr.toLowerCase()}`)
                if (cached) setKeypair(JSON.parse(cached))

                const savedChat = sessionStorage.getItem(`activeMsgChat_${addr.toLowerCase()}`)
                if (savedChat) setActiveChat(savedChat)
            } catch (e) {
                console.log(e)
                router.push("/")
            }
        }
        check()
    }, [])

    useEffect(() => {
        if (!address) return
        const handleStorage = (e) => {
            const key = `msgKey_${address.toLowerCase()}`
            if (e.key !== key) return
            if (!e.newValue) {
                setKeypair(null)
                setConversations([])
                setMessages([])
                setActiveChat(null)
                setActiveChatUsername(null)
                setFullscreen(false)
                setShowDisableConfirm(false)
                setShowDeleteConfirm(false)
            } else {
                try {
                    setKeypair(JSON.parse(e.newValue))
                } catch (err) {
                    console.log(err)
                }
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [address])

    const setupMessaging = async () => {
        if (!address) return
        setKeyLoading(true)
        setKeyError(null)
        try {
            const kp = await deriveMessagingKeypair(address)
            setKeypair(kp)
            localStorage.setItem(`msgKey_${address.toLowerCase()}`, JSON.stringify(kp))

            await fetch("/api/save-public-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address, publicKey: kp.publicKey }),
            })
        } catch (e) {
            console.log(e)
            setKeyError("Signature declined or failed. Try again.")
        }
        setKeyLoading(false)
    }

    const disableMessaging = () => {
        if (!address) return
        setShowDisableConfirm(true)
    }

    const confirmDisableMessaging = async () => {
        setShowDisableConfirm(false)
        try {
            await fetch("/api/disable-messaging", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address }),
            })
        } catch (e) {
            console.log(e)
        }
        localStorage.removeItem(`msgKey_${address.toLowerCase()}`)
        sessionStorage.removeItem(`activeMsgChat_${address.toLowerCase()}`)
        setKeypair(null)
        setConversations([])
        setMessages([])
        setActiveChat(null)
        setActiveChatUsername(null)
        setFullscreen(false)
    }

    const loadConversations = async () => {
        if (!address || !keypair) return
        try {
            const res = await fetch(`/api/get-conversations?address=${address}`)
            const data = await res.json()

            if (data.conversations) {
                const withPreview = await Promise.all(
                    data.conversations.map(async (c) => {
                        const isMine = c.last_from_wallet?.toLowerCase() === address.toLowerCase()
                        const cipherToUse = isMine ? c.last_content_sender : c.last_content
                        let preview = ""
                        try {
                            preview = await decryptMessage(keypair.privateKey, cipherToUse)
                        } catch {
                            preview = "⚠ Could not decrypt"
                        }
                        if (isMine) preview = `You: ${preview}`

                        const lastSeenKey = `msgSeen_${address.toLowerCase()}_${c.other_wallet}`
                        const lastSeen = localStorage.getItem(lastSeenKey)
                        const isUnread =
                            !isMine &&
                            (!lastSeen || new Date(c.last_message_at) > new Date(lastSeen))

                        return { ...c, preview, isUnread }
                    }),
                )

                const seenMap = {}
                withPreview.forEach((c) => {
                    const lastSeenKey = `msgSeen_${address.toLowerCase()}_${c.other_wallet}`
                    seenMap[c.other_wallet] =
                        localStorage.getItem(lastSeenKey) || "1970-01-01T00:00:00Z"
                })

                let counts = {}
                try {
                    const countRes = await fetch("/api/get-unread-counts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ address, seenMap }),
                    })
                    const countData = await countRes.json()
                    counts = countData.counts || {}
                } catch (e) {
                    console.log(e)
                }

                setConversations(
                    withPreview.map((c) => ({ ...c, unreadCount: counts[c.other_wallet] || 0 })),
                )
            }

            if (data.requests) {
                const withReqPreview = await Promise.all(
                    data.requests.map(async (r) => {
                        let preview = ""
                        try {
                            const isMine =
                                r.last_from_wallet?.toLowerCase() === address.toLowerCase()
                            const cipherToUse = isMine ? r.last_content_sender : r.last_content
                            preview = await decryptMessage(keypair.privateKey, cipherToUse)
                        } catch {
                            preview = "⚠ Could not decrypt"
                        }
                        return { ...r, preview }
                    }),
                )
                setRequests(withReqPreview)
            } else {
                setRequests([])
            }
        } catch (e) {
            console.log(e)
        }
    }

    // NEW: fetch list of wallets I have blocked
    const loadBlockedList = async () => {
        if (!address) return
        try {
            const res = await fetch(`/api/get-blocked-list?address=${address}`)
            const data = await res.json()
            setBlockedList(data.blocked || [])
        } catch (e) {
            console.log(e)
        }
    }

    const handleAcceptRequest = async (otherWallet) => {
        try {
            await fetch("/api/accept-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, otherWallet }),
            })
            setRequests((prev) => prev.filter((r) => r.other_wallet !== otherWallet))
            await loadConversations()
            setInboxTab("inbox")
            openChat(otherWallet)
        } catch (e) {
            console.log(e)
        }
    }

    // NEW: block / unblock handlers
    const handleBlockUser = () => {
        if (!activeChat) return
        setShowBlockConfirm(true)
    }

    const confirmBlockUser = async () => {
        setShowBlockConfirm(false)
        if (!activeChat) return
        blockSeqRef.current += 1
        try {
            const res = await fetch("/api/block-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, otherWallet: activeChat }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setAlertMsg("Block failed, try again.")
                return
            }
            setBlockStatus((prev) => ({ ...prev, iBlockedThem: true }))
            setConversations((prev) => prev.filter((c) => c.other_wallet !== activeChat))
            loadBlockedList()
        } catch (e) {
            console.log(e)
            setAlertMsg("Block failed, try again.")
        }
    }

    const handleUnblockUser = () => {
        setShowUnblockConfirm(true)
    }

    const confirmUnblockUser = async () => {
        setShowUnblockConfirm(false)
        if (!activeChat) return
        blockSeqRef.current += 1
        try {
            const res = await fetch("/api/unblock-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, otherWallet: activeChat }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setAlertMsg("Unblock failed, try again.")
                return
            }
            setBlockStatus((prev) => ({ ...prev, iBlockedThem: false }))
            setBlockedList((prev) => prev.filter((b) => b.other_wallet !== activeChat))
            loadConversations()
        } catch (e) {
            console.log(e)
            setAlertMsg("Unblock failed, try again.")
        }
    }

    const handleDeleteConversation = () => {
        if (!activeChat) return
        setShowDeleteConfirm(true)
    }

    const confirmDeleteConversation = async () => {
        setShowDeleteConfirm(false)
        try {
            await fetch("/api/delete-conversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address, otherWallet: activeChat }),
            })
            setMessages([])
            setConversations((prev) => prev.filter((c) => c.other_wallet !== activeChat))
            setBlockedList((prev) => prev.filter((b) => b.other_wallet !== activeChat))
            setActiveChat(null)
            sessionStorage.removeItem(`activeMsgChat_${address.toLowerCase()}`)
        } catch (e) {
            console.log(e)
            alert("Failed to delete conversation.")
        }
    }

    const openChat = async (wallet, silent = false) => {
        const clean = wallet.trim().toLowerCase()
        if (!clean || !clean.startsWith("0x") || clean.length !== 42) {
            if (!silent) alert("Enter a valid wallet address")
            return
        }
        setActiveChat(clean)
        sessionStorage.setItem(`activeMsgChat_${address.toLowerCase()}`, clean)
        localStorage.setItem(`msgSeen_${address.toLowerCase()}_${clean}`, new Date().toISOString())

        setConversations((prev) =>
            prev.map((c) => (c.other_wallet === clean ? { ...c, unreadCount: 0 } : c)),
        )
        if (!silent) {
            setLoadingMsgs(true)
            setMessages([])
        }

        try {
            const existing = conversations.find((c) => c.other_wallet === clean)
            if (existing?.username) {
                setActiveChatUsername(existing.username)
            } else {
                const uRes = await fetch(`/api/get-username?address=${clean}`)
                const uData = await uRes.json()
                setActiveChatUsername(uData.username || null)
            }
        } catch (e) {
            console.log(e)
        }

        // NEW: sirf non-silent (manual open) pe hi block status re-check karo
        if (!silent) {
            blockSeqRef.current += 1
            const mySeq = blockSeqRef.current
            try {
                const bRes = await fetch(
                    `/api/get-block-status?address=${address}&otherWallet=${clean}`,
                )
                const bData = await bRes.json()
                if (mySeq === blockSeqRef.current) {
                    setBlockStatus({
                        iBlockedThem: !!bData.iBlockedThem,
                        theyBlockedMe: !!bData.theyBlockedMe,
                    })
                }
            } catch (e) {
                console.log(e)
                if (mySeq === blockSeqRef.current) {
                    setBlockStatus({ iBlockedThem: false, theyBlockedMe: false })
                }
            }
        }

        try {
            const res = await fetch(`/api/get-messages?address=${address}&with=${clean}`)
            const data = await res.json()
            if (data.messages) {
                const decrypted = await Promise.all(
                    data.messages.map(async (m) => {
                        const isMine = m.from_wallet?.toLowerCase() === address.toLowerCase()
                        const cipherToUse = isMine
                            ? m.encrypted_content_sender
                            : m.encrypted_content
                        try {
                            const text = await decryptMessage(keypair.privateKey, cipherToUse)
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
        if (!silent) setLoadingMsgs(false)
    }

    useEffect(() => {
        if (keypair) {
            loadConversations()
            loadBlockedList()
            if (activeChat) openChat(activeChat, true)
        }
    }, [keypair])

    useEffect(() => {
        if (!keypair) return
        pollRef.current = setInterval(() => {
            loadConversations()
            if (activeChat) openChat(activeChat, true)
        }, 4000)
        return () => clearInterval(pollRef.current)
    }, [keypair, activeChat])

    useEffect(() => {
        if (showDeleteConfirm || showDisableConfirm || showUnblockConfirm) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [showDeleteConfirm, showDisableConfirm, showUnblockConfirm])

    const prevMsgCount = useRef(0)

    useEffect(() => {
        if (messages.length > prevMsgCount.current && chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
        }
        prevMsgCount.current = messages.length
    }, [messages])

    const handleSend = async () => {
        const textToSend = newMsg.trim()
        if (!textToSend || !activeChat || sending) return

        if (blockStatus.iBlockedThem) {
            setAlertMsg("You have blocked this user. Unblock them to send a message.")
            return
        }

        setSending(true)
        setNewMsg("")

        const tempId = `temp-${Date.now()}`
        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                from_wallet: address,
                to_wallet: activeChat,
                text: textToSend,
                created_at: new Date().toISOString(),
                pending: true,
            },
        ])

        try {
            const keyRes = await fetch(`/api/get-public-key?address=${activeChat}`)
            const keyData = await keyRes.json()
            if (!keyData.publicKey) {
                setMessages((prev) => prev.filter((m) => m.id !== tempId))
                setAlertMsg("This wallet hasn't set up messaging yet.")
                setSending(false)
                return
            }

            const encryptedForReceiver = await encryptMessage(keyData.publicKey, textToSend)
            const encryptedForSender = await encryptMessage(keypair.publicKey, textToSend)

            const sendRes = await fetch("/api/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromWallet: address,
                    toWallet: activeChat,
                    encryptedContent: encryptedForReceiver,
                    encryptedContentSender: encryptedForSender,
                }),
            })
            const sendData = await sendRes.json()
            if (!sendData.success) {
                if (sendData.error === "PENDING_REQUEST") {
                    setMessages((prev) => prev.filter((m) => m.id !== tempId))
                    setAlertMsg(
                        "You already sent one message. Wait for the other user to accept before sending another.",
                    )
                    setSending(false)
                    return
                }
                // NEW: receiver has blocked me
                if (sendData.error === "BLOCKED_BY_RECEIVER") {
                    setMessages((prev) => prev.filter((m) => m.id !== tempId))
                    setAlertMsg(
                        "You can't message this user. You have been blocked. You won't be able to send messages until they unblock you.",
                    )
                    setBlockStatus((prev) => ({ ...prev, theyBlockedMe: true }))
                    setSending(false)
                    return
                }
                // NEW: I have blocked them (safety fallback)
                if (sendData.error === "YOU_BLOCKED_THEM") {
                    setMessages((prev) => prev.filter((m) => m.id !== tempId))
                    setAlertMsg("You have blocked this user. Unblock them to send a message.")
                    setBlockStatus((prev) => ({ ...prev, iBlockedThem: true }))
                    setSending(false)
                    return
                }
                throw new Error("send failed")
            }

            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, pending: false } : m)),
            )

            setConversations((prev) => {
                const idx = prev.findIndex((c) => c.other_wallet === activeChat)
                if (idx === -1) {
                    loadConversations()
                    return prev
                }
                const updated = [...prev]
                const [item] = updated.splice(idx, 1)
                updated.unshift({
                    ...item,
                    preview: `You: ${textToSend}`,
                    last_message_at: new Date().toISOString(),
                })
                return updated
            })
        } catch (e) {
            console.log(e)
            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, failed: true, pending: false } : m)),
            )
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
                    {showDeleteConfirm && (
                        <div
                            className="msg-confirm-overlay"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            <div className="msg-confirm-box" onClick={(e) => e.stopPropagation()}>
                                <div className="msg-confirm-title">Delete conversation?</div>
                                <div className="msg-confirm-sub">
                                    It will only be removed from your view.
                                </div>
                                <div className="msg-confirm-actions">
                                    <button
                                        className="msg-confirm-cancel"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="msg-confirm-delete"
                                        onClick={confirmDeleteConversation}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {alertMsg &&
                        createPortal(
                            <div className="msg-alert-toast">
                                <div className="msg-alert-text">{alertMsg}</div>
                                <button className="msg-alert-ok" onClick={() => setAlertMsg(null)}>
                                    OK
                                </button>
                            </div>,
                            document.body,
                        )}
                    {showDisableConfirm &&
                        createPortal(
                            <div
                                className="msg-disable-overlay"
                                onClick={() => setShowDisableConfirm(false)}
                            >
                                <div
                                    className="msg-disable-toast"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="msg-disable-title">
                                        ⏻ Disable encrypted messaging?
                                    </div>
                                    <div className="msg-disable-sub">
                                        This removes your messaging key from this device. You can
                                        re-enable it anytime by signing again.
                                    </div>
                                    <div className="msg-disable-actions">
                                        <button
                                            className="msg-disable-cancel"
                                            onClick={() => setShowDisableConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="msg-disable-confirm"
                                            onClick={confirmDisableMessaging}
                                        >
                                            Disable
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body,
                        )}
                    {/* NEW: unblock confirmation modal */}
                    {showUnblockConfirm &&
                        createPortal(
                            <div
                                className="msg-disable-overlay"
                                onClick={() => setShowUnblockConfirm(false)}
                            >
                                <div
                                    className="msg-disable-toast"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="msg-disable-title">Unblock this user?</div>
                                    <div className="msg-disable-sub">
                                        They will be able to message you again once unblocked.
                                    </div>
                                    <div className="msg-disable-actions">
                                        <button
                                            className="msg-disable-cancel"
                                            onClick={() => setShowUnblockConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="msg-disable-confirm"
                                            onClick={confirmUnblockUser}
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body,
                        )}
                    {/* NEW: block confirmation modal */}
                    {showBlockConfirm &&
                        createPortal(
                            <div
                                className="msg-disable-overlay"
                                onClick={() => setShowBlockConfirm(false)}
                            >
                                <div
                                    className="msg-disable-toast"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="msg-disable-title">⚠ Block this user?</div>
                                    <div className="msg-disable-sub">
                                        Are you sure you want to block this user? After that they
                                        won't be able to text you until you unblock them.
                                    </div>
                                    <div className="msg-disable-actions">
                                        <button
                                            className="msg-disable-cancel"
                                            onClick={() => setShowBlockConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="msg-disable-confirm"
                                            onClick={confirmBlockUser}
                                        >
                                            Block
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body,
                        )}
                    {!keypair ? (
                        <div className="msg-setup">
                            <div className="msg-setup-title">ENABLE ENCRYPTED MESSAGING</div>
                            <div className="msg-setup-sub">
                                Sign a free message with your wallet to generate your private
                                messaging key. No gas required. You'll only need to do this once.
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
                        <div className={`msg-content ${fullscreen ? "msg-fullscreen" : ""}`}>
                            <div className="msg-page-header">
                                <div className="msg-page-header-row">
                                    <div>
                                        <div className="msg-page-title">MESSAGES</div>
                                        <div className="msg-page-sub">
                                            {address.slice(0, 6)}...{address.slice(-4)} ·{" "}
                                            {conversations.length} conversation
                                            {conversations.length === 1 ? "" : "s"}
                                        </div>
                                    </div>
                                    <div className="msg-header-btn-group">
                                        <button
                                            className="msg-fullscreen-btn"
                                            onClick={disableMessaging}
                                        >
                                            ⏻ DISABLE MESSAGING
                                        </button>
                                        <button
                                            className="msg-fullscreen-btn"
                                            onClick={() => setFullscreen((f) => !f)}
                                        >
                                            {fullscreen ? "⤡ CLOSE" : "⤢ EXPAND"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="msg-layout">
                                <div className="msg-sidebar">
                                    <div className="msg-sidebar-title">NEW CONVERSATION</div>
                                    <input
                                        className="msg-input-wallet"
                                        placeholder="0x wallet address"
                                        value={otherWallet}
                                        onChange={(e) => setOtherWallet(e.target.value)}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && openChat(otherWallet)
                                        }
                                    />
                                    <button
                                        className="msg-open-btn"
                                        onClick={() => openChat(otherWallet)}
                                    >
                                        <span className="skew-fill-left" />
                                        <span className="skew-fill-right" />
                                        <span className="msg-open-btn-text">OPEN CHAT →</span>
                                    </button>

                                    <div className="msg-inbox-title-row">
                                        <span
                                            className={`msg-inbox-label ${inboxTab === "inbox" ? "active" : ""}`}
                                            onClick={() => setInboxTab("inbox")}
                                        >
                                            INBOX
                                        </span>
                                        <span
                                            className={`msg-inbox-label ${inboxTab === "requests" ? "active" : ""}`}
                                            onClick={() => setInboxTab("requests")}
                                        >
                                            REQUESTS
                                            {requests.length > 0 && (
                                                <span className="msg-req-count">
                                                    {requests.length}
                                                </span>
                                            )}
                                        </span>
                                        {/* NEW: BLOCK-LIST tab */}
                                        <span
                                            className={`msg-inbox-label ${inboxTab === "blocked" ? "active" : ""}`}
                                            onClick={() => setInboxTab("blocked")}
                                        >
                                            BLOCKED
                                            {blockedList.length > 0 && (
                                                <span className="msg-req-count msg-blocked-count">
                                                    {blockedList.length}
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="msg-inbox-list">
                                        {inboxTab === "inbox" ? (
                                            <>
                                                {conversations.length === 0 && (
                                                    <div className="msg-inbox-empty">
                                                        No conversations yet
                                                    </div>
                                                )}
                                                {conversations.map((c) => (
                                                    <div
                                                        key={c.other_wallet}
                                                        className={`msg-inbox-item ${
                                                            activeChat === c.other_wallet
                                                                ? "active"
                                                                : ""
                                                        } ${c.unreadCount > 0 ? "unread" : ""}`}
                                                        onClick={() => openChat(c.other_wallet)}
                                                    >
                                                        <div className="msg-inbox-avatar">
                                                            {c.other_wallet
                                                                .slice(2, 4)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="msg-inbox-info">
                                                            <div className="msg-inbox-top-row">
                                                                <div className="msg-inbox-name">
                                                                    {c.other_wallet ===
                                                                    address?.toLowerCase()
                                                                        ? "Saved Messages"
                                                                        : c.username ||
                                                                          `${c.other_wallet.slice(0, 6)}...${c.other_wallet.slice(-4)}`}
                                                                </div>
                                                                <div className="msg-inbox-right">
                                                                    <div className="msg-inbox-time">
                                                                        {timeAgo(
                                                                            c.last_message_at,
                                                                        )}
                                                                    </div>
                                                                    {c.unreadCount > 0 && (
                                                                        <div className="msg-unread-badge">
                                                                            {c.unreadCount > 9
                                                                                ? "9+"
                                                                                : c.unreadCount}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="msg-inbox-preview">
                                                                {c.preview}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : inboxTab === "requests" ? (
                                            <>
                                                {requests.length === 0 && (
                                                    <div className="msg-inbox-empty">
                                                        No pending requests
                                                    </div>
                                                )}
                                                {requests.map((r) => (
                                                    <div
                                                        key={r.other_wallet}
                                                        className="msg-inbox-item msg-request-item"
                                                    >
                                                        <div className="msg-inbox-avatar">
                                                            {r.other_wallet
                                                                .slice(2, 4)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="msg-inbox-info">
                                                            <div className="msg-inbox-top-row">
                                                                <div className="msg-inbox-name">
                                                                    {r.username ||
                                                                        `${r.other_wallet.slice(0, 6)}...${r.other_wallet.slice(-4)}`}
                                                                </div>
                                                            </div>
                                                            <div className="msg-inbox-preview">
                                                                {r.preview}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="msg-accept-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleAcceptRequest(r.other_wallet)
                                                            }}
                                                        >
                                                            Accept
                                                        </button>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            // NEW: BLOCK-LIST tab body
                                            <>
                                                {blockedList.length === 0 && (
                                                    <div className="msg-inbox-empty">
                                                        No blocked users
                                                    </div>
                                                )}
                                                {blockedList.map((b) => (
                                                    <div
                                                        key={b.other_wallet}
                                                        className={`msg-inbox-item msg-blocked-item ${
                                                            activeChat === b.other_wallet
                                                                ? "active"
                                                                : ""
                                                        }`}
                                                        onClick={() => openChat(b.other_wallet)}
                                                    >
                                                        <div className="msg-inbox-avatar">
                                                            {b.other_wallet
                                                                .slice(2, 4)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="msg-inbox-info">
                                                            <div className="msg-inbox-top-row">
                                                                <div className="msg-inbox-name">
                                                                    {b.username ||
                                                                        `${b.other_wallet.slice(0, 6)}...${b.other_wallet.slice(-4)}`}
                                                                </div>
                                                            </div>
                                                            <div className="msg-inbox-preview">
                                                                Blocked
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="msg-chat">
                                    {!activeChat ? (
                                        <div className="msg-empty">
                                            Enter a wallet address to start a conversation
                                        </div>
                                    ) : (
                                        <>
                                            <div className="msg-chat-header">
                                                <div className="msg-chat-avatar">
                                                    {activeChat === address?.toLowerCase()
                                                        ? "SM"
                                                        : activeChat.slice(2, 4).toUpperCase()}
                                                </div>
                                                <div className="msg-chat-header-info">
                                                    <div className="msg-chat-header-name">
                                                        {activeChat === address?.toLowerCase()
                                                            ? "Saved Messages"
                                                            : activeChatUsername ||
                                                              `${activeChat.slice(0, 6)}...${activeChat.slice(-4)}`}
                                                    </div>
                                                    {activeChat !== address?.toLowerCase() &&
                                                        activeChatUsername && (
                                                            <div
                                                                className="msg-chat-header-addr"
                                                                title="Click to copy"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(
                                                                        activeChat,
                                                                    )
                                                                }}
                                                            >
                                                                {activeChat}
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="msg-chat-header-actions">
                                                    {fullscreen && (
                                                        <button
                                                            className="msg-normal-btn"
                                                            onClick={() => setFullscreen(false)}
                                                        >
                                                            ⤡ NORMAL
                                                        </button>
                                                    )}
                                                    {/* NEW: Block / Unblock button, conditional */}
                                                    {activeChat !== address?.toLowerCase() &&
                                                        (blockStatus.iBlockedThem ? (
                                                            <button
                                                                className="msg-unblock-btn"
                                                                onClick={handleUnblockUser}
                                                            >
                                                                Unblock
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="msg-block-btn"
                                                                onClick={handleBlockUser}
                                                            >
                                                                Block
                                                            </button>
                                                        ))}
                                                    <button
                                                        className="msg-delete-btn"
                                                        onClick={handleDeleteConversation}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="msg-chat-body" ref={chatBodyRef}>
                                                {loadingMsgs && (
                                                    <div className="msg-empty">Loading...</div>
                                                )}
                                                {!loadingMsgs && messages.length === 0 && (
                                                    <div className="msg-empty">
                                                        No messages yet. Say hi!
                                                    </div>
                                                )}
                                                {messages.map((m, i) => {
                                                    const isMine =
                                                        m.from_wallet?.toLowerCase() ===
                                                        address.toLowerCase()
                                                    const prev = messages[i - 1]
                                                    const next = messages[i + 1]
                                                    const sameAsPrev =
                                                        prev &&
                                                        prev.from_wallet?.toLowerCase() ===
                                                            m.from_wallet?.toLowerCase()
                                                    const sameAsNext =
                                                        next &&
                                                        next.from_wallet?.toLowerCase() ===
                                                            m.from_wallet?.toLowerCase()
                                                    const showDateSeparator =
                                                        !prev ||
                                                        new Date(m.created_at).toDateString() !==
                                                            new Date(
                                                                prev.created_at,
                                                            ).toDateString()

                                                    return (
                                                        <Fragment key={i}>
                                                            {showDateSeparator && (
                                                                <div className="msg-date-separator">
                                                                    <span>
                                                                        {formatDateLabel(
                                                                            m.created_at,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div
                                                                className={`msg-bubble-wrap ${isMine ? "mine" : "theirs"} ${
                                                                    sameAsPrev ? "grouped-top" : ""
                                                                } ${sameAsNext ? "grouped-bottom" : ""}`}
                                                            >
                                                                <div
                                                                    className={`msg-bubble ${isMine ? "msg-mine" : "msg-theirs"} ${m.failed ? "msg-failed" : ""}`}
                                                                >
                                                                    {m.text}
                                                                    {m.pending && (
                                                                        <span className="msg-pending-dot">
                                                                            {" "}
                                                                            •••
                                                                        </span>
                                                                    )}
                                                                    {m.failed && (
                                                                        <span className="msg-failed-text">
                                                                            {" "}
                                                                            ⚠ failed
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {!sameAsNext && (
                                                                    <div className="msg-bubble-time">
                                                                        {formatMessageTime(
                                                                            m.created_at,
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Fragment>
                                                    )
                                                })}
                                                <div ref={bottomRef} />
                                            </div>
                                            {/* NEW: footer changes to a notice when blocked either way */}
                                            {blockStatus.iBlockedThem ||
                                            blockStatus.theyBlockedMe ? (
                                                <div className="msg-blocked-footer">
                                                    {blockStatus.iBlockedThem
                                                        ? "You have blocked this user. Unblock them to send a message."
                                                        : "You can't message this user. You have been blocked. You can message again once they unblock you."}
                                                </div>
                                            ) : (
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
                                                    <div
                                                        className={`msg-send-btn ${sending ? "sending" : ""}`}
                                                        onClick={!sending ? handleSend : undefined}
                                                        onMouseEnter={() => setSendHover(true)}
                                                        onMouseLeave={() => setSendHover(false)}
                                                        style={{
                                                            opacity: sending ? 0.6 : 1,
                                                            cursor: sending
                                                                ? "not-allowed"
                                                                : "pointer",
                                                        }}
                                                    >
                                                        <div
                                                            className="skew-fill-left"
                                                            style={{
                                                                transform: sendHover
                                                                    ? "translateX(-110%) skewX(-8deg)"
                                                                    : "skewX(-8deg)",
                                                            }}
                                                        />
                                                        <div
                                                            className="skew-fill-right"
                                                            style={{
                                                                transform: sendHover
                                                                    ? "translateX(110%) skewX(-8deg)"
                                                                    : "skewX(-8deg)",
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                position: "relative",
                                                                zIndex: 1,
                                                                color: sendHover ? "#fff" : "#000",
                                                                transition: "color 0.4s ease",
                                                            }}
                                                        >
                                                            {sending ? "..." : "SEND →"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
