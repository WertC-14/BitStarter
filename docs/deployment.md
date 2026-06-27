# Deployment

## Monad Testnet

1. Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Configure environment:

```bash
cd contracts-evm
cp .env.example .env
# PRIVATE_KEY ve MONAD_RPC_URL değerlerini .env dosyasına ekleyin
```

3. Build and deploy:

```bash
forge build
forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
```

4. Copy the printed contract addresses into `apps/web/.env.local`.

## Vercel

Import the GitHub repository and set the project root to `apps/web`.

- Build command: `npm run build`
- Install command: `npm install`
- Output directory: `.next`

Environment variables:

- `NEXT_PUBLIC_FACTORY_CONTRACT_ID`
- `NEXT_PUBLIC_ESCROW_CONTRACT_ID`
- `NEXT_PUBLIC_TOKEN_CONTRACT_ID`

## Current Testnet Deployment

- Network: Monad Testnet
- CampaignFactory: `TODO`
- Escrow: `TODO`
- Token: `TODO`
