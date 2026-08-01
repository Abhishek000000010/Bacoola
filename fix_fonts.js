const fs = require('fs');
const { execSync } = require('child_process');

function fixFonts() {
    // 1. Replace ALL text-[12px] with text-[11px] in the whole src directory
    console.log("Replacing all 12px with 11px...");
    function replaceAll12to11(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = dir + '/' + file;
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.next') replaceAll12to11(fullPath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('text-[12px]')) {
                    content = content.replace(/text-\[12px\]/g, 'text-[11px]');
                    fs.writeFileSync(fullPath, content);
                }
            }
        }
    }
    replaceAll12to11('c:/Projects/bacoola-2/apps/storefront/src');

    // 2. Find all original 12px lines from HEAD and restore them in the working tree
    console.log("Restoring original 12px lines...");
    const grepOutput = execSync('git grep -n "text-\\[12px\\]" HEAD apps/storefront').toString();
    const lines = grepOutput.split('\n').filter(l => l.trim() !== '');

    const fileMap = {};
    for (const line of lines) {
        // Format: HEAD:apps/storefront/src/path.tsx:123: content
        const parts = line.split(':');
        const filename = parts[1];
        const originalContent = parts.slice(3).join(':');

        if (!fileMap[filename]) fileMap[filename] = [];
        fileMap[filename].push(originalContent);
    }

    for (const [filename, originalLines] of Object.entries(fileMap)) {
        const absolutePath = 'c:/Projects/bacoola-2/' + filename;
        if (!fs.existsSync(absolutePath)) continue;
        
        let content = fs.readFileSync(absolutePath, 'utf8');
        let linesInFile = content.split('\n');
        
        // For each original line that had text-[12px], it now has text-[11px] in our file.
        // We need to find the matching line and revert it.
        for (const origLine of originalLines) {
            // Create the expected current line by replacing 12px with 11px
            const expectedCurrentLine = origLine.replace(/text-\[12px\]/g, 'text-[11px]');
            
            // Find this exact line (ignoring leading/trailing whitespace to be safe, though exact match is better)
            let found = false;
            for (let i = 0; i < linesInFile.length; i++) {
                if (linesInFile[i].trim() === expectedCurrentLine.trim()) {
                    linesInFile[i] = linesInFile[i].replace(/text-\[11px\]/g, 'text-[12px]');
                    found = true;
                    break; // Only replace one instance per origLine
                }
            }
            if (!found) {
                console.log("Could not find line to restore in " + filename + ": " + expectedCurrentLine.trim());
            }
        }
        
        fs.writeFileSync(absolutePath, linesInFile.join('\n'));
    }
    console.log("Done.");
}

fixFonts();
