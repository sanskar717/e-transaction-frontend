import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { walletAddress, newUsername } = await request.json()
    if (!walletAddress || !newUsername) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        await client.query(
            `UPDATE users 
             SET username = $2, updated_at = NOW() 
             WHERE wallet_address = $1`,
            [walletAddress.toLowerCase(), newUsername]
        )
        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}