#!/usr/bin/env bash
# Deploy BitStarter contracts to Monad Testnet
# Prerequisites: forge (Foundry), .env with PRIVATE_KEY and TOKEN_ADDRESS

set -e

source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url monad_testnet \
  --broadcast \
  --verify \
  -vvvv
