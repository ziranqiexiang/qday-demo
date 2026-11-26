# Q-Day Demo — Quantum Pass (Build Before Q-Day)

A Quantum Pass entry for the QoreChain Developer Fest (Build Before Q-Day):
a small app that sends a hybrid post-quantum transaction and reads it back
from the QoreChain testnet, following the official Workshop 1 guide.

- **What it does:** deploys a `Counter` contract to the QoreChain testnet
  (`qorechain-diana`, chain ID 9800) inside an EVM authorisation window
  opened with a hybrid-signed transaction (classical secp256k1 +
  post-quantum ML-DSA-87). The chain verifies both signatures and emits a
  `pqc_hybrid_verify` event with status `verified`.
- **Testnet address:** `qor14uy5r6zt738t0x4nqely9z3tatvypw5sy9he72`
  (`0xAf0941e84bF44EB79aB3067E428A2bEad840BA90`)
- **How it's made:** built from the official QoreChain Workshop 1 guide
  (`create-qorechain-dapp` Hardhat template, `@qorechain/sdk`,
  Hardhat 3, viem). No code was copied from another submission.
- **Status:** tests passing (2/2); ML-DSA-87 key registered, Counter
  contract deployed to testnet at
  `0x60a5dfd01311D2C2402D9B8f39151B4bAE6Cc9AC`, hybrid-signed transaction
  `5F0DBF10D88598A9229C4C8CEAF8CF459FDC75A6FFCAE849070DAED2DF3AC81D`
  verified on chain (`code: 0`, `pqc_hybrid_verify` status `verified`,
  4,627-byte ML-DSA-87 signature).

## QoreChain Hardhat starter

A [Hardhat 3](https://hardhat.org) project for the QoreChain EVM, using the
viem toolbox: a `Counter` contract, tests on Hardhat's simulated network, an
Ignition deploy module, and a small helper that opens the EVM authorisation
window your deployer needs.

| Network | EVM chain id | Hardhat network | RPC |
| --- | --- | --- | --- |
| Testnet (`qorechain-diana`) | 9800 | `qorechainTestnet` | `https://evm-testnet.qore.host` |
| Mainnet (`qorechain-vladi`) | 9801 | `qorechain` | `https://evm.qore.host` |

## Prerequisites

- Node.js 22 or later (Hardhat 3 requires it).
- A funded account on the network you deploy to.

## Setup

```sh
pnpm install
cp .env.example .env   # the scaffolder already did this
```

Put the deployer's key in `.env` (`PRIVATE_KEY`), or store it encrypted with
`npx hardhat keystore set PRIVATE_KEY`. Never commit `.env`.

## Build and test

```sh
pnpm build    # hardhat build
pnpm test     # hardhat test, on the simulated network
```

## Before you deploy: open an EVM window

QoreChain admits an EVM transaction only when the sender has:

1. a registered **ML-DSA-87** key, and
2. a live **EVM authorisation window**.

Both are set up on QoreChain's native lane with messages signed with the
post-quantum key, so the secp256k1 key in `PRIVATE_KEY` can never authorise
spending on its own. A deploy from an account without them is refused, so do
this first:

```sh
pnpm window status     # account, PQC key, window
pnpm window register   # once per account: registers its ML-DSA-87 key
pnpm window open       # opens a window: 600 blocks, 5 transactions
```

With `QORE_MNEMONIC` set, the helper derives the account and its ML-DSA-87 key
from the mnemonic. Otherwise it uses `PRIVATE_KEY` for the account and a PQC
recovery code, `QORE_PQC_RECOVERY_CODE`, for the ML-DSA-87 key; it stops with a
message if the code is missing. Create a code once and put it in `.env`:

```sh
pnpm window recovery-code   # prints a new QRC1 code (generatePqcRecoveryCode)
```

Keep a copy of the code apart from the private key and keep using the same
one: a different code gives the account a different ML-DSA-87 key. If the
account already has a key registered by another wallet, open the window from
that wallet instead. An account registered with this helper before SDK 0.13.0
has a different key registered; `pnpm window status` then shows
"registered, but NOT this key". Rotate it to the recovery-code key with
`rotatePqcKeyMsg` (MsgRotatePQCKey), loading the old key with
`unifiedAccountFromSeed(seed, { legacySeedDerivation: true })` (see the
`@qorechain/sdk` README).

- The window bounds blocks, EVM transactions, and the total they may spend:
  value **plus** the maximum fee (gas limit x fee cap) of each transaction.
  `pnpm window open` sizes it for transactions of up to 3,000,000 gas at a
  250 gwei fee cap; set `QORE_WINDOW_MAX_UQOR` to choose the total yourself.
- `blocks` is a block count, not a duration.
- Opening a window **advances the account's nonce**. Open it first, then
  deploy. Hardhat Ignition waits for 5 confirmations of the account's last
  transaction, so give the window about 10 seconds to settle before
  `pnpm deploy:testnet`; otherwise it stops with HHE10402 and you run it again.
- Opening replaces any earlier window.

## Deploy

```sh
pnpm window open
pnpm deploy:testnet
# = hardhat ignition deploy ignition/modules/Counter.ts --network qorechainTestnet
```

Pass `--parameters` to Ignition to change the initial count.

Contract verification: Sourcify does not list chain ids 9800 and 9801 yet.

## Project layout

```
contracts/Counter.sol          the contract
test/Counter.ts                tests (node:test + viem)
ignition/modules/Counter.ts    the deploy module
scripts/window.ts              the EVM window helper (pnpm window)
hardhat.config.ts              compiler settings and the QoreChain networks
```
