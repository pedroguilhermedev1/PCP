const fs = require('fs');

const fixFile = (file) => {
    let c = fs.readFileSync(file, 'utf8');
    if (!c.includes('formatDateDisplay')) {
        const helper = `\nconst formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'S/ Data';
  const parts = dateStr.split('T');
  const d = parts[0].split('-').reverse().join('/');
  if (parts[1] && !parts[1].startsWith('00:00:00')) {
    return d + ' ' + parts[1].substring(0, 5);
  }
  return d;
};\n\n`;
        // Insert after imports
        const lastImport = c.lastIndexOf('import ');
        const endOfLastImport = c.indexOf('\n', lastImport);
        c = c.substring(0, endOfLastImport + 1) + helper + c.substring(endOfLastImport + 1);
    }
    c = c.replace(/\{([a-zA-Z0-9_.|() ]+)\?\.split\('-\'\)\.reverse\(\)\.join\('\/'\)( \|\| 'S\/ Data')?\}/g, "{formatDateDisplay($1)}");
    c = c.replace(/\{([a-zA-Z0-9_.|() ]+)\?.split\('-\'\).reverse\(\).join\('\/'\)\}/g, "{formatDateDisplay($1)}");
    c = c.replace(/d\.split\('-\'\)\.reverse\(\)\.join\('\/'\)/g, "formatDateDisplay(d)");
    fs.writeFileSync(file, c);
    console.log("Updated", file);
};

fixFile('components/faturas/FaturasGantt.tsx');
fixFile('components/faturas/TimeDetailsModal.tsx');
