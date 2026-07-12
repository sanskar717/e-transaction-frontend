import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

export async function POST(request) {
    const { address, otherWallet } = await request.json()

    if (!address || !otherWallet) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const user = address.toLowerCase()
    const otherUser = otherWallet.toLowerCase()

    const client = await pool.connect()
    try {
        await client.query(
            `INSERT INTO conversation_hides (wallet_address, other_wallet, hidden_before)
             VALUES ($1, $2, NOW())
             ON CONFLICT (wallet_address, other_wallet) 
             DO UPDATE SET hidden_before = NOW()`,
            [user, otherUser]
        )

        const otherHideCheck = await client.query(
            `SELECT 1 FROM conversation_hides WHERE wallet_address = $1 AND other_wallet = $2`,
            [otherUser, user]
        )

        if (otherHideCheck.rows.length > 0) {
            await client.query(
                `DELETE FROM messages 
                 WHERE (from_wallet = $1 AND to_wallet = $2) 
                    OR (from_wallet = $2 AND to_wallet = $1)`,
                [user, otherUser]
            )
            await client.query(
                `DELETE FROM conversation_hides 
                 WHERE (wallet_address = $1 AND other_wallet = $2) 
                    OR (wallet_address = $2 AND other_wallet = $1)`,
                [user, otherUser]
            )
        }

        return Response.json({ success: true })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}