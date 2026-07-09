"use client"
import { useEffect, useState } from "react"
import { checkIfRegistered, checkHasPinSet } from "../../config/contracts"
import SetPinNewWallet from "./SetPinNewWallet"
import { useRouter } from "next/navigation"

export default function SetPinPage() {
    const router = useRouter()
    const [skipToPin, setSkipToPin] = useState(false)
    const [ready, setReady] = useState(false)

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
                    const hasPinSet = await checkHasPinSet(accounts[0])
                    if (hasPinSet) {
                        router.push("/enterpin")
                        return
                    }
                    setSkipToPin(true)
                }
            } catch (e) {
                console.log("setpin check error:", e)
            }
            setReady(true)
        }
        check()
    }, [])

    if (!ready) return null

    return <SetPinNewWallet skipToPin={skipToPin} onSuccess={() => router.push("/enterpin")} />
}
