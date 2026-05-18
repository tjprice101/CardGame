import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import { CardRegistry } from '../src/cards/CardRegistry';
import {
  getCanonicalActivatedAbilityDescription,
  getCanonicalAttackDescription,
  getCanonicalCardDescription,
} from '../src/ui/cardStatSummary';

type Replacement = {
  start: number;
  end: number;
  text: string;
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const CARD_DATA_DIR = path.join(REPO_ROOT, 'src', 'data', 'cards');
const DESCRIPTION_HELPER_NAME = /(BespokeLine|MechanicLine)$/;
const DESCRIPTION_APPEND_PATTERN = /\.description\s*=\s*`\$\{card\.description\}/;

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function getProperty(objectLiteral: ts.ObjectLiteralExpression, propertyName: string): ts.PropertyAssignment | undefined {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (getPropertyName(property.name) === propertyName) {
      return property;
    }
  }

  return undefined;
}

function getObjectLiteralProperty(objectLiteral: ts.ObjectLiteralExpression, propertyName: string): ts.ObjectLiteralExpression | undefined {
  const property = getProperty(objectLiteral, propertyName);
  if (!property || !ts.isObjectLiteralExpression(property.initializer)) {
    return undefined;
  }

  return property.initializer;
}

function getLiteralText(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return undefined;
}

function getDefinitionId(objectLiteral: ts.ObjectLiteralExpression): string | undefined {
  const property = getProperty(objectLiteral, 'definitionId');
  if (!property) {
    return undefined;
  }

  return getLiteralText(property.initializer);
}

function quoteSingle(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
}

function pushStringReplacement(
  sourceFile: ts.SourceFile,
  property: ts.PropertyAssignment | undefined,
  nextValue: string,
  replacements: Replacement[],
): void {
  if (!property) return;
  if (!ts.isStringLiteral(property.initializer) && !ts.isNoSubstitutionTemplateLiteral(property.initializer)) {
    return;
  }

  replacements.push({
    start: property.initializer.getStart(sourceFile),
    end: property.initializer.getEnd(),
    text: quoteSingle(nextValue),
  });
}

function consumeTrailingNewlines(sourceText: string, start: number): number {
  let end = start;
  while (end < sourceText.length && (sourceText[end] === '\r' || sourceText[end] === '\n')) {
    end += 1;
  }
  return end;
}

function mergeDeletionRanges(ranges: Replacement[]): Replacement[] {
  if (ranges.length === 0) return ranges;

  const ordered = [...ranges].sort((left, right) => left.start - right.start);
  const merged: Replacement[] = [ordered[0]];

  for (const range of ordered.slice(1)) {
    const current = merged[merged.length - 1];
    if (range.start <= current.end) {
      current.end = Math.max(current.end, range.end);
      continue;
    }

    merged.push({ ...range });
  }

  return merged;
}

function applyEdits(sourceText: string, edits: Replacement[]): string {
  let output = sourceText;
  for (const edit of [...edits].sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, edit.start)}${edit.text}${output.slice(edit.end)}`;
  }
  return output;
}

