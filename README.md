# 📘 Kid Banker API Documentation

**Version:** 1.0.0  
**Last Updated:** March 28, 2026  
**Base URL:** `https://api-kidbanker.domain`

---

## 1. Pendahuluan

**Kid Banker API** adalah RESTful API yang dirancang untuk mendukung aplikasi manajemen keuangan keluarga. API ini memungkinkan orang tua (*Parent*) dan anak (*Kid*) untuk berkolaborasi dalam mengelola keuangan secara digital, menanamkan literasi finansial sejak dini melalui fitur tabungan, transaksi, dan paylater yang terintegrasi dengan Google Calendar.

---

## 2. Fungsi Utama

| No. | Fungsi | Deskripsi |
|-----|--------|-----------|
| 1 | **Authentication** | Autentikasi pengguna melalui Google OAuth 2.0 |
| 2 | **User Management** | Registrasi, login, dan penghubungan akun Parent-Kid |
| 3 | **Transaction Management** | Pencatatan transaksi pemasukan (INCOME) dan pengeluaran (EXPENSE) |
| 4 | **Savings Monitoring** | Pemantauan saldo tabungan secara real-time |
| 5 | **Paylater System** | Sistem paylater yang memerlukan persetujuan orang tua |
| 6 | **Google Calendar Integration** | Penjadwalan otomatis jatuh tempo paylater di Google Calendar |

---

## 3. Fitur Unggulan

- 🔐 **Google OAuth 2.0** — Autentikasi aman menggunakan akun Google
- 👨‍👩‍👧‍👦 **Role-Based Access** — Pembagian hak akses antara Parent dan Kid
- 💰 **Auto Balance Tracking** — Saldo tabungan otomatis terupdate setiap transaksi
- 📅 **Google Calendar Sync** — Reminder paylater otomatis di Google Calendar untuk Parent dan Kid
- 💬 **Motivational Quotes** — Pesan motivasi keuangan pada reminder calendar untuk anak
- 📊 **Activity Logging** — Pencatatan seluruh aktivitas pengguna

---

## 4. Arsitektur API

```
Client (Mobile/Web)
       │
       ▼
┌─────────────────────────────┐
│      Kid Banker API          │
│      (Express.js)            │
├─────────────────────────────┤
│  /auth       → Auth Routes   │
│  /api/finance → Finance Routes│
│  /api/paylater→ Paylater Routes│
├─────────────────────────────┤
│  Middleware: JWT Auth         │
│  Middleware: Role-Based Access│
├─────────────────────────────┤
│  Services:                   │
│  • Google Auth Service       │
│  • Google Calendar Service   │
│  • Activity Log Service      │
├─────────────────────────────┤
│  Database: Supabase (PgSQL)  │
│  External: Google APIs       │
└─────────────────────────────┘
```

---

## 5. Autentikasi API

API ini menggunakan **JSON Web Token (JWT)** untuk mengamankan endpoint yang memerlukan autentikasi.

### Cara Penggunaan

1. Lakukan login melalui endpoint `/auth/google` untuk mendapatkan `token`.
2. Sertakan token pada setiap request ke endpoint yang dilindungi:

```
Authorization: Bearer <token>
```

### Keterangan Token

| Parameter | Nilai |
|-----------|-------|
| Algoritma | HS256 |
| Masa Berlaku | 3 hari |
| Payload | `id`, `role`, `name` |

> **Catatan:** Endpoint dengan tanda 🔒 memerlukan JWT token pada header `Authorization`.

---

## 6. Base URL

```
https://api-kidbanker.domain
```

### Prefix Routing

| Prefix | Deskripsi | Autentikasi |
|--------|-----------|-------------|
| `/auth` | Authentication & User Management | Publik / 🔒 |
| `/api/finance` | Transaksi & Tabungan | 🔒 Wajib |
| `/api/paylater` | Sistem Paylater | 🔒 Wajib |

---

## 7. Endpoint

---

### 🔑 AUTH — Authentication & User Management

---

#### (POST) Google Login → `https://api-kidbanker.domain/auth/google`

