import { describe, expect, it } from 'vitest';
import { darkCards } from '@/data/cards/darkCards';
import { lightCards } from '@/data/cards/lightCards';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { getCardPreviewLines, getCardSummarySections } from '@/ui/cardStatSummary';
import { CardEffectExecutor } from '@/systems/cards/CardEffectExecutor';
import { CardRegistry } from '@/cards/CardRegistry';
import type { TurnState } from '@/types/game';

describe('Ain/Soph card catalog', () => {
  it('contains the complete Main Deck taxonomy', () => {
    expect(lightCards).toHaveLength(25);
    expect(darkCards).toHaveLength(25);
    expect(new Set([...lightCards, ...darkCards].map(card => card.definitionId)).size).toBe(50);
  });

  it('contains twelve authored Extra Deck bridge definitions', () => {
    expect(ainSophAurCards).toHaveLength(12);
    expect(new Set(ainSophAurCards.map(card => card.definitionId)).size).toBe(12);
    for (const card of ainSophAurCards) {
      expect(card.bridgeAttack?.baseOblivion).toBeGreaterThan(0);
      expect(card.bridgeAttack?.cooldownCards).toBeGreaterThan(0);
      expect(card.onSummonEffects.length).toBeGreaterThan(0);
    }
  });

  it('gives every Light and Dark card bespoke runtime values', () => {
    for (const card of lightCards) {
      expect(card.ainAttack.cooldownCards).toBeGreaterThan(0);
      expect(card.sophAttack.cooldownCards).toBeGreaterThan(0);
      expect(card.sacrificeOblivionRate).toBeGreaterThan(0);
    }
    for (const card of darkCards) {
      expect(card.cooldownCardsPlayed).toBeGreaterThan(0);
      expect(card.sacrificeOblivionRate).toBeGreaterThan(0);
      expect(card.postActivationFate).toMatch(/^(hand|deck|discard)$/);
    }
  });

  it('renders complete stat panels and previews for every Neutrality card', () => {
    for (const card of [...lightCards, ...darkCards, ...ainSophAurCards]) {
      const sections = getCardSummarySections(card);
      expect(sections.length, `${card.definitionId} should have stat sections`).toBeGreaterThanOrEqual(2);
      expect(sections.flatMap(section => section.lines).length, `${card.definitionId} should have stat lines`).toBeGreaterThanOrEqual(4);
      expect(getCardPreviewLines(card).length, `${card.definitionId} should have preview lines`).toBeGreaterThan(0);
    }
  });

  it('never throws from checkPlayable for any Light/Dark/AinSophAur card', () => {
    const emptyBoard = { frontSlots: [null, null, null, null], backSlots: [null, null, null, null], activeBoardEffects: [] } as any;
    const fullBoard = {
      frontSlots: [null, null, null, null],
      backSlots: [{}, {}, {}, {}],
      activeBoardEffects: [],
    } as any;
    for (const card of [...lightCards, ...darkCards, ...ainSophAurCards]) {
      expect(() => CardEffectExecutor.checkPlayable(card, 0, {} as TurnState, emptyBoard)).not.toThrow();
      expect(() => CardEffectExecutor.checkPlayable(card, 0, {} as TurnState, fullBoard)).not.toThrow();
      expect(() => CardEffectExecutor.checkPlayable(card, 0, {} as TurnState)).not.toThrow();
    }
  });

  it('exposes every catalog card through the registry under a buildable type', () => {
    // Guards the Deck Builder, which buckets the card pool purely by def.type.
    const buildableTypes = new Set(['Light', 'Dark', 'AinSophAur']);
    for (const card of [...lightCards, ...darkCards, ...ainSophAurCards]) {
      const registered = CardRegistry.get(card.definitionId);
      expect(registered, `${card.definitionId} must be registered`).toBeDefined();
      expect(
        buildableTypes.has(registered!.type),
        `${card.definitionId} has non-buildable type ${registered!.type}`,
      ).toBe(true);
    }
  });

  it('registers exactly the 50 main-deck and 12 extra-deck cards as buildable', () => {
    const all = CardRegistry.getAll();
    expect(all.filter(d => d.definitionId.startsWith('light-neutrality-'))).toHaveLength(25);
    expect(all.filter(d => d.definitionId.startsWith('dark-neutrality-'))).toHaveLength(25);
    expect(all.filter(d => d.definitionId.startsWith('ain-soph-aur-neutrality-'))).toHaveLength(12);
  });

  it('registers every late-game reward card with its intended rarity', () => {
    const all = CardRegistry.getAll();
    const eternal = all.filter(card => card.definitionId.startsWith('btei-'));
    const transcendent = all.filter(card => card.definitionId.startsWith('tx-'));
    const enigmas = all.filter(card => card.definitionId.startsWith('enig-neutral-'));

    expect(eternal).toHaveLength(9);
    expect(eternal.every(card => card.rarity === 'Eternal')).toBe(true);
    expect(transcendent).toHaveLength(4);
    expect(transcendent.every(card => card.rarity === 'Transcendent')).toBe(true);
    expect(enigmas).toHaveLength(2);
    expect(enigmas.every(card => card.rarity === 'Enigmatic')).toBe(true);
  });

  it('keeps authored attack values intentionally distinct across the catalog', () => {
    const triples: string[] = [];

    for (const card of lightCards) {
      triples.push(JSON.stringify([
        card.ainAttack.baseOblivion,
        card.ainAttack.scaling.kind === 'triune' ? card.ainAttack.scaling.amount : 0,
        card.ainAttack.cooldownCards,
      ]));
      triples.push(JSON.stringify([
        card.sophAttack.baseOblivion,
        card.sophAttack.scaling.kind === 'triune' ? card.sophAttack.scaling.amount : 0,
        card.sophAttack.cooldownCards,
      ]));
    }

    for (const card of darkCards) {
      triples.push(JSON.stringify([
        card.cooldownCardsPlayed,
        card.activationCost.kind === 'fixed' ? card.activationCost.value : 0,
        card.sacrificeOblivionRate,
      ]));
    }

    for (const card of ainSophAurCards) {
      expect(card.bridgeAttack).toBeDefined();
      triples.push(JSON.stringify([
        card.bridgeAttack!.baseOblivion,
        card.bridgeAttack!.scaling.kind === 'triune' ? card.bridgeAttack!.scaling.amount : 0,
        card.bridgeAttack!.cooldownCards,
      ]));
    }

    expect(new Set(triples).size).toBe(triples.length);
  });
});