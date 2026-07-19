const fs = require('fs');
const code = fs.readFileSync('online-index.js', 'utf8');
const regex = /function o\$e\(\){[\s\S]*?}/;
const match = code.match(regex);
if (match) {
  console.log("MATCH LENGTH:", match[0].length);
  console.log(match[0].substring(0, 1500));
} else {
  console.log("NOT FOUND");
}
