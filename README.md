# SimMengaji - Aplikasi Manajemen Kajian Islam

Aplikasi manajemen pembelajaran Islam di masjid dengan fitur lengkap untuk mengelola santri, guru, presensi, hafalan, dan aktivitas pembelajaran.

## 🏗️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes dengan Raw SQL Queries
- **Database**: Neon PostgreSQL dengan Drizzle ORM (untuk migrations dan seed)
- **File Storage**: Vercel Blob
- **PDF Export**: html2canvas + client-side PDF generation
- **Charts**: Recharts

## 📋 Fitur Utama

### 1. **Manajemen Santri (Siswa)**
- Daftar santri dengan level pembelajaran (Iqro/Juz)
- Detail profil santri
- Status kehadiran
- Riwayat aktivitas pembelajaran

### 2. **Input Pembelajaran**
- Input Iqro (dengan metode, surah, halaman, catatan)
- Input Hafalan Doa (dengan kategori harian dan bacaan shalat)
- Tracking progress pembelajaran

### 3. **Presensi**
- Input kehadiran santri per hari
- Status: Hadir, Alpa, Sakit
- Riwayat presensi
- Statistik kehadiran

### 4. **Kabar/Activity Feed**
- Posting berita dari admin/guru
- Komentar pada aktivitas
- Berbagi informasi penting

### 5. **Portal Orang Tua**
- Melihat progress anak
- Statistik kehadiran
- Riwayat aktivitas pembelajaran
- Laporan pembelajaran

### 6. **Super Admin Dashboard**
- Overview seluruh masjid
- Manajemen guru
- Statistik santri dan guru
- Struktur organisasi

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Neon PostgreSQL Database

### Environment Variables

Tambahkan ke `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Installation & Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd simmengaji
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup Database**

Jalankan migration script untuk membuat tabel dan data awal:

```bash
node scripts/migrate.js
```

4. **Run Development Server**
```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── page.tsx              # Main app entry point
├── layout.tsx            # Root layout
├── globals.css          # Global styles
├── api/                 # API routes (raw SQL queries)
│   ├── students/
│   ├── attendance/
│   ├── learning-records/
│   ├── doa-records/
│   ├── activities/
│   ├── upload/
│   └── export-pdf/

components/
├── Header.tsx           # App header
├── BottomNav.tsx        # Bottom navigation
├── Toast.tsx            # Toast notifications
└── pages/              # Page components
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── SantriListPage.tsx
    ├── SantriDetailPage.tsx
    ├── InputIqroPage.tsx
    ├── InputHafalnDoa.tsx
    ├── PresensiPage.tsx
    ├── KabarPage.tsx
    ├── ParentViewPage.tsx
    ├── SuperAdminDashboard.tsx
    ├── SuperAdminMosqueDetail.tsx
    └── ManageTeachersPage.tsx

lib/
├── db.ts               # Database connection
├── schema.ts           # Drizzle schema
└── api-helpers.ts      # Raw SQL query helpers

scripts/
├── migrate.js          # Run migrations
├── migrate.sql         # SQL migration file
└── seed.sql            # Seed data
```

## 🔐 Authentication

**Catatan**: Saat ini menggunakan login simulasi. Silakan klik tombol login sesuai role yang ingin diakses:

- **Guru**: Akses dashboard guru, input pembelajaran, presensi
- **Admin DKM**: Akses dashboard admin, manajemen santri, laporan
- **Orang Tua**: Portal melihat progress anak
- **Super Admin**: Overview seluruh masjid, manajemen guru

## 📊 API Routes

### Students
- `GET /api/students` - Daftar santri
- `GET /api/students?id=ID` - Detail santri
- `POST /api/students` - Tambah santri
- `PUT /api/students` - Update santri
- `DELETE /api/students?id=ID` - Hapus santri

### Attendance
- `GET /api/attendance` - Daftar presensi
- `POST /api/attendance` - Tambah presensi
- `PUT /api/attendance` - Update presensi

### Learning Records
- `GET /api/learning-records` - Daftar pembelajaran
- `POST /api/learning-records` - Tambah pembelajaran
- `PUT /api/learning-records` - Update pembelajaran

### Doa Records
- `GET /api/doa-records` - Daftar doa
- `POST /api/doa-records` - Tambah doa
- `PUT /api/doa-records` - Update doa

### Activities
- `GET /api/activities` - Daftar aktivitas
- `POST /api/activities` - Post aktivitas
- `DELETE /api/activities?id=ID` - Hapus aktivitas

### File Upload
- `POST /api/upload` - Upload file ke Vercel Blob

## 🛠️ Development

### Menjalankan Migrations
```bash
node scripts/migrate.js
```

### Build untuk Production
```bash
pnpm build
pnpm start
```

## 📝 Database Schema

Tabel utama:
- `users` - Data pengguna
- `students` - Data santri
- `teachers` - Data guru/ustadz
- `mosques` - Data masjid
- `attendance` - Data presensi
- `learning_records` - Data pembelajaran (Iqro, hafalan)
- `doa_records` - Data hafalan doa
- `activities` - Activity feed/kabar
- `surrahs` - Data surat Al-Quran
- `duas` - Data doa-doa

## 🚀 Deployment

Aplikasi siap deploy ke Vercel:

1. Push ke GitHub repository
2. Connect ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository ini.

## 📄 License

MIT License - Lihat file LICENSE untuk detail
