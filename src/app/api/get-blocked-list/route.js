import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
        return Response.json({ error: "Address required" }, { status: 400 })
    }

    const addr = address.toLowerCase()
    const client = await pool.connect()
    try {
        const result = await client.query(
            `SELECT 
                cb.blocked_wallet AS other_wallet,
                cb.created_at AS blocked_at,
                u.username
             FROM chat_blocks cb
             LEFT JOIN users u ON u.wallet_address = cb.blocked_wallet
             WHERE cb.blocker_wallet = $1
             ORDER BY cb.created_at DESC`,
            [addr]
        )

        return Response.json({ blocked: result.rows })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}