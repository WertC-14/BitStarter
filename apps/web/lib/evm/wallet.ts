"use client";

export const MONAD_TESTNET = {
  chainId: "0x279f", // 10143
  chainName: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
};

export type WalletSession = {
  address: string;
  connected: boolean;
};

function getEthereum() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function isMetaMaskAvailable(): boolean {
  return getEthereum() !== null;
}

async function switchToMonadTestnet() {
  const eth = getEthereum()!;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_TESTNET.chainId }],
    });
  } catch (err: unknown) {
    // Chain not added yet — add it
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [MONAD_TESTNET],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet(): Promise<WalletSession> {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask bulunamadı. Lütfen MetaMask yükle.");

  await switchToMonadTestnet();

  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts.length) throw new Error("Hesap seçilmedi.");

  return { address: accounts[0], connected: true };
}

export async function getConnectedAddress(): Promise<string | null> {
  const eth = getEthereum();
  if (!eth) return null;
  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}

export function onAccountsChanged(handler: (accounts: string[]) => void) {
  getEthereum()?.on("accountsChanged", handler as (...args: unknown[]) => void);
}

export function offAccountsChanged(handler: (accounts: string[]) => void) {
  getEthereum()?.removeListener("accountsChanged", handler as (...args: unknown[]) => void);
}
