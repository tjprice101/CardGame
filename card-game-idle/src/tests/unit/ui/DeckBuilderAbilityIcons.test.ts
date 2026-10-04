import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import DeckBuilderAbilitiesTab from '@/ui/deck/tabs/DeckBuilderAbilitiesTab';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';
import type { SavedDeck } from '@/types/game';

function render(loadout: SavedDeck['abilityLoadout'], hasDeck = true) {
  const activeDeck: SavedDeck = { id: 'test-deck', name: 'Test', deckList: [], extraDeck: [], abilityLoadout: loadout };
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(createElement(DeckBuilderAbilitiesTab, {
    activeDeck: hasDeck ? activeDeck : null, deckList: [], extraDeckList: [],
    ownedAbilities: Object.fromEntries(ABILITY_DEFINITIONS.map(ability => [ability.id, true])),
    setDeckAbilityLoadout: vi.fn(),
  }));
  return container;
}

describe('Deck Builder equipped ability icons', () => {
  it('renders each slot’s selected icon with the correct name and full-image containment', () => {
    const abilities = ABILITY_DEFINITIONS.slice(0, 3);
    const container = render({ 1: abilities[0].id, 2: abilities[1].id, 3: abilities[2].id });
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(3);
    abilities.forEach((ability, index) => {
      expect(images[index].getAttribute('src')).toBe(`${import.meta.env.BASE_URL}assets/ability-icons/${ability.iconAssetKey}.png`);
      expect(images[index].alt).toBe(`${ability.name} icon`);
      expect(images[index].style.objectFit).toBe('contain');
      expect(images[index].width).toBe(48);
    });
  });

  it('updates the rendered icon for a different equipped ability', () => {
    const [first, second] = ABILITY_DEFINITIONS;
    expect(render({ 1: first.id }).querySelector('img')?.alt).toBe(`${first.name} icon`);
    expect(render({ 1: second.id }).querySelector('img')?.alt).toBe(`${second.name} icon`);
  });

  it('does not show an icon for empty slots or when no saved deck is active', () => {
    expect(render({}).querySelectorAll('img')).toHaveLength(0);
    expect(render({ 1: ABILITY_DEFINITIONS[0].id }, false).querySelectorAll('img')).toHaveLength(0);
  });
});
