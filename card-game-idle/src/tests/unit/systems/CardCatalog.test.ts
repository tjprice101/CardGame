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
    expect(lightCards).toHaveLength(24);
    expect(darkCards).toHaveLength(24);
    expect(new Set([...lightCards, ...darkCards].map(card => card.definitionId)).size).toBe(48);
  });

  it('contains four authored Extra Deck bridge definitions', () => {
    expect(ainSophAurCards).toHaveLength(4);
    expect(new Set(ainSophAurCards.map(card => card.definitionId)).size).toBe(4);
    for (const card of ainSophAurCards) {
      expect(card.bridgeAttack?.baseOblivion).toBeGreaterThan(0);
      expect(card.bridgeAttack?.cooldownCards).toBeGreaterThan(0);
      expect(card.onSummonEffects.length).toBeGreaterThan(0);
    }
  });

  it('gives every Eternal ASA an exact named-card material recipe', () => {
    for (const card of CardRegistry.getAll().filter(definition => definition.type === 'AinSophAur' && definition.rarity === 'Eternal')) {
      expect(card.summonMaterials?.some(requirement => (requirement.definitionIds?.length ?? 0) > 0), card.definitionId).toBe(true);
    }
  });

  it('gives every Light and Dark card bespoke runtime values', () => {
    for (const card of lightCards) {
      expect(card.ainAttack.cooldownCards).toBeGreaterThan(0);
      expect(card.sophAttack.cooldownCards).toBeGreaterThan(0);
      expect(card.sacrificeStackRate).toBeGreaterThan(0);
    }
    for (const card of darkCards) {
      expect(card.persistent).not.toBe(true);
      expect(card.cooldownCardsPlayed).toBeUndefined();
      expect(card.sacrificeStackRate).toBeGreaterThan(0);
      expect(card.postActivationFate).toMatch(/^(hand|deck|discard)$/);
    }
  });

  it('gives every Light card a distinct Soph placement effect pattern', () => {
    const patterns = lightCards.map(card => JSON.stringify(card.sophPlacementEffects));
    expect(new Set(patterns).size).toBeGreaterThan(1);
    expect(lightCards.every(card => (card.sophPlacementEffects?.length ?? 0) > 0)).toBe(true);
    for (const card of lightCards) {
      expect(getCardSummarySections(card).some(section => section.title === 'Soph Placement'), card.definitionId).toBe(true);
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

  it('enables every Ain Soph Aur card only when its back-row materials and a front slot are available', () => {
    for (const card of ainSophAurCards) {
      const matchingMaterials = Array.from({ length: card.summonMaterialCount }, (_, index) => ({
        instanceId: `${card.definitionId}-material-${index}`,
        definitionId: index % 2 === 0 ? lightCards[0].definitionId : darkCards[0].definitionId,
        type: 'Light' as const,
        side: 'ain' as const,
      }));
      const availableBoard = {
        frontSlots: [null, null, null, null],
        backSlots: [...matchingMaterials, ...Array(4 - matchingMaterials.length).fill(null)],
        activeBoardEffects: [],
      } as any;
      const missingMaterialsBoard = {
        ...availableBoard,
        backSlots: [null, null, null, null],
      } as any;
      const fullFrontBoard = {
        ...availableBoard,
        frontSlots: [{}, {}, {}, {}],
      } as any;

      expect(CardEffectExecutor.checkPlayable(card, 0, {} as TurnState, availableBoard), card.definitionId).toBe(true);
      expect(CardEffectExecutor.checkPlayable(card, 0, {} as TurnState, missingMaterialsBoard), card.definitionId).toBe(false);
      expect(CardEffectExecutor.checkPlayable(card, 0, {} as TurnState, fullFrontBoard), card.definitionId).toBe(false);
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

  it('registers exactly the 48 base Main Deck and 4 base Extra Deck cards as buildable', () => {
    const all = CardRegistry.getAll();
    expect(all.filter(d => d.definitionId.startsWith('light-neutrality-'))).toHaveLength(24);
    expect(all.filter(d => d.definitionId.startsWith('dark-neutrality-'))).toHaveLength(24);
    expect(all.filter(d => d.definitionId.startsWith('ain-soph-aur-neutrality-'))).toHaveLength(4);
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

  it('reserves Dark cooldowns for the three persistent utility cards', () => {
    const persistentDarkIds = CardRegistry.getAll()
      .filter((card): card is Extract<typeof card, { type: 'Dark' }> => card.type === 'Dark' && card.persistent)
      .map(card => card.definitionId)
      .sort();
    expect(persistentDarkIds).toEqual([
      'enig-neutral-null-catechism',
      'tx-neutral-null-catalyst',
      'tx-neutral-void-reliquary',
    ]);

    for (const card of CardRegistry.getAll()) {
      if (card.type !== 'Dark' || card.persistent) continue;
      expect(card.cooldownCardsPlayed, `${card.definitionId} should be a one-shot Dark card`).toBeUndefined();
    }
  });

  it('reserves Dark activation costs for premium effects', () => {
    const paidBaseCards = darkCards
      .filter(card => (card.activationCost.value ?? 0) > 0)
      .map(card => [card.definitionId, card.activationCost.value]);
    expect(paidBaseCards).toEqual([
      ['dark-neutrality-22', 1],
      ['dark-neutrality-23', 1],
    ]);

    const premiumCosts = new Map(
      CardRegistry.getAll()
        .filter((card): card is DarkCardDefinition => card.type === 'Dark' && !card.definitionId.startsWith('dark-neutrality-'))
        .map(card => [card.definitionId, card.activationCost.value ?? 0]),
    );
    expect(premiumCosts.get('btei-temporal-ruin')).toBe(2);
    expect(premiumCosts.get('btei-null-edict')).toBe(2);
    expect(premiumCosts.get('enig-neutral-null-catechism')).toBe(1);
    expect(premiumCosts.get('tx-neutral-null-catalyst')).toBe(3);
    expect(premiumCosts.get('tx-neutral-void-reliquary')).toBe(4);
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
        card.sacrificeStackRate,
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