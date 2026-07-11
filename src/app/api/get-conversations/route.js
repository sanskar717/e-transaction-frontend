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
            `SELECT DISTINCT ON (other_wallet) other_wallet, last_message_at
             FROM (
                 SELECT 
                     CASE WHEN from_wallet = $1 THEN to_wallet ELSE from_wallet END AS other_wallet,
                     created_at AS last_message_at
                 FROM messages
                 WHERE from_wallet = $1 OR to_wallet = $1
             ) sub
             ORDER BY other_wallet, last_message_at DESC`,
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