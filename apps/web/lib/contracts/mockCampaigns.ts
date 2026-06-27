import type { Campaign } from "@/features/campaigns/types";

const now = Date.now();
const days = (n: number) => new Date(now + n * 86_400_000).toISOString();

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "0x0000000000000000000000000000000000000001",
    title: "YieldBridge — Cross-Chain Yield Optimizer",
    description:
      "YieldBridge otomatik olarak en yüksek getiriyi sunan zincirler arasında likiditeyi yeniden dengeler. " +
      "Monad'ın düşük gecikmesini kullanarak rebalance maliyetlerini %80 azaltıyoruz.",
    developer: "0xDev1000000000000000000000000000000000001",
    goalAmount: 50000,
    totalInvested: 31200,
    fundingDeadline: days(38),
    metadataUri: "ipfs://QmYieldBridgeV1Meta",
    refundRatio: 60,
    usableRatio: 40,
    totalUsableAllocated: 12480,
    totalUsableWithdrawn: 4000,
    usableAvailable: 8480,
    votingDuration: 7 * 86400,
    status: "Active",
  },
  {
    id: "0x0000000000000000000000000000000000000002",
    title: "MonadArena — On-Chain Battle Royale",
    description:
      "MonadArena, her maçın tamamen zincir üzerinde doğrulandığı 100 oyunculu bir battle-royale oyunudur. " +
      "Kohort modeli erken destekçilere öncelikli whitelist ve düşük giriş fiyatı sunar.",
    developer: "0xDev2000000000000000000000000000000000002",
    goalAmount: 30000,
    totalInvested: 30000,
    fundingDeadline: days(-3),
    metadataUri: "ipfs://QmMonadArenaV1Meta",
    refundRatio: 70,
    usableRatio: 30,
    totalUsableAllocated: 9000,
    totalUsableWithdrawn: 9000,
    usableAvailable: 0,
    votingDuration: 10 * 86400,
    status: "VotingOpen",
  },
  {
    id: "0x0000000000000000000000000000000000000003",
    title: "DevForge — EVM Smart Contract IDE",
    description:
      "DevForge, Solidity geliştiricileri için tarayıcı tabanlı entegre bir geliştirme ortamıdır. " +
      "Yerleşik fuzz testi, formal doğrulama ve tek tıklamayla Monad Testnet deploy özelliklerine sahiptir.",
    developer: "0xDev3000000000000000000000000000000000003",
    goalAmount: 20000,
    totalInvested: 20000,
    fundingDeadline: days(-20),
    metadataUri: "ipfs://QmDevForgeV1Meta",
    refundRatio: 55,
    usableRatio: 45,
    totalUsableAllocated: 9000,
    totalUsableWithdrawn: 9000,
    usableAvailable: 0,
    votingDuration: 5 * 86400,
    status: "Approved",
  },
  {
    id: "0x0000000000000000000000000000000000000004",
    title: "ChainTalk — Decentralized Creator Platform",
    description:
      "ChainTalk, içerik oluşturucuların token'ları ve NFT kapılı toplulukları aracılığıyla para kazandığı " +
      "merkezi olmayan bir sosyal platformdur. 4 kohort yapısı erken yatırımcılara daha büyük pay garanti eder.",
    developer: "0xDev4000000000000000000000000000000000004",
    goalAmount: 40000,
    totalInvested: 8750,
    fundingDeadline: days(62),
    metadataUri: "ipfs://QmChainTalkV1Meta",
    refundRatio: 65,
    usableRatio: 35,
    totalUsableAllocated: 3062,
    totalUsableWithdrawn: 0,
    usableAvailable: 3062,
    votingDuration: 14 * 86400,
    status: "Active",
  },
  {
    id: "0x0000000000000000000000000000000000000005",
    title: "DataVault — Tokenized Data Marketplace",
    description:
      "DataVault, şirketlerin veri kümelerini tokenize edip ticaret yaptığı on-chain bir veri pazarıdır. " +
      "Sıfır bilgi ispatı entegrasyonu ile veri gizliliği güvence altındadır.",
    developer: "0xDev5000000000000000000000000000000000005",
    goalAmount: 75000,
    totalInvested: 5000,
    fundingDeadline: days(48),
    metadataUri: "ipfs://QmDataVaultV1Meta",
    refundRatio: 50,
    usableRatio: 50,
    totalUsableAllocated: 2500,
    totalUsableWithdrawn: 0,
    usableAvailable: 2500,
    votingDuration: 7 * 86400,
    status: "Active",
  },
];
