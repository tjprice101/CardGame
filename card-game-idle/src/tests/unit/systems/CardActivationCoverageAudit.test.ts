import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardRegistry } from '../../../cards/CardRegistry';

type CoverageSets = {
  effects: Set<string>;
  conditions: Set<string>;
};

const EXECUTOR_PATH = path.resolve(process.cwd(), 'src', 'systems', 'cards', 'CardEffectExecutor.ts');
const STORE_PATH = path.resolve(process.cwd(), 'src', 'state', 'store.ts');
const CARD_REGISTRY_PATH = path.resolve(process.cwd(), 'src', 'cards', 'CardRegistry.ts');
const SCORE_SYSTEM_PATH = path.resolve(process.cwd(), 'src', 'systems', 'scoring', 'ScoreSystem.ts');

function extractHandlerLabels(filePath: string): Set<string> {
  const sourceText = readFileSync(filePath, 'utf8');
  const labels = new Set<string>();
  const patterns = [
    /case '([A-Za-z0-9_]+)'/g,
    /\b[A-Za-z_][A-Za-z0-9_]*\.type\s*===\s*'([A-Za-z0-9_]+)'/g,
    /\b[A-Za-z_][A-Za-z0-9_]*\.type\s*!==\s*'([A-Za-z0-9_]+)'/g,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(sourceText)) !== null) {
      labels.add(match[1]);
    }
  }

  return labels;
}

function collectCoverage(value: unknown, coverage: CoverageSets): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const entry of value) collectCoverage(entry, coverage);
    return;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.type === 'string') {
    coverage.effects.add(record.type);
  }

  if ('condition' in record) collectCondition(record.condition, coverage);
  if ('trigger' in record) collectCondition(record.trigger, coverage);
  if ('effect' in record) collectCoverage(record.effect, coverage);
  if ('payoff' in record) collectCoverage(record.payoff, coverage);

  if (Array.isArray(record.effects)) collectCoverage(record.effects, coverage);
  if (Array.isArray(record.then)) collectCoverage(record.then, coverage);
  if (Array.isArray(record.else)) collectCoverage(record.else, coverage);

  if (Array.isArray(record.gates)) {
    for (const gate of record.gates) {
      if (!gate || typeof gate !== 'object') continue;
      const gateRecord = gate as Record<string, unknown>;
      if ('condition' in gateRecord) collectCondition(gateRecord.condition, coverage);
      if ('payoff' in gateRecord) collectCoverage(gateRecord.payoff, coverage);
    }
  }
}

function collectCondition(value: unknown, coverage: CoverageSets): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const entry of value) collectCondition(entry, coverage);
    return;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.type === 'string') {
    coverage.conditions.add(record.type);
  }
}

function collectCardCoverage(): CoverageSets {
  const coverage: CoverageSets = {
    effects: new Set<string>(),
    conditions: new Set<string>(),
  };

  for (const card of CardRegistry.getAll()) {
    collectCoverage((card as any).effects, coverage);
    collectCoverage((card as any).onPlayEffects, coverage);
    collectCoverage((card as any).onSummonEffects, coverage);
    collectCoverage((card as any).onDeathEffects, coverage);

    const activatedAbility = (card as any).activatedAbility;
    if (activatedAbility && typeof activatedAbility === 'object') {
      collectCoverage((activatedAbility as { effects?: unknown }).effects, coverage);
    }
  }

  return coverage;
}

describe('card activation coverage audit', () => {
  it('keeps every authored effect and condition type backed by runtime handlers', () => {
    const used = collectCardCoverage();
    const handlerPaths = [EXECUTOR_PATH, STORE_PATH, CARD_REGISTRY_PATH, SCORE_SYSTEM_PATH];
    const handledEffects = new Set(handlerPaths.flatMap(filePath => [...extractHandlerLabels(filePath)]));
    const handledConditions = new Set(handlerPaths.flatMap(filePath => [...extractHandlerLabels(filePath)]));

    const missingEffects = [...used.effects].filter(effectType => !handledEffects.has(effectType)).sort();
    const missingConditions = [...used.conditions].filter(conditionType => !handledConditions.has(conditionType)).sort();

    expect({ missingEffects, missingConditions }).toEqual({ missingEffects: [], missingConditions: [] });
  });
});