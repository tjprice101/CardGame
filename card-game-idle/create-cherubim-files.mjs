import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardsDir = path.join(__dirname, 'src/data/cards');

// Map of chaos files to create cherubim files from
const chaosFiles = [
  'pyroabyssChaosCards.ts',
  'mechanicalDreamsChaosCards.ts',
  'prismaticAccordChaosCards.ts',
  'thornboundChaosCards.ts',
  'blackGlassInfernoChaosCards.ts',
];

for (const chaosFile of chaosFiles) {
  const chaosPath = path.join(cardsDir, chaosFile);
  if (!fs.existsSync(chaosPath)) {
    console.log(`✗ ${chaosFile} not found, skipping...`);
    continue;
  }

  let content = fs.readFileSync(chaosPath, 'utf8');
  
  // Convert the file to Cherubim format
  // 1. Change imports from ChaosDefinition to CherubimDefinition
  content = content.replace(/from '@\/types\/cards';/, "from '@/types/cards';");
  content = content.replace(/import type { ChaosDefinition }/g, "import type { CherubimDefinition }");
  
  // 2. Replace type annotations
  content = content.replace(/ChaosDefinition\[\]/g, "CherubimDefinition[]");
  
  // 3. Replace type: 'Chaos' with type: 'Cherubim'
  content = content.replace(/type: 'Chaos'/g, "type: 'Cherubim'");
  
  // 4. Replace chaos- with cherubim- in definitionId
  content = content.replace(/definitionId: 'chaos-/g, "definitionId: 'cherubim-");
  
  // 5. Update effect type names (chaos_* → cherubim_*)
  content = content.replace(/{ type: 'chaos_/g, "{ type: 'cherubim_");
  
  // 6. Update export names
  const setPrefix = chaosFile.match(/^([a-z]+)/i)?.[1]?.toLowerCase() || '';
  const newExportName = `${setPrefix}CherubimCards`;
  const oldExportName = `${setPrefix}ChaosCards`;
  
  // Replace export const declarations
  content = content.replace(
    new RegExp(`export const ${setPrefix}StartedChaosCards`, 'g'),
    `export const ${setPrefix}StarterCherubimCards`
  );
  content = content.replace(
    new RegExp(`export const ${setPrefix}PackChaosCards`, 'g'),
    `export const ${setPrefix}PackCherubimCards`
  );
  content = content.replace(
    new RegExp(`export const ${oldExportName} = \\[`, 'g'),
    `export const ${newExportName} = [`
  );
  
  // Write to new cherubim file
  const newFileName = chaosFile.replace('Chaos', 'Cherubim');
  const newPath = path.join(cardsDir, newFileName);
  fs.writeFileSync(newPath, content, 'utf8');
  console.log(`✓ Created ${newFileName}`);
}

console.log('✓ All Cherubim files created!');
