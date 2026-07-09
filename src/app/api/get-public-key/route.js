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
            `SELECT public_key FROM user_keys WHERE wallet_address = $1`,
            [address.toLowerCase()]
        )
        if (result.rows.length === 0) {
            return Response.json({ error: "No key found for this wallet" }, { status: 404 })
        }
        return Response.json({ publicKey: result.rows[0].public_key })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}