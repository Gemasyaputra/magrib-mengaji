const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'InputHafalnDoa.tsx',
  'MasterHafalanPage.tsx',
  'PresensiPage.tsx',
  'SuperAdminDashboard.tsx',
  'SuperAdminMosqueDetail.tsx',
  'ManageTeachersPage.tsx',
  'InputIqroPage.tsx'
];

for (const file of filesToProcess) {
  const filePath = path.join('components', 'pages', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if no alert calls
  if (!content.includes('alert(')) continue;

  // Add the import if missing
  if (!content.includes("import { toast } from 'sonner';") && !content.includes('import { toast } from "sonner";')) {
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + "import { toast } from 'sonner';\n" + content.slice(endOfLastImport + 1);
    } else {
       content = "import { toast } from 'sonner';\n" + content;
    }
  }

  // Replace alert() logic
  content = content.replace(/alert\(([^)]*)\)/g, (match, inner) => {
    const lowerInner = inner.toLowerCase();
    if (lowerInner.includes('berhasil') || lowerInner.includes('disimpan') || lowerInner.includes('disetujui')) {
      return `toast.success(${inner})`;
    } else {
      return `toast.error(${inner})`;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed', file);
}
console.log('Done.');
