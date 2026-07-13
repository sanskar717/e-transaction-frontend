import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

function sortPair(a, b) {
    return a < b ? [a, b] : [b, a]
}

export async function POST(request) {
    const { address, otherWallet } = await request.json()

    if (!address || !otherWallet) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const [wallet_a, wallet_b] = sortPair(address.toLowerCase(), otherWallet.toLowerCase())

    const client = await pool.connect()
    try {
        await client.query(
            `UPDATE chat_permissions SET status = 'accepted' 
             WHERE wallet_a = $1 AND wallet_b = $2`,
            [wallet_a, wallet_b]
        )
        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}