Melakukan autentikasi pengguna menggunakan Google OAuth. Jika pengguna sudah terdaftar, sistem akan mengembalikan JWT token dan memperbarui `google_refresh_token`. Jika belum terdaftar, sistem akan mengarahkan untuk registrasi.

**Request:**

```json
{
    "id_token": "eyJhbGciOiJSUzI1NiIs...",
    "google_refresh_token": "1//0eXx..."
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `id_token` | `string` | ✅ | Google ID Token dari OAuth flow |
| `google_refresh_token` | `string` | ✅ | Google Refresh Token untuk integrasi Calendar |

**Response (200) — User Terdaftar:**

```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
        "name": "John Doe",
        "email": "john@gmail.com",
        "role": "PARENT",
        "google_id": "1123456789",
        "parent_code": "A1B2C3",
        "google_refresh_token": "1//0eXx..."
    }
}
```

**Response (200) — User Belum Terdaftar:**

```json
{
    "status": "Register Required",
    "user": {
        "google_id": "1123456789",
        "name": "John Doe",
        "email": "john@gmail.com"
    },
    "need_google_token": true
}
```

**Response (400):**

```json
{
    "error": "Google refresh token is required"
}
```

---

#### (POST) Register → `https://api-kidbanker.domain/auth/register`

Mendaftarkan pengguna baru ke dalam sistem. Jika role adalah `PARENT`, sistem akan secara otomatis menghasilkan `parent_code` yang digunakan untuk menghubungkan akun anak.

**Request:**

```json
{
    "name": "John Doe",
    "email": "john@gmail.com",
    "google_id": "1123456789",
    "role": "PARENT",
    "google_refresh_token": "1//0eXx..."
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `name` | `string` | ✅ | Nama lengkap pengguna |
| `email` | `string` | ✅ | Alamat email pengguna |
| `google_id` | `string` | ✅ | Google ID dari OAuth |
| `role` | `string` | ✅ | Role pengguna: `PARENT` atau `KID` |
| `google_refresh_token` | `string` | ✅ | Google Refresh Token |

**Response (200):**

```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
        "name": "John Doe",
        "email": "john@gmail.com",
        "role": "PARENT",
        "google_id": "1123456789",
        "parent_code": "A1B2C3",
        "google_refresh_token": "1//0eXx..."
    }
}
```

**Response (400):**

```json
{
    "error": "Google refresh token is required"
}
```

---

#### 🔒 (POST) Link Parent → `https://api-kidbanker.domain/auth/link-parent`

Menghubungkan akun Kid dengan akun Parent menggunakan `parent_code`. Hanya dapat diakses oleh pengguna dengan role `KID`.

**Request:**

```
Authorization: Bearer <token>
```

```json
{
    "parent_code": "A1B2C3"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `parent_code` | `string` | ✅ | Kode unik milik Parent |

**Response (200):**

```json
{
    "message": "Parent linked successfully"
}
```

**Response (400):**

```json
{
    "message": "Invalid parent code"
}
```

**Response (403):**

```json
{
    "message": "Only kid can link parent"
}
```

---

### 💰 FINANCE — Transaksi & Tabungan

---

#### 🔒 (POST) Create Transaction → `https://api-kidbanker.domain/api/finance/transactions`

Membuat transaksi baru. Hanya dapat diakses oleh pengguna dengan role `KID`. Saldo tabungan akan otomatis diperbarui berdasarkan tipe transaksi.

**Request:**

```
Authorization: Bearer <token>
```

```json
{
    "type": "INCOME",
    "amount": 50000,
    "description": "Allowance from Dad"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `type` | `string` | ✅ | Tipe transaksi: `INCOME` atau `EXPENSE` |
| `amount` | `number` | ✅ | Jumlah nominal transaksi |
| `description` | `string` | ✅ | Keterangan transaksi |

**Response (200):**

```json
{
    "message": "Transaction created successfully",
    "data": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
        "type": "INCOME",
        "amount": 50000,
        "description": "Allowance from Dad",
        "created_at": "2026-03-28T14:00:00.000Z"
    }
}
```

**Response (403):**

```json
{
    "message": "Only kid can create transaction"
}
```

---

#### 🔒 (GET) Get Transactions → `https://api-kidbanker.domain/api/finance/transactions`

