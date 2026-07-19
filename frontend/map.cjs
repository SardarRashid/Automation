const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

async function run() {
  const mapData = fs.readFileSync('dist/assets/index-DMku7nyo.js.map', 'utf8');
  const rawSourceMap = JSON.parse(mapData);
  await SourceMapConsumer.with(rawSourceMap, null, consumer => {
    const jsCode = fs.readFileSync('dist/assets/index-DMku7nyo.js', 'utf8');
    const lines = jsCode.split('\n');
    
    lines.forEach((line, lineIdx) => {
      let colIdx = line.indexOf('.forEach');
      while (colIdx !== -1) {
        const pos = consumer.originalPositionFor({ line: lineIdx + 1, column: colIdx });
        if (pos.source && !pos.source.includes('node_modules')) {
          console.log(`Found .forEach at ${lineIdx + 1}:${colIdx} -> ${pos.source}:${pos.line}:${pos.column} (${pos.name})`);
        } else if (pos.source && (pos.source.includes('framer-motion') || pos.source.includes('recharts') || pos.source.includes('react'))) {
          console.log(`Found .forEach in lib -> ${pos.source}:${pos.line}`);
        }
        colIdx = line.indexOf('.forEach', colIdx + 1);
      }
    });
  });
}
run();
