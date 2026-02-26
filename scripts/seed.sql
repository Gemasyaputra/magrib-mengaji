-- ==========================================
-- SEED DATA (DATA DUMMY)
-- ==========================================

-- A. SEED MASTER DATA SURAH (Sampel 5 Surah)
INSERT INTO master_surahs (name_latin, name_arabic, total_verses, revelation_type) VALUES
('Al-Fatihah', 'الفاتحة', 7, 'Makkiyah'),
('Al-Baqarah', 'البقرة', 286, 'Madaniyah'),
('Al-Ikhlas', 'الإخلاص', 4, 'Makkiyah'),
('Al-Falaq', 'الفلق', 5, 'Makkiyah'),
('An-Nas', 'الناس', 6, 'Makkiyah')
ON CONFLICT DO NOTHING;

-- B. SEED MASTER DATA DOA HARIAN (Sampel 3 Doa)
INSERT INTO master_daily_prayers (title, category, arabic_text, translation) VALUES
('Doa Sebelum Makan', 'Adab Makan', 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ', 'Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami'),
('Doa Sesudah Makan', 'Adab Makan', 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا', 'Segala puji bagi Allah yang telah memberi makan kami'),
('Doa Masuk Masjid', 'Adab Masjid', 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'Ya Allah, bukalah untukku pintu-pintu rahmat-Mu')
ON CONFLICT DO NOTHING;

-- C. SEED MASTER DATA BACAAN SHOLAT (Sampel 3 Bacaan)
INSERT INTO master_prayer_readings (step_order, title, category, arabic_text) VALUES
(1, 'Takbiratul Ihram', 'Rukun', 'الله أكبر'),
(2, 'Doa Iftitah', 'Sunnah', 'الله أكبر كبيرا والحمد لله كثيرا'),
(3, 'Surah Al-Fatihah', 'Rukun', 'بسم الله الرحمن الرحيم')
ON CONFLICT DO NOTHING;

-- D. SEED DATA MASJID & USERS
INSERT INTO mosques (name, slug, address, contact_phone) VALUES
('Masjid Al-Hikmah', 'al-hikmah-jkt', 'Jakarta Selatan', '021-123456'),
('Masjid Nurul Iman', 'nurul-iman-bdg', 'Bandung Kota', '022-234567')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (mosque_id, name, email, password_hash, phone, role) VALUES
(1, 'Admin Hikmah', 'admin@hikmah.com', 'pass123', '081-123456', 'admin'),
(1, 'Ustadz Ali', 'ali@hikmah.com', 'pass123', '081-123457', 'teacher'),
(2, 'Admin Nurul', 'admin@nurul.com', 'pass123', '082-234567', 'admin'),
(2, 'Ustadzah Dina', 'dina@nurul.com', 'pass123', '082-234568', 'teacher')
ON CONFLICT DO NOTHING;

-- E. SEED DATA SANTRI
INSERT INTO students (mosque_id, name, slug, parent_name, parent_phone, birth_date, gender, current_level) VALUES
(1, 'Ahmad Fauzi', 'ahmad-fauzi-123', 'Pak Ahmad', '0628123456', '2015-05-10', 'L', 'Iqro Jilid 4'),
(1, 'Budi Santoso', 'budi-santoso-456', 'Pak Budi', '0628123457', '2016-07-15', 'L', 'Iqro Jilid 3'),
(2, 'Siti Aminah', 'siti-aminah-789', 'Bu Aminah', '0628123458', '2014-03-20', 'P', 'Al-Quran Surah Al-Fatihah'),
(2, 'Rizky Billar', 'rizky-billar-999', 'Pak Rizky', '0628123459', '2017-11-08', 'L', 'Iqro Jilid 2')
ON CONFLICT (slug) DO NOTHING;

-- F. SEED TRANSAKSI HAFALAN
INSERT INTO memorization_records (student_id, teacher_id, surah_id, verse_start, verse_end, status, quality, date) VALUES
(1, 2, 1, 1, 7, 'MURAJAAH', 'LANCAR', CURRENT_DATE),
(3, 4, 5, 1, 6, 'ZIYADAH', 'KURANG', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- G. SEED TRANSAKSI IBADAH
INSERT INTO worship_records (student_id, teacher_id, type, daily_prayer_id, is_completed, quality, date) VALUES
(1, 2, 'DOA_HARIAN', 1, true, 'A', CURRENT_DATE),
(3, 4, 'DOA_HARIAN', 3, true, 'B', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- H. SEED DATA PRESENSI
INSERT INTO attendance (student_id, teacher_id, date, status, notes) VALUES
(1, 2, CURRENT_DATE, 'HADIR', 'Hadiri dengan baik'),
(2, 2, CURRENT_DATE, 'HADIR', ''),
(3, 4, CURRENT_DATE, 'HADIR', ''),
(4, 4, CURRENT_DATE, 'SAKIT', 'Sakit demam')
ON CONFLICT DO NOTHING;

-- I. SEED DATA LEARNING RECORDS
INSERT INTO learning_records (student_id, teacher_id, date, type, level_or_surah, start_point, end_point, quality, notes) VALUES
(1, 2, CURRENT_DATE, 'IQRO', 'Jilid 4', 'Hal 1', 'Hal 3', 'A', 'Lancar'),
(2, 2, CURRENT_DATE, 'IQRO', 'Jilid 3', 'Hal 5', 'Hal 6', 'B', 'Cukup lancar'),
(3, 4, CURRENT_DATE, 'QURAN', 'Al-Fatihah', 'Ayat 1', 'Ayat 7', 'A', 'Sangat lancar'),
(4, 4, CURRENT_DATE, 'IQRO', 'Jilid 2', 'Hal 1', 'Hal 2', 'C', 'Kurang lancar')
ON CONFLICT DO NOTHING;

-- J. SEED DATA ACTIVITY POSTS
INSERT INTO activity_posts (mosque_id, author_id, title, content, activity_date) VALUES
(1, 2, 'Acara Tarawih Rame-Rame', 'Alhamdulillah, acara tarawih kami dihadiri oleh lebih dari 100 jamaah. Suasana sangat khusyuk dan penuh berkah.', CURRENT_DATE),
(2, 4, 'Wisata Edukatif ke Masjid Raya', 'Anak-anak kami mengunjungi Masjid Raya untuk belajar sejarah dan arsitektur masjid.', CURRENT_DATE)
ON CONFLICT DO NOTHING;
