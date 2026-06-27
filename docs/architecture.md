# Architecture

BitStarter is a monorepo with EVM smart contracts (Foundry) and a Vercel-ready Next.js app targeting Monad Testnet.

The contract layer is split into:

- `CampaignFactory`: creates and indexes campaigns.
- `InvestmentCampaign`: stores investor positions, usable funds, refund reserves, voting, settlement, and cancellation.
- `CommitmentCampaign`: cohort-based investment campaign variant.
- `RefundManager`: optional wrapper that delegates refund claims to campaign contracts without duplicating refund state.
- `Escrow`: holds token custody on behalf of campaigns.

The frontend isolates EVM provider access in `apps/web/lib/evm` and contract-facing methods in `apps/web/lib/contracts`. UI pages consume those abstractions instead of constructing blockchain calls directly.

Realtime updates are handled through `apps/web/features/realtime`. The current implementation uses a polling abstraction so it can run reliably on Vercel. The same parser can be wired to Monad RPC event responses after contract addresses are deployed.
