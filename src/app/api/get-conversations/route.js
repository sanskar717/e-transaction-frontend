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

    const client = await pool.connect()
    try {
        const result = await client.query(
            `SELECT * FROM (
                SELECT DISTINCT ON (other_wallet) 
                    sub.other_wallet, 
                    sub.last_message_at, 
                    sub.last_from_wallet,
                    sub.last_content,
                    sub.last_content_sender,
                    u.username
                FROM (
                    SELECT 
                        CASE WHEN from_wallet = $1 THEN to_wallet ELSE from_wallet END AS other_wallet,
                        created_at AS last_message_at,
                        from_wallet AS last_from_wallet,
                        encrypted_content AS last_content,
                        encrypted_content_sender AS last_content_sender
                    FROM messages
                    WHERE from_wallet = $1 OR to_wallet = $1
                ) sub
                LEFT JOIN users u ON u.wallet_address = sub.other_wallet
                ORDER BY other_wallet, last_message_at DESC
            ) latest
            ORDER BY last_message_at DESC`,
            [address.toLowerCase()]
        )
        return Response.json({ conversations: result.rows })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}