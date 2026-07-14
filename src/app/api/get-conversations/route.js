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

    const addr = address.toLowerCase()
    const client = await pool.connect()
    try {
        const conversationsResult = await client.query(
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
                        m.from_wallet AS msg_from,
                        m.to_wallet AS msg_to,
                        CASE WHEN m.from_wallet = $1 THEN m.to_wallet ELSE m.from_wallet END AS other_wallet,
                        m.created_at AS last_message_at,
                        m.from_wallet AS last_from_wallet,
                        m.encrypted_content AS last_content,
                        m.encrypted_content_sender AS last_content_sender
                    FROM messages m
                    WHERE m.from_wallet = $1 OR m.to_wallet = $1
                ) sub
                LEFT JOIN conversation_hides h 
                    ON h.wallet_address = $1 AND h.other_wallet = sub.other_wallet
                LEFT JOIN users u ON u.wallet_address = sub.other_wallet
                LEFT JOIN chat_permissions cp
                    ON cp.wallet_a = LEAST($1, sub.other_wallet)
                   AND cp.wallet_b = GREATEST($1, sub.other_wallet)
                -- NEW: blocked wallets ko normal inbox se bahar rakho.
                -- Yeh check karta hai ki maine unhe block kiya hai (blocker=me)
                -- ya unhone mujhe block kiya hai (blocker=other) -- dono case
                -- mein yeh conversation ab BLOCK-LIST tab mein jaayegi, inbox mein nahi.
                LEFT JOIN chat_blocks cb
                    ON (cb.blocker_wallet = $1 AND cb.blocked_wallet = sub.other_wallet)
                    OR (cb.blocker_wallet = sub.other_wallet AND cb.blocked_wallet = $1)
                WHERE sub.last_message_at > COALESCE(h.hidden_before, '1970-01-01T00:00:00Z')
                  AND (cp.status IS NULL OR cp.status = 'accepted' OR cp.initiated_by = $1)
                  AND cb.blocker_wallet IS NULL
                ORDER BY other_wallet, last_message_at DESC
            ) latest
            ORDER BY last_message_at DESC`,
            [addr]
        )

        const requestsResult = await client.query(
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
                        CASE WHEN m.from_wallet = $1 THEN m.to_wallet ELSE m.from_wallet END AS other_wallet,
                        m.created_at AS last_message_at,
                        m.from_wallet AS last_from_wallet,
                        m.encrypted_content AS last_content,
                        m.encrypted_content_sender AS last_content_sender
                    FROM messages m
                    WHERE m.from_wallet = $1 OR m.to_wallet = $1
                ) sub
                JOIN chat_permissions cp
                    ON cp.wallet_a = LEAST($1, sub.other_wallet)
                   AND cp.wallet_b = GREATEST($1, sub.other_wallet)
                LEFT JOIN conversation_hides h 
                    ON h.wallet_address = $1 AND h.other_wallet = sub.other_wallet
                LEFT JOIN users u ON u.wallet_address = sub.other_wallet
                -- NEW: blocked wallets requests mein bhi na dikhein
                LEFT JOIN chat_blocks cb
                    ON (cb.blocker_wallet = $1 AND cb.blocked_wallet = sub.other_wallet)
                    OR (cb.blocker_wallet = sub.other_wallet AND cb.blocked_wallet = $1)
                WHERE cp.status = 'pending'
                  AND cp.initiated_by != $1
                  AND sub.last_message_at > COALESCE(h.hidden_before, '1970-01-01T00:00:00Z')
                  AND cb.blocker_wallet IS NULL
                ORDER BY other_wallet, last_message_at DESC
            ) latest
            ORDER BY last_message_at DESC`,
            [addr]
        )

        return Response.json({
            conversations: conversationsResult.rows,
            requests: requestsResult.rows,
        })
    } catch (err) {
        console.error(err)
        return Response.json({ error: "DB error" }, { status: 500 })
    } finally {
        client.release()
    }
}