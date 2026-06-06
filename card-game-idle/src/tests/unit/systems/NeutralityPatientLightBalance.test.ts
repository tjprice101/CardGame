import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import type { SeraphimDefinition, AngelDefinition, CherubimDefinition } from '@/types/cards';
import {
  getEffectivePatientLightPatienceBonus,
  getEffectivePatientLightPerCardPatienceGain,
} from '@/systems/cards/neutralityPatientLight';

describe('Neutrality Patient Light soft cap', () => {
  it('applies diminishing returns after early stacks', () => {
    expect(getEffectivePatientLightPatienceBonus(0)).toBe(0);
    expect(getEffectivePatientLightPatienceBonus(4)).toBe(4);
    expect(getEffectivePatientLightPatienceBonus(8)).toBe(6);
    expect(getEffectivePatientLightPatienceBonus(12)).toBe(7);

    expect(getEffectivePatientLightPerCardPatienceGain(0)).toBe(1);
    expect(getEffectivePatientLightPerCardPatienceGain(4)).toBe(5);
    expect(getEffectivePatientLightPerCardPatienceGain(8)).toBe(7);
    expect(getEffectivePatientLightPerCardPatienceGain(12)).toBe(8);
  });
});

describe('Neutrality tuned card profile', () => {
  it('keeps Eternal Vigil at tuned medium-severity values', () => {
    const card = CardRegistry.get('btei-eternal-vigil');
    expect(card?.type).toBe('Seraphim');
    const seraphim = card as SeraphimDefinition;

    expect(seraphim.baseStats.bonusValue).toBe(0);
    expect(seraphim.attacks?.unsynergized.baseOblivion).toBe(2550);
    expect(seraphim.attacks?.synergized.baseOblivion).toBe(3400);

    const onPlay = seraphim.onPlayEffects;
    const patience = onPlay.find(effect => effect.type === 'patience_gain_all');
    const light = onPlay.find(effect => effect.type === 'neutrality_patient_light_gain');
    expect(patience && 'value' in patience ? patience.value : null).toBe(3);
    expect(light && 'value' in light ? light.value : null).toBe(1);
  });

  it('reduces top-end Neutrality infinite Patient Light injection', () => {
    const sovereignty = CardRegistry.get('inf-sovereign-void');
    const rupture = CardRegistry.get('inf-eternity-rupture');
    const genesis = CardRegistry.get('inf-genesis-throne');
    const annihilation = CardRegistry.get('inf-annihilation-field');

    expect(sovereignty?.type).toBe('Angel');
    expect(rupture?.type).toBe('Angel');
    expect(genesis?.type).toBe('Seraphim');
    expect(annihilation?.type).toBe('Cherubim');

    const sovereigntyAngel = sovereignty as AngelDefinition;
    const ruptureAngel = rupture as AngelDefinition;
    const genesisSeraphim = genesis as SeraphimDefinition;
    const annihilationCherubim = annihilation as CherubimDefinition;

    const sovereigntyGain = sovereigntyAngel.activatedAbility?.effects.find(effect => effect.type === 'neutrality_patient_light_gain');
    const ruptureGain = ruptureAngel.activatedAbility?.effects.find(effect => effect.type === 'neutrality_patient_light_gain');
    const genesisGain = genesisSeraphim.onPlayEffects.find(effect => effect.type === 'neutrality_patient_light_gain');
    const annihilationGain = annihilationCherubim.onPlayEffects.find(effect => effect.type === 'neutrality_patient_light_gain');

    expect(sovereigntyGain && 'value' in sovereigntyGain ? sovereigntyGain.value : null).toBe(3);
    expect(ruptureGain && 'value' in ruptureGain ? ruptureGain.value : null).toBe(1);
    expect(genesisGain && 'value' in genesisGain ? genesisGain.value : null).toBeNull();
    expect(annihilationGain && 'value' in annihilationGain ? annihilationGain.value : null).toBeNull();
  });
});
