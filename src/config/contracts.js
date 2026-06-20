import { ethers } from "ethers"
import { CONTRACT_ADDRESSES } from "./addresses"
import WalletRegistryABI from "../contracts/WalletRegistry.json"
import TransactionTrackerABI from "../contracts/TransactionTracker.json"
import TrackerStorageABI from "../contracts/TrackerStorage.json"

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
    return new ethers.Contract(CONTRACT_ADDRESSES.WalletRegistry, WalletRegistryABI, signer)
}

export async function getTransactionTrackerContract() {
    const signer = await getSigner()
    return new ethers.Contract(
        CONTRACT_ADDRESSES.TransactionTracker,
        TransactionTrackerABI,
        signer,
    )
}

export async function checkIfRegistered(address) {
    const contract = await getWalletRegistryContract()
    return await contract.isWalletRegistered(address)
}

export async function registerWallet(username) {
    const contract = await getWalletRegistryContract()
    const tx = await contract.registerWallet(username)
    await tx.wait()
    return tx
}

export async function getTrackerStorageContract() {
    const signer = await getSigner()
    return new ethers.Contract(
        CONTRACT_ADDRESSES.TrackerStorage,
        TrackerStorageABI,
        signer
    )
}

export function hashPin(pin) {
    return ethers.keccak256(ethers.toUtf8Bytes(pin))
}

export async function checkHasPinSet(address) {
    const contract = await getWalletRegistryContract()
    return await contract.hasPinSet(address)
}

export async function setPinOnChain(pin) {
    const contract = await getWalletRegistryContract()
    const pinHash = hashPin(pin)
    const tx = await contract.setPin(pinHash)
    await tx.wait()
    return tx
}

export async function verifyPinOnChain(pin) {
    const contract = await getWalletRegistryContract()
    const pinHash = hashPin(pin)
    return await contract.verifyPin(pinHash)
}