import { useState } from 'react';
import { useStore, selectBossFight, selectProgress } from '@/state/store';
import { BOSS_DEFINITIONS, BOSS_FIGHT_ROUND_SECONDS } from '@/data/bosses/bossDefinitions';
import { PACK_DEFINITIONS, STORE_PACK_ORDER } from '@/data/packs/packDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import { getCardBackgroundUrl } from '@/ui/cardBackgrounds';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import type { BossCategory } from '@/types/bossFight';

const RARITY_COLORS: Record<string, string> = {
  Common: '#999', Rare: '#5b9bd5', Epic: '#9b59b6', Legendary: '#f39c12', Eternal: '#ff6b6b', Infinite: '#e8e8f0',
};

const BOSS_ART_ROOT = '/assets/card-backgrounds';
const BOSS_ART_FILES: Record<string, { folder: string; file: string }> = {
  boss_hollow_queen: { folder: 'neutrality', file: 'Hollow Queen.png' },
  boss_immortal_warden: { folder: 'neutrality', file: 'Immortal Warden.png' },
  boss_cherubim_sovereign: { folder: 'neutrality', file: 'Cherubim Sovereign.png' },
  boss_eternal_seraph: { folder: 'neutrality', file: 'Eternal Seraph.png' },
  boss_time_eater: { folder: 'neutrality', file: 'The Time Eater.png' },
  boss_void_architect: { folder: 'neutrality', file: 'The Void Architect.png' },
  boss_null_sovereign: { folder: 'neutrality', file: 'Null Sovereign.png' },
  boss_shattered_oracle: { folder: 'neutrality', file: 'Shattered Oracle.png' },
  boss_abyssal_colossus: { folder: 'neutrality', file: 'Abyssal Colossus.png' },
  boss_eternal_null: { folder: 'neutrality', file: 'Eternal Null.png' },
  // Neutrality expansion
  boss_neutrality_paradox_throne: { folder: 'neutrality', file: 'Paradox Throne.png' },
  boss_neutrality_void_exchequer: { folder: 'neutrality', file: 'Void Exchequer.png' },
  boss_neutrality_equilibrium_rex: { folder: 'neutrality', file: 'Equilibrium Rex.png' },
  boss_neutrality_axiom_maw: { folder: 'neutrality', file: 'Axiom Maw.png' },
  boss_neutrality_prime_judge: { folder: 'neutrality', file: 'Prime Judge of Silence.png' },
  // Pyroabyss
  boss_pyroabyss_cinder_leviathan: { folder: 'pyroabyss', file: 'Cinder Leviathan.png' },
  boss_pyroabyss_ash_kings: { folder: 'pyroabyss', file: 'Ash Kings Unbound.png' },
  boss_pyroabyss_infernal_sun: { folder: 'pyroabyss', file: 'Infernal Suncore.png' },
  boss_pyroabyss_rift_bell: { folder: 'pyroabyss', file: 'Riftbell Catastrophe.png' },
  boss_pyroabyss_phoenix_judge: { folder: 'pyroabyss', file: 'Phoenix Judge of the Abyss.png' },
  // Heavenly Light
  boss_light_aurora_throne: { folder: 'heavenly-light', file: 'Aurora Throne.png' },
  boss_light_sanctum_breaker: { folder: 'heavenly-light', file: 'Sanctum Breaker.png' },
  boss_light_choral_tyrant: { folder: 'heavenly-light', file: 'Choral Tyrant.png' },
  boss_light_halo_legion: { folder: 'heavenly-light', file: 'Halo Legion Prime.png' },
  boss_light_morning_crown: { folder: 'heavenly-light', file: 'Morning Crown Absolute.png' },
  // Thornbound Plains
  boss_thornbound_bleeding_road: { folder: 'thornbound-plains', file: 'Bleeding Road Matriarch.png' },
  boss_thornbound_ragged_banner: { folder: 'thornbound-plains', file: 'Ragged Banner Host.png' },
  boss_thornbound_cathedral_lance: { folder: 'thornbound-plains', file: 'Cathedral Lance.png' },
  boss_thornbound_grave_hedge: { folder: 'thornbound-plains', file: 'Grave Hedge Reliquary.png' },
  boss_thornbound_gallowcrown: { folder: 'thornbound-plains', file: 'Gallowcrown Matron.png' },
  // Mechanical Dreams
  boss_mech_overclock_arch: { folder: 'mechanical-dreams', file: 'Overclock Arch-Engine.png' },
  boss_mech_furnace_mind: { folder: 'mechanical-dreams', file: 'Furnace Mind Helix.png' },
  boss_mech_brass_tribunal: { folder: 'mechanical-dreams', file: 'Brass Tribunal.png' },
  boss_mech_reactor_psalm: { folder: 'mechanical-dreams', file: 'Reactor Psalm Engine.png' },
  boss_mech_primevector: { folder: 'mechanical-dreams', file: 'Primevector Thaumiel.png' },
  // Prismatic Accord
  boss_prismatic_mirror_regent: { folder: 'prismatic-accord', file: 'Vorthum Mirror Regent.png' },
  boss_prismatic_fracture_hierophant: { folder: 'prismatic-accord', file: 'Fracture Road Hierophant.png' },
  boss_prismatic_drift_leviathan: { folder: 'prismatic-accord', file: 'Drift Canopy Leviathan.png' },
  boss_prismatic_blindwars_reliquary: { folder: 'prismatic-accord', file: 'Reliquary of Blind Wars.png' },
  boss_prismatic_whitebeam_concordat: { folder: 'prismatic-accord', file: 'Whitebeam Concordat.png' },
  // Black Glass Inferno
  boss_inferno_vaelthorax_grief: { folder: 'black-glass-inferno', file: 'Vaelthorax Grieffire.png' },
  boss_inferno_morvakael_answer: { folder: 'black-glass-inferno', file: 'Morvakael the Twice-Scarred.png' },
  boss_inferno_sorveth_flame: { folder: 'black-glass-inferno', file: 'Sorveth Bifurcated Flame.png' },
  boss_inferno_cinderborn_court: { folder: 'black-glass-inferno', file: 'Cinderborn Matriarch.png' },
  boss_inferno_ashen_sovereign: { folder: 'black-glass-inferno', file: 'Ashen Court Regent.png' },
};

