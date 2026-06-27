# BitStarter

## Overview

BitStarter uses EVM smart contracts on Monad Testnet to create a refund-protected investment crowdfunding system. A configurable share of each investment is immediately usable by the developer, while the protected reserve can be refunded if the project is rejected or cancelled.

## Problem

Early software projects often require investors to trust a developer before the product exists. Developers also need a clear way to access staged funding while giving investors refund protection.

## Solution

BitStarter lets developers create investment campaigns with a goal, deadline, refund ratio, usable ratio, and voting duration. Investors fund campaigns through Monad Testnet contracts, vote with power proportional to invested capital, and can claim the protected reserve if a campaign is rejected or cancelled.

## Features

- Solidity smart contracts with Foundry.
- Three-contract architecture with factory, campaign, and refund manager.
- Inter-contract refund eligibility checks.
- Event-driven activity feed abstraction for near-real-time updates.
- Mobile responsive Next.js frontend.
- Client-side validation, loading states, and readable transaction errors.
- Foundry contract tests and Vitest frontend tests.
- GitHub Actions CI for frontend and contract checks.
- Monad Testnet and Vercel deployment documentation.

## Architecture

```txt
contracts-evm/
  src/
    CampaignFactory.sol
    InvestmentCampaign.sol
    CommitmentCampaign.sol
    RefundManager.sol
    Escrow.sol
    IEscrow.sol
  test/
  script/
apps/web/
  app/
  components/
  features/
  lib/
scripts/
docs/
```

See [docs/architecture.md](docs/architecture.md) for details.

## Smart Contracts

- `CampaignFactory`: creates campaign records, tracks all campaigns, stores developer-to-campaign mappings, and deploys investment and commitment campaigns.
- `Escrow`: holds token custody for campaign investments.
- `InvestmentCampaign`: tracks campaign metadata, investor positions, usable funds, refund reserves, weighted voting, final withdrawal, cancellation, and escrow release rules.
- `CommitmentCampaign`: cohort-based variant of investment campaign with configurable defection rate.
- `RefundManager`: optional compatibility wrapper that delegates refund claims to the campaign contract.

## Inter-Contract Communication

`RefundManager` delegates to `InvestmentCampaign.claimRefund`. Refund state and refund events are owned by the campaign contract.

## Event Streaming / Real-Time Updates

Contracts emit events for campaign creation, investments, usable withdrawals, voting, finalization, refunds, remaining withdrawals, and cancellations. The frontend keeps all realtime logic in `apps/web/features/realtime`. The current Vercel-safe implementation uses polling with a parser abstraction; after deployment, wire the poller to Monad RPC event responses for the configured contract addresses.

## Tech Stack

- Solidity smart contracts (Foundry)
- ethers.js v6
- Next.js, React, TypeScript
- Tailwind CSS
- Vitest and React Testing Library
- GitHub Actions
- Vercel

## Local Setup

```bash
git clone https://github.com/your-org/bitstarter.git
cd bitstarter/apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```txt
NEXT_PUBLIC_FACTORY_CONTRACT_ID=0x...
NEXT_PUBLIC_ESCROW_CONTRACT_ID=0x...
NEXT_PUBLIC_TOKEN_CONTRACT_ID=0x...
```

Do not expose deployer private keys with `NEXT_PUBLIC_`.

## Running Tests

Frontend:

```bash
cd apps/web
npm test
npm run build
```

Contracts:

```bash
cd contracts-evm
forge build
forge test
```

## Monad Testnet Deployment

```bash
cd contracts-evm
cp .env.example .env
# .env dosyasına PRIVATE_KEY ve MONAD_RPC_URL ekleyin
forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
```

Copy the printed contract addresses into `apps/web/.env.local` and Vercel environment variables.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import it into Vercel.
3. Set the Vercel project root to `apps/web`.
4. Set the environment variables listed above.
5. Use `npm run build` as the build command.
6. Deploy.

Live demo link: `TODO`

## Contract Addresses

- CampaignFactory: `TODO`
- Escrow: `TODO`
- Token: `TODO`

## Example Transaction Hash

`TODO`

## Screenshots

- Mobile responsive UI: `docs/screenshots/mobile-ui.png` placeholder
- CI/CD pipeline running: `docs/screenshots/ci-pipeline.png` placeholder
- Test output with 3+ passing tests: `docs/screenshots/test-output.png` placeholder

## Demo Video

Demo video link: `TODO`

## Submission Checklist

- [ ] Public GitHub repository
- [ ] 10+ meaningful commits
- [ ] Vercel live demo link
- [ ] Monad Testnet contract addresses
- [ ] Example transaction hash
- [ ] Mobile UI screenshot
- [ ] CI screenshot
- [ ] Test output screenshot
- [ ] Demo video link

## Known Limitations

- The frontend currently includes demo data fallback so the UI is reviewable before Testnet deployment.
- Campaign funds are held by the dedicated `Escrow` contract; redeploy factory, escrow, campaign, and refund manager together before retesting Testnet flows.
