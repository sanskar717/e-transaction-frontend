import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function getEthPrice(dateKey, base, blockTimestamp) {
    const client = await pool.connect()
    try {
        const result = await client.query(
            "SELECT price_usd FROM eth_price_cache WHERE date_key = $1",
            [dateKey]
        )
        if (result.rows.length > 0) {
            return parseFloat(result.rows[0].price_usd)
        }

        const today = new Date()
        const txDate = new Date(blockTimestamp)
        const isToday =
            txDate.getUTCDate() === today.getUTCDate() &&
            txDate.getUTCMonth() === today.getUTCMonth() &&
            txDate.getUTCFullYear() === today.getUTCFullYear()

        let price = 0

        if (isToday) {
            const priceRes = await fetch(base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0", id: 1,
                    method: "eth_call",
                    params: [{
                        to: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
                        data: "0x50d25bcd"
                    }, "latest"]
                })
            })
            const priceData = await priceRes.json()
            price = parseInt(priceData.result, 16) / 1e8
        } else {
            const [dd, mm, yyyy] = dateKey.split("-")
            const cgRes = await fetch(
                `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${dd}-${mm}-${yyyy}&localization=false`,
                {
                    headers: {
                        "Accept": "application/json",
                        "x-cg-demo-api-key": process.env.COINGECKO_API_KEY
                    }
                }
            )
            const cgData = await cgRes.json()
            price = cgData?.market_data?.current_price?.usd || 0
        }

        if (price > 0) {
            await client.query(
                "INSERT INTO eth_price_cache (date_key, price_usd) VALUES ($1, $2) ON CONFLICT (date_key) DO NOTHING",
                [dateKey, price]
            )
        }

        return price
    } finally {
        client.release()
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    if (!address) return Response.json({ error: "Address required" }, { status: 400 })

    const key = process.env.ALCHEMY_API_KEY
    const base = `https://eth-sepolia.g.alchemy.com/v2/${key}`

    try {
        const [sentRes, receivedRes] = await Promise.all([
            fetch(base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: 1, jsonrpc: "2.0",
                    method: "alchemy_getAssetTransfers",
                    params: [{ fromBlock: "0x0", toBlock: "latest", fromAddress: address, category: ["external"], withMetadata: true, excludeZeroValue: true, maxCount: "0x64", order: "desc" }]
                })
            }),
            fetch(base, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: 2, jsonrpc: "2.0",
                    method: "alchemy_getAssetTransfers",
                    params: [{ fromBlock: "0x0", toBlock: "latest", toAddress: address, category: ["external"], withMetadata: true, excludeZeroValue: true, maxCount: "0x64", order: "desc" }]
                })
            })
        ])

        const [sentData, receivedData] = await Promise.all([sentRes.json(), receivedRes.json()])

        const allTransfers = [
            ...(sentData.result?.transfers || []).map(tx => ({ ...tx, txType: 0 })),
            ...(receivedData.result?.transfers || []).map(tx => ({ ...tx, txType: 1 })),
        ]

        const uniqueDates = [...new Set(allTransfers.map(tx => {
            const date = new Date(tx.metadata?.blockTimestamp)
            const dd = String(date.getUTCDate()).padStart(2, "0")
            const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
            const yyyy = date.getUTCFullYear()
            return `${dd}-${mm}-${yyyy}`
        }))]

        const priceCache = {}
        for (const dateKey of uniqueDates) {
            const sampleTx = allTransfers.find(tx => {
                const date = new Date(tx.metadata?.blockTimestamp)
                const dd = String(date.getUTCDate()).padStart(2, "0")
                const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
                const yyyy = date.getUTCFullYear()
                return `${dd}-${mm}-${yyyy}` === dateKey
            })
            priceCache[dateKey] = await getEthPrice(dateKey, base, sampleTx?.metadata?.blockTimestamp)
            await new Promise(r => setTimeout(r, 300))
        }

        const txsWithGas = await Promise.all(
            allTransfers.map(async (tx) => {
                try {
                    const [receiptRes, txRes] = await Promise.all([
                        fetch(base, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0", id: 1,
                                method: "eth_getTransactionReceipt",
                                params: [tx.hash]
                            })
                        }),
                        fetch(base, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                jsonrpc: "2.0", id: 1,
                                method: "eth_getTransactionByHash",
                                params: [tx.hash]
                            })
                        })
                    ])

                    const [receiptData, txData] = await Promise.all([receiptRes.json(), txRes.json()])

                    const gasUsed = parseInt(receiptData.result?.gasUsed || "0", 16)
                    const gasPrice = parseInt(txData.result?.gasPrice || "0", 16)
                    const gasFeeEth = (gasUsed * gasPrice) / 1e18

                    const date = new Date(tx.metadata?.blockTimestamp)
                    const dd = String(date.getUTCDate()).padStart(2, "0")
                    const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
                    const yyyy = date.getUTCFullYear()
                    const dateKey = `${dd}-${mm}-${yyyy}`

                    const ethPrice = priceCache[dateKey] || 0
                    const gasFeeUsd = (gasFeeEth * ethPrice).toFixed(4)

                    return {
                        hash: tx.hash,
                        from: tx.from,
                        to: tx.to,
                        amount: tx.value,
                        timeStamp: tx.metadata?.blockTimestamp,
                        blockNum: tx.blockNum,
                        gasFeeUsd,
                        txType: tx.txType
                    }
                } catch {
                    return {
                        hash: tx.hash,
                        from: tx.from,
                        to: tx.to,
                        amount: tx.value,
                        timeStamp: tx.metadata?.blockTimestamp,
                        blockNum: tx.blockNum,
                        gasFeeUsd: "0.00",
                        txType: tx.txType
                    }
                }
            })
        )

        const all = txsWithGas.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))
        return Response.json({ transactions: all })

    } catch (err) {
        console.error(err)
        return Response.json({ error: "Failed to fetch" }, { status: 500 })
    }
}