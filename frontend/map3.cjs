const fs = require('fs');
const { SourceMapConsumer } = require('source-map');
async function run() {
  const mapData = fs.readFileSync('dist/assets/index-DMku7nyo.js.map', 'utf8');
  const rawSourceMap = JSON.parse(mapData);
  const sources = rawSourceMap.sources;
  console.log(sources.filter(s => s.includes('framer-motion')).length);
  console.log(sources.filter(s => s.includes('lucide-react')).length);
  console.log(sources.filter(s => s.includes('recharts')).length);
}
run();