function getBossArtUrl(keyArt: string): string | null {
  const artData = BOSS_ART_FILES[keyArt];
  return artData ? `${BOSS_ART_ROOT}/${artData.folder}/${encodeURIComponent(artData.file)}` : null;
}

function mapPackToBossCategory(packId: string, packElement: string): BossCategory {
  if (packId === 'pack-snowbound-voltage') return 'Snowbound Voltage';
  switch (packElement) {
    case 'Neutrality':
      return 'Neutrality';
    case 'Fire':
      return 'Pyroabyss';
    case 'Light':
      return 'Heavenly Light';
    case 'Thornbound':
      return 'Thornbound Plains';
    case 'Mechanical':
      return 'Mechanical Dreams';
    case 'Prismatic':
      return 'Prismatic Accord';
    case 'GlassAbsolute':
      return 'Glass Absolute';
    case 'BlazingGarden':
      return 'The Blazing Garden';
    case 'Dark':
      return 'Black Glass Inferno';
    default:
      return 'Neutrality';
  }
}

const PACK_BY_ID = new Map(PACK_DEFINITIONS.map(pack => [pack.id, pack] as const));
const STORE_BOSS_TAB_ORDER: BossCategory[] = STORE_PACK_ORDER.map(packId => {
  const pack = PACK_BY_ID.get(packId);
  return pack ? mapPackToBossCategory(pack.id, pack.element) : 'Neutrality';
});

interface Props { onClose: () => void; }

