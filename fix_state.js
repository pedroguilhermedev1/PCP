const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('selectedViewFatura')) {
  content = content.replace(
    /const \[activeTab, setActiveTab\] = useState<[^>]+>\('[^']+'\);/,
    match => `${match}\n  const [selectedViewFatura, setSelectedViewFatura] = useState<Fatura | null>(null);`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed missing state definition');
