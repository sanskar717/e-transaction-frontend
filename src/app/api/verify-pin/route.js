import { ethers } from "ethers"
import { NextResponse } from "next/server"
import { signSession } from "../../../../lib/Auth"
import WalletRegistryABI from "../../../contracts/WalletRegistry.json"
import { CONTRACT_ADDRESSES } from "../../../config/addresses"

export async function POST(req) {
    try {
        const { address, pin } = await req.json()
        if (!address || !pin) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL)
        const contract = new ethers.Contract(
            CONTRACT_ADDRESSES.WalletRegistry,
            WalletRegistryABI,
            provider
        )

        const isRegistered = await contract.isWalletRegistered(address)
        if (!isRegistered) {
            return NextResponse.json({ error: "NOT_REGISTERED" }, { status: 403 })
        }

        const hasPinSet = await contract.hasPinSet(address)
        if (!hasPinSet) {
            return NextResponse.json({ error: "NO_PIN_SET" }, { status: 403 })
        }

        const pinHash = ethers.keccak256(ethers.toUtf8Bytes(pin))
        const isValid = await contract.verifyPin(pinHash, { from: address })

        if (!isValid) {
            return NextResponse.json({ error: "INVALID_PIN" }, { status: 401 })
        }

        const token = await signSession(address)
        return NextResponse.json({ success: true, token })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
    }
}