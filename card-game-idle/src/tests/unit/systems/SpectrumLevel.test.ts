import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState, useStore } from '@/state/store';
import { SPECTRUM_RARITY_MIN_LEVEL } from '@/data/cards/spectrumPower';
import { getCardSpectrumLevel, getSpectrumLevelUpCost } from '@/systems/cards/SpectrumLevel';
import { getUnmetCardRequirement } from '@/systems/cards/PlayRequirements';
import type { CardDefinition, CardRarity, LightCardDefinition } from '@/types/cards';
import type { DeckCard, GameState } from '@/types/game';

const RARITY_ORDER: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Enigmatic', 'Eternal', 'Infinite', 'Transcendent'];

function resetStore(): void {
  const baseState = JSON.parse(JSON.stringify(defaultGameState)) as GameState;
  useStore.setState(state => ({ ...state, ...baseState }));
}

const card = (instanceId: string, definitionId: string): DeckCard => ({ instanceId, definitionId, finish: 'normal' });

function findCard(predicate: (def: CardDefinition) => boolean): CardDefinition {
  const def = CardRegistry.getAll().find(predicate);
  if (!def) throw new Error('no matching card');
  return def;
}

describe('Spectrum Level catalog', () => {
  it('never assigns a card a level below its rarity floor', () => {
    for (const def of CardRegistry.getAll()) {
      expect(def.spectrumLevel, def.definitionId).toBeGreaterThanOrEqual(SPECTRUM_RARITY_MIN_LEVEL[def.rarity]);
      expect(def.spectrumLevel).toBeLessThanOrEqual(5);
    }
    for (const def of CardRegistry.getByRarity('Transcendent')) expect(def.spectrumLevel).toBe(5);
  });

  it('spreads the base Neutrality main deck with ~25% Level 0 and few Level 5 cards', () => {
    const base = CardRegistry.getAll().filter(def => /^(light|dark)-neutrality-/.test(def.definitionId));
    const counts = [0, 0, 0, 0, 0, 0];
    for (const def of base) counts[def.spectrumLevel] += 1;
    expect(counts[0] / base.length).toBeCloseTo(0.25, 1);
    expect(counts[5]).toBeLessThanOrEqual(2);
    expect(counts[0]).toBeGreaterThan(counts[3]);
    expect(counts[3]).toBeGreaterThan(counts[5]);
  });

  it('makes every higher rarity out-hit every lower rarity for each attack kind', () => {
    const kinds = {
      ain: (def: CardDefinition) => (def.type === 'Light' ? def.ainAttack.baseDivineLight : null),
      soph: (def: CardDefinition) => (def.type === 'Light' ? def.sophAttack.baseDivineLight : null),
      bridge: (def: CardDefinition) => (def.type === 'AinSophAur' ? def.bridgeAttack?.baseDivineLight ?? null : null),
    };
    for (const [kind, read] of Object.entries(kinds)) {
      const ranges = RARITY_ORDER.map(rarity => {
        const values = CardRegistry.getByRarity(rarity).map(read).filter((value): value is number => value !== null);
        return { rarity, min: Math.min(...values), max: Math.max(...values), count: values.length };
      }).filter(range => range.count > 0);
      for (let index = 1; index < ranges.length; index += 1) {
        expect(ranges[index].min, `${kind}: ${ranges[index].rarity} vs ${ranges[index - 1].rarity}`).toBeGreaterThan(ranges[index - 1].max);
      }
    }
  });

  it('gives every Light card a unique Soph placement effect', () => {
    const lights = CardRegistry.getAll().filter((def): def is LightCardDefinition => def.type === 'Light');
    const fingerprints = lights.map(def => JSON.stringify(def.sophPlacementEffects ?? []));
    const duplicates = fingerprints.filter((fingerprint, index) => fingerprints.indexOf(fingerprint) !== index);
    expect(duplicates).toEqual([]);
  });

  it('shows the Spectrum Level as the first preview line', async () => {
    const { getCardPreviewLines } = await import('@/ui/cardStatSummary');
    const def = findCard(candidate => candidate.spectrumLevel === 3);
    expect(getCardPreviewLines(def, 1)[0]).toContain('Requires Spectrum Level 3');
  });
});

