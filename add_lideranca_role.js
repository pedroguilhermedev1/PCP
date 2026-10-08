const fs = require('fs');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      if (!name.includes('node_modules') && !name.includes('.next') && !name.includes('.git')) {
        getFiles(name, files);
      }
    } else {
      if (name.endsWith('.tsx') || name.endsWith('.ts')) {
        files.push(name);
      }
    }
  }
  return files;
}

const files = getFiles('.');
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add to currentUser.startsWith checks
  content = content.replace(/(currentUser\.startsWith\('debora\.mota'\) \|\| currentUser\.startsWith\('raphael\.ramiro'\))/g, "$1 || currentUser.startsWith('lideranca.arco')");
  
  // Add to user.startsWith checks
  content = content.replace(/(user\.startsWith\('debora\.mota'\) \|\| user\.startsWith\('raphael\.ramiro'\))/g, "$1 || user.startsWith('lideranca.arco')");

  // Add to array-based isAdmin checks
  content = content.replace(/'debora\.mota',\s*'raphael\.ramiro',\s*'francisco\.edson'/g, "'debora.mota', 'raphael.ramiro', 'francisco.edson', 'lideranca.arco'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} files.`);
