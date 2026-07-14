import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const otherWallet = searchParams.get("otherWallet")

    if (!address || !otherWallet) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const user = address.toLowerCase()
    const otheruser = otherWallet.toLowerCase()

    const client = await pool.connect()
    try {
        const res = await client.query(
            `SELECT blocker_wallet, blocked_wallet FROM chat_blocks
             WHERE (blocker_wallet = $1 AND blocked_wallet = $2)
                OR (blocker_wallet = $2 AND blocked_wallet = $1)`,
            [user, otheruser]
        )

        const iBlockedThem = res.rows.some(
            (r) => r.blocker_wallet === user && r.blocked_wallet === otheruser
        )
        const theyBlockedMe = res.rows.some(
            (r) => r.blocker_wallet === otheruser && r.blocked_wallet === user
        )

        return Response.json({ iBlockedThem, theyBlockedMe })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}