export const userFriendlyErrors: Record<string, string> = {
  wallet_not_connected: "Connect a Monad Testnet wallet before submitting a transaction.",
  wrong_network: "Switch your wallet to Monad Testnet.",
  invalid_goal_amount: "Enter a goal amount greater than zero.",
  invalid_deadline: "Choose a future deadline.",
  transaction_rejected: "The transaction was rejected in your wallet.",
  transaction_failed: "The transaction failed on Monad Testnet.",
  contract_call_failed: "The contract call failed. Check the campaign status and try again.",
  rpc_unavailable: "Monad RPC is unavailable. Try again in a moment.",
  campaign_not_found: "Campaign not found.",
  refund_not_available: "Refund is not available for this campaign.",
  withdraw_not_allowed: "Withdrawal is only available for the current campaign status and available balance.",
  amount_exceeds_remaining: "Investment amount cannot exceed the remaining campaign goal."
};
