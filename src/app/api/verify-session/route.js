import { NextResponse } from "next/server"
import { verifySession } from "../../../../lib/Auth"

export async function POST(req) {
    try {
        const authHeader = req.headers.get("authorization")
        const token = authHeader?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ valid: false }, { status: 401 })
        }

        const payload = await verifySession(token)
        if (!payload) {
            return NextResponse.json({ valid: false }, { status: 401 })
        }

        return NextResponse.json({ valid: true, address: payload.address })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ valid: false }, { status: 500 })
    }
}