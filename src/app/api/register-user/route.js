import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }

})

export async function POST(request) {
    const { walletAddress, username } = await request.json()
    if (!walletAddress || !username) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        await client.query(
            `INSERT INTO users (wallet_address, username) 
             VALUES ($1, $2) 
             ON CONFLICT (wallet_address) DO NOTHING`,
            [walletAddress.toLowerCase(), username]
        )
        return Response.json({ success: true })

    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }

}