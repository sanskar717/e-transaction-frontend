import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { address, otherWallet } = await request.json()

    if (!address || !otherWallet) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const blocker = address.toLowerCase()
    const blocked = otherWallet.toLowerCase()

    const client = await pool.connect()
    try {
        await client.query(
            `DELETE FROM chat_blocks WHERE blocker_wallet = $1 AND blocked_wallet = $2`,
            [blocker, blocked]
        )
        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}