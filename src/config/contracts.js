import { ethers } from "ethers"
import { CONTRACT_ADDRESSES } from "./addresses"
import WalletRegistryABI from "../contracts/WalletRegistry.json"
import TransactionTrackerABI from "../contracts/TransactionTracker.json"

export function getProvider() {
    if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask install karo!")
    }
    return new ethers.BrowserProvider(window.ethereum)
}

export async function getSigner() {
    const provider = getProvider()
    return await provider.getSigner()
}

export async function getWalletRegistryContract() {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACT_ADDRESSES.WalletRegistry, WalletRegistryABI.abi, signer)
}

export async function getTransactionTrackerContract() {
    const signer = await getSigner()
    return new ethers.Contract(
        CONTRACT_ADDRESSES.TransactionTracker,
        TransactionTrackerABI.abi,
        signer,
    )
}

export async function checkIfRegistered(address) {
    const contract = await getWalletRegistryContract()
    const result = await contract.isWalletRegistered(address)
    return result
}

export async function registerWallet(username) {
    const contract = await getWalletRegistryContract()
    const tx = await contract.registerWallet(username)
    await tx.wait()
    return tx
}
