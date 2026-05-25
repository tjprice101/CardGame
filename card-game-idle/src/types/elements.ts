export const ELEMENTS = ['Neutrality', 'Light', 'Dark', 'Fire', 'Water', 'Earth', 'Wind', 'Thornbound', 'Mechanical', 'Prismatic', 'GlassAbsolute', 'BlazingGarden', 'Butterfly', 'EternalSeas', 'AbyssalForge', 'DeathFlamedHell', 'WishedUponAStar'] as const;
export type Element = typeof ELEMENTS[number];

export interface ParticleConfig {
  maxParticles: number;
  frequency: number;
  spawnRadius: number;
  startAlpha: number;
  endAlpha: number;
  startScale: number;
  endScale: number;
  speed: number;
  lifetime: number;
  tint: number;
  blendMode: 'normal' | 'add';
}

export interface ElementShaderUniforms {
  uGlowColor: [number, number, number];
  uGlowIntensity: number;
  uPulseSpeed: number;
  uRimStrength: number;
}

export interface ElementProfile {
  type: Element;

  primaryColor: number;
  secondaryColor: number;
  glowColor: number;
  bloomTint: [number, number, number];

  bloomThreshold: number;
  bloomIntensity: number;
  bloomKernelSize: 5 | 7 | 9 | 11 | 13 | 15;

  glowStrength: number;
  glowDistance: number;
  glowQuality: number;

  shaderUniforms: ElementShaderUniforms;

  angelAuraConfig: ParticleConfig;
  seraphimMoteConfig: ParticleConfig;

  sfxPlay: string;
  sfxSynergy: string;
  sfxAngelPlace: string;
}
