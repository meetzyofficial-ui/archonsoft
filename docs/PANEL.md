# Site paneli (/panel)

Ziyaretçi istatistikleri ve gelen talepler. Şifresi Fleet paneliyle aynıdır
(`FLEET_PASSWORD_HASH`, `FLEET_SESSION_SECRET`). Kayıt için Vercel'de
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` gerekir;
yoksa panel açıkça söyler ve hiçbir şey kaydedilmez. Veriler `site_stats_<gün>`
koleksiyonlarında durur. Form maili için `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
`CONTACT_FROM_EMAIL`. İkisi de yoksa form WhatsApp'a yönlendirir.
Gerçek müşteri sözleri: `src/data/testimonials.ts`.
