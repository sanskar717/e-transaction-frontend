import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { walletAddress, publicKey } = await request.json()

    if (!walletAddress || !publicKey) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        await client.query(
            `INSERT INTO user_keys (wallet_address, public_key) 
             VALUES ($1, $2) 
             ON CONFLICT (wallet_address) DO UPDATE SET public_key = $2`,
            [walletAddress.toLowerCase(), publicKey]
        )
        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}