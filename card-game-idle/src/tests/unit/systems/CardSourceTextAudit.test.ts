import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const CARD_DATA_DIR = path.resolve(process.cwd(), 'src', 'data', 'cards');
const STRING_PROPERTY_NAMES = new Set([
  'description',
  'primaryDescription',
  'exaltedDescription',
  'unsynergizedDescription',
  'synergizedDescription',
  'lore',
]);

const suspiciousSourcePattern = /(?:\uFFFD|�~|(?:AE|ÁE|�E)(?=[0-9.])|\?E|\bx\.(?=\d))/;
const legacyDescriptionMutationPattern = /description\s*=\s*`\$\{card\.description\}/;
const legacyFlavorPattern = /applies disciplined pressure|executes a |escalates into a |finisher window/i;

function listCardDataFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listCardDataFiles(fullPath);
      }

      return /\.(?:ts|mts)$/.test(entry.name) ? [fullPath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function collectStringPropertyValues(filePath: string, sourceText: string): Array<{ propertyName: string; value: string }> {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const values: Array<{ propertyName: string; value: string }> = [];

  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node)) {
      const propertyName = getPropertyName(node.name);
      if (
        propertyName
        && STRING_PROPERTY_NAMES.has(propertyName)
        && (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
      ) {
        values.push({ propertyName, value: node.initializer.text });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return values;
}

describe('card source text audit', () => {
  const files = listCardDataFiles(CARD_DATA_DIR);

  it('keeps raw card data free of encoding artifacts and legacy description mutations', () => {
    const offenders = files.flatMap(filePath => {
      const sourceText = readFileSync(filePath, 'utf8');
      const issues: string[] = [];

      if (suspiciousSourcePattern.test(sourceText)) {
        issues.push('suspicious source text');
      }

      if (legacyDescriptionMutationPattern.test(sourceText)) {
        issues.push('legacy description mutation');
      }

      return issues.map(issue => `${path.relative(CARD_DATA_DIR, filePath)}: ${issue}`);
    });

    expect(offenders).toEqual([]);
  });

  it('keeps authored description fields on mechanic text rather than legacy flavor scaffolding', () => {
    const offenders = files.flatMap(filePath => {
      const sourceText = readFileSync(filePath, 'utf8');
      return collectStringPropertyValues(filePath, sourceText)
        .filter(entry => entry.propertyName !== 'lore' && legacyFlavorPattern.test(entry.value))
        .map(entry => `${path.relative(CARD_DATA_DIR, filePath)}: ${entry.propertyName} -> ${entry.value}`);
    });

    expect(offenders).toEqual([]);
  });
});