import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { address, seenMap } = await request.json()

    if (!address || !seenMap) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const wallets = Object.keys(seenMap)
    if (wallets.length === 0) {
        return Response.json({ counts: {} })
    }

    const sinceTimes = wallets.map((w) => seenMap[w] || "1970-01-01T00:00:00Z")

    const client = await pool.connect()
    try {
        const result = await client.query(
            `SELECT m.from_wallet, COUNT(*)::int AS cnt
             FROM messages m
             JOIN UNNEST($2::varchar[], $3::timestamptz[]) AS seen(wallet, since)
                ON m.from_wallet = seen.wallet
             WHERE m.to_wallet = $1 AND m.created_at > seen.since
             GROUP BY m.from_wallet`,
            [address.toLowerCase(), wallets, sinceTimes]
        )
        const counts = {}
        result.rows.forEach((r) => {
            counts[r.from_wallet] = r.cnt
        })
        return Response.json({ counts })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}