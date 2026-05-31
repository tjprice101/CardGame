import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import CollectionCardDetail from '@/ui/store/CollectionCardDetail';
import { getDenseCardFaceBackgroundStyle, getCardArtTopBottomBorderOverlayStyleForCard } from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { NULL_RAID_DEFINITIONS, NULL_RAID_BOSS_MAP, type NullRaidDefinition } from '@/data/ascension/nullRaidDefinitions';
import { getNullRaidBossArtUrl } from '@/ui/ascension/nullRaidArt';
import { TRANSCENDENT_SHOP_COSTS, TRANSCENDENT_SHOP_IDS } from '@/data/ascension/transcendentCards';

// ── Void Violet palette ───────────────────────────────────────────────
const G = {
  bg: 'linear-gradient(160deg, #060310 0%, #040210 55%, #020108 100%)',
  accent: '#b890ff',
  accentSoft: '#d4bcff',
  accentDeep: '#7050d0',
  border: 'rgba(150,100,255,0.28)',
  borderStrong: 'rgba(185,135,255,0.55)',
  goldBorder: 'rgba(255,212,112,0.30)',
  text: '#ece6ff',
  textMuted: 'rgba(220,210,255,0.72)',
  textFaint: 'rgba(190,175,240,0.46)',
  cinzel: uiTypography.display,
  entropyColor: '#c0a8ff',
  raidColor: '#8ac8ff',
  transcendentColor: '#ffe4a0',
};

interface Props {
  onClose: () => void;
}

