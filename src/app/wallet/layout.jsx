"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WalletLayout({ children }) {
    const router = useRouter()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const check = async () => {
            const token = sessionStorage.getItem("session")
            if (!token) {
                router.push("/enterpin")
                return
            }
            try {
                const res = await fetch("/api/verify-session", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) {
                    sessionStorage.removeItem("session")
                    router.push("/enterpin")
                    return
                }
                setChecking(false)
            } catch (e) {
                console.log(e)
                router.push("/enterpin")
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
                }}
            >
                VERIFYING...
            </div>
        )
    }

    return children
}
