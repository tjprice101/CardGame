const fs = require('fs');
const path = require('path');

const cardsDir = 'src/data/cards';
const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('Cards.ts'));

console.log(`Found ${files.length} card files to process`);

for (const file of files) {
  const filePath = path.join(cardsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all seek- prefixes with ophanim-
  const before = content.length;
  content = content.replace(/definitionId: '([a-z]+)?seek-/g, "definitionId: '$1ophanim-");
  content = content.replace(/definitionId: '([a-z]+)-seek-/g, "definitionId: '$1-ophanim-");
  const after = content.length;
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ ${file}`);
}

console.log('✓ All files renamed!');
