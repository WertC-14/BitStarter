"use client";

import { LogOut, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import {
  connectWallet,
  getConnectedAddress,
  isMetaMaskAvailable,
  onAccountsChanged,
  offAccountsChanged,
  type WalletSession,
} from "@/lib/evm/wallet";

export function WalletStatus() {
  const [session, setSession]   = useState<WalletSession | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [open, setOpen]         = useState(false);

  // Sayfa yüklendiğinde zaten bağlı hesabı kontrol et
  useEffect(() => {
    getConnectedAddress().then((address) => {
      if (address) setSession({ address, connected: true });
    });

    const handler = (accounts: unknown) => {
      const list = accounts as string[];
      if (list.length > 0) {
        setSession({ address: list[0], connected: true });
      } else {
        setSession(null);
      }
    };
    onAccountsChanged(handler);
    return () => offAccountsChanged(handler);
  }, []);

  async function handleConnect() {
    setLoading(true);
    setError("");
    try {
      const s = await connectWallet();
      setSession(s);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı başarısız.");
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    setSession(null);
    setOpen(false);
  }

  const shortAddress = session?.address
    ? `${session.address.slice(0, 6)}...${session.address.slice(-4)}`
    : null;

  if (!isMetaMaskAvailable()) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm"
      >
        <Wallet size={16} />
        MetaMask Yükle
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => session?.connected ? setOpen((v) => !v) : handleConnect()}
        disabled={loading}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm disabled:opacity-60"
      >
        <Wallet size={16} aria-hidden="true" />
        <span>
          {loading ? "Bağlanıyor..." : shortAddress ?? "MetaMask Bağla"}
        </span>
      </button>

      {open && session?.connected ? (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-line bg-white p-3 text-sm shadow-lg">
          <p className="break-all font-mono text-xs text-slate-500">{session.address}</p>
          <p className="mt-1 text-xs text-emerald-600">Monad Testnet ✓</p>
          <button
            type="button"
            onClick={handleDisconnect}
            className="mt-3 inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
          >
            <LogOut size={15} aria-hidden="true" />
            Bağlantıyı Kes
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="absolute right-0 z-20 mt-2 w-64 rounded-md bg-rose-50 p-2 text-xs text-rose-700 shadow">
          {error}
        </p>
      ) : null}
    </div>
  );
}
