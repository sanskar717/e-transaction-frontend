import EthCrypto from "eth-crypto"

const SIGN_MESSAGE = "Generate my E-Wallet messaging key"

export async function deriveMessagingKeypair(walletAddress) {
    if (!window.ethereum) throw new Error("No wallet found")

    const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [SIGN_MESSAGE, walletAddress],
    })

    const privateKey = EthCrypto.hash.keccak256(signature)
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey)

    return { privateKey, publicKey }
}

export async function encryptMessage(receiverPublicKey, message) {
    const encrypted = await EthCrypto.encryptWithPublicKey(receiverPublicKey, message)
    return EthCrypto.cipher.stringify(encrypted)
}

export async function decryptMessage(privateKey, encryptedString) {
    const encryptedObject = EthCrypto.cipher.parse(encryptedString)
    const decrypted = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject)
    return decrypted
}