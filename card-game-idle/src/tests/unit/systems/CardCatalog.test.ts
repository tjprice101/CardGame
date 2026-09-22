import { describe, expect, it } from 'vitest';
import { darkCards } from '@/data/cards/darkCards';
import { lightCards } from '@/data/cards/lightCards';
import { ainSophAurCards } from '@/data/cards/ainSophAurCards';
import { getEnigmaDefinition } from '@/data/enigmas/enigmaDefinitions';
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

  it('names and hints the five Causality Enigmas with their intended manuscript identity', () => {
    const entries = new Map([
      ['causality-first-horizon', { title: 'The First Horizon', hint: 'Place a Causality Light card on the Ain side of the back row to reveal the first horizon.' }],
      ['causality-black-ink', { title: 'Black Ink, White Star', hint: 'Place opposing Causality Light and Dark cards together on the Ain back row.' }],
      ['causality-heavenly-archive', { title: 'The Heavenly Archive', hint: 'Play Eventide Archivist, Gravitic Testament, and Asterion of the Last Gate.' }],
      ['causality-collapsed-equation', { title: 'The Collapsed Equation', hint: 'Fill three active Causality board positions at once to collapse the equation.' }],
      ['causality-unwritten-law', { title: 'The Unwritten Law', hint: 'Hold 5 Limitless Cosmos stacks at once to write the unwritten law.' }],
    ]);

    const definitions = [
      'causality-first-horizon',
      'causality-black-ink',
      'causality-heavenly-archive',
      'causality-collapsed-equation',
      'causality-unwritten-law',
    ].map(id => ({ id, definition: getEnigmaDefinition(id) }));

    expect(definitions.filter(item => item.definition)).toHaveLength(5);
    for (const [id, expected] of entries) {
      const def = definitions.find(item => item.id === id)!.definition;
      expect(def, `${id} should exist`).toBeDefined();
      expect(def!.id).toBe(id);
    }

    const enigmaDefinitions = definitions;

    expect(enigmaDefinitions.every(item => item.definition !== undefined)).toBe(true);
    for (const [id, expected] of entries) {
      const definition = enigmaDefinitions.find(item => item.id === id)!.definition!;
      expect(definition.title).toBe(expected.title);
      expect(definition.hintText).toBe(expected.hint);
      expect(definition.hintText).not.toMatch(/5 unique Causality cards/i);
      expect(definition.steps.length).toBeGreaterThanOrEqual(3);
      expect(definition.steps.every(step => !!step.title && !!step.description)).toBe(true);
    }

    const archive = getEnigmaDefinition('causality-heavenly-archive');
    expect(archive?.unlockCondition).toBe('specific-cards');
    expect(archive?.unlockCardIds).toEqual([
      'light-causality-1',
      'dark-causality-1',
      'ain-soph-aur-causality-2',
    ]);
  });

  it('contains four authored Extra Deck bridge definitions', () => {
    expect(ainSophAurCards).toHaveLength(4);
    expect(new Set(ainSophAurCards.map(card => card.definitionId)).size).toBe(4);
    for (const card of ainSophAurCards) {
      expect(card.bridgeAttack?.baseDivineLight).toBeGreaterThan(0);
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
    const enigmas = all.filter(card => card.definitionId.startsWith('enig-'));

    expect(eternal).toHaveLength(14);
    expect(eternal.every(card => card.rarity === 'Eternal')).toBe(true);
    expect(transcendent).toHaveLength(4);
    expect(transcendent.every(card => card.rarity === 'Transcendent')).toBe(true);
    expect(enigmas).toHaveLength(9);
    expect(enigmas.every(card => card.rarity === 'Enigmatic')).toBe(true);
  });

  it('gives persistent Dark utilities cooldowns and keeps one-shot cards immediate', () => {
    for (const card of CardRegistry.getAll()) {
      if (card.type !== 'Dark') continue;
      if (card.persistent) {
        expect(card.cooldownCardsPlayed, `${card.definitionId} persistent cooldown`).toBeGreaterThan(0);
      } else {
        if (card.rarity === 'Transcendent') {
          expect(card.cooldownCardsPlayed, `${card.definitionId} should have a zero-card cooldown`).toBe(0);
        } else {
          expect(card.cooldownCardsPlayed, `${card.definitionId} should be a one-shot Dark card`).toBeUndefined();
        }
      }
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
    // Transcendent Dark utilities are powerful but deliberately independent
    // of set-specific resource systems, so their activation costs are zero.
    expect(premiumCosts.get('tx-neutral-null-catalyst')).toBe(0);
    expect(premiumCosts.get('tx-neutral-void-reliquary')).toBe(0);
  });

  it('keeps authored attack values intentionally distinct across the catalog', () => {
    const triples: string[] = [];

    for (const card of lightCards) {
      triples.push(JSON.stringify([
        card.ainAttack.baseDivineLight,
        card.ainAttack.scaling.kind === 'linear' ? card.ainAttack.scaling.multiplier : 0,
        card.ainAttack.cooldownCards,
      ]));
      triples.push(JSON.stringify([
        card.sophAttack.baseDivineLight,
        card.sophAttack.scaling.kind === 'linear' ? card.sophAttack.scaling.multiplier : 0,
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
        card.bridgeAttack!.baseDivineLight,
        card.bridgeAttack!.scaling.kind === 'linear' ? card.bridgeAttack!.scaling.multiplier : 0,
        card.bridgeAttack!.cooldownCards,
      ]));
    }

    expect(new Set(triples).size).toBe(triples.length);
  });
});