const fs = require('fs');
const code = fs.readFileSync('online-index.js', 'utf8');
const idx = code.indexOf('function o$e()');
console.log(code.substring(idx, idx + 2000));
