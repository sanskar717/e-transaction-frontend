"use client"
import { useState, useEffect } from "react"
import Navbar from "./walletNavbar"

export default function Dashboard() {
    const [account, setAccount] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem("wallet")
        if (saved) {
            setAccount(saved)
        }
    }, [])

    return (
        <div
            style={{
                minHeight: "100vh",
                color: "#f1f5f9",
                fontFamily: "'Courier New', monospace",
                position: "relative",
            }}
        >
            <Navbar account={account} />
        </div>
    )
}
