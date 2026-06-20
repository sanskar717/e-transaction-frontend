"use client"
import { useEffect } from "react"
import { checkIfRegistered } from "../../config/contracts"
import SetPinNewWallet from "./SetPinNewWallet"
import { useRouter } from "next/navigation"

export default function SetPinPage() {
    const router = useRouter()

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
                const isRegistered = await checkIfRegistered(accounts[0])
                if (isRegistered) {
                    router.push("/enterpin")
                    return
                }
            } catch (e) {
                console.log("setpin check error:", e)
            }
        }
        check()
    }, [])

    return (
        <SetPinNewWallet
            onSuccess={() => router.push("/enterpin")}
            onBack={() => router.push("/")}
        />
    )
}
