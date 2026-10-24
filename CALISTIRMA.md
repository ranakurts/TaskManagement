# Çalıştırma

## 1. Backend (TaskManagement.API)

```bash
cd TaskManagement.API
dotnet run --launch-profile http
```

- API `http://localhost:5246` adresinde açılır (Swagger: `/swagger`).
- Veritabanı: `appsettings.json` → `ConnectionStrings:DefaultConnection` (varsayılan `localhost` / `TaskManagementDb`).
- Bekleyen migration'lar (ör. `TeamInvitations` tablosu) uygulama açılırken otomatik uygulanır.
- `Jwt:Key` en az 32 karakter olmalı. Yayına almadan önce kendi gizli anahtarınızla değiştirin.

## 2. Frontend (TaskManagementUI)

```bash
cd TaskManagementUI
npm install
npm start
```

Uygulama: `http://localhost:4200`. API adresi tek yerde tanımlı: `src/app/api.config.ts`.

## Arayüz özellikleri

- **Ana sayfa:** Günün özeti, tamamlanma halkası, metrikler, "Odak listem" (sana atanan işler), önümüzdeki 7 gün, son aktiviteler ve takımların.
- **Görevler:** Arama, "Bana atanan / Oluşturduğum / Gecikenler" sekmeleri, durum/öncelik/takım filtreleri, sıralama, duruma göre gruplama. Satırdaki kutuya tıklayınca görev tamamlanır.
- **Pano:** Kartları sürükleyip bırakarak durum değiştir, sütun altından hızlı görev ekle.
- **Takvim:** Ay görünümü; bir güne çift tıklayınca o tarihli görev açılır.
- **Raporlar:** 7/30/90 günlük görev akışı, durum ve öncelik dağılımı, kişi bazında iş yükü, gecikmiş görevler.
- **Görev detayı:** Herhangi bir göreve tıklayınca sağdan panel açılır; durum değiştir, düzenle, sil, yorum yaz.
- **Bildirimler:** Takım davetleri, sana atanan görevler ve gecikmiş görevler.
- **Temalar:** Cosmic Nebula, Midnight, Cyberpunk, Aurora, Solar Horizon (Ayarlar).

Kısayollar: `Ctrl+K` komut paleti (ara / sayfaya git), `N` yeni görev, `Ctrl+Enter` kaydet, `Esc` kapat, `?` kısayol listesi.

Görevler veritabanında tutulur. Takıma ait bir görevi takımın tüm üyeleri görür ve düzenler; silme yetkisi görevi oluşturana ve takım yöneticisine aittir. Kişisel görevler sadece sana atanabilir.

## Takım özelliği

- **Takım sayfası** (üst menüde "Takım / Team") → **Yeni Takım**: takımı oluşturan kişi otomatik olarak **Yönetici (Admin)** olur.
- Yalnızca yönetici, kayıtlı bir kullanıcıya e-posta ile **davet** gönderebilir, bekleyen daveti iptal edebilir ve üye çıkarabilir.
- Davet edilen kişiye istek düşer: hem **bildirim zilinde** hem Takım sayfasındaki "Bekleyen Takım Davetleri" kartında **Kabul Et / Reddet** butonları çıkar. Kabul ederse takıma "Üye (Member)" olarak eklenir.

API uçları (`/api/teams`):

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/teams` | Takım oluştur (oluşturan Admin olur) |
| GET | `/api/teams` | Üyesi olduğum takımlar |
| GET | `/api/teams/{id}/members` | Takım üyeleri |
| DELETE | `/api/teams/{id}/members/{userId}` | Üye çıkar (Admin) |
| POST | `/api/teams/{id}/invitations` | Davet gönder (Admin) |
| GET | `/api/teams/{id}/invitations` | Gönderilen davetler (Admin) |
| DELETE | `/api/teams/{id}/invitations/{invId}` | Daveti iptal et (Admin) |
| GET | `/api/teams/invitations/pending` | Bana gelen bekleyen davetler |
| POST | `/api/teams/invitations/{invId}/respond` | `{ "accept": true/false }` ile kabul/ret |