describe('Spectrum Level runtime', () => {
  it('raises level by spending 5+level stacks and sacrificing a hand card to the Light-bound Abyss', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 40 },
      deck: { ...state.deck, hand: Array.from({ length: 6 }, (_, index) => card(`h${index}`, 'light-neutrality-1')) },
    }));

    for (let level = 0; level < 5; level += 1) {
      const stacksBefore = useStore.getState().turn.limitlessLightStacks;
      expect(useStore.getState().raiseSpectrumLevel(`h${level}`)).toBe(true);
      const after = useStore.getState();
      expect(after.turn.spectrumLevel).toBe(level + 1);
      expect(after.turn.limitlessLightStacks).toBe(stacksBefore - getSpectrumLevelUpCost(level));
      expect(after.deck.lightBoundAbyss?.map(entry => entry.instanceId)).toContain(`h${level}`);
      expect(after.deck.hand.some(entry => entry.instanceId === `h${level}`)).toBe(false);
    }
    expect(useStore.getState().turn.limitlessLightStacks).toBe(40 - (5 + 6 + 7 + 8 + 9));
    expect(useStore.getState().raiseSpectrumLevel('h5')).toBe(false);
  });

  it('refuses to level without enough stacks or a hand card', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 4 },
      deck: { ...state.deck, hand: [card('h0', 'light-neutrality-1')] },
    }));
    expect(useStore.getState().raiseSpectrumLevel('h0')).toBe(false);
    useStore.setState(state => ({ ...state, turn: { ...state.turn, limitlessLightStacks: 5 }, deck: { ...state.deck, hand: [] } }));
    expect(useStore.getState().raiseSpectrumLevel('h0')).toBe(false);
    expect(useStore.getState().turn.spectrumLevel ?? 0).toBe(0);
  });

  it('blocks playing a card above the current Spectrum Level until the player levels up', () => {
    resetStore();
    const levelTwo = findCard(def => def.type === 'Light' && def.spectrumLevel === 2 && def.definitionId.startsWith('light-neutrality-')
      && !(def.sophPlacementEffects ?? []).some(effect => effect.type === 'discard_choice'));
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 11 },
      deck: {
        ...state.deck,
        hand: [card('target', levelTwo.definitionId), card('fuel-1', 'dark-neutrality-1'), card('fuel-2', 'dark-neutrality-2'), card('keep', 'light-neutrality-1')],
        drawPile: [card('d1', 'light-neutrality-2'), card('d2', 'dark-neutrality-3')],
      },
    }));

    expect(getUnmetCardRequirement(levelTwo, useStore.getState().turn, useStore.getState().deck, 'target')).toBe('Requires Spectrum Lv 2');
    useStore.getState().playCard('target', 'ain');
    expect(useStore.getState().board.backSlots.some(slot => slot?.instanceId === 'target')).toBe(false);

    useStore.getState().raiseSpectrumLevel('fuel-1');
    useStore.getState().raiseSpectrumLevel('fuel-2');
    expect(useStore.getState().turn.spectrumLevel).toBe(2);
    useStore.getState().playCard('target', 'ain');
    expect(useStore.getState().board.backSlots.some(slot => slot?.instanceId === 'target')).toBe(true);
  });

  it('returns Abyss cards to the deck and resets Spectrum Level when the turn ends', () => {
    resetStore();
    useStore.setState(state => ({
      ...state,
      turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 5 },
      deck: { ...state.deck, hand: [card('fuel', 'light-neutrality-1')] },
    }));
    useStore.getState().raiseSpectrumLevel('fuel');
    expect(useStore.getState().deck.lightBoundAbyss).toHaveLength(1);

    useStore.getState().endTurn();
    const after = useStore.getState();
    expect(after.turn.spectrumLevel ?? 0).toBe(0);
    expect(after.deck.lightBoundAbyss ?? []).toHaveLength(0);
    expect(after.deck.drawPile.some(entry => entry.instanceId === 'fuel')).toBe(true);
  });

  it('gates Ain Soph Aur summons by level and lets Phantom Matrix free summons reach one level higher', () => {
    const levelOneAsa = findCard(def => def.type === 'AinSophAur' && getCardSpectrumLevel(def) === 1 && def.definitionId.startsWith('ain-soph-aur-neutrality-'));
    if (levelOneAsa.type !== 'AinSophAur') throw new Error('expected ASA');
    const material = (index: number, definitionId: string) => ({
      instanceId: `mat-${index}`, definitionId, type: CardRegistry.get(definitionId)!.type as 'Light' | 'Dark', rarity: 'Common' as const,
      finish: 'normal' as const, side: 'ain' as const, faceState: 'front' as const, limitlessCharge: 0, attackCooldowns: {}, backSlot: index as 0 | 1 | 2 | 3,
    });
    const setup = () => {
      resetStore();
      useStore.setState(state => ({
        ...state,
        turn: { ...state.turn, phase: 'playing', limitlessLightStacks: 20 },
        board: { ...state.board, backSlots: [material(0, 'light-neutrality-1'), material(1, 'dark-neutrality-1'), null, null] as GameState['board']['backSlots'] },
        deck: { ...state.deck, extraDeck: [{ definitionId: levelOneAsa.definitionId, finish: 'normal' as const }] },
      }));
    };

    setup();
    useStore.getState().summonAinSophAur(levelOneAsa.definitionId, ['mat-0', 'mat-1'], 0);
    expect(useStore.getState().board.frontSlots[0]).toBeNull();

    setup();
    useStore.setState(state => ({ ...state, turn: { ...state.turn, spectrumLevel: 1 } }));
    useStore.getState().summonAinSophAur(levelOneAsa.definitionId, ['mat-0', 'mat-1'], 0);
    expect(useStore.getState().board.frontSlots[0]?.definitionId).toBe(levelOneAsa.definitionId);

    setup();
    useStore.getState().summonAinSophAur(levelOneAsa.definitionId, [], 0, true);
    expect(useStore.getState().board.frontSlots[0]?.definitionId).toBe(levelOneAsa.definitionId);
  });
});
