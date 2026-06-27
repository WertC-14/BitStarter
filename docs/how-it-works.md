# BitStarter Çalışma Mantığı

## Temel Yapıtaşı: Para İkiye Bölünür

Bir yatırımcı para yatırdığı anda kontrat parayı **anında ve otomatik olarak** iki kısma ayırır:

```
Yatırım: 1000 MON
─────────────────────────────────────────────
Usable (Kullanılabilir)   → %40 →  400 MON  (developer hemen çekebilir)
Refundable (İade Havuzu)  → %60 →  600 MON  (escrow'da kilitli, sonucu bekler)
```

Bu oran kampanya kurulurken developer tarafından belirlenir (`refundRatio + usableRatio = 100` zorunluluğu var). Para escrow kontratına gider, developer doğrudan tutmaz.

---

## Kampanya Yaşam Döngüsü

### Aşama 1 — Active (Fonlama Süreci)

Developer kampanyayı oluşturur. Yatırımcılar para yatırır. **Developer usable kısmı bu aşamada çekmeye başlayabilir** — beklemeye gerek yok.

```
Ahmet 2000 MON yatırıyor  → 800 MON developer'a açık, 1200 MON kilitli
Fatma 3000 MON yatırıyor  → 1200 MON developer'a açık, 1800 MON kilitli

Developer şu anda 2000 MON çekebilir (800 + 1200)
Escrow'da 3000 MON kilitli (1200 + 1800)
```

---

### Aşama 2 — VotingOpen (Oylama)

İki şekilde açılır:

- **Developer** `markFinished()` çağırır → "bitirdim, değerlendirin"
- **Süre dolduktan sonra** herkes `openVotingAfterDeadline()` çağırabilir

Oylama gücü **yatırım miktarıyla orantılı**. 2000 MON yatıran, 500 MON yatırana göre 4× güce sahip. Bu, büyük yatırımcıların sistemi "1 kişi 1 oy" senaryosuna göre daha az manipüle edebildiği anlamına gelir.

```
Ahmet (2000 MON) → ONAYLA
Fatma (3000 MON) → REDDET

approvalPower  = 2000
rejectionPower = 3000
totalInvested  = 5000
```

---

### Aşama 3a — Approved (Onaylandı)

Koşul: `approvalPower > totalInvested / 2` → yani **%50'den fazlası onaylamalı**.

Yukardaki örnekte: 2000 > 2500 değil → **Rejected** olur.

Eğer onaylanmış olsaydı:

```
Developer withdrawRemainingFunds() çağırır
→ Escrow'daki 3000 MON'u (kilitli kısım) da alır
→ Toplam: 2000 (usable, zaten çekti) + 3000 (kilitli) = 5000 MON
```

Yatırımcılar bu durumda para alamaz — onayladıkları için tüm fonları developer'a bırakmış olurlar.

---

### Aşama 3b — Rejected (Reddedildi)

Yatırımcılar `claimRefund()` çağırır ve **refundable kısmını geri alır**:

```
Ahmet → 1200 MON iade
Fatma → 1800 MON iade

Developer'da kalıcı olarak kalan:
  2000 MON (usable, zaten çekilmişti)
  Kilitli 3000 MON → iade edildi, developer alamaz
```

Developer usable kısmı geri ödemez. Bu sistemin "korumalı fonlama" özelliği: yatırımcı en kötü senaryoda parasının `refundRatio` yüzdesini geri alır. `%60 refundRatio` ile 1000 MON yatıran biri en az 600 MON geri alır.

---

### Aşama 4 — Cancelled (İptal)

