-- ==========================================
-- BAGIAN 1: MASTER DATA (REFERENCE TABLES)
-- ==========================================

-- 1. Master Data Surah Al-Quran (Standard Kemenag)
CREATE TABLE IF NOT EXISTS master_surahs (
    id BIGSERIAL PRIMARY KEY,
    name_latin VARCHAR(100) NOT NULL,
    name_arabic VARCHAR(100),
    total_verses INT NOT NULL,
    revelation_type VARCHAR(20) CHECK (revelation_type IN ('Makkiyah', 'Madaniyah')),
    juz VARCHAR(50)
);

-- 2. Master Data Doa Harian
CREATE TABLE IF NOT EXISTS master_daily_prayers (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    arabic_text TEXT,
    latin_text TEXT,
    translation TEXT
);

-- 3. Master Data Bacaan Sholat
CREATE TABLE IF NOT EXISTS master_prayer_readings (
    id BIGSERIAL PRIMARY KEY,
    step_order INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    arabic_text TEXT,
    translation TEXT
);

-- ==========================================
-- BAGIAN 2: STRUKTUR UTAMA (CORE TABLES)
-- ==========================================

-- 4. Tabel Masjid
CREATE TABLE IF NOT EXISTS mosques (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Users (Admin & Pengajar)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    mosque_id BIGINT NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    nik VARCHAR(50),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(20),
    golongan_darah VARCHAR(5),
    alamat TEXT,
    rt_rw VARCHAR(20),
    kel_desa VARCHAR(100),
    kecamatan VARCHAR(100),
    agama VARCHAR(50),
    status_perkawinan VARCHAR(50),
    pekerjaan VARCHAR(100),
    kewarganegaraan VARCHAR(50),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Kelompok Belajar
CREATE TABLE IF NOT EXISTS study_groups (
    id BIGSERIAL PRIMARY KEY,
    mosque_id BIGINT NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    teacher_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- 7. Tabel Santri
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    mosque_id BIGINT NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES study_groups(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(1) CHECK (gender IN ('L', 'P')),
    address TEXT,
    current_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Presensi
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('HADIR', 'SAKIT', 'IZIN', 'ALPA')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- BAGIAN 3: TABEL TRANSAKSI (UPDATED)
-- ==========================================

-- 9. Tabel Log Mengaji (Bacaan/Simak)
CREATE TABLE IF NOT EXISTS learning_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('IQRO', 'QURAN')),
    level_or_surah VARCHAR(50) NOT NULL,
    start_point VARCHAR(20) NOT NULL,
    end_point VARCHAR(20) NOT NULL,
    quality VARCHAR(1) NOT NULL CHECK (quality IN ('A', 'B', 'C', 'D')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel Log Hafalan (Tahfidz)
CREATE TABLE IF NOT EXISTS memorization_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    surah_id BIGINT NOT NULL REFERENCES master_surahs(id),
    verse_start INT NOT NULL,
    verse_end INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ZIYADAH', 'MURAJAAH')),
    quality VARCHAR(20) NOT NULL CHECK (quality IN ('LANCAR', 'KURANG', 'ULANG')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabel Log Ibadah & Doa
CREATE TABLE IF NOT EXISTS worship_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DOA_HARIAN', 'BACAAN_SHOLAT')),
    daily_prayer_id BIGINT REFERENCES master_daily_prayers(id),
    prayer_reading_id BIGINT REFERENCES master_prayer_readings(id),
    is_completed BOOLEAN DEFAULT FALSE,
    quality VARCHAR(1) CHECK (quality IN ('A', 'B', 'C')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Tabel Dokumentasi (News Feed)
CREATE TABLE IF NOT EXISTS activity_posts (
    id BIGSERIAL PRIMARY KEY,
    mosque_id BIGINT NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    activity_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_images (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES activity_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ADD JUZ COLUMN
ALTER TABLE master_surahs ADD COLUMN IF NOT EXISTS juz VARCHAR(50);