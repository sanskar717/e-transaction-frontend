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

        const blockRes = await client.query(
            `SELECT blocker_wallet, blocked_wallet FROM chat_blocks
             WHERE (blocker_wallet = $1 AND blocked_wallet = $2)
                OR (blocker_wallet = $2 AND blocked_wallet = $1)`,
            [to, from]
        )

        if (blockRes.rows.length > 0) {
            const blockedByReceiver = blockRes.rows.some(
                (r) => r.blocker_wallet === to && r.blocked_wallet === from
            )
            await client.query("ROLLBACK")
            return Response.json(
                {
                    success: false,
                    error: blockedByReceiver ? "BLOCKED_BY_RECEIVER" : "YOU_BLOCKED_THEM",
                },
                { status: 403 }
            )
        }

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

            if (perm.status === "pending" && perm.initiated_by === from) {
                await client.query("ROLLBACK")
                return Response.json({ success: false, error: "PENDING_REQUEST" }, { status: 403 })
            }

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