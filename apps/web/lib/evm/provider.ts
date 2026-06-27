import { BrowserProvider, JsonRpcProvider } from "ethers";
import { MONAD_TESTNET } from "./wallet";

// Read-only provider (server-side veya wallet bağlı değilken)
export function getReadProvider() {
  return new JsonRpcProvider(MONAD_TESTNET.rpcUrls[0]);
}

// Signer gerektiren işlemler için (MetaMask üzerinden)
export async function getSigner() {
  if (typeof window === "undefined") throw new Error("Tarayıcı gerekli.");
  const eth = (window as unknown as { ethereum?: object }).ethereum;
  if (!eth) throw new Error("MetaMask bulunamadı.");
  const provider = new BrowserProvider(eth as Parameters<typeof BrowserProvider>[0]);
  return provider.getSigner();
}
