const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('admin@admin') || c.includes('id:"admin"') || c.includes("id: 'admin'") || c.includes('id: "admin"')) {
        console.log("MATCH:", full);
      }
    }
  }
}
walk('src');
