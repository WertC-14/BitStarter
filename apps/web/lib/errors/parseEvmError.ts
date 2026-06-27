import { userFriendlyErrors } from "./userFriendlyErrors";

export function parseEvmError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.startsWith("withdraw an amount up to")) return error.message;
    if (message.includes("invalid investment amount")) return error.message;
    if (message.includes("user rejected") || message.includes("reject")) return userFriendlyErrors.transaction_rejected;
    if (message.includes("rpc") || message.includes("fetch") || message.includes("network")) return userFriendlyErrors.rpc_unavailable;
    if (message.includes("refund")) return userFriendlyErrors.refund_not_available;
    if (message.includes("withdraw")) return userFriendlyErrors.withdraw_not_allowed;
    if (message.includes("remaining") || message.includes("amountexceedsremaininggoal")) return userFriendlyErrors.amount_exceeds_remaining;
    return error.message;
  }
  return userFriendlyErrors.contract_call_failed;
}
