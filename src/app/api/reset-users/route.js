import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { secret } = await request.json()

    if (secret !== process.env.RESET_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
        await client.query(`TRUNCATE TABLE users RESTART IDENTITY`)
        return Response.json({ success: true, message: "users table reset, IDs restarted from 1" })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}