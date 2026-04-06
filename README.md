# Kid Banker API — Documentation

**Versi:** 1.3.0 <br>
**Terakhir Diperbarui:** 6 April 2026 <br>
**Base URL:** `https://api-kidbanker.vercel.app`

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Fungsi Utama](#2-fungsi-utama)
3. [Fitur Unggulan](#3-fitur-unggulan)
4. [Arsitektur API](#4-arsitektur-api)
5. [Autentikasi API](#5-autentikasi-api)
6. [Endpoint](#6-endpoint)
   - [6.1 Autentikasi](#61-autentikasi)
   - [6.2 Keuangan (Finance)](#62-keuangan-finance)
   - [6.3 Paylater](#63-paylater)
   - [6.4 Dashboard Anak (Kid)](#64-dashboard-anak-kid)
   - [6.5 Dashboard Orang Tua (Parent)](#65-dashboard-orang-tua-parent)
7. [Ringkasan Endpoint](#7-ringkasan-endpoint)
8. [Referensi Kode Error](#8-referensi-kode-error)

---

## 1. Pendahuluan

**Kid Banker API** adalah antarmuka pemrograman aplikasi (API) berbasis REST yang dirancang untuk mendukung platform manajemen keuangan keluarga berbasis peran. API ini memungkinkan orang tua (_Parent_) dan anak (_Kid_) untuk berkolaborasi dalam pengelolaan keuangan secara digital, dengan tujuan menanamkan literasi finansial sejak dini.

Sistem ini dibangun di atas **Node.js** dengan framework **Express.js**, menggunakan **Supabase** (PostgreSQL) sebagai basis data, serta terintegrasi dengan **Google OAuth 2.0** untuk autentikasi dan **Google Calendar API** untuk penjadwalan pengingat paylater.

---

## 2. Fungsi Utama

| No. | Fungsi                    | Deskripsi                                                                      |
| --- | ------------------------- | ------------------------------------------------------------------------------ |
| 1   | Autentikasi               | Autentikasi pengguna melalui Google OAuth 2.0 dan penerbitan JWT               |
| 2   | Manajemen Pengguna        | Registrasi akun, login, dan pengaitan akun Orang Tua–Anak                      |
| 3   | Manajemen Transaksi       | Pencatatan transaksi pemasukan (INCOME) dan pengeluaran (EXPENSE)              |
| 4   | Pemantauan Tabungan       | Pemantauan saldo tabungan secara otomatis dan real-time                        |
| 5   | Sistem Paylater           | Pengajuan, persetujuan, dan penolakan paylater dengan alur otorisasi orang tua |
| 6   | Integrasi Google Calendar | Penjadwalan pengingat jatuh tempo paylater secara otomatis                     |
| 7   | Dashboard Statistik       | Laporan keuangan mingguan, bulanan, dan agregat per peran                      |

---

## 3. Fitur Unggulan

- **Google OAuth 2.0** — Autentikasi aman tanpa pengelolaan kata sandi secara manual
- **Role-Based Access Control** — Pemisahan hak akses ketat antara peran Orang Tua dan Anak
- **Auto Balance Tracking** — Saldo tabungan diperbarui otomatis pada setiap transaksi
- **Google Calendar Sync** — Pengingat jatuh tempo paylater otomatis dikirim ke kalender Orang Tua dan Anak
- **Activity Logging** — Seluruh aksi pengguna dicatat untuk kebutuhan audit dan pelacakan
- **Dashboard Modular** — Setiap metrik tersedia sebagai endpoint mandiri maupun agregat

---

## 4. Arsitektur API

```
+--------------------------------------------+
|        Kid Banker API (Express.js)         |
+--------------------------------------------+
|  /auth           --> Routes Autentikasi    |
|  /api/finance    --> Routes Keuangan       |
|  /api/paylater   --> Routes Paylater       |
|  /api/kid        --> Routes Dashboard Anak |
|  /api/parent     --> Routes Dashboard OT   |
+--------------------------------------------+
|  Middleware: JWT Auth (authMiddleware)     |
|  Middleware: Role Check (roleMiddleware)   |
+--------------------------------------------+
|  Services:                                 |
|  · Google Auth Service                     |
|  · Google Calendar Service                 |
|  · Activity Log Service                    |
|  · Paylater Service                        |
|  · Savings Service                         |
|  · Transaction Service                     |
|  · Kid Dashboard Service                   |
|  · Parent Dashboard Service                |
+--------------------------------------------+
|  Database: Supabase (PostgreSQL)           |
|  Eksternal: Google OAuth & Calendar API    |
+--------------------------------------------+
```

---

## 5. Autentikasi API

API ini menggunakan **JSON Web Token (JWT)** untuk mengamankan seluruh endpoint yang bersifat privat.

### Cara Penggunaan Token

1. Lakukan login melalui endpoint `/auth/google` untuk mendapatkan `token`.
2. Sertakan token pada header setiap request ke endpoint yang dilindungi:

```
Authorization: Bearer <token>
```

### Spesifikasi Token

| Parameter    | Nilai                |
| ------------ | -------------------- |
| Algoritma    | HS256                |
| Masa Berlaku | 3 hari               |
| Payload      | `id`, `role`, `name` |

> **Catatan:** Seluruh endpoint yang bertanda **[Auth Required]** wajib menyertakan JWT token yang valid pada header `Authorization`. Permintaan tanpa token atau dengan token yang tidak valid akan menghasilkan respons `401 Unauthorized`.

---

## 6. Endpoint

---

### 6.1 Autentikasi

Endpoint autentikasi menangani proses login, registrasi, dan pengaitan akun antar pengguna.

---

#### `POST` Google Login

```
POST https://api-kidbanker.vercel.app/auth/google
```

Melakukan autentikasi pengguna menggunakan Google OAuth. Jika pengguna sudah terdaftar, sistem mengembalikan JWT token. Jika belum terdaftar, sistem mengembalikan data Google pengguna beserta indikator bahwa registrasi diperlukan.

**Request Body:**

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "google_refresh_token": "1//0eXx..."
}
```

| Field                  | Tipe     | Wajib | Deskripsi                                                    |
| ---------------------- | -------- | ----- | ------------------------------------------------------------ |
| `id_token`             | `string` | Ya    | Google ID Token yang diperoleh dari alur OAuth di sisi klien |
| `google_refresh_token` | `string` | Ya    | Google Refresh Token untuk keperluan integrasi Calendar      |

**Response `200` — Pengguna Terdaftar:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "name": "Andika Satrio Nurcahyo",
    "email": "andikasatrionurcahyo@kidbanker.id",
    "role": "PARENT",
    "google_id": "112345678901234567890",
    "parent_code": "A1B2C3",
    "google_refresh_token": "1//0eXx..."
  }
}
```

**Response `200` — Pengguna Belum Terdaftar:**

```json
{
  "status": "Register Required",
  "user": {
    "google_id": "112345678901234567890",
    "name": "Andika Satrio Nurcahyo",
    "email": "andikasatrionurcahyo@kidbanker.id"
  },
  "need_google_token": true
}
```

**Response `400`:**

```json
{
  "error": "Google refresh token is required"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `POST` Registrasi

```
POST https://api-kidbanker.vercel.app/auth/register
```

Mendaftarkan pengguna baru ke dalam sistem. Jika peran yang dipilih adalah `PARENT`, sistem akan secara otomatis membuat `parent_code` unik yang digunakan untuk menghubungkan akun anak.

**Request Body:**

```json
{
  "name": "Andika Satrio Nurcahyo",
  "email": "andikasatrionurcahyo@kidbanker.id",
  "google_id": "112345678901234567890",
  "role": "PARENT",
  "google_refresh_token": "1//0eXx..."
}
```

| Field                  | Tipe     | Wajib | Deskripsi                                |
| ---------------------- | -------- | ----- | ---------------------------------------- |
| `name`                 | `string` | Ya    | Nama lengkap pengguna                    |
| `email`                | `string` | Ya    | Alamat email pengguna                    |
| `google_id`            | `string` | Ya    | Google ID yang diperoleh dari alur OAuth |
| `role`                 | `string` | Ya    | Peran pengguna: `PARENT` atau `KID`      |
| `google_refresh_token` | `string` | Ya    | Google Refresh Token                     |

**Response `200`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "name": "Andika Satrio Nurcahyo",
    "email": "andikasatrionurcahyo@kidbanker.id",
    "role": "PARENT",
    "google_id": "112345678901234567890",
    "parent_code": "A1B2C3",
    "google_refresh_token": "1//0eXx..."
  }
}
```

**Response `400`:**

```json
{
  "error": "Google refresh token is required"
}
```

**Response `500`:**

```json
{
  "error": "Internal server error"
}
```

---

#### `POST` Hubungkan Orang Tua `[Auth Required]` `[KID Only]`

```
POST https://api-kidbanker.vercel.app/auth/link-parent
Authorization: Bearer <token>
```

Menghubungkan akun Anak dengan akun Orang Tua menggunakan `parent_code`. Endpoint ini hanya dapat diakses oleh pengguna dengan peran `KID`.

**Request Body:**

```json
{
  "parent_code": "A1B2C3"
}
```

| Field         | Tipe     | Wajib | Deskripsi                                  |
| ------------- | -------- | ----- | ------------------------------------------ |
| `parent_code` | `string` | Ya    | Kode unik milik Orang Tua yang dihubungkan |

**Response `200`:**

```json
{
  "message": "Parent linked successfully"
}
```

**Response `400`:**

```json
{
  "message": "Invalid parent code"
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

### 6.2 Keuangan (Finance)

Endpoint keuangan menangani pencatatan transaksi dan pemantauan saldo tabungan. Akses bersifat bergantung pada peran pengguna.

---

#### `POST` Buat Transaksi `[Auth Required]` `[KID Only]`

```
POST https://api-kidbanker.vercel.app/api/finance/transactions
Authorization: Bearer <token>
```

Membuat catatan transaksi baru. Hanya dapat diakses oleh pengguna dengan peran `KID`. Saldo tabungan akan diperbarui secara otomatis sesuai tipe transaksi yang dicatat.

**Request Body:**

```json
{
  "type": "INCOME",
  "amount": 50000,
  "description": "Uang saku dari Ayah"
}
```

| Field         | Tipe     | Wajib | Deskripsi                                      |
| ------------- | -------- | ----- | ---------------------------------------------- |
| `type`        | `string` | Ya    | Tipe transaksi: `INCOME` atau `EXPENSE`        |
| `amount`      | `number` | Ya    | Jumlah nominal transaksi (dalam satuan Rupiah) |
| `description` | `string` | Ya    | Keterangan atau catatan transaksi              |

**Response `200`:**

```json
{
  "message": "Transaction created successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "type": "INCOME",
    "amount": 50000,
    "description": "Uang saku dari Ayah",
    "created_at": "2026-04-06T09:00:00.000Z"
  }
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Daftar Transaksi `[Auth Required]` `[KID & PARENT]`

```
GET https://api-kidbanker.vercel.app/api/finance/transactions
Authorization: Bearer <token>
```

Mengambil daftar transaksi. Peran `KID` akan mendapatkan seluruh transaksi miliknya sendiri. Peran `PARENT` akan mendapatkan seluruh transaksi anak yang terhubung.

**Response `200` — Peran KID:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "type": "INCOME",
    "amount": 50000,
    "description": "Uang saku dari Ayah",
    "created_at": "2026-04-06T09:00:00.000Z"
  }
]
```

**Response `200` — Peran PARENT:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "kid-user-id",
    "type": "INCOME",
    "amount": 50000,
    "description": "Uang saku dari Ayah",
    "created_at": "2026-04-06T09:00:00.000Z"
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "user_id": "kid-user-id",
    "type": "EXPENSE",
    "amount": 10000,
    "description": "Beli buku pelajaran",
    "created_at": "2026-04-06T08:00:00.000Z"
  }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Informasi Tabungan `[Auth Required]` `[KID & PARENT]`

```
GET https://api-kidbanker.vercel.app/api/finance/savings
Authorization: Bearer <token>
```

Mengambil informasi saldo tabungan. Peran `KID` mendapatkan data tabungan miliknya sendiri. Peran `PARENT` mendapatkan data tabungan anak yang terhubung.

**Response `200` — Peran KID:**

```json
{
  "id": "s1a2v3i4-n5g6-7890-abcd-ef1234567890",
  "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
  "total_balance": 40000
}
```

**Response `200` — Peran PARENT:**

```json
{
  "id": "s1a2v3i4-n5g6-7890-abcd-ef1234567890",
  "user_id": "kid-user-id",
  "total_balance": 40000
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

### 6.3 Paylater

Endpoint paylater menangani alur pengajuan, persetujuan, dan penolakan pinjaman yang memerlukan otorisasi dari Orang Tua.

---

#### `POST` Ajukan Paylater `[Auth Required]` `[KID Only]`

```
POST https://api-kidbanker.vercel.app/api/paylater/request
Authorization: Bearer <token>
```

Membuat pengajuan paylater baru. Hanya dapat diakses oleh pengguna dengan peran `KID`. Status awal pengajuan adalah `PENDING` hingga mendapat respons dari Orang Tua.

**Request Body:**

```json
{
  "name": "Buku Pelajaran Semester Baru",
  "amount": 50000,
  "deadline": "2026-04-15"
}
```

| Field      | Tipe     | Wajib | Deskripsi                                          |
| ---------- | -------- | ----- | -------------------------------------------------- |
| `name`     | `string` | Ya    | Nama atau keperluan paylater                       |
| `amount`   | `number` | Ya    | Jumlah nominal yang diajukan (dalam satuan Rupiah) |
| `deadline` | `string` | Ya    | Tanggal jatuh tempo dalam format `YYYY-MM-DD`      |

**Response `200`:**

```json
{
  "message": "Paylater request created",
  "data": {
    "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
    "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "name": "Buku Pelajaran Semester Baru",
    "amount": 50000,
    "deadline": "2026-04-15",
    "status": "PENDING",
    "approved_by": null,
    "approved_at": null,
    "calendar_event_id": null,
    "created_at": "2026-04-06T09:00:00.000Z"
  }
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Daftar Pengajuan Paylater `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/paylater/requests
Authorization: Bearer <token>
```

Mengambil seluruh daftar pengajuan paylater dari anak yang terhubung, diurutkan dari yang terbaru. Hanya dapat diakses oleh pengguna dengan peran `PARENT`.

**Response `200`:**

```json
[
  {
    "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
    "user_id": "kid-user-id",
    "name": "Buku Pelajaran Semester Baru",
    "amount": 50000,
    "deadline": "2026-04-15",
    "status": "PENDING",
    "approved_by": null,
    "approved_at": null,
    "calendar_event_id": null,
    "created_at": "2026-04-06T09:00:00.000Z"
  }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `PATCH` Setujui Paylater `[Auth Required]` `[PARENT Only]`

```
PATCH https://api-kidbanker.vercel.app/api/paylater/approve/:id
Authorization: Bearer <token>
```

Menyetujui pengajuan paylater yang statusnya masih `PENDING`. Hanya dapat diakses oleh pengguna dengan peran `PARENT`. Setelah disetujui, sistem akan secara otomatis membuat event pengingat di Google Calendar untuk Anak dan Orang Tua (apabila keduanya telah menghubungkan akun Google Calendar).

**URL Parameter:**

| Parameter | Tipe   | Deskripsi                       |
| --------- | ------ | ------------------------------- |
| `id`      | `UUID` | ID paylater yang akan disetujui |

**Response `200`:**

```json
{
  "message": "Paylater request approved & added to Google Calendar",
  "data": {
    "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
    "user_id": "kid-user-id",
    "name": "Buku Pelajaran Semester Baru",
    "amount": 50000,
    "deadline": "2026-04-15",
    "status": "APPROVED",
    "approved_by": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "approved_at": "2026-04-06T09:30:00.000Z",
    "calendar_event_id": "google_calendar_event_id"
  }
}
```

**Response `400`:**

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

```json
{
  "message": "Paylater request already added to Google Calendar"
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `404`:**

```json
{
  "message": "Paylater request not found"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `PATCH` Tolak Paylater `[Auth Required]` `[PARENT Only]`

```
PATCH https://api-kidbanker.vercel.app/api/paylater/reject/:id
Authorization: Bearer <token>
```

Menolak pengajuan paylater yang statusnya masih `PENDING`. Hanya dapat diakses oleh pengguna dengan peran `PARENT`.

**URL Parameter:**

| Parameter | Tipe   | Deskripsi                     |
| --------- | ------ | ----------------------------- |
| `id`      | `UUID` | ID paylater yang akan ditolak |

**Response `200`:**

```json
{
  "message": "Paylater request rejected",
  "data": {
    "id": "p1a2y3l4-a5t6-7890-abcd-ef1234567890",
    "user_id": "kid-user-id",
    "name": "Buku Pelajaran Semester Baru",
    "amount": 50000,
    "deadline": "2026-04-15",
    "status": "REJECTED",
    "approved_by": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
    "approved_at": "2026-04-06T09:30:00.000Z",
    "calendar_event_id": null
  }
}
```

**Response `400`:**

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

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `404`:**

```json
{
  "message": "Paylater request not found"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

### 6.4 Dashboard Anak (Kid)

Kumpulan endpoint berikut digunakan untuk menampilkan data statistik dan ringkasan pada dashboard Anak. Seluruh endpoint dalam kelompok ini hanya dapat diakses oleh pengguna dengan peran `KID` dan wajib menyertakan token autentikasi yang valid.

---

#### `GET` Informasi Profil `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/profile
Authorization: Bearer <token>
```

Mengambil informasi profil dasar dari akun Anak, termasuk nama Orang Tua dan kode orang tua jika sudah terhubung.

**Response `200`:**

```json
{
  "name": "Andika Satrio Nurcahyo",
  "parent_name": "Nama Orang Tua",
  "parent_code": "A1B2C3"
}
```

> Keterangan: `parent_code` bernilai `"-"` apabila akun Anak belum memiliki `parent_code` sendiri. `parent_name` bernilai `null` apabila akun Anak belum terhubung dengan Orang Tua.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Tabungan Saya `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/my-savings
Authorization: Bearer <token>
```

Mengambil total saldo tabungan, nominal pemasukan terakhir, dan nominal pengeluaran terakhir dari akun Anak.

**Response `200`:**

```json
{
  "total_balance": 40000,
  "last_income": 50000,
  "last_expense": 10000
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Pemasukan Mingguan `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/weekly-income
Authorization: Bearer <token>
```

Mengambil perbandingan total pemasukan minggu ini dengan minggu lalu, beserta jumlah transaksi dan status perubahan.

**Response `200`:**

```json
{
  "this_week": 50000,
  "last_week": 30000,
  "income_count": 2,
  "difference": 20000,
  "status": "UP"
}
```

> Keterangan: Nilai `status` dapat berupa `UP`, `DOWN`, atau `SAME`.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Pengeluaran Mingguan `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/weekly-expense
Authorization: Bearer <token>
```

Mengambil perbandingan total pengeluaran minggu ini dengan minggu lalu, beserta jumlah transaksi dan status perubahan.

**Response `200`:**

```json
{
  "this_week": 10000,
  "last_week": 15000,
  "expense_count": 1,
  "difference": 5000,
  "status": "DOWN"
}
```

> Keterangan: Nilai `status` dapat berupa `UP`, `DOWN`, atau `SAME`.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Laporan Mingguan `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/weekly-report
Authorization: Bearer <token>
```

Mengambil laporan ringkas perbandingan total pemasukan minggu berjalan dengan minggu sebelumnya.

**Response `200`:**

```json
{
  "this_week": 50000,
  "income_count": 2,
  "difference": 20000,
  "status": "UP"
}
```

> Keterangan: Nilai `status` dapat berupa `UP`, `DOWN`, atau `SAME`.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Transaksi Mingguan (Chart) `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/weekly-transactions
Authorization: Bearer <token>
```

Mengambil data total pemasukan dan pengeluaran per hari untuk minggu berjalan (Senin hingga Minggu). Respons dirancang sebagai data sumber untuk visualisasi bar chart.

**Response `200`:**

```json
[
  { "day": "Mon", "income": 10000, "expense": 0 },
  { "day": "Tue", "income": 0, "expense": 5000 },
  { "day": "Wed", "income": 0, "expense": 0 },
  { "day": "Thu", "income": 40000, "expense": 5000 },
  { "day": "Fri", "income": 0, "expense": 0 },
  { "day": "Sat", "income": 0, "expense": 0 },
  { "day": "Sun", "income": 0, "expense": 0 }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Ikhtisar Bulanan `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/monthly-overview
Authorization: Bearer <token>
```

Mengambil frekuensi (jumlah) transaksi pemasukan dan pengeluaran secara akumulatif untuk bulan berjalan.

**Response `200`:**

```json
{
  "month": "apr",
  "income_count": 5,
  "expense_count": 3
}
```

> Keterangan: Nilai `month` adalah singkatan nama bulan dalam bahasa Inggris huruf kecil (contoh: `jan`, `feb`, `mar`).

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Ikhtisar Paylater `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/paylater-overview
Authorization: Bearer <token>
```

Mengambil ringkasan 5 data paylater terbaru milik Anak beserta indikator status keterlambatan.

**Response `200`:**

```json
[
  {
    "name": "Buku Pelajaran Semester Baru",
    "amount": 50000,
    "deadline": "2026-04-15",
    "status": "PENDING",
    "is_overdue": false
  }
]
```

> Keterangan: Nilai `is_overdue` bernilai `true` apabila tanggal `deadline` telah melewati tanggal saat ini.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Pengingat Paylater `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/paylater-reminder
Authorization: Bearer <token>
```

Mengambil satu pengingat paylater dengan jatuh tempo paling dekat yang berstatus `APPROVED` dan belum melewati tanggal hari ini.

**Response `200` — Terdapat pengingat aktif:**

```json
{
  "amount": 50000,
  "deadline": "2026-04-15",
  "is_overdue": false,
  "total_upcoming": 2
}
```

> Keterangan: `total_upcoming` adalah jumlah paylater `APPROVED` lainnya yang belum jatuh tempo, tidak termasuk yang ditampilkan.

**Response `200` — Tidak ada pengingat aktif:**

```json
null
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Status Paylater `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/paylater-status
Authorization: Bearer <token>
```

Mengambil rekap jumlah paylater berdasarkan status (disetujui, menunggu, dan ditolak) dari seluruh riwayat paylater Anak.

**Response `200`:**

```json
{
  "approved_count": 2,
  "pending_count": 1,
  "rejected_count": 0
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` 5 Transaksi Terakhir `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/last-transactions
Authorization: Bearer <token>
```

Mengambil deskripsi dan tipe dari 5 transaksi terbaru yang dilakukan oleh Anak.

**Response `200`:**

```json
[
  {
    "description": "Uang saku dari Ayah",
    "type": "INCOME"
  },
  {
    "description": "Beli buku pelajaran",
    "type": "EXPENSE"
  }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Seluruh Transaksi (Paginasi) `[Auth Required]` `[KID Only]`

```
GET https://api-kidbanker.vercel.app/api/kid/transactions
Authorization: Bearer <token>
```

Mengambil seluruh riwayat transaksi milik Anak dengan dukungan paginasi.

**Query Parameter:**

| Parameter | Tipe     | Wajib | Default | Deskripsi                  |
| --------- | -------- | ----- | ------- | -------------------------- |
| `page`    | `number` | Tidak | `1`     | Nomor halaman yang diminta |
| `limit`   | `number` | Tidak | `10`    | Jumlah data per halaman    |

**Response `200`:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "57f8dd4b-d656-4422-95ee-efc8b55d1f13",
      "type": "INCOME",
      "amount": 50000,
      "description": "Uang saku dari Ayah",
      "created_at": "2026-04-06T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "per_page": 10,
    "current_page": 1,
    "last_page": 3,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

### 6.5 Dashboard Orang Tua (Parent)

Kumpulan endpoint berikut digunakan untuk menampilkan data statistik dan ringkasan pada dashboard Orang Tua. Seluruh endpoint dalam kelompok ini hanya dapat diakses oleh pengguna dengan peran `PARENT` dan wajib menyertakan token autentikasi yang valid.

---

#### `GET` Informasi Profil `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/profile
Authorization: Bearer <token>
```

Mengambil informasi profil dasar dari akun Orang Tua beserta nama Anak yang terhubung.

**Response `200`:**

```json
{
  "name": "Andika Satrio Nurcahyo",
  "kid_name": "Nama Anak",
  "parent_code": "A1B2C3"
}
```

> Keterangan: `kid_name` bernilai `"-"` apabila belum ada akun Anak yang terhubung.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Tabungan Anak `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/kid-savings
Authorization: Bearer <token>
```

Mengambil informasi saldo tabungan dari Anak yang terhubung, termasuk nominal pemasukan dan pengeluaran terakhir.

**Response `200`:**

```json
{
  "total_balance": 40000,
  "last_earned": 50000,
  "last_spent": 10000
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Laporan Mingguan `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/weekly-report
Authorization: Bearer <token>
```

Mengambil laporan perbandingan total pemasukan Anak pada minggu berjalan dibandingkan minggu sebelumnya.

**Response `200`:**

```json
{
  "this_week": 50000,
  "income_count": 2,
  "difference": 20000,
  "status": "UP"
}
```

> Keterangan: Nilai `status` dapat berupa `UP`, `DOWN`, atau `SAME`.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Laporan Bulanan `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/monthly-report
Authorization: Bearer <token>
```

Mengambil laporan perbandingan total pemasukan Anak pada bulan berjalan dibandingkan bulan sebelumnya.

**Response `200`:**

```json
{
  "this_month": 150000,
  "income_count": 6,
  "difference": 30000,
  "status": "UP"
}
```

> Keterangan: Nilai `status` dapat berupa `UP`, `DOWN`, atau `SAME`.

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Transaksi Mingguan (Chart) `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/weekly-transactions
Authorization: Bearer <token>
```

Mengambil data total pemasukan dan pengeluaran Anak per hari untuk minggu berjalan (Senin hingga Minggu). Respons dirancang sebagai data sumber untuk visualisasi grafik.

**Response `200`:**

```json
[
  { "day": "Mon", "income": 10000, "expense": 0 },
  { "day": "Tue", "income": 0, "expense": 5000 },
  { "day": "Wed", "income": 0, "expense": 0 },
  { "day": "Thu", "income": 40000, "expense": 5000 },
  { "day": "Fri", "income": 0, "expense": 0 },
  { "day": "Sat", "income": 0, "expense": 0 },
  { "day": "Sun", "income": 0, "expense": 0 }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Ikhtisar Bulanan `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/monthly-overview
Authorization: Bearer <token>
```

Mengambil frekuensi transaksi pemasukan dan pengeluaran Anak secara akumulatif untuk bulan berjalan.

**Response `200`:**

```json
{
  "month": "apr",
  "income_count": 8,
  "expense_count": 5
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Seluruh Transaksi Anak (Paginasi) `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/transactions
Authorization: Bearer <token>
```

Mengambil seluruh riwayat transaksi Anak yang terhubung dengan dukungan paginasi.

**Query Parameter:**

| Parameter | Tipe     | Wajib | Default | Deskripsi                  |
| --------- | -------- | ----- | ------- | -------------------------- |
| `page`    | `number` | Tidak | `1`     | Nomor halaman yang diminta |
| `limit`   | `number` | Tidak | `10`    | Jumlah data per halaman    |

**Response `200`:**

```json
{
  "data": [
    {
      "description": "Uang saku dari Ayah",
      "type": "INCOME",
      "amount": 50000,
      "created_at": "2026-04-06T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "per_page": 10,
    "current_page": 1,
    "last_page": 3,
    "has_next_page": true,
    "has_prev_page": false
  }
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` 5 Transaksi Terakhir Anak `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/last-transactions
Authorization: Bearer <token>
```

Mengambil deskripsi dan tipe dari 5 transaksi terbaru Anak yang terhubung.

**Response `200`:**

```json
[
  {
    "description": "Uang saku dari Ayah",
    "type": "INCOME"
  },
  {
    "description": "Beli buku pelajaran",
    "type": "EXPENSE"
  }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Ikhtisar Paylater Anak `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/paylater-overview
Authorization: Bearer <token>
```

Mengambil seluruh riwayat paylater Anak yang terhubung beserta status dan informasi persetujuan.

**Response `200`:**

```json
[
  {
    "name": "Buku Pelajaran Semester Baru",
    "amount": 50000,
    "deadline": "2026-04-15",
    "status": "PENDING",
    "approved_at": null
  }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Paylater Menunggu Persetujuan `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/paylater-pending
Authorization: Bearer <token>
```

Mengambil hingga 5 data paylater terbaru yang berstatus `PENDING` dari Anak yang terhubung, diurutkan dari yang terbaru.

**Response `200`:**

```json
[
  {
    "name": "Buku Pelajaran Semester Baru",
    "status": "PENDING",
    "created_at": "2026-04-06T09:00:00.000Z"
  }
]
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Pengingat Paylater Anak `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/paylater-reminder
Authorization: Bearer <token>
```

Mengambil satu pengingat paylater Anak dengan jatuh tempo paling dekat yang berstatus `APPROVED` dan belum melewati tanggal hari ini.

**Response `200` — Terdapat pengingat aktif:**

```json
{
  "amount": 50000,
  "deadline": "2026-04-15",
  "is_overdue": false,
  "total_upcoming": 1
}
```

**Response `200` — Tidak ada pengingat aktif:**

```json
null
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

#### `GET` Status Paylater Anak `[Auth Required]` `[PARENT Only]`

```
GET https://api-kidbanker.vercel.app/api/parent/paylater-status
Authorization: Bearer <token>
```

Mengambil rekap jumlah paylater berdasarkan status dari seluruh riwayat paylater Anak yang terhubung.

**Response `200`:**

```json
{
  "approved_count": 3,
  "pending_count": 1,
  "rejected_count": 0
}
```

**Response `401`:**

```json
{
  "message": "Unauthorized"
}
```

**Response `403`:**

```json
{
  "message": "Forbidden"
}
```

**Response `500`:**

```json
{
  "message": "Internal server error"
}
```

---

## 7. Ringkasan Endpoint

| No. | Method  | Endpoint                          | Autentikasi | Peran       | Deskripsi                                           |
| --- | ------- | --------------------------------- | ----------- | ----------- | --------------------------------------------------- |
| 1   | `POST`  | `/auth/google`                    | Tidak       | Semua       | Login via Google OAuth                             |
| 2   | `POST`  | `/auth/register`                  | Tidak       | Semua       | Registrasi akun baru                               |
| 3   | `POST`  | `/auth/link-parent`               | Ya          | KID         | Hubungkan akun ke Orang Tua                        |
| 4   | `POST`  | `/api/finance/transactions`       | Ya          | KID         | Buat transaksi baru                                |
| 5   | `GET`   | `/api/finance/transactions`       | Ya          | KID, PARENT | Lihat daftar transaksi                             |
| 6   | `GET`   | `/api/finance/savings`            | Ya          | KID, PARENT | Lihat informasi tabungan                           |
| 7   | `POST`  | `/api/paylater/request`           | Ya          | KID         | Ajukan paylater baru                               |
| 8   | `GET`   | `/api/paylater/requests`          | Ya          | PARENT      | Lihat daftar pengajuan paylater                    |
| 9   | `PATCH` | `/api/paylater/approve/:id`       | Ya          | PARENT      | Setujui pengajuan paylater                         |
| 10  | `PATCH` | `/api/paylater/reject/:id`        | Ya          | PARENT      | Tolak pengajuan paylater                           |
| 11  | `GET`   | `/api/kid/profile`                | Ya          | KID         | Dashboard Anak: Profil                             |
| 12  | `GET`   | `/api/kid/my-savings`             | Ya          | KID         | Dashboard Anak: Tabungan Saya                      |
| 13  | `GET`   | `/api/kid/weekly-income`          | Ya          | KID         | Dashboard Anak: Pemasukan Mingguan                 |
| 14  | `GET`   | `/api/kid/weekly-expense`         | Ya          | KID         | Dashboard Anak: Pengeluaran Mingguan               |
| 15  | `GET`   | `/api/kid/weekly-report`          | Ya          | KID         | Dashboard Anak: Laporan Mingguan                   |
| 16  | `GET`   | `/api/kid/weekly-transactions`    | Ya          | KID         | Dashboard Anak: Transaksi Harian Mingguan          |
| 17  | `GET`   | `/api/kid/monthly-overview`       | Ya          | KID         | Dashboard Anak: Ikhtisar Bulanan                   |
| 18  | `GET`   | `/api/kid/transactions`           | Ya          | KID         | Dashboard Anak: Semua Transaksi (Paginasi)         |
| 19  | `GET`   | `/api/kid/last-transactions`      | Ya          | KID         | Dashboard Anak: 5 Transaksi Terakhir               |
| 20  | `GET`   | `/api/kid/paylater-overview`      | Ya          | KID         | Dashboard Anak: Ikhtisar Paylater                  |
| 21  | `GET`   | `/api/kid/paylater-reminder`      | Ya          | KID         | Dashboard Anak: Pengingat Paylater                 |
| 22  | `GET`   | `/api/kid/paylater-status`        | Ya          | KID         | Dashboard Anak: Status Paylater                    |
| 23  | `GET`   | `/api/parent/profile`             | Ya          | PARENT      | Dashboard Orang Tua: Profil                        |
| 24  | `GET`   | `/api/parent/kid-savings`         | Ya          | PARENT      | Dashboard Orang Tua: Tabungan Anak                 |
| 25  | `GET`   | `/api/parent/weekly-report`       | Ya          | PARENT      | Dashboard Orang Tua: Laporan Mingguan              |
| 26  | `GET`   | `/api/parent/monthly-report`      | Ya          | PARENT      | Dashboard Orang Tua: Laporan Bulanan               |
| 27  | `GET`   | `/api/parent/weekly-transactions` | Ya          | PARENT      | Dashboard Orang Tua: Transaksi Harian Mingguan     |
| 28  | `GET`   | `/api/parent/monthly-overview`    | Ya          | PARENT      | Dashboard Orang Tua: Ikhtisar Bulanan              |
| 29  | `GET`   | `/api/parent/transactions`        | Ya          | PARENT      | Dashboard Orang Tua: Semua Transaksi (Paginasi)    |
| 30  | `GET`   | `/api/parent/last-transactions`   | Ya          | PARENT      | Dashboard Orang Tua: 5 Transaksi Terakhir          |
| 31  | `GET`   | `/api/parent/paylater-overview`   | Ya          | PARENT      | Dashboard Orang Tua: Ikhtisar Paylater Anak        |
| 32  | `GET`   | `/api/parent/paylater-pending`    | Ya          | PARENT      | Dashboard Orang Tua: Paylater Menunggu Persetujuan |
| 33  | `GET`   | `/api/parent/paylater-reminder`   | Ya          | PARENT      | Dashboard Orang Tua: Pengingat Paylater Anak       |
| 34  | `GET`   | `/api/parent/paylater-status`     | Ya          | PARENT      | Dashboard Orang Tua: Status Paylater Anak          |

---

## 8. Referensi Kode Error

Seluruh endpoint menggunakan format dan kode HTTP error yang konsisten berikut ini.

| Kode  | Status                | Keterangan                                                                                                |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `400` | Bad Request           | Permintaan tidak valid, data yang dikirim tidak sesuai, atau terdapat kondisi bisnis yang tidak terpenuhi |
| `401` | Unauthorized          | Token tidak disertakan, tidak valid, atau telah kedaluwarsa                                               |
| `403` | Forbidden             | Token valid, namun peran pengguna tidak memiliki izin untuk mengakses endpoint ini                        |
| `404` | Not Found             | Sumber daya yang diminta tidak ditemukan                                                                  |
| `500` | Internal Server Error | Terjadi kesalahan pada sisi server                                                                        |

**Format Respons Error Umum:**

```json
{
  "message": "Deskripsi error yang terjadi"
}
```

---

_Dokumentasi ini disusun berdasarkan source code aktual dari Kid Banker API versi 1.3.0._
_Untuk pertanyaan teknis, silakan hubungi tim pengembang Kid Banker `@andkstrr_` ._