function collectDescriptionReplacements(sourceFile: ts.SourceFile): Replacement[] {
  const replacements: Replacement[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      const definitionId = getDefinitionId(node);
      if (definitionId) {
        const card = CardRegistry.get(definitionId);
        if (card) {
          pushStringReplacement(sourceFile, getProperty(node, 'description'), getCanonicalCardDescription(card), replacements);

          if (card.type === 'Seraphim' && card.attacks) {
            pushStringReplacement(
              sourceFile,
              getProperty(node, 'unsynergizedDescription'),
              getCanonicalAttackDescription(card.attacks.unsynergized),
              replacements,
            );
            pushStringReplacement(
              sourceFile,
              getProperty(node, 'synergizedDescription'),
              getCanonicalAttackDescription(card.attacks.synergized),
              replacements,
            );

            const attacksObject = getObjectLiteralProperty(node, 'attacks');
            if (attacksObject) {
              const unsynergizedAttack = getObjectLiteralProperty(attacksObject, 'unsynergized');
              const synergizedAttack = getObjectLiteralProperty(attacksObject, 'synergized');
              if (unsynergizedAttack) {
                pushStringReplacement(
                  sourceFile,
                  getProperty(unsynergizedAttack, 'description'),
                  getCanonicalAttackDescription(card.attacks.unsynergized),
                  replacements,
                );
              }
              if (synergizedAttack) {
                pushStringReplacement(
                  sourceFile,
                  getProperty(synergizedAttack, 'description'),
                  getCanonicalAttackDescription(card.attacks.synergized),
                  replacements,
                );
              }
            }
          }

          if (card.type === 'Angel') {
            pushStringReplacement(
              sourceFile,
              getProperty(node, 'primaryDescription'),
              card.attacks ? getCanonicalAttackDescription(card.attacks.primary) : '',
              replacements,
            );
            pushStringReplacement(
              sourceFile,
              getProperty(node, 'exaltedDescription'),
              card.attacks ? getCanonicalAttackDescription(card.attacks.exalted) : '',
              replacements,
            );

            const activatedAbility = getObjectLiteralProperty(node, 'activatedAbility');
            if (activatedAbility) {
              pushStringReplacement(
                sourceFile,
                getProperty(activatedAbility, 'description'),
                getCanonicalActivatedAbilityDescription(card),
                replacements,
              );
            }

            if (card.attacks) {
              const attacksObject = getObjectLiteralProperty(node, 'attacks');
              if (attacksObject) {
                const primaryAttack = getObjectLiteralProperty(attacksObject, 'primary');
                const exaltedAttack = getObjectLiteralProperty(attacksObject, 'exalted');
                if (primaryAttack) {
                  pushStringReplacement(
                    sourceFile,
                    getProperty(primaryAttack, 'description'),
                    getCanonicalAttackDescription(card.attacks.primary),
                    replacements,
                  );
                }
                if (exaltedAttack) {
                  pushStringReplacement(
                    sourceFile,
                    getProperty(exaltedAttack, 'description'),
                    getCanonicalAttackDescription(card.attacks.exalted),
                    replacements,
                  );
                }
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return replacements;
}

function collectDeletionRanges(sourceFile: ts.SourceFile, sourceText: string): Replacement[] {
  const deletions: Replacement[] = [];

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement)
      && statement.name
      && DESCRIPTION_HELPER_NAME.test(statement.name.text)
    ) {
      deletions.push({
        start: statement.getFullStart(),
        end: consumeTrailingNewlines(sourceText, statement.getEnd()),
        text: '',
      });
      continue;
    }

    if (ts.isForOfStatement(statement) && DESCRIPTION_APPEND_PATTERN.test(statement.getText(sourceFile))) {
      deletions.push({
        start: statement.getFullStart(),
        end: consumeTrailingNewlines(sourceText, statement.getEnd()),
        text: '',
      });
    }
  }

  return mergeDeletionRanges(deletions);
}

async function rewriteFile(filePath: string): Promise<boolean> {
  const sourceText = await fs.readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const replacements = collectDescriptionReplacements(sourceFile);
  const deletions = collectDeletionRanges(sourceFile, sourceText);
  if (replacements.length === 0 && deletions.length === 0) {
    return false;
  }

  const nextText = applyEdits(sourceText, [...replacements, ...deletions]);
  if (nextText === sourceText) {
    return false;
  }

  await fs.writeFile(filePath, nextText, 'utf8');
  return true;
}

async function main(): Promise<void> {
  const entries = await fs.readdir(CARD_DATA_DIR, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && /\.(?:ts|mts)$/.test(entry.name))
    .map(entry => path.join(CARD_DATA_DIR, entry.name))
    .sort((left, right) => left.localeCompare(right));

  let changedCount = 0;
  for (const filePath of files) {
    const didChange = await rewriteFile(filePath);
    if (didChange) {
      changedCount += 1;
      console.log(path.relative(REPO_ROOT, filePath));
    }
  }

  console.log(`Updated ${changedCount} card data file(s).`);
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});