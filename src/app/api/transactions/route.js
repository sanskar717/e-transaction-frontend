import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function fetchWithRetry(url, options, retries = 3, delayMs = 1000) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(url, options)
        const data = await res.json()

        if (data?.error?.code === 429) {
            if (attempt === retries) return data
            const wait = delayMs * Math.pow(2, attempt)
            await new Promise(r => setTimeout(r, wait))
            continue
        }
        return data
    }
}

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
            const priceData = await fetchWithRetry(base, {
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
            if (priceData?.result) {
                price = parseInt(priceData.result, 16) / 1e8
            }
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

    const infuraBase = process.env.INFURA_URL
    const etherscanKey = process.env.ETHERSCAN_API_KEY

    try {
        const etherscanUrl = `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanKey}`

        const etherscanRes = await fetch(etherscanUrl)
        const etherscanData = await etherscanRes.json()

        if (etherscanData.status !== "1" && etherscanData.message !== "No transactions found") {
            return Response.json(
                { error: `Etherscan error: ${etherscanData.message || etherscanData.result}` },
                { status: 429 }
            )
        }

        const rawTxs = etherscanData.result || []

        const allTransfers = rawTxs
            .filter(tx => parseFloat(tx.value) > 0)
            .map(tx => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: (parseFloat(tx.value) / 1e18).toString(),
                blockNum: tx.blockNumber,
                metadata: { blockTimestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString() },
                txType: tx.from?.toLowerCase() === address.toLowerCase() ? 0 : 1,
                // Etherscan already gives us gasUsed + gasPrice directly — no extra RPC calls needed!
                gasUsed: tx.gasUsed,
                gasPrice: tx.gasPrice
            }))

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
            priceCache[dateKey] = await getEthPrice(dateKey, infuraBase, sampleTx?.metadata?.blockTimestamp)
            await new Promise(r => setTimeout(r, 300))
        }

        // ── No extra RPC calls needed — Etherscan already gave us gasUsed/gasPrice ──
        const txsWithGas = allTransfers.map(tx => {
            const gasUsed = parseInt(tx.gasUsed || "0")
            const gasPrice = parseInt(tx.gasPrice || "0")
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
        })

        const all = txsWithGas.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))
        return Response.json({ transactions: all })

    } catch (err) {
        console.error(err)
        return Response.json({ error: "Failed to fetch" }, { status: 500 })
    }
}