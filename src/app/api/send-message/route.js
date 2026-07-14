import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

function sortPair(a, b) {
    return a < b ? [a, b] : [b, a]
}

export async function POST(request) {
    const { fromWallet, toWallet, encryptedContent, encryptedContentSender } = await request.json()

    if (!fromWallet || !toWallet || !encryptedContent || !encryptedContentSender) {
        return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    const from = fromWallet.toLowerCase()
    const to = toWallet.toLowerCase()
    const [wallet_a, wallet_b] = sortPair(from, to)

    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        // Try to create the permission row. RETURNING tells us if it was
        // just created (brand new pair, first message ever -> always allow)
        // or if it already existed (need to check status below).
        const insertRes = await client.query(
            `INSERT INTO chat_permissions (wallet_a, wallet_b, initiated_by, status)
             VALUES ($1, $2, $3, 'pending')
             ON CONFLICT (wallet_a, wallet_b) DO NOTHING
             RETURNING *`,
            [wallet_a, wallet_b, from]
        )

        const justCreated = insertRes.rows.length > 0

        if (!justCreated) {
            const permRes = await client.query(
                `SELECT status, initiated_by FROM chat_permissions
                 WHERE wallet_a = $1 AND wallet_b = $2
                 FOR UPDATE`,
                [wallet_a, wallet_b]
            )
            const perm = permRes.rows[0]

            // sender already sent the first message and receiver hasn't accepted yet -> block
            if (perm.status === "pending" && perm.initiated_by === from) {
                await client.query("ROLLBACK")
                return Response.json({ success: false, error: "PENDING_REQUEST" }, { status: 403 })
            }

            // the OTHER wallet initiated and is now pending -> this reply counts as accepting it
            if (perm.status === "pending" && perm.initiated_by !== from) {
                await client.query(
                    `UPDATE chat_permissions SET status = 'accepted' WHERE wallet_a = $1 AND wallet_b = $2`,
                    [wallet_a, wallet_b]
                )
            }
        }

        await client.query(
            `INSERT INTO messages (from_wallet, to_wallet, encrypted_content, encrypted_content_sender) 
             VALUES ($1, $2, $3, $4)`,
            [from, to, encryptedContent, encryptedContentSender]
        )

        await client.query("COMMIT")
        return Response.json({ success: true })
    } catch (err) {
        await client.query("ROLLBACK")
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}