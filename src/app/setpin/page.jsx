"use client"
import SetPinNewWallet from "./SetPinNewWallet"
import { useRouter } from "next/navigation"

export default function SetPinPage() {
    const router = useRouter()

    return (
        <div style={{
            background: "#000000",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <SetPinNewWallet
                onSuccess={() => {
                    router.push("/dashboard") 
                }}
                onBack={() => {
                    router.push("/") 
                }}
            />
        </div>
    )
}