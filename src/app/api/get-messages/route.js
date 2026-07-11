import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const myWallet = searchParams.get("address")
    const otherWallet = searchParams.get("with")

    if (!myWallet || !otherWallet) {
        return Response.json({ error: "Both addresses required" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        const result = await client.query(
            `SELECT id, from_wallet, to_wallet, encrypted_content, encrypted_content_sender, created_at 
             FROM messages 
             WHERE (from_wallet = $1 AND to_wallet = $2) 
                OR (from_wallet = $2 AND to_wallet = $1)
             ORDER BY created_at ASC`,
            [myWallet.toLowerCase(), otherWallet.toLowerCase()]
        )
        return Response.json({ messages: result.rows })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}