"use client"
import { useState } from "react"

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("transactions")

    return (
        <div
            style={{
                background: "#000",
                minHeight: "100vh",
                fontFamily: "'Courier New', monospace",
                paddingTop: "120px", // navbar (64px top + 44px tabs)
            }}
        >
            <div
                style={{
                    padding: "40px",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "11px",
                    letterSpacing: "3px",
                }}
            >
                // {activeTab.toUpperCase()} — coming soon
            </div>
        </div>
    )
}
