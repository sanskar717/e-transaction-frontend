import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { fromWallet, toWallet, encryptedContent, encryptedContentSender } = await request.json()

    if (!fromWallet || !toWallet || !encryptedContent || !encryptedContentSender) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
        await client.query(
            `INSERT INTO messages (from_wallet, to_wallet, encrypted_content, encrypted_content_sender) 
             VALUES ($1, $2, $3, $4)`,
            [fromWallet.toLowerCase(), toWallet.toLowerCase(), encryptedContent, encryptedContentSender]
        )
        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}