#!/usr/bin/env node
/**
 * BitStarter Demo Seed Script
 * Monad Testnet üzerinde 5 örnek kampanya oluşturur.
 *
 * Kullanım:
 *   PRIVATE_KEY=0x... \
 *   FACTORY_ADDRESS=0x... \
 *   TOKEN_ADDRESS=0x... \
 *   node scripts/seed-demo-data/seed.mjs
 *
 * Opsiyonel: .env dosyasından okumak için dotenv kullanın:
 *   node -r dotenv/config scripts/seed-demo-data/seed.mjs dotenv_config_path=apps/web/.env
 */

import { ethers } from "ethers";

// ── Config ─────────────────────────────────────────────────────────────────────

const RPC_URL        = process.env.MONAD_RPC_URL    ?? "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY    = process.env.PRIVATE_KEY       ?? "";
const FACTORY_ADDR   = process.env.FACTORY_ADDRESS   ?? process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID ?? "";
const TOKEN_ADDR     = process.env.TOKEN_ADDRESS     ?? process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID   ?? "";

if (!PRIVATE_KEY)  { console.error("HATA: PRIVATE_KEY env değişkeni gerekli."); process.exit(1); }
if (!FACTORY_ADDR || FACTORY_ADDR === "0x...") { console.error("HATA: FACTORY_ADDRESS env değişkeni gerekli."); process.exit(1); }

const FACTORY_ABI = [
  "function createCampaign(string title, string description, string metadataUri, uint256 fundingGoal, uint256 fundingDeadline, uint256 refundRatio, uint256 usableRatio, uint256 votingDuration) external returns (address)",
  "function createCommitmentCampaign(string title, string description, string metadataUri, uint256 fundingGoal, uint256 fundingDeadline, uint256 refundRatio, uint256 usableRatio, uint256 votingDuration, uint256 defectionRateBps, uint256[] cohortCaps) external returns (address)",
  "event CampaignCreated(address indexed campaign, address indexed developer, string title, uint8 launchMode)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
];

// ── Kampanya Verileri ───────────────────────────────────────────────────────────

const now = Math.floor(Date.now() / 1000);
const days = (n) => n * 24 * 60 * 60;

const CAMPAIGNS = [
  // 1 — InvestmentCampaign: DeFi yield protokolü
  {
    type: "investment",
    title: "YieldBridge — Cross-Chain Yield Optimizer",
    description:
      "YieldBridge otomatik olarak en yüksek getiriyi sunan zincirler arasında likiditeyi yeniden dengeler. " +
      "Monad'ın düşük gecikmesini kullanarak rebalance maliyetlerini %80 azaltıyoruz. " +
      "Fon, akıllı sözleşme geliştirme, denetim ve likidite başlangıç havuzuna tahsis edilecek.",
    metadataUri: "ipfs://QmYieldBridgeV1Meta",
    goalAmount: "50000",
    deadlineOffset: days(60),
    refundRatio: 60,
    usableRatio: 40,
    votingDays: 7,
  },

  // 2 — CommitmentCampaign: GameFi platformu (3 kohort)
  {
    type: "commitment",
    title: "MonadArena — On-Chain Battle Royale",
    description:
      "MonadArena, her maçın tamamen zincir üzerinde doğrulandığı 100 oyunculu bir battle-royale oyunudur. " +
      "Monad'ın saniyede 10,000 TPS kapasitesi anlık hareket doğrulamasını mümkün kılıyor. " +
      "Kohort modeli erken destekçilere öncelikli whitelist ve düşük giriş fiyatı sunar.",
    metadataUri: "ipfs://QmMonadArenaV1Meta",
    goalAmount: "30000",
    deadlineOffset: days(45),
    refundRatio: 70,
    usableRatio: 30,
    votingDays: 10,
    defectionRateBps: 1500,
    cohortCaps: ["10000", "10000", "10000"],
  },

  // 3 — InvestmentCampaign: Geliştirici araçları
  {
    type: "investment",
    title: "DevForge — EVM Smart Contract IDE",
    description:
      "DevForge, Solidity geliştiricileri için tarayıcı tabanlı entegre bir geliştirme ortamıdır. " +
      "Yerleşik fuzz testi, formal doğrulama ve tek tıklamayla Monad Testnet deploy özelliklerine sahiptir. " +
      "MVP zaten hazır; bu fon profesyonel plan ve team genişlemesi için kullanılacak.",
    metadataUri: "ipfs://QmDevForgeV1Meta",
    goalAmount: "20000",
    deadlineOffset: days(30),
    refundRatio: 55,
    usableRatio: 45,
    votingDays: 5,
  },

  // 4 — CommitmentCampaign: Sosyal platform (4 kohort)
  {
    type: "commitment",
    title: "ChainTalk — Decentralized Creator Platform",
    description:
      "ChainTalk, içerik oluşturucuların token'ları ve NFT kapılı toplulukları aracılığıyla para kazandığı " +
      "merkezi olmayan bir sosyal platformdur. Sansür dayanıklı, algoritma özgür ve tamamen on-chain. " +
      "4 kohort yapısı, erken yatırımcılara platform tokeninin daha büyük payını garanti eder.",
    metadataUri: "ipfs://QmChainTalkV1Meta",
    goalAmount: "40000",
    deadlineOffset: days(90),
    refundRatio: 65,
    usableRatio: 35,
    votingDays: 14,
    defectionRateBps: 2000,
    cohortCaps: ["8000", "10000", "10000", "12000"],
  },

  // 5 — InvestmentCampaign: Veri pazarı
  {
    type: "investment",
    title: "DataVault — Tokenized Data Marketplace",
    description:
      "DataVault, şirketlerin veri kümelerini tokenize edip ticaret yaptığı ve analistlerin " +
      "gizlilik koruyucu sorgular çalıştırdığı bir zincir-üstü veri pazarıdır. " +
      "sıfır bilgi ispatı entegrasyonu ile veri gizliliği güvence altındadır. " +
      "Hedef: ilk 6 ayda 20 kurumsal veri sağlayıcısını platforma dahil etmek.",
    metadataUri: "ipfs://QmDataVaultV1Meta",
    goalAmount: "75000",
    deadlineOffset: days(75),
    refundRatio: 50,
    usableRatio: 50,
    votingDays: 7,
  },
];

