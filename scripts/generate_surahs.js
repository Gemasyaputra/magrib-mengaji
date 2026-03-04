const fs = require('fs');

async function main() {
  const url = 'https://raw.githubusercontent.com/semarketir/quranjson/master/source/surah.json';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    let sql = `-- A. SEED MASTER DATA SURAH (114 Surah Lengkap dengan Juz)\n`;
    sql += `INSERT INTO master_surahs (id, name_latin, name_arabic, total_verses, revelation_type, juz) VALUES\n`;
    
    const values = data.map((surah, idx) => {
      // Extract unique juz using Set to remove duplicates
      const juzIndices = [...new Set(surah.juz.map(j => parseInt(j.index, 10).toString()))].join(', ');
      
      const id = parseInt(surah.index, 10);
      const nameLatin = surah.title.replace(/'/g, "''");
      const nameArabic = surah.titleAr.replace(/'/g, "''");
      const revType = surah.type === 'Makkiyah' ? 'Makkiyah' : 'Madaniyah';
      
      return `(${id}, '${nameLatin}', '${nameArabic}', ${surah.count}, '${revType}', '${juzIndices}')`;
    });
    
    sql += values.join(',\n');
    sql += `\nON CONFLICT (id) DO UPDATE SET\n  name_latin = EXCLUDED.name_latin,\n  name_arabic = EXCLUDED.name_arabic,\n  total_verses = EXCLUDED.total_verses,\n  revelation_type = EXCLUDED.revelation_type,\n  juz = EXCLUDED.juz;\n`;

    fs.writeFileSync('surahs_seed_patch.sql', sql);
    console.log('Successfully generated surahs_seed_patch.sql');
  } catch (error) {
    console.error('Error fetching/generating:', error);
  }
}

main();
