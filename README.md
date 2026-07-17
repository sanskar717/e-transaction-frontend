# E-WALLET

A decentralized Web3 wallet dashboard built on Ethereum (Sepolia testnet) — combining on-chain wallet registration and PIN authentication with an off-chain, end-to-end encrypted messaging layer between wallet addresses.

> **Status:** Live on Sepolia testnet. Vercel production deployment in progress (ETA 1–2 days).

## 🌐 Live Demo

**App:** https://etransactions.vercel.app

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Smart Contracts](#smart-contracts)
- [Core Features](#core-features)
  - [Wallet Connection & Registration](#wallet-connection--registration)
  - [PIN Authentication](#pin-authentication)
  - [Transaction Dashboard](#transaction-dashboard)
  - [Encrypted Messaging System](#encrypted-messaging-system)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)

---

## Overview

E-Wallet lets a user connect their MetaMask (or any injected) wallet, register on-chain, secure their account with a PIN, and then track their own transaction history (sent, received, gas fees) pulled directly from the blockchain. On top of that, it layers a **fully end-to-end encrypted, wallet-to-wallet messaging system** — so two wallet addresses can chat with each other without ever exposing plaintext to the server or database.

No wallet data, balances, or transaction history is ever stored off-chain — everything transaction-related is read live from the blockchain. The only off-chain data is what's needed to support messaging (encrypted blobs only) and lightweight account metadata (username, PIN hash).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js (App Router) |
| Smart contracts | Solidity, deployed & managed via Foundry/Forge |
| Blockchain interaction | ethers.js v6 |
| Chain data / indexing | Alchemy RPC, Rindexer |
| Off-chain database | PostgreSQL (via Supabase), accessed with `pg` Pool |
| Auth | httpOnly cookie + JWT (via `jose`, edge-compatible) with on-chain PIN re-verification |
| Price data | CoinGecko API |
| Styling | Custom CSS (`Courier New` monospace theme, animated `ShootingStars` background) |
| Network | Ethereum Sepolia Testnet |

---

## Smart Contracts

All contracts are deployed on **Sepolia Testnet** and managed via Foundry. ABIs are synced to both the frontend (`src/contracts/`, `src/config/addresses.js`) and the Rindexer indexer via a shell script whenever contracts are redeployed.

```javascript
export const CONTRACT_ADDRESSES = {
  WalletRegistry: "0xb89b44DdCa766523b8b18FE375817c3598E3A2F7",
  TransactionTracker: "0xF29B326347Ec8172502BEE1908E9Fed77A8C19c3",
  TrackerStorage: "0x57FC0141F9e43a656A3ED83762AC1884Fb231cea",
};

export const SEPOLIA_CHAIN_ID = 11155111;
```

| Contract | Purpose |
|---|---|
| `WalletRegistry` | Handles wallet registration, PIN hash storage/verification, and registration status checks (`checkIfRegistered`, `checkHasPinSet`) |
| `TransactionTracker` | On-chain tracking hooks for a wallet's transaction activity |
| `TrackerStorage` | Backing storage contract used by the tracker system |

> **Network:** Sepolia (chain ID `11155111`). Make sure your wallet is switched to Sepolia before connecting — the app will not function on mainnet or other testnets.

---

## Core Features

### Wallet Connection & Registration

- Connects via `window.ethereum` (MetaMask / any EIP-1193 provider).
- On first connect, checks `checkIfRegistered(address)` against `WalletRegistry`.
- Unregistered wallets are routed to the registration flow before anything else is accessible.
- Registered wallets without a PIN are routed to `/setpin`.

### PIN Authentication

- PIN is set once and its hash is stored on-chain via `WalletRegistry`.
- Login flow (`/enterpin`) re-verifies the PIN **server-side** against the chain via Alchemy RPC — the PIN itself is never trusted from the client alone.
- Session is issued as an **httpOnly cookie + JWT** (using `jose`, edge-runtime compatible), replacing an earlier, spoofable `sessionStorage`-only flag.
- Next.js **middleware** protects every route under `/wallet/:path*` — no protected page renders without a valid session.

### Transaction Dashboard

All transaction data is read **live from the blockchain** — nothing is cached or duplicated in the database.

- **Sent** — all transactions where `txType === 0`, with stat cards and skeleton loading states.
- **Received** — all transactions where `txType === 1`, same card/loading treatment.
- **Total Gas Fees** — a dedicated summary page, filtered to sent transactions only, with a sticky summary card.
- **Account** — wallet profile: connected address, username, and account-level actions.

### Encrypted Messaging System

The centerpiece of the app: a **wallet-to-wallet encrypted chat system**, built entirely on top of Postgres (no third-party chat provider), with WhatsApp-style message requests, spam protection, and blocking.

#### How the encryption works

1. On first use, a wallet **signs a message** to deterministically derive a messaging keypair (`deriveMessagingKeypair`) — no gas cost, one-time signature.
2. The keypair is cached in `localStorage` (scoped per wallet address) and the **public key** is published to the server (`/api/save-public-key`) so other wallets can encrypt messages to you.
3. Every message is **encrypted twice** before it ever leaves the browser:
   - Once with the **receiver's** public key (`encrypted_content`) — so they can read it.
   - Once with the **sender's own** public key (`encrypted_content_sender`) — so the sender can also decrypt and re-read their own sent messages later (since only the receiver's ciphertext would otherwise be undecryptable by the sender).
4. The server only ever stores ciphertext. Decryption happens client-side with the private key, which never leaves `localStorage`.
5. **Disable Messaging** wipes the local private key and notifies the server — effectively "logging out" of the messaging feature. Re-enabling requires signing again to re-derive the same deterministic keypair.

#### Message requests (spam protection)

- The **first message** ever sent between two wallets creates a `chat_permissions` row with `status = 'pending'`.
- The sender **cannot send a second message** until the receiver responds — the receiver sees it under a **REQUESTS** tab, not in their main inbox.
- The receiver can either hit **Accept**, or simply **reply**, either of which flips the permission to `accepted` and unlocks normal two-way messaging.
- This prevents wallet-spam without requiring any moderation — no message is deliverable in bulk without explicit reciprocation.

#### Block / Unblock

- Either party can **Block** the other directly from an open chat — a confirmation modal explains the consequence before it's applied.
- Blocking is **directional** and immediately:
  - Removes the conversation from the blocker's normal INBOX/REQUESTS view.
  - Moves it into a dedicated **BLOCK-LIST** tab, where the chat can still be opened (read history, delete, or unblock) but not messaged in.
  - Prevents the blocked wallet from sending any further messages — enforced **server-side** in the send-message API (not just hidden in the UI), so it can't be bypassed by calling the API directly.
- If a blocked wallet tries to message the person who blocked them, they receive a clear on-screen notice: *"You can't message this user. You have been blocked. You can message again once they unblock you."*
- **Unblocking** requires a confirmation step and immediately restores normal messaging both ways.

#### Delete Conversation

- Deleting a conversation only hides it **from your own view** (via a `conversation_hides` timestamp) — it does not delete the other person's copy or the underlying messages. Confirmed via a modal before applying.

#### Fullscreen mode

- Chat can be expanded to a distraction-free fullscreen overlay and collapsed back at any time.

---

## Folder Structure

```
src/
├── app/
│   ├── api/                      # All backend routes (Postgres via `pg`)
│   │   ├── accept-request/
│   │   ├── block-user/
│   │   ├── unblock-user/
│   │   ├── get-block-status/
│   │   ├── get-blocked-list/
│   │   ├── get-conversations/
│   │   ├── get-messages/
│   │   ├── get-public-key/
│   │   ├── get-unread-counts/
│   │   ├── get-username/
│   │   ├── save-public-key/
│   │   ├── send-message/
│   │   ├── delete-conversation/
│   │   ├── disable-messaging/
│   │   ├── register-user/
│   │   ├── update-username/
│   │   ├── reset-users/
│   │   ├── verify-pin/
│   │   └── verify-session/
│   └── wallet/
│       ├── messages/             # Encrypted messaging UI
│       ├── transactions/
│       ├── sent/
│       ├── received/
│       ├── gas/                  # Total Gas Fees page
│       ├── account/
│       ├── enterpin/
│       └── setpin/
├── config/
│   ├── addresses.js               # Contract addresses + chain ID
│   └── contracts.js               # Contract read/write helpers
├── contracts/                     # Solidity source (Foundry project)
├── components/
│   └── ShootingStars.jsx          # Shared animated background
└── lib/
    └── messageCrypto.js           # Keypair derivation, encrypt/decrypt helpers
```

---

## Database Schema

Postgres tables (Supabase-hosted). Transaction data is intentionally **not** stored here — only account metadata and encrypted messaging state.

| Table | Purpose |
|---|---|
| `users` | Wallet address ↔ username mapping |
| `messages` | Encrypted message rows (`encrypted_content` for receiver, `encrypted_content_sender` for sender's own copy) |
| `chat_permissions` | Tracks request/accepted status per wallet pair (`wallet_a`, `wallet_b`, `initiated_by`, `status`) |
| `chat_blocks` | Directional block records (`blocker_wallet`, `blocked_wallet`) |
| `conversation_hides` | Per-wallet "deleted from view" timestamps |
| `eth_price_cache` | Cached CoinGecko price data |

---

## Environment Variables

```env
DATABASE_URL=            # Postgres connection string (Supabase)
ALCHEMY_API_KEY=         # Alchemy RPC key for Sepolia
JWT_SECRET=              # Secret for signing session JWTs (jose)
```

*(Add any additional keys your `.env.local` actually uses — e.g. CoinGecko or Rindexer config — as your setup requires.)*

---

## Getting Started

```bash
# install dependencies
npm install

# run the dev server
npm run dev

# open
http://localhost:3000
```

Make sure your wallet is connected to **Sepolia Testnet** and funded with test ETH before registering (use a Sepolia faucet if needed).

---

## Security Notes

- PINs are never trusted client-side alone — every session is re-verified against the on-chain PIN hash via server-side Alchemy RPC calls.
- Session cookies are httpOnly and JWT-signed; no client-readable session token exists.
- Messaging private keys never leave the browser's `localStorage` and are never transmitted to the server.
- The server only ever handles ciphertext for messages — it cannot read message content even with full database access.
- Blocking is enforced at the API layer, not just hidden in the UI, so it can't be bypassed by a direct API call.

---

## Roadmap

- [ ] Mainnet deployment consideration
- [ ] Push notifications for new messages / requests
- [ ] Media/attachment support in encrypted chat
- [ ] Multi-device key sync for messaging (currently per-device via `localStorage`)
- [ ] Vercel production deployment

---

## License

This project is currently unlicensed / private. Add a license here once decided.
