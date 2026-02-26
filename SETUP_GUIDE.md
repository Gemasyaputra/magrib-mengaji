# Setup Guide - SimMengaji

Panduan lengkap untuk setup dan menjalankan aplikasi SimMengaji.

## ✅ Prerequisites

- Node.js 18+ 
- pnpm (atau npm/yarn)
- Neon PostgreSQL Database Account (gratis di neon.tech)
- Vercel Account (untuk deployment, opsional)

## 🔐 Step 1: Setup Database

### 1.1 Create Neon Database

1. Buka [neon.tech](https://neon.tech)
2. Login atau create account
3. Create new project
4. Dapatkan connection string:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### 1.2 Configure Environment Variables

Buat file `.env.local` di root project:

```env
# Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Vercel Blob (opsional, hanya jika mau file upload)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

## 🚀 Step 2: Install Dependencies

```bash
# Install dependencies
pnpm install

# Verify installation
pnpm --version
node --version
```

## 📊 Step 3: Run Database Migrations

Jalankan script untuk membuat tabel dan data seed:

```bash
# Run migration dan seed
node scripts/migrate.js
```

**Expected Output:**
```
Starting database migration...
Executing migration SQL...
Migration completed successfully!
Executing seed SQL...
Seed data inserted successfully!
```

Jika ada error:
- Pastikan DATABASE_URL benar
- Cek koneksi ke database
- Lihat error message untuk detail

## 🎯 Step 4: Start Development Server

```bash
pnpm dev
```

Server akan berjalan di `http://localhost:3000`

## 🧪 Step 5: Testing & Demo

### Login Test

1. Buka browser ke `http://localhost:3000`
2. Pilih salah satu role untuk login:
   - **Login sebagai Guru** → Akses dashboard guru
   - **Login sebagai Admin DKM** → Akses dashboard admin
   - **Login sebagai Orang Tua** → Portal parent
   - **Login sebagai Super Admin** → Super admin panel

### Explore Features

**Guru Dashboard:**
- Input Iqro dengan surah, halaman, catatan
- Input Hafalan Doa dengan checklist
- View presensi santri
- Post kabar untuk santri

**Admin Dashboard:**
- Lihat daftar santri
- Input dan view presensi
- Kelola guru
- Activity feed

**Parent Portal:**
- Lihat progress anak
- Chart kehadiran
- Aktivitas terkini

**Super Admin:**
- Overview semua masjid
- Statistik santri & guru
- Kelola struktur pengurus

## 🛠️ Development Workflow

### Menjalankan Server
```bash
pnpm dev
```

### Build untuk Production
```bash
pnpm build
pnpm start
```

### Menjalankan Linter
```bash
pnpm lint
```

### Format Code
```bash
pnpm format
```

## 📱 Project Structure Walkthrough

```
app/page.tsx
  └─ Main app component yang handle routing ke semua pages

components/
  ├─ Header.tsx (shared header)
  ├─ BottomNav.tsx (shared navigation)
  ├─ Toast.tsx (notifications)
  └─ pages/ (all page components)

app/api/
  ├─ students/ (CRUD santri)
  ├─ attendance/ (CRUD presensi)
  ├─ learning-records/ (CRUD pembelajaran)
  ├─ doa-records/ (CRUD doa)
  ├─ activities/ (CRUD kabar)
  ├─ upload/ (file upload)
  └─ export-pdf/ (PDF export)

lib/
  ├─ db.ts (database config)
  ├─ schema.ts (drizzle schema)
  └─ api-helpers.ts (SQL query helpers)

scripts/
  ├─ migrate.js (run migration script)
  ├─ migrate.sql (create tables)
  └─ seed.sql (insert dummy data)
```

## 🔧 Common Issues & Solutions

### Issue: DATABASE_URL not found
**Solution:** 
- Pastikan `.env.local` sudah dibuat
- Restart dev server setelah menambah env vars
```bash
# Kill server (Ctrl+C) lalu jalankan lagi
pnpm dev
```

### Issue: Migration fails
**Solution:**
- Cek DATABASE_URL format benar
- Pastikan database sudah dibuat
- Try manual connection:
```bash
psql "postgresql://user:password@host/database?sslmode=require"
```

### Issue: Port 3000 sudah digunakan
**Solution:**
```bash
# Gunakan port lain
pnpm dev -- -p 3001
```

### Issue: Hot reload tidak bekerja
**Solution:**
- Clear `.next` folder
```bash
rm -rf .next
pnpm dev
```

## 📦 Dependencies

### Production
- `next`: ^15.0.0
- `react`: ^19.0.0
- `typescript`: ^5.0.0
- `tailwindcss`: ^4.0.0
- `pg`: ^8.11.3 (PostgreSQL driver)
- `drizzle-orm`: ^0.30.10 (ORM untuk migration)
- `html2canvas`: ^1.4.1 (PDF export)
- `@vercel/blob`: ^0.16.1 (file storage)
- `lucide-react`: ^0.X.X (icons)

### Dev Dependencies
- `drizzle-kit`: ^0.20.14 (Drizzle tools)
- `@types/node`: ^22
- `@types/react`: ^19.0.0

## 🚀 Deployment ke Vercel

### 1. Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/simmengaji
git push -u origin main
```

### 2. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import dari GitHub repository
4. Add environment variables:
   - `DATABASE_URL` = Neon connection string
   - `BLOB_READ_WRITE_TOKEN` = (opsional)
5. Click Deploy

### 3. Verify Deployment
- Check build logs
- Test semua features di production URL
- Monitor di Vercel dashboard

## 📝 Database Schema Quick Reference

**Tabel Utama:**
- `users` - Pengguna (guru, admin, etc)
- `students` - Santri/murid
- `teachers` - Guru/ustadz
- `mosques` - Data masjid
- `attendance` - Data presensi
- `learning_records` - Pembelajaran (Iqro, Quran)
- `doa_records` - Hafalan doa
- `activities` - Kabar/feed
- `surahs` - Surat Al-Quran
- `duas` - Data doa

## 💾 API Examples

### Get All Students
```bash
curl http://localhost:3000/api/students
```

### Create Attendance Record
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "attendance_date": "2025-10-24",
    "status": "hadir",
    "notes": "Hadir normal"
  }'
```

### Get Learning Records
```bash
curl "http://localhost:3000/api/learning-records?student_id=1"
```

## 🆘 Getting Help

1. **Check logs**: Lihat console saat running `pnpm dev`
2. **Read error message**: Biasanya error message sudah cukup descriptive
3. **Check DATABASE_URL**: Most common issue
4. **Review code**: Semua file sudah documented dengan comments

## ✨ Next Steps

1. ✅ Run migrations
2. ✅ Test di development
3. ✅ Customize sesuai kebutuhan
4. ✅ Implement real authentication
5. ✅ Deploy ke production

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Neon Docs](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

**Selamat setup! Jika ada pertanyaan, review PROJECT_SUMMARY.md dan README.md untuk informasi lebih lengkap.**
