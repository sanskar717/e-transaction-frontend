export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
        return Response.json({ error: "Address required" }, { status: 400 })
    }

    const key = process.env.ALCHEMY_API_KEY

    try {
        const [sentRes, receivedRes] = await Promise.all([
            fetch(`https://eth-sepolia.g.alchemy.com/v2/${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: 1,
                    jsonrpc: "2.0",
                    method: "alchemy_getAssetTransfers",
                    params: [{
                        fromBlock: "0x0",
                        toBlock: "latest",
                        fromAddress: address,
                        category: ["external"],
                        withMetadata: true,
                        excludeZeroValue: true,
                        maxCount: "0x64",
                        order: "desc"
                    }]
                })
            }),
            fetch(`https://eth-sepolia.g.alchemy.com/v2/${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: 2,
                    jsonrpc: "2.0",
                    method: "alchemy_getAssetTransfers",
                    params: [{
                        fromBlock: "0x0",
                        toBlock: "latest",
                        toAddress: address,
                        category: ["external"],
                        withMetadata: true,
                        excludeZeroValue: true,
                        maxCount: "0x64",
                        order: "desc"
                    }]
                })
            })
        ])

        const [sentData, receivedData] = await Promise.all([
            sentRes.json(),
            receivedRes.json()
        ])

        const sent = (sentData.result?.transfers || []).map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            amount: tx.value,
            timeStamp: tx.metadata?.blockTimestamp,
            txType: 0
        }))

        const received = (receivedData.result?.transfers || []).map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            amount: tx.value,
            timeStamp: tx.metadata?.blockTimestamp,
            txType: 1
        }))

        const all = [...sent, ...received].sort(
            (a, b) => new Date(b.timeStamp) - new Date(a.timeStamp)
        )

        return Response.json({ transactions: all })

    } catch (err) {
        console.error(err)
        return Response.json({ error: "Failed to fetch" }, { status: 500 })
    }
}