import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { walletAddress } = await request.json()
    if (!walletAddress) {
        return Response.json({ error: "Missing wallet address" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        await client.query(
            `DELETE FROM users WHERE wallet_address = $1`,
            [walletAddress.toLowerCase()]
        )
        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}