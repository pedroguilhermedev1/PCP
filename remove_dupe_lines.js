const fs = require('fs');
const file = 'components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split(/\r?\n/);

const startIdx = 839; // 0-indexed for line 840
const endIdx = 1515; // 0-indexed for line 1516

if (lines[startIdx].includes('<section className="space-y-6 p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">')) {
  lines.splice(startIdx, endIdx - startIdx);
  fs.writeFileSync(file, lines.join('\n'));
  console.log("Successfully removed duplicate section based on line numbers!");
} else {
  console.log("Line 840 doesn't match the expected string, please verify.", lines[startIdx]);
}
