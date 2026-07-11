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
            `SELECT username FROM users WHERE wallet_address = $1`,
            [address.toLowerCase()]
        )
        return Response.json({ username: result.rows[0]?.username || null })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}