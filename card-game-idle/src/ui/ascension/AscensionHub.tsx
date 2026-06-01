import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { uiTypography } from '@/ui/theme';
import { CardRegistry } from '@/cards/CardRegistry';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import CollectionCardDetail from '@/ui/store/CollectionCardDetail';
import {
  getDenseCardFaceBackgroundStyle,
  getCardArtTopBottomBorderOverlayStyleForCard,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import {
  NULL_RAID_DEFINITIONS,
  NULL_RAID_BOSS_MAP,
  NULL_RAID_PROVE_YOURSELF_SECONDS,
  getNullRaidProveYourselfTargetDamage,
  type NullRaidDefinition,
} from '@/data/ascension/nullRaidDefinitions';
import { getNullRaidBossArtUrl, getNullRaidSplashArtUrl } from '@/ui/ascension/nullRaidArt';
import { TRANSCENDENT_SHOP_COSTS, TRANSCENDENT_SHOP_IDS } from '@/data/ascension/transcendentCards';

// ── Obsidian + Gold + Chromatic palette ───────────────────────────────
const G = {
  bg: 'linear-gradient(160deg, #030303 0%, #050505 52%, #080707 100%)',
  accent: '#e8c77a',
  accentSoft: '#f6e4b8',
  accentDeep: '#8f6a2a',
  border: 'rgba(255,255,255,0.16)',
  borderStrong: 'rgba(246,228,184,0.48)',
  goldBorder: 'rgba(246,228,184,0.42)',
  text: '#f3f3f3',
  textMuted: 'rgba(235,235,235,0.72)',
  textFaint: 'rgba(210,210,210,0.5)',
  cinzel: uiTypography.display,
  entropyColor: '#f0cd7f',
  raidColor: '#9fd8ff',
  transcendentColor: '#f6e4b8',
};

type RaidVisualTheme = {
  accent: string;
  accentSoft: string;
  chroma: string;
  panelBg: string;
  cardBg: string;
  stripe: string;
  glow: string;
  badgeBg: string;
  lockedBg: string;
  buttonBg: string;
  buttonBorder: string;
};

function getRaidVisualTheme(raid: NullRaidDefinition | null | undefined): RaidVisualTheme {
  if (!raid) {
    return {
      accent: '#f6e4b8',
      accentSoft: '#f3f3f3',
      chroma: '#9fd8ff',
      panelBg: 'linear-gradient(146deg, rgba(18,18,18,0.96) 0%, rgba(8,8,8,0.98) 100%)',
      cardBg: 'linear-gradient(146deg, rgba(24,24,24,0.9) 0%, rgba(9,9,9,0.94) 100%)',
      stripe: 'linear-gradient(180deg, rgba(246,228,184,0.8) 0%, rgba(159,216,255,0.7) 100%)',
      glow: 'rgba(246,228,184,0.35)',
      badgeBg: 'rgba(246,228,184,0.14)',
      lockedBg: 'rgba(255,70,70,0.18)',
      buttonBg: 'linear-gradient(136deg, rgba(246,228,184,0.22) 0%, rgba(140,180,255,0.18) 100%)',
      buttonBorder: 'rgba(246,228,184,0.5)',
    };
  }

  if (raid.associatedSet.toLowerCase() === 'neutrality') {
    return {
      accent: '#f7f7f7',
      accentSoft: '#ffffff',
      chroma: '#8de8ff',
      panelBg: 'linear-gradient(148deg, rgba(16,16,16,0.97) 0%, rgba(6,6,6,0.98) 100%)',
      cardBg: 'linear-gradient(148deg, rgba(26,26,26,0.9) 0%, rgba(8,8,8,0.94) 100%)',
      stripe: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(141,232,255,0.78) 100%)',
      glow: 'rgba(141,232,255,0.28)',
      badgeBg: 'rgba(255,255,255,0.12)',
      lockedBg: 'rgba(255,100,100,0.16)',
      buttonBg: 'linear-gradient(136deg, rgba(255,255,255,0.2) 0%, rgba(141,232,255,0.18) 100%)',
      buttonBorder: 'rgba(255,255,255,0.5)',
    };
  }

  if (raid.associatedSet.toLowerCase() === 'pyroabyss') {
    return {
      accent: '#ffcf9a',
      accentSoft: '#ffe1bb',
      chroma: '#ff7c52',
      panelBg: 'linear-gradient(148deg, rgba(20,12,10,0.97) 0%, rgba(8,5,4,0.98) 100%)',
      cardBg: 'linear-gradient(148deg, rgba(30,16,12,0.9) 0%, rgba(10,6,4,0.94) 100%)',
      stripe: 'linear-gradient(180deg, rgba(255,207,154,0.9) 0%, rgba(255,124,82,0.82) 100%)',
      glow: 'rgba(255,124,82,0.3)',
      badgeBg: 'rgba(255,180,130,0.14)',
      lockedBg: 'rgba(255,80,80,0.18)',
      buttonBg: 'linear-gradient(136deg, rgba(255,180,120,0.22) 0%, rgba(255,96,72,0.2) 100%)',
      buttonBorder: 'rgba(255,180,130,0.55)',
    };
  }

  if (raid.associatedSet.toLowerCase() === 'heavenly light') {
    return {
      accent: '#e8d47c',
      accentSoft: '#f4edcc',
      chroma: '#7ab0f5',
      panelBg: 'linear-gradient(148deg, rgba(10,10,24,0.97) 0%, rgba(5,5,15,0.98) 100%)',
      cardBg: 'linear-gradient(148deg, rgba(16,14,34,0.9) 0%, rgba(6,5,20,0.94) 100%)',
      stripe: 'linear-gradient(180deg, rgba(232,212,124,0.92) 0%, rgba(122,176,245,0.82) 100%)',
      glow: 'rgba(200,178,108,0.34)',
      badgeBg: 'rgba(232,212,124,0.14)',
      lockedBg: 'rgba(255,90,90,0.17)',
      buttonBg: 'linear-gradient(136deg, rgba(232,212,124,0.22) 0%, rgba(100,148,240,0.18) 100%)',
      buttonBorder: 'rgba(232,212,124,0.54)',
    };
  }

  return getRaidVisualTheme(null);
}

