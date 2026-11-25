# Archon Fleet

Araç kiralama ve filo takip paneli. Herkese açık sitenin parçası değildir:
menüde görünmez, arama motorlarına kapalıdır (`noindex`, `robots.txt`), tek
şifreyle açılır ve tek kişi tarafından kullanılır.

- Adres: `https://archonsoft.tr/fleet` (giriş: `/fleet/giris`)
- Dil: Türkçe · Para: TL · Tarih: gg.aa.yyyy · Saat dilimi: Europe/Istanbul

## Kurulum

1. `npm run fleet:password` → çıkan `FLEET_PASSWORD_HASH` ve `FLEET_SESSION_SECRET`
   satırlarını barındırma ortamının değişkenlerine ekleyin (Vercel → Settings →
   Environment Variables). Yerelde `.env.local` dosyasına.
2. Veritabanı: sitedeki lead kayıtlarının kullandığı `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` yeterlidir. Fleet verileri
   aynı projede `fleet_` önekli koleksiyonlara yazılır.
3. Firestore güvenlik kuralları: tarayıcı Firestore'a hiç bağlanmaz (bütün
   okuma/yazma sunucuda servis hesabıyla yapılır; servis hesabı kurallardan
   etkilenmez). Bu yüzden `fleet_*` koleksiyonlarını istemciye tamamen kapatın:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Site Firebase istemci SDK'sı kullanmıyor; her şey sunucuda.
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

   Mevcut kurallarınız istemci erişimini zaten kapatıyorsa değişiklik gerekmez.
4. İsteğe bağlı e-posta özeti: `FLEET_ALERT_EMAIL`, `RESEND_API_KEY`,
   `CONTACT_FROM_EMAIL`. Zamanlanmış görev için `FLEET_CRON_SECRET` tanımlayıp
   günde bir kez `GET /api/fleet/alerts?gonder=1` adresini
   `Authorization: Bearer <FLEET_CRON_SECRET>` başlığıyla çağırın.
   Tanımlı değilse uyarılar yalnızca panelde görünür; sistem e-posta
   gönderilmiş gibi davranmaz.

## Mimari

| Katman | Dosya |
|---|---|
| Veri modeli | `src/lib/fleet/types.ts` — tutarlar kuruş (tam sayı), tarihler `YYYY-MM-DD` |
| **Bütün hesaplar** | `src/lib/fleet/calc.ts` — ödeme planı, borç, gecikme, kasa defteri, raporlar, uyarılar |
| Doğrulama | `src/lib/fleet/validate.ts` — para, tarih, plaka, TC (algoritma), telefon |
| İşlemler | `src/lib/fleet/service.ts` — çakışma kontrolü, iş kuralları, işlem geçmişi |
| Depo | `src/lib/fleet/store.ts` — Firestore REST (SDK yok) / dosya / bellek |
| Giriş | `src/lib/fleet/auth.ts` — scrypt şifre, HMAC imzalı HttpOnly çerez, deneme freni |
| API | `src/app/api/fleet/{auth,mutate,export,alerts}` |
| Ekranlar | `src/app/fleet/` (kendi kök düzeni, sitenin başlığı/menüsü yok) |

Kurallar:

- **Kasa tek yerden.** `buildLedger` başlangıç bakiyesi + tahsilatlar − giderler ±
  düzeltmeler defterini kurar; her ekran ve rapor bunu kullanır. Tahsil edilmemiş
  kira ve depozito kasaya girmez.
- **Ödeme planı ≠ tahsilat.** Taksitler kiralamadan hesaplanır, saklanmaz.
  Tahsilatlar ayrı kayıttır ve en eski taksitten başlayarak dağıtılır.
  "Peşin" ayarında her dönemin kirası dönem başında borç olur.
- **Silme yok.** Tahsilat, gider ve düzeltme gerekçeyle iptal edilir (kayıt kalır,
  toplamlardan çıkar). Araç ve sürücü pasife alınır. Tahsilatı olan kiralama
  iptal edilemez, tamamlanır.
- **Çakışma yok.** Bir araç aynı tarihlerde iki kiralamada olamaz (tamamlanmış
  kiralamalar dahil; iptaller hariç).
- **Kişisel veri.** TC listelerde maskelenir, yalnızca sürücü detayında açık
  görünür; işlem geçmişine, sunucu loglarına ve Excel dışa aktarmaya yazılmaz.
- **Kilometre.** Önceki kayıttan düşük km uyarı verir, ancak onayla kaydedilir
  ve uyarı listesinde kalır.

## Test

```bash
npm run test:fleet     # finans, ilişkiler, doğrulama, giriş, dışa aktarma — 17 test
npm run verify         # typecheck + lint + build (tüm site)
```

`test:fleet`, Excel dosyasındaki (ArchonFleet_Filo_Takip.xlsx) örnek veriyi
servis katmanından kurar ve aynı sonuçları bekler: kasa 57.200 ₺, beklenen kira
84.000 ₺, K-0002'de 3 gün gecikmiş 6.500 ₺, vb.
