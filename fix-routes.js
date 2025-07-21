const fs = require('fs');

// Read the routes file
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Replace all catch (error) with catch (error: any)
content = content.replace(/catch \(error\)/g, 'catch (error: any)');

// Write back
fs.writeFileSync('server/routes.ts', content);
console.log('Fixed TypeScript errors in routes.ts');