Mengambil daftar transaksi. **Kid** akan mendapatkan transaksi miliknya sendiri. **Parent** akan mendapatkan seluruh transaksi anak-anak yang terhubung.

**Request:**

```
Authorization: Bearer <token>
```

**Response (200) — Role KID:**

```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
        "type": "INCOME",
        "amount": 50000,
        "description": "Allowance from Dad",
        "created_at": "2026-03-28T14:00:00.000Z"
    }
]
```

**Response (200) — Role PARENT:**

```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "user_id": "child-user-id-1",
        "type": "INCOME",
        "amount": 50000,
        "description": "Allowance from Dad",
        "created_at": "2026-03-28T14:00:00.000Z"
    },
    {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "user_id": "child-user-id-1",
        "type": "EXPENSE",
        "amount": 10000,
        "description": "Bought a notebook",
        "created_at": "2026-03-28T13:00:00.000Z"
    }
]
```

---

#### 🔒 (GET) Get Savings → `https://api-kidbanker.domain/api/finance/savings`

Mengambil informasi saldo tabungan. **Kid** akan mendapatkan saldo miliknya. **Parent** akan mendapatkan saldo seluruh anak yang terhubung.

**Request:**

```
Authorization: Bearer <token>
```

**Response (200) — Role KID:**

```json
{
    "id": "s1a2v3i4-n5g6-7890-abcd-ef1234567890",
    "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "total_balance": 40000
}
```

**Response (200) — Role PARENT:**

```json
[
    {
        "id": "s1a2v3i4-n5g6-7890-abcd-ef1234567890",
        "user_id": "child-user-id-1",
        "total_balance": 40000
    },
    {
        "id": "s2b3c4d5-e6f7-8901-bcde-f12345678901",
        "user_id": "child-user-id-2",
        "total_balance": 75000
    }
]
```

---

### 📅 PAYLATER — Sistem Paylater

---

#### 🔒 (POST) Request Paylater → `https://api-kidbanker.domain/api/paylater/request`

Membuat permintaan paylater baru. Hanya dapat diakses oleh pengguna dengan role `KID`. Permintaan ini memerlukan persetujuan dari Parent.

**Request:**

```
Authorization: Bearer <token>
```

```json
{
    "name": "School Books",
    "amount": 50000,
    "deadline": "2026-04-15"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `name` | `string` | ✅ | Nama/keperluan paylater |
| `amount` | `number` | ✅ | Jumlah nominal paylater |
| `deadline` | `string` | ✅ | Tanggal jatuh tempo (format: `YYYY-MM-DD`) |

**Response (200):**

```json
{
    "message": "Paylater request created",
    "data": {
        "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
        "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
        "name": "School Books",
        "amount": 50000,
        "deadline": "2026-04-15",
        "status": "PENDING",
        "created_at": "2026-03-28T14:00:00.000Z"
    }
}
```

**Response (403):**

```json
{
    "message": "Only kid can request paylater"
}
```

---

#### 🔒 (GET) Get Paylater Requests → `https://api-kidbanker.domain/api/paylater/requests`

Mengambil seluruh daftar permintaan paylater dari anak-anak yang terhubung. Hanya dapat diakses oleh pengguna dengan role `PARENT`.

**Request:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
[
    {
        "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
        "user_id": "child-user-id-1",
        "name": "School Books",
        "amount": 50000,
        "deadline": "2026-04-15",
        "status": "PENDING",
        "approved_by": null,
        "approved_at": null,
        "calendar_event_id": null,
        "created_at": "2026-03-28T14:00:00.000Z"
    }
]
```

**Response (403):**

```json
{
    "message": "Only parent can see paylater requests"
}
```

---

#### 🔒 (PATCH) Approve Paylater → `https://api-kidbanker.domain/api/paylater/approve/:id`