const RAID_SHOP_FACE_METRICS = getCardFaceMetrics('compact');

interface Props {
  onClose: () => void;
}

export default function AscensionHub({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const computedStats = useStore(s => s.computedStats);
  const startNullRaid = useStore(s => s.startNullRaid);
  const startNullRaidProveYourself = useStore(s => s.startNullRaidProveYourself);
  const purchaseTranscendentCard = useStore(s => s.purchaseTranscendentCard);
  const enqueueToast = useStore(s => s.enqueueToast);

  const entropy = progress.entropicEnergyBalance ?? progress.entropyBalance ?? 0;
  const nullRaidClears = progress.nullRaidClears ?? {};
  const nullRaidProveUnlocks = progress.nullRaidProveUnlocks ?? {};
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
    return nullRaidProveUnlocks[raid.id] !== true;
  }

  function getRaidProveYourselfLabel(raid: NullRaidDefinition): string {
    const target = getNullRaidProveYourselfTargetDamage(raid);
    if (target <= 0) return 'Prove Yourself Required';
    return `Prove Yourself: Deal ${target.toLocaleString()} in ${NULL_RAID_PROVE_YOURSELF_SECONDS}s`;
  }

  function handleEnterRaid() {
    if (!selectedRaid || !selectedDeckId) return;
    const started = startNullRaid(selectedRaid.id, selectedDeckId);
    if (started) onClose();
  }

  function handleProveYourself(raid: NullRaidDefinition) {
    if (!selectedDeckId) return;
    const started = startNullRaidProveYourself(raid.id, selectedDeckId);
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
      light: 'Heavenly Light',
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
      'Heavenly Light': {
        title: 'Duality',
        body:
          'Every Transcendent in this suite triggers Duality: choose Discard 1, Draw 2, or cash out a massive Oblivion burst that scales from Resonance, Halo, and distinct cadence notes. The cards also inject above-rate Radiance and Halo to accelerate Light endgame lines.',
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
  const STAR_COLOR: Record<number, string> = { 1: '#9fd8ff', 2: '#f5f5f5', 3: '#f0cd7f' };
  const selectedRaidTheme = getRaidVisualTheme(selectedRaid);

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
      <div style={{ position: 'absolute', top: '-24%', left: '-12%', width: '78%', height: '88%', background: 'radial-gradient(ellipse, rgba(245,245,245,0.14) 0%, rgba(160,220,255,0.08) 38%, transparent 72%)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-24%', right: '-12%', width: '72%', height: '82%', background: 'radial-gradient(ellipse, rgba(246,228,184,0.16) 0%, rgba(120,190,255,0.08) 42%, transparent 68%)', filter: 'blur(92px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 44%, transparent 22%, rgba(0,0,0,0.74) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 12% 24%, rgba(255,255,255,0.13) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 38%, rgba(246,228,184,0.16) 0 1px, transparent 1.5px), radial-gradient(circle at 44% 70%, rgba(150,220,255,0.16) 0 1px, transparent 1.5px)', backgroundSize: '220px 220px, 300px 300px, 260px 260px', pointerEvents: 'none', opacity: 0.75 }} />

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
                background: showShop ? 'rgba(246,228,184,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${showShop ? G.borderStrong : G.border}`,
                color: showShop ? G.accentSoft : G.textMuted,
                fontSize: 11, letterSpacing: 2, fontFamily: G.cinzel,
                textTransform: 'uppercase', transition: 'all 0.18s ease',
              }}
            >
              Spoils of Entropy
            </button>
            <button
              onClick={onClose}
              style={{
                width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${G.border}`,
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
                    Spoils of Entropy
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
                                    <div style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      pointerEvents: 'none',
                                    }}>
                                      <div style={getCardNameRibbonStyle('compact')}>
                                        <div style={{
                                          fontSize: RAID_SHOP_FACE_METRICS.typeSize,
                                          letterSpacing: 0.55,
                                          textTransform: 'uppercase',
                                          color: 'var(--card-face-text-muted, rgba(19, 13, 8, 0.78))',
                                          lineHeight: 1.04,
                                        }}>
                                          {getDisplayCardTypeLabel(card.type)} · {card.rarity}
                                        </div>
                                        <div style={{
                                          fontSize: RAID_SHOP_FACE_METRICS.nameSize,
                                          fontWeight: 700,
                                          lineHeight: 1.08,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}>
                                          {card.name}
                                        </div>
                                      </div>

                                      <div style={{
                                        ...getCardRulesPanelStyle('compact'),
                                        marginTop: 'auto',
                                      }}>
                                        <CardRulesDigest
                                          card={card}
                                          variant="preview"
                                          maxSections={2}
                                          maxLinesPerSection={1}
                                          lineClamp={1}
                                          labelColor="var(--card-face-text-muted, rgba(19, 13, 8, 0.78))"
                                          textColor="var(--card-face-text-soft, rgba(19, 13, 8, 0.94))"
                                          sectionBackground="transparent"
                                          sectionBorder="transparent"
                                          lightBg
                                        />
                                      </div>
                                    </div>
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
              <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${selectedRaidTheme.buttonBorder}`, background: selectedRaidTheme.panelBg, boxShadow: `0 8px 36px ${selectedRaidTheme.glow}` }}>
                <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${selectedRaidTheme.accent}, ${selectedRaidTheme.chroma}, ${selectedRaidTheme.accent}, transparent)`, boxShadow: `0 0 22px ${selectedRaidTheme.glow}` }} />
                <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: 3, color: selectedRaidTheme.accent, fontFamily: G.cinzel, textTransform: 'uppercase', marginBottom: 6, textShadow: `0 0 14px ${selectedRaidTheme.glow}` }}>
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
                      background: selectedRaidTheme.badgeBg, border: `1px solid ${selectedRaidTheme.buttonBorder}`,
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
                          background: selectedRaidTheme.cardBg, border: `1px solid ${selectedRaidTheme.buttonBorder}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
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
                            <span style={{ fontSize: 13, color: G.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {bossData?.name ?? id.replace(/^nr-[a-z]+-/, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                          </div>
                          <div style={{
                            marginLeft: 'auto',
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: `1px solid ${selectedRaidTheme.buttonBorder}`,
                            background: selectedRaidTheme.badgeBg,
                            color: selectedRaidTheme.accentSoft,
                            fontSize: 11,
                            letterSpacing: 0.4,
                            fontVariantNumeric: 'tabular-nums',
                            textShadow: `0 0 10px ${selectedRaidTheme.glow}`,
                            whiteSpace: 'nowrap',
                          }}>
                            HP {Math.max(0, bossData?.hp ?? 0).toLocaleString()}
                          </div>
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
                    ].map(r => (
                      <div key={r.label} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${selectedRaidTheme.buttonBorder}`, background: selectedRaidTheme.cardBg, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: `${r.color}80` }}>{r.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 600, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                    {selectedRaid.completionAngelId && (
                      <div style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${G.goldBorder}`, background: selectedRaidTheme.badgeBg, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(220,180,100,0.60)' }}>Final Boss Drop</span>
                        <span style={{ fontSize: 13, color: '#ffd08a' }}>
                          5% Raid Unique Angel: {CardRegistry.get(selectedRaid.completionAngelId)?.name ?? selectedRaid.completionAngelId}
                        </span>
                      </div>
                    )}
                    <div style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${selectedRaidTheme.buttonBorder}`, background: selectedRaidTheme.badgeBg, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: `${G.accentSoft}88` }}>Prove Yourself Unlock</span>
                      <span style={{ fontSize: 13, color: selectedRaidTheme.accentSoft }}>
                        Deal {getNullRaidProveYourselfTargetDamage(selectedRaid).toLocaleString()} in {NULL_RAID_PROVE_YOURSELF_SECONDS}s
                      </span>
                    </div>
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
                              background: selectedDeckId === deck.id ? selectedRaidTheme.buttonBg : selectedRaidTheme.cardBg,
                              border: `1px solid ${selectedDeckId === deck.id ? selectedRaidTheme.buttonBorder : G.border}`,
                              color: selectedDeckId === deck.id ? selectedRaidTheme.accentSoft : G.textMuted,
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
                        background: selectedRaidTheme.buttonBg, border: `1px solid ${selectedRaidTheme.buttonBorder}`,
                        color: selectedRaidTheme.accentSoft, fontSize: 12, letterSpacing: 2, fontFamily: G.cinzel,
                        textTransform: 'uppercase',
                        boxShadow: `0 0 20px ${selectedRaidTheme.glow}`,
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
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {locked && (
                          <button
                            disabled={!selectedDeckId}
                            onClick={() => handleProveYourself(selectedRaid)}
                            style={{
                              alignSelf: 'flex-start', padding: '12px 22px', borderRadius: 10, cursor: selectedDeckId ? 'pointer' : 'not-allowed',
                              background: selectedDeckId ? selectedRaidTheme.buttonBg : 'rgba(40,40,40,0.4)',
                              border: `1px solid ${selectedDeckId ? selectedRaidTheme.buttonBorder : G.border}`,
                              color: selectedDeckId ? selectedRaidTheme.accentSoft : G.textFaint,
                              fontSize: 12, letterSpacing: 2, fontFamily: G.cinzel,
                              textTransform: 'uppercase', transition: 'all 0.18s ease',
                              boxShadow: selectedDeckId ? `0 0 20px ${selectedRaidTheme.glow}` : 'none',
                            }}
                          >
                            PROVE YOURSELF
                          </button>
                        )}
                        {locked ? (
                          <span style={{ fontSize: 11, color: '#ffb3b3', padding: '4px 10px', border: '1px solid rgba(255,80,80,0.36)', borderRadius: 5, background: selectedRaidTheme.lockedBg, letterSpacing: 1, textTransform: 'uppercase' }}>
                            {getRaidProveYourselfLabel(selectedRaid)}
                          </span>
                        ) : (
                          <button
                            disabled={!canEnter}
                            onClick={handleEnterRaid}
                            style={{
                              alignSelf: 'flex-start', padding: '12px 32px', borderRadius: 10, cursor: canEnter ? 'pointer' : 'not-allowed',
                              background: canEnter ? `linear-gradient(135deg, ${selectedRaidTheme.accent}55 0%, ${selectedRaidTheme.chroma}45 100%)` : 'rgba(40,40,40,0.4)',
                              border: `1px solid ${canEnter ? selectedRaidTheme.buttonBorder : G.border}`,
                              color: canEnter ? selectedRaidTheme.accentSoft : G.textFaint,
                              fontSize: 13, letterSpacing: 3, fontFamily: G.cinzel,
                              textTransform: 'uppercase', textShadow: canEnter ? `0 0 20px ${selectedRaidTheme.glow}` : 'none',
                              transition: 'all 0.18s ease',
                              boxShadow: canEnter ? `0 0 24px ${selectedRaidTheme.glow}` : 'none',
                            }}
                          >
                            {onCd ? `On Cooldown — ${formatCooldown(cdMs)}` : 'ENTER RAID'}
                          </button>
                        )}
                      </div>
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
                    const raidTheme = getRaidVisualTheme(raid);
                    const locked = isRaidLocked(raid);
                    const cdMs = getCooldownRemaining(raid.id);
                    const onCd = cdMs > 0;
                    const clears = nullRaidClears[raid.id] ?? 0;
                    const finalBossId = raid.encounterBossIds[raid.encounterBossIds.length - 1] ?? raid.encounterBossIds[0];
                    const finalBossArtUrl = getNullRaidBossArtUrl(finalBossId);
                    const splashArtUrl = getNullRaidSplashArtUrl(raid.id) ?? finalBossArtUrl;
                    return (
                      <div
                        key={raid.id}
                        onClick={() => setSelectedRaid(raid)}
                        style={{
                          borderRadius: 12, overflow: 'hidden',
                          border: `1px solid ${locked ? `${raidTheme.buttonBorder}66` : raidTheme.buttonBorder}`,
                          background: raidTheme.panelBg,
                          display: 'flex', alignItems: 'center',
                          cursor: 'pointer',
                          opacity: locked ? 0.72 : 1,
                          transition: 'all 0.18s ease',
                          boxShadow: locked ? 'none' : `0 0 24px ${raidTheme.glow}`,
                        }}
                      >
                        <div style={{ width: 4, alignSelf: 'stretch', background: locked ? `${raidTheme.accent}66` : raidTheme.stripe, flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                          {splashArtUrl && (
                            <div
                              style={{
                                width: 168,
                                height: 96,
                                borderRadius: 10,
                                border: `1px solid ${raidTheme.buttonBorder}`,
                                backgroundImage: `linear-gradient(180deg, rgba(10,4,16,0.10) 0%, rgba(10,4,16,0.45) 100%), url("${splashArtUrl}")`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 20px ${raidTheme.glow}`,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
                            <div style={{ fontFamily: G.cinzel, fontSize: 16, letterSpacing: 1.5, color: locked ? G.textMuted : raidTheme.accentSoft, textShadow: locked ? 'none' : `0 0 18px ${raidTheme.glow}` }}>
                              {raid.name}
                            </div>
                            <div style={{ fontSize: 11, color: G.textMuted }}>
                              {raid.associatedSet} · {raid.encounterBossIds.length} Encounters · {Array.from({ length: raid.stars }).map(() => '✦').join('')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            {clears > 0 && (
                              <span style={{ fontSize: 11, color: G.transcendentColor, padding: '4px 10px', border: `1px solid ${G.goldBorder}`, borderRadius: 5, background: raidTheme.badgeBg }}>
                                ×{clears} clears
                              </span>
                            )}
                            {locked && (
                              <>
                                <span style={{ fontSize: 11, color: '#ffb3b3', padding: '4px 10px', border: '1px solid rgba(255,80,80,0.36)', borderRadius: 5, background: raidTheme.lockedBg }}>
                                  🔒 {getRaidProveYourselfLabel(raid)}
                                </span>
                                <button
                                  disabled={!selectedDeckId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProveYourself(raid);
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 5,
                                    border: `1px solid ${selectedDeckId ? raidTheme.buttonBorder : G.border}`,
                                    background: selectedDeckId ? raidTheme.buttonBg : 'rgba(40,40,40,0.4)',
                                    color: selectedDeckId ? raidTheme.accentSoft : G.textFaint,
                                    fontSize: 10,
                                    letterSpacing: 1,
                                    cursor: selectedDeckId ? 'pointer' : 'not-allowed',
                                    boxShadow: selectedDeckId ? `0 0 18px ${raidTheme.glow}` : 'none',
                                  }}
                                >
                                  PROVE YOURSELF
                                </button>
                              </>
                            )}
                            {onCd && !locked && (
                              <span style={{ fontSize: 11, color: '#ffcf95', padding: '4px 10px', border: '1px solid rgba(255,190,100,0.34)', borderRadius: 5, background: raidTheme.badgeBg }}>
                                ⏱ {formatCooldown(cdMs)}
                              </span>
                            )}
                            {!locked && !onCd && (
                              <span style={{ fontSize: 11, color: raidTheme.accentSoft, padding: '4px 10px', border: `1px solid ${raidTheme.buttonBorder}`, borderRadius: 5, background: raidTheme.badgeBg }}>
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