export default function EternitysWake({ onClose }: Props) {
  const bossFight = useStore(selectBossFight);
  const progress = useStore(selectProgress);
  const startBossFight = useStore(s => s.startBossFight);
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const [activeBossTab, setActiveBossTab] = useState<BossCategory>('Neutrality');

  const now = Date.now();

  function getCooldownRemaining(bossId: string): number {
    const cd = bossFight.cooldowns[bossId] ?? 0;
    return Math.max(0, Math.ceil((cd - now) / 1000));
  }

  function handleChallenge(bossId: string, deckId: string) {
    startBossFight(bossId, deckId);
    onClose();
  }

  const hasSavedDecks = progress.savedDecks.length > 0;
  const bossTabs: BossCategory[] = STORE_BOSS_TAB_ORDER;
  const visibleBosses = BOSS_DEFINITIONS.filter(boss => boss.category === activeBossTab);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(circle at 50% -8%, rgba(255, 108, 108, 0.22) 0%, rgba(255, 108, 108, 0) 35%), radial-gradient(circle at 18% 86%, rgba(149, 62, 95, 0.22) 0%, rgba(149, 62, 95, 0) 44%), repeating-linear-gradient(126deg, rgba(255, 130, 130, 0.08) 0px, rgba(255, 130, 130, 0.08) 1px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 24px), linear-gradient(180deg, rgba(8, 4, 12, 0.985) 0%, rgba(18, 9, 20, 0.985) 100%)',
      zIndex: 50,
      display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: '#FFF8DC',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(255,107,107,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: '#ff6b6b', letterSpacing: 3 }}>
            ETERNITY'S WAKE
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,107,107,0.6)', marginTop: 2, letterSpacing: 1 }}>
            BOSS CHALLENGES - EARN "ETERNAL" CARDS
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid rgba(255,107,107,0.4)',
          color: '#ff6b6b', padding: '6px 14px', cursor: 'pointer',
          fontFamily: 'Georgia, serif', fontSize: 13, borderRadius: 6,
        }}>
          Close
        </button>
      </div>

      <div style={{
        padding: '10px 24px 0',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {bossTabs.map(tab => {
          const active = tab === activeBossTab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveBossTab(tab);
                setSelectedBossId(null);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `1px solid ${active ? 'rgba(255,107,107,0.6)' : 'rgba(255,107,107,0.28)'}`,
                background: active ? 'rgba(255,107,107,0.16)' : 'rgba(255,107,107,0.06)',
                color: active ? '#ff9a9a' : 'rgba(255,180,180,0.65)',
                fontSize: 11,
                letterSpacing: 1,
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Boss grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexWrap: 'wrap', gap: 20, alignContent: 'flex-start', justifyContent: 'center',
      }}>
        {visibleBosses.length === 0 && (
          <div style={{
            width: '100%',
            textAlign: 'center',
            color: 'rgba(255,180,180,0.6)',
            fontSize: 13,
            fontStyle: 'italic',
            paddingTop: 36,
          }}>
            No bosses added for {activeBossTab} yet.
          </div>
        )}

        {visibleBosses.map(boss => {
          const cooldown = getCooldownRemaining(boss.id);
          const onCooldown = cooldown > 0;
          const rewardDef = CardRegistry.get(boss.rewardCardId);
          const bossArtUrl = getBossArtUrl(boss.keyArt);
          const rewardCardArtUrl = rewardDef ? getCardBackgroundUrl(rewardDef) : null;
          const displayBossArtUrl = bossArtUrl ?? rewardCardArtUrl;
          const isSelected = selectedBossId === boss.id;
          const rewardDisplayName = boss.category === 'Black Glass Inferno' ? boss.name : rewardDef?.name ?? '';

          return (
            <div key={boss.id} style={{
              width: 300, background: 'rgba(10,4,16,0.95)',
              border: `1px solid ${onCooldown ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.5)'}`,
              borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
              opacity: onCooldown ? 0.65 : 1,
            }}>
              {displayBossArtUrl && (
                <div style={{
                  height: 156,
                  borderRadius: 10,
                  border: '1px solid rgba(255,107,107,0.28)',
                  backgroundImage: `linear-gradient(180deg, rgba(10,4,16,0.08) 0%, rgba(10,4,16,0.42) 100%), url("${displayBossArtUrl}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                }} />
              )}

              {/* Boss info */}
              <div style={{ borderBottom: '1px solid rgba(255,107,107,0.2)', paddingBottom: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff6b6b' }}>{boss.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,200,200,0.6)', marginTop: 4 }}>{boss.description}</div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ color: 'rgba(255,150,150,0.8)' }}>HP: <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{boss.hp.toLocaleString()}</span></div>
                <div style={{ color: 'rgba(255,150,150,0.6)' }}>{Math.floor(BOSS_FIGHT_ROUND_SECONDS / 60)} minute round · 1 turn only</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,180,180,0.62)' }}>
                <div>Category: {boss.category}</div>
                <div>Shards: {boss.firstClearShards} first / {boss.repeatClearShards} repeat</div>
              </div>

              {/* Reward card */}
              {rewardDef && (
                <div style={{
                  background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
                title={getCardPreviewLines(rewardDef, 4).join('\n')}
                >
                  <div style={{
                    height: 156,
                    backgroundImage: rewardCardArtUrl
                      ? `linear-gradient(180deg, rgba(10,4,16,0.06) 0%, rgba(10,4,16,0.18) 100%), url("${rewardCardArtUrl}")`
                      : 'linear-gradient(180deg, rgba(255,107,107,0.12) 0%, rgba(255,107,107,0.04) 100%)',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    borderBottom: '1px solid rgba(255,107,107,0.18)',
                  }} />
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,150,150,0.5)', letterSpacing: 1 }}>REWARD</div>
                    <div style={{ fontSize: 13, color: '#ff6b6b', marginTop: 2, fontWeight: 'bold', lineHeight: 1.15 }}>{rewardDisplayName}</div>
                    <div style={{ fontSize: 10, color: RARITY_COLORS[rewardDef.rarity], marginTop: 2 }}>
                      {rewardDef.rarity} · {rewardDef.type}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <CardEngineCallout card={rewardDef} variant="compact" />
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <CardRulesDigest
                        card={rewardDef}
                        variant="preview"
                        maxSections={2}
                        maxLinesPerSection={1}
                        lineClamp={1}
                        labelColor="rgba(255,150,150,0.5)"
                        textColor="rgba(255,200,200,0.68)"
                        sectionBackground="transparent"
                        sectionBorder="transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Collection count */}
              {rewardDef && (
                <div style={{ fontSize: 11, color: 'rgba(255,150,150,0.5)' }}>
                  Owned: {progress.collection[boss.rewardCardId] ?? 0}
                </div>
              )}

              {/* Cooldown or deck selector */}
              {onCooldown ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,107,107,0.6)', fontSize: 12 }}>
                  Cooldown: {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, '0')}
                </div>
              ) : !isSelected ? (
                <button
                  onClick={() => setSelectedBossId(boss.id)}
                  style={{
                    background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.5)',
                    color: '#ff6b6b', padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                    fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 1,
                  }}
                >
                  Challenge
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,200,200,0.6)' }}>Select a deck:</div>
                  {!hasSavedDecks ? (
                    <div style={{ fontSize: 11, color: 'rgba(255,107,107,0.5)' }}>No saved decks found.</div>
                  ) : (
                    progress.savedDecks.map(deck => (
                      <button
                        key={deck.id}
                        onClick={() => handleChallenge(boss.id, deck.id)}
                        style={{
                          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.35)',
                          color: '#ff9999', padding: '6px 10px', borderRadius: 5, cursor: 'pointer',
                          fontFamily: 'Georgia, serif', fontSize: 12, textAlign: 'left',
                        }}
                      >
                        {deck.name}
                        {deck.deckList.length > 0 ? ` (${deck.deckList.reduce((a, e) => a + e.copies, 0)} cards)` : ''}
                      </button>
                    ))
                  )}
                  <button
                    onClick={() => setSelectedBossId(null)}
                    style={{
                      background: 'none', border: 'none', color: 'rgba(255,150,150,0.4)',
                      cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 11, textAlign: 'left',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid rgba(255,107,107,0.15)',
        fontSize: 11, color: 'rgba(255,150,150,0.4)', flexShrink: 0,
      }}>
        Boss fights last {Math.floor(BOSS_FIGHT_ROUND_SECONDS / 60)} minutes, and you only get one turn. All Oblivion earned deals damage instead. 60-second cooldown on success or failure.
      </div>
    </div>
  );
}
