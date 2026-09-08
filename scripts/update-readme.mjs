import fs from 'node:fs';
import path from 'node:path';

const generatedApiPath = path.resolve('docs/api-readme/API.md');
const readmePath = path.resolve('README.md');

if (fs.existsSync(generatedApiPath) && fs.existsSync(readmePath)) {
    const apiDocs = fs.readFileSync(generatedApiPath, 'utf-8');
    let readme = fs.readFileSync(readmePath, 'utf-8');

    const startMarker = '<!-- API_DOCS_START -->';
    const endMarker = '<!-- API_DOCS_END -->';

    const startIndex = readme.indexOf(startMarker);
    const endIndex = readme.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
        const updated =
            readme.substring(0, startIndex + startMarker.length) +
            '\n\n' + apiDocs.trim() + '\n\n' +
            readme.substring(endIndex);

        fs.writeFileSync(readmePath, updated, 'utf-8');
        console.log('✓ Successfully synced API reference into README.md');

        // Clean up temporary single-file folder
        fs.rmSync(path.resolve('docs/api-readme'), { recursive: true, force: true });
    } else {
        console.error('Error: Could not find <!-- API_DOCS_START --> and <!-- API_DOCS_END --> markers in README.md');
    }
}
