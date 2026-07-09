"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import ShootingStars from "../../../components/ShootingStars"
import Navbar from "../walletNavbar"
import { checkIfRegistered, checkHasPinSet } from "../../../config/contracts"

export default function MessagesPage() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)

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
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    paddingTop: "160px",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "2px",
                    fontSize: "14px",
                }}
            >
                MESSAGES — COMING SOON
            </div>
        </>
    )
}
