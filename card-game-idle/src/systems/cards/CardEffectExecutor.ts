import type { BoardState, DeckState, PendingEffect, TurnState } from '@/types/game';
import type { CardEffect } from '@/types/effects';
import type { AngelDefinition, CardDefinition, SeekerDefinition, SeraphimDefinition } from '@/types/cards';
import { CardRegistry } from '@/cards/CardRegistry';
import { TurnSystem } from './TurnSystem';

export interface ExecutionResult {
  deck: DeckState;
  turn: TurnState;
  board: BoardState;
  oblivionBonus: number;    // direct Oblivion bonus from card effects (beyond chain calc)
  pendingEffect: PendingEffect | null;
  canPlay: boolean;         // false if radiance_spend failed
}

interface ExecuteOptions {
  effects?: CardEffect[];
  countAsPlay?: boolean;
  removeFromHand?: boolean;
  useNextCardMultiplier?: boolean;
}

function cloneBoard(board: BoardState): BoardState {
  return {
    ...board,
    activeBoardEffects: [...board.activeBoardEffects],
    frontSlots: [...board.frontSlots] as BoardState['frontSlots'],
    backSlots: [...board.backSlots] as BoardState['backSlots'],
  };
}

export class CardEffectExecutor {
  static execute(
    deckCard: { instanceId: string; definitionId: string; finish?: import('@/types/cards').CardFinish },
    turn: TurnState,
    board: BoardState,
    deck: DeckState,
    isSeraphim = false,
    options: ExecuteOptions = {}
  ): ExecutionResult {
    const def = CardRegistry.get(deckCard.definitionId);
    if (!def) {
      return { deck, turn, board, oblivionBonus: 0, pendingEffect: null, canPlay: true };
    }

    const effects: CardEffect[] = options.effects ?? (
      def.type === 'Seraphim'  ? (def as SeraphimDefinition).onPlayEffects
      : def.type === 'Angel'   ? (def as AngelDefinition).onSummonEffects
      : def.type === 'Chaos'   ? []
      : (def as SeekerDefinition).effects
    );
    const countAsPlay = options.countAsPlay ?? true;
    const removeFromHand = options.removeFromHand ?? (deckCard.instanceId !== 'echo' && !isSeraphim);
    const useNextCardMultiplier = options.useNextCardMultiplier ?? countAsPlay;

    let mutableDeck = { ...deck, hand: [...deck.hand] };
    let mutableTurn = { ...turn };
    let mutableBoard = cloneBoard(board);
    let oblivionBonus = 0;
    let pendingEffect: PendingEffect | null = null;
    let embersDrained = 0;  // tracks embers before ember_spend:9999 for dynamic sentinels
    let radianceDrained = 0; // tracks radiance before radiance_spend:9999 for dynamic sentinels

    const multiplier = useNextCardMultiplier && mutableTurn.nextCardMultiplied ? 2 : 1;
    if (useNextCardMultiplier && mutableTurn.nextCardMultiplied) {
      mutableTurn.nextCardMultiplied = false;
    }

    const activeSynergies = board.frontSlots.filter(
      s => s?.type === 'Seraphim' && s.isActive
    ).length;

    const throneActive = board.frontSlots.some(
      s => s?.type === 'Seraphim' && s.isActive && s.definitionId === 'ser-light-throne'
    );

    function applyRadianceGain(base: number): void {
      const adjusted = throneActive ? Math.ceil(base * 1.5) : base;
      mutableTurn.radiance += adjusted;
    }

    function processEffect(effect: CardEffect): boolean {
      switch (effect.type) {
        // ── Oblivion effects ─────────────────────────────────────────────────────
        case 'oblivion_flat': {
          let val = effect.value * multiplier;
          // Dynamic sentinel: Chain Pulse — +10 per card played this turn (including this one)
          if (deckCard.definitionId === 'seek-neutral-chain-pulse') {
            val = (mutableTurn.cardsPlayedThisTurn + 1) * 10 * multiplier;
          }
          // Echo Pulse — +15 per card played this turn
          if (deckCard.definitionId === 'seek-neutral-echo-pulse') {
            val = (mutableTurn.cardsPlayedThisTurn + 1) * 15 * multiplier;
          }
          // Conflagration — +10 Oblivion per card played this turn (Pyroabyss)
          if (deckCard.definitionId === 'seek-fire-conflagration') {
            val = (mutableTurn.cardsPlayedThisTurn + 1) * 10 * multiplier;
          }
          // Void Combustion — +25 Oblivion per Ember drained
          if (deckCard.definitionId === 'seek-fire-void-combustion') {
            val = embersDrained * 25 * multiplier;
          }
          // Void Apocalypse — +30 Oblivion per Ember drained
          if (deckCard.definitionId === 'seek-fire-void-apocalypse') {
            val = embersDrained * 30 * multiplier;
          }
          // Radiant Surge — +8 Oblivion per Radiance (max 80)
          if (deckCard.definitionId === 'hr-light-radiant-surge') {
            val = Math.min(mutableTurn.radiance * 8, 80) * multiplier;
          }
          // Sunforged — +25 Oblivion per Radiance drained
          if (deckCard.definitionId === 'hr-light-sunforged') {
            val = radianceDrained * 25 * multiplier;
          }
          // Celestial Dividend — +18 Oblivion per Radiance drained
          if (deckCard.definitionId === 'hr-light-celestial-dividend') {
            val = radianceDrained * 18 * multiplier;
          }
          // Grand Illumination — +8 Oblivion per Radiance (after doubling)
          if (deckCard.definitionId === 'hr-light-grand-illumination') {
            val = mutableTurn.radiance * 8 * multiplier;
          }
          oblivionBonus += val;
          break;
        }

        case 'set_chain_floor':
          mutableTurn.chainFloor = Math.max(mutableTurn.chainFloor ?? 0, effect.value);
          break;

        case 'chain_multiplier_set':
          mutableTurn.chainMultiplier = Math.max(mutableTurn.chainMultiplier, effect.value);
          break;

        case 'dominant_stack_gain': {
          const gain = effect.value * multiplier;
          if (mutableTurn.embers >= mutableTurn.radiance) {
            mutableTurn.embers += gain;
          } else {
            mutableTurn.radiance += gain;
          }
          break;
        }

        // ── Thornbound / Mechanical Dreams resources ───────────────────────────
        case 'trail_gain':
          mutableTurn.trail += effect.value * multiplier;
          break;

        case 'trail_spend': {
          if (effect.value >= 9999) {
            mutableTurn.trail = 0;
          } else {
            if (mutableTurn.trail < effect.value) return false;
            mutableTurn.trail -= effect.value;
          }
          break;
        }

        case 'strain_gain':
          mutableTurn.strain += effect.value * multiplier;
          break;

        case 'strain_vent': {
          if (effect.value >= 9999) {
            mutableTurn.strain = 0;
          } else {
            mutableTurn.strain = Math.max(0, mutableTurn.strain - effect.value);
          }
          break;
        }

        case 'overclock': {
          mutableTurn.strain += effect.strain * multiplier;
          for (const subEffect of effect.then) {
            const ok = processEffect(subEffect);
            if (!ok) return false;
          }
          break;
        }

        // ── Legacy score/power effects (Light compat — map to Oblivion) ──────────
        case 'score_flat':
          oblivionBonus += effect.value * multiplier;
          break;

        case 'power_flat':
          mutableBoard.activeBoardEffects.push({ type: 'power_flat', value: effect.value * multiplier });
          break;
        case 'power_percent':
          mutableBoard.activeBoardEffects.push({ type: 'power_percent', value: effect.value * multiplier });
          break;
        case 'score_multiplier':
          mutableBoard.activeBoardEffects.push({ type: 'score_multiplier', value: effect.value * multiplier });
          break;
        case 'seraphim_bonus_amplifier':
          mutableBoard.activeBoardEffects.push({ type: 'seraphim_bonus_amplifier', value: effect.value * multiplier });
          break;

        // ── Radiance effects (Light) ──────────────────────────────────────────────
        case 'radiance_gain': {
          let gain = effect.value;
          if (deckCard.definitionId === 'hr-light-seraphic-bond') gain = activeSynergies;
          else if (deckCard.definitionId === 'hr-light-aureate-chain') {
            gain = deck.hand.filter(c => {
              const d = CardRegistry.get(c.definitionId);
              return d?.type === 'Seeker';
            }).length;
          }
          else if (deckCard.definitionId === 'hr-light-transcendent-surge') {
            gain = mutableTurn.cardsPlayedThisTurn;
          }
          else if (deckCard.definitionId === 'ser-light-warden') {
            gain = Math.ceil(deck.hand.length / 2);
          }
          applyRadianceGain(gain * multiplier);
          break;
        }

        case 'radiance_spend': {
          if (effect.value >= 9999) {
            radianceDrained = mutableTurn.radiance;
            mutableTurn.radiance = 0;
          } else {
            if (mutableTurn.radiance < effect.value) return false;
            mutableTurn.radiance -= effect.value;
          }
          break;
        }

        case 'radiance_double':
          mutableTurn.radiance = mutableTurn.radiance * 2;
          break;

        // ── Ember effects (Pyroabyss) ─────────────────────────────────────────────
        case 'ember_gain': {
          let gain = effect.value;
          // Ember Chain — gain Embers equal to Seeker count in hand
          if (deckCard.definitionId === 'seek-fire-ember-chain') {
            gain = deck.hand.filter(c => {
              const d = CardRegistry.get(c.definitionId);
              return d?.type === 'Seeker';
            }).length;
          }
          mutableTurn.embers += gain * multiplier;
          break;
        }

        case 'ember_spend': {
          if (effect.value >= 9999) {
            embersDrained = mutableTurn.embers;
            mutableTurn.embers = 0;
          } else {
            if (mutableTurn.embers < effect.value) return false;
            mutableTurn.embers -= effect.value;
          }
          break;
        }

        // ── Draw / deck manipulation ──────────────────────────────────────────────
        case 'draw': {
          let count = effect.value;
          if (deckCard.definitionId === 'hr-light-divine-clarity') count = 4;
          mutableDeck = TurnSystem.drawCards(mutableDeck, count);
          if (deckCard.definitionId === 'hr-light-divine-clarity') {
            applyRadianceGain(count * multiplier);
          }
          break;
        }

        case 'discard_choice':
          if (pendingEffect === null) {
            const src = deckCard.definitionId === 'hr-light-luminous-cycle'
              ? `${deckCard.instanceId}:draw_plus:1`
              : deckCard.instanceId;
            pendingEffect = { type: 'discard_choice', count: effect.value, sourceCard: src };
          }
          break;

        case 'discard_draw':
          if (pendingEffect === null) {
            pendingEffect = {
              type: 'discard_choice',
              count: effect.discard,
              sourceCard: `${deckCard.instanceId}:draw:${effect.draw}`,
            };
          }
          break;

        case 'shuffle_discard':
          mutableDeck = TurnSystem.shuffleDiscard(mutableDeck);
          break;

        case 'copy_last_hr': {
          const lastId = mutableTurn.lastPlayedDefinitionId;
          if (lastId) {
            const lastDef = CardRegistry.get(lastId);
            if (lastDef?.type === 'Seeker') {
              const echoResult = CardEffectExecutor.execute(
                { instanceId: 'echo', definitionId: lastId, finish: 'normal' },
                mutableTurn, mutableBoard, mutableDeck
              );
              if (echoResult.canPlay) {
                mutableDeck = echoResult.deck;
                mutableTurn = echoResult.turn;
                mutableBoard = echoResult.board;
                oblivionBonus += echoResult.oblivionBonus;
                if (echoResult.pendingEffect !== null && pendingEffect === null) {
                  pendingEffect = echoResult.pendingEffect;
                }
              }
            }
          }
          break;
        }

        case 'multiply_next':
          mutableTurn.nextCardMultiplied = true;
          break;

        case 'look_top_take':
          if (pendingEffect === null) {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffect = { type: 'look_top_take', cards: peeked, take: effect.take };
            }
          }
          break;

        case 'look_top_take_drop':
          if (pendingEffect === null) {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffect = { type: 'look_top_take_drop', cards: peeked, drop: effect.drop };
            }
          }
          break;

        case 'look_top_take_type':
          if (pendingEffect === null) {
            const peeked = TurnSystem.peekTop(mutableDeck, effect.look);
            if (peeked.length > 0) {
              pendingEffect = { type: 'look_top_take_type', cards: peeked, filter: effect.filter };
            }
          }
          break;

        case 'search_deck_by_type': {
          if (pendingEffect === null) {
            const matching = mutableDeck.drawPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              return effect.filter.some(f =>
                f === 'Seraphim' ? d.type === 'Seraphim'
                : f === 'Chaos'  ? d.type === 'Chaos'
                : f === 'Seeker' ? d.type === 'Seeker'
                : false
              );
            });
            if (matching.length > 0) {
              pendingEffect = { type: 'search_deck', cards: matching, filter: effect.filter };
            }
          }
          break;
        }

        case 'salvage_by_type': {
          if (pendingEffect === null) {
            const matching = mutableDeck.discardPile.filter(card => {
              const d = CardRegistry.get(card.definitionId);
              if (!d) return false;
              return effect.filter.some(f =>
                f === 'Seraphim' ? d.type === 'Seraphim'
                : f === 'Chaos'  ? d.type === 'Chaos'
                : f === 'Seeker' ? d.type === 'Seeker'
                : false
              );
            });
            pendingEffect = { type: 'salvage', cards: matching, filter: effect.filter };
          }
          break;
        }

        case 'salvage_any':
          if (pendingEffect === null) {
            pendingEffect = { type: 'salvage', cards: [...mutableDeck.discardPile], filter: null };
          }
          break;

        case 'sacred_covenant':
          // Light set mechanic — kept for compat
          break;

        case 'conditional': {
          const met = CardEffectExecutor.evaluateCondition(effect.condition, mutableTurn, mutableBoard);
          if (met) {
            for (const subEffect of effect.then) {
              const ok = processEffect(subEffect);
              if (!ok) return false;
            }
          }
          break;
        }
      }
      return true;
    }

    for (const effect of effects) {
      const ok = processEffect(effect);
      if (!ok) {
        return { deck, turn, board, oblivionBonus: 0, pendingEffect: null, canPlay: false };
      }
    }

    // Vigil Seraphim: +1 Radiance per Seeker card played when in synergy
    const vigilActive = board.frontSlots.some(
      s => s?.type === 'Seraphim' && s.isActive && s.definitionId === 'ser-light-vigil'
    );
    if (vigilActive && def.type === 'Seeker') {
      applyRadianceGain(1);
    }

    // Remove played card from hand (for non-Seraphim, non-virtual cards)
    if (removeFromHand) {
      mutableDeck = {
        ...mutableDeck,
        hand: mutableDeck.hand.filter(c => c.instanceId !== deckCard.instanceId),
        discardPile: [
          ...mutableDeck.discardPile,
          {
            instanceId: deckCard.instanceId,
            definitionId: deckCard.definitionId,
            finish: deckCard.finish ?? 'normal',
          },
        ],
      };
    }

    if (countAsPlay) {
      mutableTurn.cardsPlayedThisTurn += 1;
      mutableTurn.chainMultiplier = Math.max(
        1.0 + mutableTurn.cardsPlayedThisTurn * 0.1,
        mutableTurn.chainFloor
      );
    }

    if (countAsPlay && def.type === 'Seeker') {
      mutableTurn.lastPlayedDefinitionId = deckCard.definitionId;
    }

    return { deck: mutableDeck, turn: mutableTurn, board: mutableBoard, oblivionBonus, pendingEffect, canPlay: true };
  }

  static evaluateCondition(
    condition: import('@/types/effects').EffectCondition,
    turn: TurnState,
    board: BoardState
  ): boolean {
    switch (condition.type) {
      case 'radiance_gte':      return turn.radiance >= condition.value;
      case 'ember_gte':         return turn.embers >= condition.value;
      case 'trail_gte':         return turn.trail >= condition.value;
      case 'strain_gte':        return turn.strain >= condition.value;
      case 'strain_lte':        return turn.strain <= condition.value;
      case 'cards_played_gte':  return turn.cardsPlayedThisTurn >= condition.value;
      case 'first_card_this_turn': return turn.cardsPlayedThisTurn === 0;
      case 'seraphim_active_gte':
        return board.frontSlots.filter(s => s?.type === 'Seraphim' && s.isActive).length >= condition.value;
      case 'chaos_active_gte':
        return board.backSlots.filter(s => s !== null).length >= condition.value;
    }
  }

  static checkPlayable(
    def: CardDefinition,
    handSize: number,
    turn: TurnState,
    board?: BoardState,
  ): boolean {
    if (def.type === 'Angel') {
      if (!board) return true;
      const angelDef = def as AngelDefinition;
      const costCount: Record<string, number> = {};
      for (const id of angelDef.summonCost) costCount[id] = (costCount[id] ?? 0) + 1;
      const boardCount: Record<string, number> = {};
      for (const slot of board.frontSlots) {
        if (slot) boardCount[slot.definitionId] = (boardCount[slot.definitionId] ?? 0) + 1;
      }
      for (const [id, needed] of Object.entries(costCount)) {
        if ((boardCount[id] ?? 0) < needed) return false;
      }
      // Check extraSummonConditions
      if (angelDef.extraSummonConditions) {
        for (const cond of angelDef.extraSummonConditions) {
          if (cond.type === 'chaos_active_gte') {
            const activeChaos = board.backSlots.filter(s => s !== null).length;
            if (activeChaos < cond.value) return false;
          }
          if (cond.type === 'seraphim_on_board_gte') {
            const activeSeraphim = board.frontSlots.filter(s => s?.type === 'Seraphim').length;
            if (activeSeraphim < cond.value) return false;
          }
        }
      }
      return true;
    }

    if (def.type === 'Seraphim') {
      if (!board) return true;
      return board.frontSlots.findIndex(sl => sl === null) !== -1;
    }

    if (def.type === 'Chaos') {
      if (!board) return true;
      return board.backSlots.findIndex(sl => sl === null) !== -1;
    }

    const effects = (def as SeekerDefinition).effects;
    for (const effect of effects) {
      if (effect.type === 'discard_choice' && handSize - 1 < effect.value) return false;
      if (effect.type === 'discard_draw' && handSize - 1 < effect.discard) return false;
      if (effect.type === 'radiance_spend' && effect.value < 9999 && turn.radiance < effect.value) return false;
      if (effect.type === 'ember_spend' && effect.value < 9999 && turn.embers < effect.value) return false;
      if (effect.type === 'trail_spend' && effect.value < 9999 && turn.trail < effect.value) return false;
    }
    return true;
  }
}