Developer istediği zaman `cancelCampaign()` çağırabilir (Active veya VotingOpen'da). Rejected ile aynı sonuç: yatırımcılar refundable kısımlarını geri alır.

---

## Tip 1: InvestmentCampaign (Standart)

Sade akış:

```
Active → VotingOpen → Approved  (developer tüm parayı alır)
                    → Rejected  (yatırımcılar refundable kısmı alır)
         ↓
       Cancelled    (yatırımcılar refundable kısmı alır)
```

---

## Tip 2: CommitmentCampaign (Taahhütlü)

İki ek mekanik ekler: **Kohortlar** ve **Erken Çıkış Cezası**.

### Kohortlar

Para sıralı gruplara bölünür. Hedef 30,000 MON ve 3 kohort:

```
Kohort 0: 10,000 MON  ← önce bu dolar
Kohort 1: 10,000 MON  ← sonra bu
Kohort 2: 10,000 MON  ← en son bu
```

Kohort 0 dolmadan Kohort 1'e geçilemiyor. Bu mekanizmanın amacı: erken giren yatırımcıların öncelikli konumunu somutlaştırmak (örnek: düşük token fiyatı ilk kohortta).

### Erken Çıkış (Defection)

Kampanya Active'ken bir yatırımcı pişman olup `exitEarly()` çağırabilir:

```
Ahmet 2000 MON yatırdı (%40 usable / %60 refundable / %15 defection cezası)
→ refundableAmount = 1200 MON

exitEarly() çağırıyor:
  ceza     = 1200 × %15 = 180 MON  → penaltyPool'a gider
  iade     = 1200 - 180 = 1020 MON → Ahmet'e döner
  usable (800 MON) → zaten developer'a tahsis edildi, iade edilmez
```

**Usable kısım geri alınamaz** — erken çıkmak "ucuz" değil.

### Ceza Havuzu Dağılımı

Kampanya **Rejected veya Cancelled** olursa, `penaltyPool`'daki para kaçmadı kampanyada kalan yatırımcılara dağıtılır:

```
penaltyPool = 500 MON (birkaç kişi erken çıktı)
Fatma  → 3000 MON yatırdı, refundable = 1800 MON
Mehmet → 1000 MON yatırdı, refundable =  600 MON
─────────────────────────────────────────────────
Toplam refundPool = 2400 MON

Fatma'nın payı  = 500 × (1800 / 2400) = 375 MON bonus
Mehmet'in payı  = 500 × (600  / 2400) = 125 MON bonus

Fatma'nın toplam iadesi:  1800 + 375 = 2175 MON
Mehmet'in toplam iadesi:   600 + 125 =  725 MON
```

Erken çıkanlar "kalan sadakatli yatırımcıları ödüllendiriyor".

---

## Para Akışı Özeti

```
YATIRIMCI                    ESCROW                    DEVELOPER
    │                           │                           │
    │──── invest(1000 MON) ────►│                           │
    │                           │──── usable (400) ────────►│ (hemen çekebilir)
    │                           │                           │
    │                   [oylama sonucu]                     │
    │                           │                           │
    │  Approved olursa:         │                           │
    │                           │──── remaining (600) ─────►│
    │                           │                           │
    │  Rejected olursa:         │                           │
    │◄─── claimRefund (600) ────│                           │
    │                           │                           │
    │  CommitmentCampaign +     │                           │
    │  başkaları erken çıktıysa │                           │
    │◄─── 600 + bonus ──────────│                           │
```

---

## Hangi Şartlarda Kim Ne Alır?

| Sonuç | Developer | Yatırımcı |
|-------|-----------|-----------|
| **Approved** | Usable (çekti) + Remaining (kilitlinin tamamı) | Sıfır iade |
| **Rejected** | Usable (çekti, kalıcı) | refundableAmount geri |
| **Cancelled** | Usable (çekti, kalıcı) | refundableAmount geri |
| **CommitmentCampaign Rejected/Cancelled** | Usable (çekti, kalıcı) | refundableAmount + penaltyPool'dan pay |
| **CommitmentCampaign exitEarly** | Usable (çekti) | refundableAmount − ceza |

---

## Platform Sınırları (CommitmentCampaign)

| Parametre | Min | Max |
|-----------|-----|-----|
| `defectionRateBps` (erken çıkış cezası) | %10 (1000 bps) | %30 (3000 bps) |
| Kohort sayısı | 2 | 4 |
| Kohortlar toplamı | `fundingGoal`'e eşit olmalı | — |
