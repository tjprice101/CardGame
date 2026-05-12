import type { ElementProfile } from '@/types/elements';

export const lightElement: ElementProfile = {
  type: 'Light',

  primaryColor: 0xFFD700,
  secondaryColor: 0xFFF8DC,
  glowColor: 0xFFE566,
  bloomTint: [1.0, 0.93, 0.72],

  bloomThreshold: 0.75,
  bloomIntensity: 1.2,
  bloomKernelSize: 13,

  glowStrength: 20,
  glowDistance: 25,
  glowQuality: 0.5,

  shaderUniforms: {
    uGlowColor: [1.0, 0.9, 0.4],
    uGlowIntensity: 1.5,
    uPulseSpeed: 1.2,
    uRimStrength: 0.8,
  },

  angelAuraConfig: {
    maxParticles: 150,
    frequency: 0.02,
    spawnRadius: 90,
    startAlpha: 0.9,
    endAlpha: 0.0,
    startScale: 0.4,
    endScale: 0.1,
    speed: 20,
    lifetime: 3.0,
    tint: 0xFFD700,
    blendMode: 'add',
  },

  seraphimMoteConfig: {
    maxParticles: 30,
    frequency: 0.05,
    spawnRadius: 45,
    startAlpha: 0.7,
    endAlpha: 0.0,
    startScale: 0.25,
    endScale: 0.05,
    speed: 15,
    lifetime: 2.5,
    tint: 0xFFF0A0,
    blendMode: 'add',
  },

  sfxPlay: 'light_card_play',
  sfxSynergy: 'light_synergy',
  sfxAngelPlace: 'light_angel_place',
};
