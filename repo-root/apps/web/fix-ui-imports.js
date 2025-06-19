const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**']
});

console.log(`Found ${files.length} TypeScript files to check...`);

let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Replace @/components/ui imports with @locumtruerate/ui
  if (content.includes('@/components/ui/')) {
    // Extract all UI component imports
    const uiImportRegex = /import\s*{([^}]+)}\s*from\s*['"]@\/components\/ui\/[^'"]+['"]/g;
    const toastImportRegex = /import\s*{\s*toast\s*}\s*from\s*['"]@\/components\/ui\/use-toast['"]/g;
    
    let allImports = [];
    let match;
    
    // Collect all UI imports
    while ((match = uiImportRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(imp => imp.trim());
      allImports.push(...imports);
    }
    
    // Remove duplicates
    allImports = [...new Set(allImports)];
    
    if (allImports.length > 0) {
      // Replace all individual UI imports with a single combined import
      content = content.replace(uiImportRegex, '');
      
      // Add the combined import at the top of imports section
      const firstImportMatch = content.match(/^import\s+/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index;
        const combinedImport = `import { ${allImports.join(', ')} } from '@locumtruerate/ui'\n`;
        content = content.slice(0, insertPos) + combinedImport + content.slice(insertPos);
      }
      
      modified = true;
    }
    
    // Replace toast import
    if (content.match(toastImportRegex)) {
      content = content.replace(toastImportRegex, "import { toast } from 'sonner'");
      modified = true;
    }
  }
  
  // Replace any remaining @/components/ui/badge imports with direct exports
  if (content.includes("from '@/components/ui/badge'")) {
    content = content.replace(
      /import\s*{\s*Badge\s*}\s*from\s*['"]@\/components\/ui\/badge['"]/g,
      "import { Badge } from '@locumtruerate/ui'"
    );
    modified = true;
  }
  
  if (modified) {
    // Clean up multiple empty lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed imports in: ${file}`);
    filesModified++;
  }
});

console.log(`\n📊 Summary: Modified ${filesModified} files`);