Menyetujui permintaan paylater. Hanya dapat diakses oleh pengguna dengan role `PARENT`. Setelah disetujui, sistem akan otomatis membuat event reminder di Google Calendar untuk Kid dan Parent.

**Request:**

```
Authorization: Bearer <token>
```

| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| `id` | `UUID` | ID paylater yang akan disetujui (URL parameter) |

**Response (200):**

```json
{
    "message": "Paylater request approved & added to Google Calendar",
    "data": {
        "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
        "user_id": "child-user-id-1",
        "name": "School Books",
        "amount": 50000,
        "deadline": "2026-04-15",
        "status": "APPROVED",
        "approved_by": "parent-user-id",
        "approved_at": "2026-03-28T14:30:00.000Z",
        "calendar_event_id": "google-calendar-event-id"
    }
}
```

**Response (400):**

```json
{
    "message": "Paylater request already approved"
}
```

```json
{
    "message": "Cannot approve a rejected paylater request"
}
```

**Response (403):**

```json
{
    "message": "Only parent can approve paylater"
}
```

**Response (404):**

```json
{
    "message": "Paylater request not found"
}
```

---

#### 🔒 (PATCH) Reject Paylater → `https://api-kidbanker.domain/api/paylater/reject/:id`

Menolak permintaan paylater. Hanya dapat diakses oleh pengguna dengan role `PARENT`.

**Request:**

```
Authorization: Bearer <token>
```

| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| `id` | `UUID` | ID paylater yang akan ditolak (URL parameter) |

**Response (200):**

```json
{
    "message": "Paylater request rejected",
    "data": {
        "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
        "user_id": "child-user-id-1",
        "name": "School Books",
        "amount": 50000,
        "deadline": "2026-04-15",
        "status": "REJECTED",
        "approved_by": "parent-user-id",
        "approved_at": "2026-03-28T14:30:00.000Z"
    }
}
```

**Response (400):**

```json
{
    "message": "Paylater request already rejected"
}
```

```json
{
    "message": "Cannot reject an approved paylater request"
}
```

**Response (403):**

```json
{
    "message": "Only parent can reject paylater"
}
```

**Response (404):**

```json
{
    "message": "Paylater request not found"
}
```

---

## 8. Ringkasan Endpoint

| No. | Method | Endpoint | Prefix | Auth | Role | Deskripsi |
|-----|--------|----------|--------|------|------|-----------|
| 1 | `POST` | `/auth/google` | auth | ❌ | ALL | Google Login |
| 2 | `POST` | `/auth/register` | auth | ❌ | ALL | Registrasi User |
| 3 | `POST` | `/auth/link-parent` | auth | 🔒 | KID | Hubungkan akun ke Parent |
| 4 | `POST` | `/api/finance/transactions` | finance | 🔒 | KID | Buat transaksi baru |
| 5 | `GET` | `/api/finance/transactions` | finance | 🔒 | ALL | Lihat daftar transaksi |
| 6 | `GET` | `/api/finance/savings` | finance | 🔒 | ALL | Lihat saldo tabungan |
| 7 | `POST` | `/api/paylater/request` | paylater | 🔒 | KID | Buat permintaan paylater |
| 8 | `GET` | `/api/paylater/requests` | paylater | 🔒 | PARENT | Lihat daftar paylater |
| 9 | `PATCH` | `/api/paylater/approve/:id` | paylater | 🔒 | PARENT | Setujui paylater |
| 10 | `PATCH` | `/api/paylater/reject/:id` | paylater | 🔒 | PARENT | Tolak paylater |

---

## 9. Error Response

Seluruh endpoint menggunakan format error response yang konsisten:

**Response (401) — Unauthorized:**

```json
{
    "message": "Unauthorized"
}
```

**Response (500) — Internal Server Error:**

```json
{
    "error": "Error message details"
}
```

---

> 📌 **Catatan:** Dokumentasi ini disusun berdasarkan source code aktual dari Kid Banker API. Untuk informasi lebih lanjut atau pertanyaan teknis, silakan hubungi tim pengembang.

---

*Powered by Kid Banker 🏦*
