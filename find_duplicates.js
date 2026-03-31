const fs = require('fs');
const content = fs.readFileSync('c:/Users/Sahithi/OneDrive/Desktop/safespace/index.html', 'utf8');
const lines = content.split('\n');
const ids = {};
lines.forEach((line, i) => {
  const match = line.match(/id="([^"]+)"/);
  if (match) {
    const id = match[1];
    if (!ids[id]) ids[id] = [];
    ids[id].push(i + 1);
  }
});
for (const id in ids) {
  if (ids[id].length > 1) {
    console.log(`DUPLICATE ID Found: "${id}" at lines: ${ids[id].join(', ')}`);
  }
}
