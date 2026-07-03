"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ShootingStars from "../../components/ShootingStars"
import { checkIfRegistered, checkHasPinSet } from "../../config/contracts"
import Navbar from "./walletNavbar"
import Transactions from "./Transactions"
import Dashboard from "./dashboard"

export default function WalletPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [activeTab, setActiveTab] = useState("transactions")
    const [walletAddress, setWalletAddress] = useState(null)

    useEffect(() => {
        const check = async () => {
            const pinVerified = sessionStorage.getItem("pinVerified")
            if (!pinVerified) {
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
            const address = accounts[0]
            try {
                const isRegistered = await checkIfRegistered(address)
                if (!isRegistered) {
                    router.push("/")
                    return
                }
                const hasPinSet = await checkHasPinSet(address)
                if (!hasPinSet) {
                    router.push("/setpin")
                    return
                }
                setWalletAddress(address)
                setChecking(false)
            } catch (e) {
                console.log(e)
                router.push("/")
            }
        }
        check()
    }, [])

    if (checking) {
        return (
            <div
                style={{
                    background: "#000",
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "12px",
                    letterSpacing: "3px",
                    fontFamily: "'Courier New', monospace",
                }}
            >
                <ShootingStars />
                VERIFYING...
            </div>
        )
    }

    return (
        <main style={{ background: "#000", minHeight: "100vh", paddingTop: "120px" }}>
            <ShootingStars />
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <Transactions activeTab={activeTab} walletAddress={walletAddress} />
            <Dashboard activeTab={activeTab} />
        </main>
    )
}