// ── Deploy ─────────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const factory  = new ethers.Contract(FACTORY_ADDR, FACTORY_ABI, signer);

  const network = await provider.getNetwork();
  console.log(`\nAg: ${network.name} (chainId: ${network.chainId})`);
  console.log(`Gonderen: ${signer.address}`);
  console.log(`Factory: ${FACTORY_ADDR}\n`);

  const results = [];

  for (const [i, c] of CAMPAIGNS.entries()) {
    console.log(`[${i + 1}/5] Olusturuluyor: "${c.title}"`);

    const deadline      = now + c.deadlineOffset;
    const votingSeconds = c.votingDays * 24 * 60 * 60;
    const goalWei       = ethers.parseEther(c.goalAmount);

    let tx;
    if (c.type === "commitment") {
      const cohortWei = c.cohortCaps.map((cap) => ethers.parseEther(cap));
      tx = await factory.createCommitmentCampaign(
        c.title,
        c.description,
        c.metadataUri,
        goalWei,
        deadline,
        c.refundRatio,
        c.usableRatio,
        votingSeconds,
        c.defectionRateBps,
        cohortWei
      );
    } else {
      tx = await factory.createCampaign(
        c.title,
        c.description,
        c.metadataUri,
        goalWei,
        deadline,
        c.refundRatio,
        c.usableRatio,
        votingSeconds
      );
    }

    const receipt = await tx.wait();

    // CampaignCreated event'inden adresi parse et
    const iface        = new ethers.Interface(FACTORY_ABI);
    let campaignAddr   = "";
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "CampaignCreated") {
          campaignAddr = parsed.args.campaign;
          break;
        }
      } catch { /* diğer logları atla */ }
    }
    if (!campaignAddr) campaignAddr = receipt?.logs?.[0]?.address ?? "(adres bulunamadi)";

    console.log(`   OK  kampanya: ${campaignAddr}`);
    console.log(`       tx:       ${tx.hash}\n`);
    results.push({ title: c.title, type: c.type, address: campaignAddr, tx: tx.hash });
  }

  console.log("=".repeat(70));
  console.log("OZET");
  console.log("=".repeat(70));
  for (const r of results) {
    console.log(`${r.type.padEnd(12)} ${r.address}  "${r.title}"`);
  }
  console.log();
}

main().catch((err) => {
  console.error("HATA:", err.message ?? err);
  process.exit(1);
});