export default function AscensionHub({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const computedStats = useStore(s => s.computedStats);
  const startNullRaid = useStore(s => s.startNullRaid);
  const purchaseTranscendentCard = useStore(s => s.purchaseTranscendentCard);
  const enqueueToast = useStore(s => s.enqueueToast);

  const entropy = progress.entropicEnergyBalance ?? progress.entropyBalance ?? 0;
  const nullRaidClears = progress.nullRaidClears ?? {};
  const totalClears = Object.values(nullRaidClears).reduce((sum, n) => sum + n, 0);
  const transcendentCollection = progress.transcendentCollection ?? {};
  const transcendentCount = Object.values(transcendentCollection).reduce((sum, n) => sum + n, 0);
  const resonanceScore = computedStats.resonanceScore ?? 0;
  const savedDecks = progress.savedDecks ?? [];

  const [selectedRaid, setSelectedRaid] = useState<NullRaidDefinition | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(savedDecks[0]?.id ?? '');
  const [showShop, setShowShop] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [selectedDropCardId, setSelectedDropCardId] = useState<string | null>(null);

  // Refresh cooldown timers every second.
  const refreshNow = useCallback(() => setNow(Date.now()), []);
  useEffect(() => {
    const id = setInterval(refreshNow, 1000);
    return () => clearInterval(id);
  }, [refreshNow]);

  function getCooldownRemaining(raidId: string): number {
    const cd = progress.nullRaidCooldowns?.[raidId];
    if (!cd) return 0;
    return Math.max(0, cd - now);
  }

  function formatCooldown(ms: number): string {
    if (ms <= 0) return '';
    const secs = Math.ceil(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function isRaidLocked(raid: NullRaidDefinition): boolean {
    return resonanceScore < raid.resonanceRequired;
  }

  function handleEnterRaid() {
    if (!selectedRaid || !selectedDeckId) return;
    const started = startNullRaid(selectedRaid.id, selectedDeckId);
    if (started) onClose();
  }

  function handleOpenCardBoundCoop() {
    if (!selectedRaid || !selectedDeckId) return;
    window.dispatchEvent(new CustomEvent('open-card-bound-coop', {
      detail: {
        draft: { type: 'null_raid', label: `Null Raid · ${selectedRaid.name}`, raidId: selectedRaid.id, deckId: selectedDeckId },
      },
    }));
  }

  const raidsByStars: Record<1 | 2 | 3, NullRaidDefinition[]> = { 1: [], 2: [], 3: [] };
  for (const r of NULL_RAID_DEFINITIONS) raidsByStars[r.stars].push(r);

  const raidShopSections = useMemo(() => {
    const elementToSet: Record<string, string> = {
      neutrality: 'Neutrality',
      fire: 'Pyroabyss',
    };
    const mechanicOverviewBySet: Record<string, { title: string; body: string }> = {
      Neutrality: {
        title: 'Equilibrium Sigils',
        body:
          'These cards create and spend Equilibrium Sigils. Sigils amplify Patience growth passively, then convert into tactical spikes: burst Oblivion, Patience restoration, and cooldown pressure relief when spent at the right moment.',
      },
      Pyroabyss: {
        title: 'Inferno Confluence',
        body:
          'These cards build matched Heat and Chroma Ember pairs, then cash those pairs in through Confluence. The suite rewards balancing both pools, correcting lopsided states, and timing the angel ritual after the Seraph and Cherub are online.',
      },
    };

    const entries = Array.from(TRANSCENDENT_SHOP_IDS)
      .map(definitionId => {
        const card = CardRegistry.get(definitionId);
        if (!card) return null;
        const cost = TRANSCENDENT_SHOP_COSTS[definitionId] ?? 0;
        if (cost <= 0) return null;
        const normalizedElement = card.element.toLowerCase();
        const associatedSet = elementToSet[normalizedElement] ?? card.element;
        const matchingRaid = NULL_RAID_DEFINITIONS.find(r => r.associatedSet.toLowerCase() === associatedSet.toLowerCase()) ?? null;
        return { card, cost, associatedSet, raid: matchingRaid };
      })
      .filter((entry): entry is {
        card: NonNullable<ReturnType<typeof CardRegistry.get>>;
        cost: number;
        associatedSet: string;
        raid: NullRaidDefinition | null;
      } => entry !== null)
      .sort((a, b) => a.cost - b.cost || a.card.name.localeCompare(b.card.name));

    const grouped = new Map<string, {
      raid: NullRaidDefinition | null;
      associatedSet: string;
      mechanic: { title: string; body: string };
      entries: typeof entries;
    }>();

    for (const entry of entries) {
      const groupKey = entry.raid?.id ?? `set:${entry.associatedSet.toLowerCase()}`;
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.entries.push(entry);
        continue;
      }
      grouped.set(groupKey, {
        raid: entry.raid,
        associatedSet: entry.associatedSet,
        mechanic: mechanicOverviewBySet[entry.associatedSet] ?? {
          title: 'Set Core Overlay',
          body: 'These cards extend their set\'s core loop with a raid-focused endgame conversion pattern.',
        },
        entries: [entry],
      });
    }

    const raidOrder = new Map<string, number>(NULL_RAID_DEFINITIONS.map((raid, idx) => [raid.id, idx]));
    return Array.from(grouped.values()).sort((a, b) => {
      const aOrder = a.raid ? (raidOrder.get(a.raid.id) ?? 999) : 999;
      const bOrder = b.raid ? (raidOrder.get(b.raid.id) ?? 999) : 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.associatedSet.localeCompare(b.associatedSet);
    });
  }, []);

  function handleBuyRaidShopCard(definitionId: string, cost: number) {
    const card = CardRegistry.get(definitionId);
    if (!card) return;
    const purchased = purchaseTranscendentCard(definitionId, cost);
    if (!purchased) {
      enqueueToast(`Not enough Entropic Energy for ${card.name}.`, 'warning');
      return;
    }
    enqueueToast(`Purchased ${card.name} for ${cost.toLocaleString()} Entropic Energy.`, 'success');
  }

  const selectedDropCard = selectedDropCardId ? CardRegistry.get(selectedDropCardId) : null;

  const STAR_LABEL: Record<number, string> = { 1: '✦ 1-STAR RAIDS', 2: '✦✦ 2-STAR RAIDS', 3: '✦✦✦ 3-STAR RAIDS' };
  const STAR_COLOR: Record<number, string> = { 1: '#8ac8ff', 2: '#c89aff', 3: '#ffd070' };

  return (
    <div
      className="ui-panel-intro"
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        display: 'flex', flexDirection: 'column',
        background: G.bg,
        color: G.text,
        fontFamily: uiTypography.body,
        overflow: 'hidden',
      }}
    >
      {/* Atmospheric washes */}
      {/* Atmospheric washes — Void Violet nebula */}
      <div style={{ position: 'absolute', top: '-22%', left: '-10%', width: '75%', height: '85%', background: 'radial-gradient(ellipse, rgba(140,80,255,0.26) 0%, rgba(80,30,200,0.10) 42%, transparent 68%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-22%', right: '-10%', width: '70%', height: '80%', background: 'radial-gradient(ellipse, rgba(60,200,255,0.12) 0%, rgba(180,40,220,0.08) 40%, transparent 65%)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 44%, transparent 26%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div className="ui-shimmer-band" style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: 'clamp(18px,2vw,28px) clamp(32px,3.5vw,60px) clamp(12px,1.4vw,18px)',
          borderBottom: `1px solid ${G.border}`,
          flexShrink: 0, gap: 24,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="ui-title-glow" style={{
              fontSize: 'clamp(22px,2.4vw,34px)', fontWeight: 300, letterSpacing: 7,
              color: G.accentSoft, fontFamily: G.cinzel,
              textShadow: `0 2px 28px rgba(160,128,255,0.45), 0 0 60px rgba(100,60,220,0.18)`,
              lineHeight: 1.1,
            }}>
              ASCENSION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 1, width: 80, background: `linear-gradient(90deg, ${G.accentDeep}80, transparent)` }} />
              <span style={{ fontSize: 11, color: `${G.accentDeep}cc` }}>✦</span>
              <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, ${G.accentDeep}40, transparent)` }} />
            </div>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: G.textMuted, fontWeight: 400 }}>
              Endgame Mode · Null Raids · Transcendent Cards
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => { setShowShop(v => !v); setSelectedRaid(null); }}
              style={{
                padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                background: showShop ? `rgba(130,80,255,0.22)` : 'rgba(80,40,180,0.12)',
                border: `1px solid ${showShop ? G.borderStrong : G.border}`,
                color: showShop ? G.accentSoft : G.textMuted,
                fontSize: 11, letterSpacing: 2, fontFamily: G.cinzel,
                textTransform: 'uppercase', transition: 'all 0.18s ease',
              }}
            >
              Spoils
            </button>
            <button
              onClick={onClose}
              style={{
                width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(100,60,220,0.10)', border: `1px solid ${G.border}`,
                color: G.textMuted, fontSize: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s ease', padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Stat bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: 'clamp(10px,1.2vw,16px) clamp(32px,3.5vw,60px)',
          borderBottom: `1px solid ${G.border}`,
          background: 'rgba(8,4,20,0.55)',
          flexShrink: 0, gap: 0,
        }}>
          {[
            { label: 'Entropic Energy', value: entropy.toLocaleString(), color: G.entropyColor },
            { label: 'Resonance', value: Math.floor(resonanceScore).toLocaleString(), color: '#a0e8c0' },
            { label: 'Raid Clears', value: totalClears.toLocaleString(), color: G.raidColor },
            { label: 'Transcendents', value: transcendentCount.toLocaleString(), color: G.transcendentColor },
          ].map((stat, i) => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 1, height: 32, background: G.border, flexShrink: 0 }} />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 24px', gap: 4 }}>
                <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: `${stat.color}99`, fontWeight: 400, whiteSpace: 'nowrap' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 1, color: stat.color, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${stat.color}55` }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(20px,2vw,32px) clamp(32px,3.5vw,60px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── RAID SHOP ── */}
            {showShop && (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${G.borderStrong}`, background: 'linear-gradient(148deg, rgba(18,9,44,0.96) 0%, rgba(9,4,24,0.98) 100%)' }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${G.accent}, ${G.accentSoft}, ${G.accent}, transparent)`, boxShadow: `0 0 20px rgba(130,80,255,0.40)` }} />
                <div style={{ padding: '20px 28px' }}>
                  <div style={{ fontFamily: G.cinzel, fontSize: 12, letterSpacing: 4, color: G.accentSoft, marginBottom: 6, textTransform: 'uppercase' }}>
                    Spoils of the Eternal Battlefield
                  </div>
                  <div style={{ fontSize: 11, color: G.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
                    Spend Entropic Energy on Transcendent cards recovered from each Null Raid front. Cards are organized by raid origin and each section includes its mechanic overview.
                  </div>
                  {raidShopSections.length === 0 ? (
                    <div style={{ fontSize: 12, color: G.textMuted }}>
                      No Raid Shop cards are currently configured.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {raidShopSections.map(section => (
                        <div key={section.raid?.id ?? section.associatedSet} style={{ border: `1px solid ${G.border}`, borderRadius: 12, padding: 12, background: 'rgba(8,4,20,0.68)' }}>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 9, color: G.raidColor, letterSpacing: 3, textTransform: 'uppercase', fontFamily: G.cinzel, marginBottom: 4 }}>
                              Raid
                            </div>
                            <div style={{ fontSize: 14, color: G.text, fontFamily: G.cinzel, letterSpacing: 1 }}>
                              {section.raid?.name ?? `${section.associatedSet} Front`}
                            </div>
                          </div>

                          <div style={{ border: `1px solid ${G.border}`, borderRadius: 8, background: 'rgba(16,8,34,0.75)', padding: '10px 12px', marginBottom: 12 }}>
                            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: G.accentSoft, fontFamily: G.cinzel, marginBottom: 4 }}>
                              Mechanic Overview · {section.mechanic.title}
                            </div>
                            <div style={{ fontSize: 11, color: G.textMuted, lineHeight: 1.6 }}>
                              {section.mechanic.body}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                            {section.entries.map(({ card, cost }) => {
                              const owned = transcendentCollection[card.definitionId] ?? 0;
                              const canAfford = entropy >= cost;
                              return (
                                <div
                                  key={card.definitionId}
                                  style={{
                                    borderRadius: 12,
                                    padding: '12px',
                                    border: `1px solid ${G.border}`,
                                    background: 'rgba(10,5,25,0.82)',
                                    display: 'grid',
                                    gridTemplateColumns: '110px 1fr',
                                    gap: 12,
                                    color: G.text,
                                  }}
                                >
                                  <button
                                    onClick={() => setSelectedDropCardId(card.definitionId)}
                                    style={{
                                      width: 110,
                                      aspectRatio: '148 / 204',
                                      borderRadius: 10,
                                      position: 'relative',
                                      overflow: 'hidden',
                                      border: `1px solid ${G.border}`,
                                      padding: 0,
                                      cursor: 'pointer',
                                      background: 'transparent',
                                      ...getDenseCardFaceBackgroundStyle(card, 'normal'),
                                    }}
                                  >
                                    <div style={getCardArtTopBottomBorderOverlayStyleForCard(card)} />
                                  </button>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                      <button
                                        onClick={() => setSelectedDropCardId(card.definitionId)}
                                        style={{
                                          fontSize: 14,
                                          color: G.text,
                                          fontFamily: G.cinzel,
                                          letterSpacing: 1,
                                          background: 'transparent',
                                          border: 'none',
                                          padding: 0,
                                          textAlign: 'left',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {card.name}
                                      </button>
                                      <div style={{ fontSize: 10, color: G.transcendentColor, letterSpacing: 1 }}>
                                        OWNED ×{owned}
                                      </div>
                                    </div>
                                    <div style={{ fontSize: 10, color: G.textMuted, textTransform: 'uppercase', letterSpacing: 2 }}>
                                      {getDisplayCardTypeLabel(card.type)} · {card.rarity}
                                    </div>
                                    <CardRulesDigest
                                      card={card}
                                      variant="preview"
                                      maxSections={3}
                                      maxLinesPerSection={1}
                                      lineClamp={2}
                                      labelColor="rgba(220,210,255,0.65)"
                                      textColor="rgba(236,230,255,0.90)"
                                      sectionBackground="rgba(255,255,255,0.03)"
                                      sectionBorder="rgba(255,255,255,0.08)"
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                      <div style={{ fontSize: 11, color: G.entropyColor, fontVariantNumeric: 'tabular-nums' }}>
                                        Cost: {cost.toLocaleString()} Entropic Energy
                                      </div>
                                      <button
                                        onClick={() => handleBuyRaidShopCard(card.definitionId, cost)}
                                        disabled={!canAfford}
                                        style={{
                                          padding: '6px 10px',
                                          borderRadius: 7,
                                          border: `1px solid ${canAfford ? G.borderStrong : G.border}`,
                                          background: canAfford ? 'rgba(120,70,220,0.26)' : 'rgba(40,20,80,0.32)',
                                          color: canAfford ? G.accentSoft : G.textFaint,
                                          fontSize: 10,
                                          letterSpacing: 1,
                                          cursor: canAfford ? 'pointer' : 'not-allowed',
                                        }}
                                      >
                                        Buy
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RAID SELECT DETAIL ── */}
            {!showShop && selectedRaid && (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${G.borderStrong}`, background: 'linear-gradient(148deg, rgba(18,9,44,0.96) 0%, rgba(9,4,24,0.98) 100%)' }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${STAR_COLOR[selectedRaid.stars]}, transparent)`, boxShadow: `0 0 16px ${STAR_COLOR[selectedRaid.stars]}60` }} />
                <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 3, color: STAR_COLOR[selectedRaid.stars], fontFamily: G.cinzel, textTransform: 'uppercase', marginBottom: 6 }}>
                        {Array.from({ length: selectedRaid.stars }).map(() => '✦').join('')} {selectedRaid.stars}-Star Null Raid
                      </div>
                      <div style={{ fontFamily: G.cinzel, fontSize: 18, letterSpacing: 2, color: G.text, marginBottom: 6 }}>
                        {selectedRaid.name}
                      </div>
                      <div style={{ fontSize: 12, color: G.textMuted, lineHeight: 1.7, maxWidth: 580 }}>
                        {selectedRaid.description}
                      </div>
                    </div>
                    <button onClick={() => setSelectedRaid(null)} style={{
                      padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(80,40,160,0.12)', border: `1px solid ${G.border}`,
                      color: G.textMuted, fontSize: 11,
                    }}>
                      ← Back
                    </button>
                  </div>

                  {/* Boss lineup */}
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: G.textMuted, marginBottom: 10, fontFamily: G.cinzel }}>
                      Encounter Lineup — {selectedRaid.encounterBossIds.length} Bosses · 2:00 per encounter
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedRaid.encounterBossIds.map((id, idx) => {
                        const bossData = NULL_RAID_BOSS_MAP.get(id);
                        const bossArtUrl = getNullRaidBossArtUrl(id);
                        return (
                        <div key={id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 14px', borderRadius: 8,
                          background: 'rgba(10,5,25,0.80)', border: `1px solid ${G.border}`,
                        }}>
                          <span style={{ fontSize: 10, color: G.textFaint, fontFamily: G.cinzel, minWidth: 22 }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {bossArtUrl && (
                            <div
                              style={{
                                width: 92,
                                height: 54,
                                borderRadius: 6,
                                border: `1px solid ${G.border}`,
                                backgroundImage: `linear-gradient(180deg, rgba(10,4,16,0.10) 0%, rgba(10,4,16,0.45) 100%), url("${bossArtUrl}")`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span style={{ fontSize: 13, color: G.text }}>{bossData?.name ?? id.replace(/^nr-[a-z]+-/, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rewards per encounter */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Entropic Energy / Encounter', value: selectedRaid.entropyPerEncounter, color: G.entropyColor },
                      { label: 'Shards / Encounter', value: selectedRaid.shardsPerEncounter, color: '#a0ffcc' },
                      { label: 'Recommended Resonance', value: selectedRaid.recommendedResonance.toLocaleString(), color: '#a0e8c0' },
                    ].map(r => (
                      <div key={r.label} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${G.border}`, background: 'rgba(10,5,25,0.80)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: `${r.color}80` }}>{r.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 600, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                    {selectedRaid.completionAngelId && (
                      <div style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${G.goldBorder}`, background: 'rgba(10,5,25,0.80)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(220,180,100,0.60)' }}>Final Boss Drop</span>
                        <span style={{ fontSize: 13, color: '#ffd08a' }}>5% • Unique Angel</span>
                      </div>
                    )}
                  </div>

                  {/* Deck selector */}
                  {savedDecks.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: G.textMuted, marginBottom: 8, fontFamily: G.cinzel }}>
                        Select Deck
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {savedDecks.map(deck => (
                          <button
                            key={deck.id}
                            onClick={() => setSelectedDeckId(deck.id)}
                            style={{
                              padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
                              background: selectedDeckId === deck.id ? 'rgba(130,80,255,0.22)' : 'rgba(10,5,25,0.80)',
                              border: `1px solid ${selectedDeckId === deck.id ? G.borderStrong : G.border}`,
                              color: selectedDeckId === deck.id ? G.accentSoft : G.textMuted,
                              fontSize: 12, transition: 'all 0.15s ease',
                            }}
                          >
                            {deck.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: G.textMuted }}>No saved decks. Save a deck from the deck builder to enter a raid.</div>
                  )}

                  {savedDecks.length > 0 && (
                    <button
                      onClick={handleOpenCardBoundCoop}
                      style={{
                        alignSelf: 'flex-start', padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(120,70,220,0.20)', border: `1px solid ${G.borderStrong}`,
                        color: G.accentSoft, fontSize: 12, letterSpacing: 2, fontFamily: G.cinzel,
                        textTransform: 'uppercase',
                      }}
                    >
                      Open Card-bound Co-op
                    </button>
                  )}

                  {/* Enter button */}
                  {(() => {
                    const locked = isRaidLocked(selectedRaid);
                    const cdMs = getCooldownRemaining(selectedRaid.id);
                    const onCd = cdMs > 0;
                    const canEnter = !locked && !onCd && selectedDeckId;
                    return (
                      <button
                        disabled={!canEnter}
                        onClick={handleEnterRaid}
                        style={{
                          alignSelf: 'flex-start', padding: '12px 32px', borderRadius: 10, cursor: canEnter ? 'pointer' : 'not-allowed',
                          background: canEnter ? `linear-gradient(135deg, rgba(100,50,220,0.55) 0%, rgba(70,30,180,0.45) 100%)` : 'rgba(40,20,80,0.30)',
                          border: `1px solid ${canEnter ? G.borderStrong : G.border}`,
                          color: canEnter ? G.accentSoft : G.textFaint,
                          fontSize: 13, letterSpacing: 3, fontFamily: G.cinzel,
                          textTransform: 'uppercase', textShadow: canEnter ? `0 0 20px rgba(160,128,255,0.50)` : 'none',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {locked ? `Requires ${selectedRaid.resonanceRequired.toLocaleString()} Resonance` : onCd ? `On Cooldown — ${formatCooldown(cdMs)}` : 'ENTER RAID'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── RAID LIST ── */}
            {!showShop && !selectedRaid && ([1, 2, 3] as const).map(stars => (
              <div key={stars}>
                <div style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: `${STAR_COLOR[stars]}cc`, fontFamily: G.cinzel, marginBottom: 10 }}>
                  {STAR_LABEL[stars]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {raidsByStars[stars].map(raid => {
                    const locked = isRaidLocked(raid);
                    const cdMs = getCooldownRemaining(raid.id);
                    const onCd = cdMs > 0;
                    const clears = nullRaidClears[raid.id] ?? 0;
                    const finalBossId = raid.encounterBossIds[raid.encounterBossIds.length - 1] ?? raid.encounterBossIds[0];
                    const finalBossArtUrl = getNullRaidBossArtUrl(finalBossId);
                    const finalBossName = finalBossId ? (NULL_RAID_BOSS_MAP.get(finalBossId)?.name ?? 'Unknown Final Boss') : null;
                    return (
                      <div
                        key={raid.id}
                        onClick={() => !locked && setSelectedRaid(raid)}
                        style={{
                          borderRadius: 12, overflow: 'hidden',
                          border: `1px solid ${locked ? 'rgba(80,60,120,0.20)' : G.border}`,
                          background: 'linear-gradient(148deg, rgba(14,7,34,0.92) 0%, rgba(7,3,18,0.96) 100%)',
                          display: 'flex', alignItems: 'center',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          opacity: locked ? 0.6 : 1,
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <div style={{ width: 4, alignSelf: 'stretch', background: locked ? 'rgba(80,60,120,0.30)' : STAR_COLOR[stars], flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                          {finalBossArtUrl && (
                            <div
                              style={{
                                width: 168,
                                height: 96,
                                borderRadius: 10,
                                border: `1px solid ${G.border}`,
                                backgroundImage: `linear-gradient(180deg, rgba(10,4,16,0.10) 0%, rgba(10,4,16,0.45) 100%), url("${finalBossArtUrl}")`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
                            <div style={{ fontFamily: G.cinzel, fontSize: 16, letterSpacing: 1.5, color: locked ? G.textMuted : G.text }}>
                              {raid.name}
                            </div>
                            <div style={{ fontSize: 11, color: G.textMuted }}>
                              {raid.associatedSet} · {raid.encounterBossIds.length} Encounters · {Array.from({ length: raid.stars }).map(() => '✦').join('')}
                            </div>
                            {finalBossName && (
                              <div style={{ fontSize: 10, color: G.accentSoft, letterSpacing: 0.5 }}>
                                Final Boss Splash: {finalBossName}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            {clears > 0 && (
                              <span style={{ fontSize: 11, color: G.transcendentColor, padding: '4px 10px', border: `1px solid ${G.goldBorder}`, borderRadius: 5 }}>
                                ×{clears} clears
                              </span>
                            )}
                            {locked && (
                              <span style={{ fontSize: 11, color: '#ff8080', padding: '4px 10px', border: '1px solid rgba(255,80,80,0.20)', borderRadius: 5 }}>
                                🔒 {raid.resonanceRequired.toLocaleString()} Resonance
                              </span>
                            )}
                            {onCd && !locked && (
                              <span style={{ fontSize: 11, color: '#ffb860', padding: '4px 10px', border: '1px solid rgba(255,180,80,0.22)', borderRadius: 5 }}>
                                ⏱ {formatCooldown(cdMs)}
                              </span>
                            )}
                            {!locked && !onCd && (
                              <span style={{ fontSize: 11, color: G.accentSoft, padding: '4px 10px', border: `1px solid ${G.border}`, borderRadius: 5 }}>
                                READY
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {showShop && selectedDropCard && (
        <CollectionCardDetail
          card={selectedDropCard}
          finish="normal"
          owned={transcendentCollection[selectedDropCard.definitionId] ?? 0}
          onClose={() => setSelectedDropCardId(null)}
        />
      )}
    </div>
  );
}
