import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { STARTER_COLLECTION } from '@/systems/progression/StarterDeck';
import {
  ARTIFACT_SET_ORDER,
  ARTIFACT_SET_NAMES,
  ARTIFACT_SET_COLORS,
  ARTIFACT_DEFINITIONS,
  getArtifactsForSet,
} from '@/data/artifacts/artifactDefinitions';
import {
  ARTIFACT_APEX_SHARD_COST,
  ARTIFACT_MASTERY_THRESHOLDS,
  RARITY_POWDER_YIELD,
  getCardDissolveYield,
  getMasteryLevel,
  getMasteryMultiplier,
  getNextMasteryThreshold,
  getArtifactCopyCost,
  type ArtifactDefinition,
} from '@/types/artifacts';

interface Props {
  onClose: () => void;
}

const TIER_LABELS: Record<string, string> = { basic: 'I', advanced: 'II', apex: 'III' };
const TIER_NAMES: Record<string, string> = { basic: 'Basic', advanced: 'Advanced', apex: 'Apex' };

const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Eternal', 'Infinite'] as const;
const RARITY_COLORS: Record<string, string> = {
  Common: '#b8b8c8',
  Rare: '#5fb8ff',
  Epic: '#c479ff',
  Legendary: '#ffb74d',
  Eternal: '#ff5d9c',
  Infinite: '#ffe066',
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.0+$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.floor(n));
}

function masteryBadge(level: number): string {
  if (level < 0) return 'LOCKED';
  if (level === 3) return 'APEX';
  return `ML ${level}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

export default function ArtifactsMenu({ onClose }: Props) {
  const [selectedSet, setSelectedSet] = useState<string>(ARTIFACT_SET_ORDER[0]);
  const [view, setView] = useState<'artifacts' | 'dissolve'>('artifacts');
  const [mounted, setMounted] = useState(false);

  const cardbaneLight = useStore(s => s.progress.cardbaneLight ?? 0);
  const aberratedShards = useStore(s => s.progress.aberratedShards ?? 0);
  const ownedArtifacts = useStore(s => s.progress.ownedArtifacts ?? {});
  const purchaseArtifactCopy = useStore(s => s.purchaseArtifactCopy);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 20);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(id); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const setColor = ARTIFACT_SET_COLORS[selectedSet] ?? '#a0a0c0';
  const setArtifacts = getArtifactsForSet(selectedSet);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at top, rgba(20,15,40,0.97), rgba(5,4,14,0.99))',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      pointerEvents: 'auto',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 320ms ease',
      overflow: 'hidden',
      fontFamily: 'inherit',
      color: '#e8e8f0',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Header
        cardbaneLight={cardbaneLight}
        aberratedShards={aberratedShards}
        setColor={setColor}
        view={view}
        onViewChange={setView}
        onClose={onClose}
      />

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {view === 'artifacts' ? (
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          <SetSidebar
            selectedSet={selectedSet}
            onSelect={setSelectedSet}
            ownedArtifacts={ownedArtifacts}
          />
          <ArtifactDetailPanel
            elementKey={selectedSet}
            setColor={setColor}
            artifacts={setArtifacts}
            ownedArtifacts={ownedArtifacts}
            cardbaneLight={cardbaneLight}
            aberratedShards={aberratedShards}
            onBuy={purchaseArtifactCopy}
          />
        </div>
      ) : (
        <DissolvePanel />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────────────────────

interface HeaderProps {
  cardbaneLight: number;
  aberratedShards: number;
  setColor: string;
  view: 'artifacts' | 'dissolve';
  onViewChange: (v: 'artifacts' | 'dissolve') => void;
  onClose: () => void;
}

function Header({ cardbaneLight, aberratedShards, setColor, view, onViewChange, onClose }: HeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)',
    }}>
      <div>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: setColor,
          textShadow: `0 0 18px ${setColor}55`,
          transition: 'color 360ms ease, text-shadow 360ms ease',
        }}>
          Artifacts
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.06em' }}>
          Dissolve cards · Forge mastery · Equip up to 3 per deck
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Currency pills */}
        <CurrencyPill icon="✦" label="Card-bane Light" value={cardbaneLight} accent="#ffd966" />
        <CurrencyPill icon="◈" label="Aberrated Shards" value={aberratedShards} accent="#c79bff" />

        {/* View tabs */}
        <div style={{ display: 'flex', borderRadius: 10, background: 'rgba(255,255,255,0.04)', padding: 3, marginLeft: 10 }}>
          {(['artifacts', 'dissolve'] as const).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              style={{
                padding: '7px 16px',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: view === v ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: view === v ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: 7,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 180ms ease',
              }}
            >
              {v === 'artifacts' ? 'Artifacts' : 'Dissolve'}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.75)',
            borderRadius: 8,
            padding: '7px 16px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            marginLeft: 6,
          }}
        >
          Close ✕
        </button>
      </div>
    </div>
  );
}

function CurrencyPill({ icon, label, value, accent }: { icon: string; label: string; value: number; accent: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 14px',
      borderRadius: 22,
      background: `linear-gradient(180deg, ${accent}1c, ${accent}08)`,
      border: `1px solid ${accent}40`,
      boxShadow: `0 0 14px ${accent}18 inset`,
    }}>
      <span style={{ fontSize: 16, color: accent, textShadow: `0 0 8px ${accent}` }}>{icon}</span>
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>{formatNumber(value)}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Set sidebar
// ────────────────────────────────────────────────────────────────────────────

interface SetSidebarProps {
  selectedSet: string;
  onSelect: (key: string) => void;
  ownedArtifacts: Record<string, number>;
}

function SetSidebar({ selectedSet, onSelect, ownedArtifacts }: SetSidebarProps) {
  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto',
      padding: '14px 8px',
    }}>
      {ARTIFACT_SET_ORDER.map(key => {
        const color = ARTIFACT_SET_COLORS[key] ?? '#a0a0c0';
        const name = ARTIFACT_SET_NAMES[key] ?? key;
        const artifacts = getArtifactsForSet(key);
        const ownedCount = artifacts.filter(a => (ownedArtifacts[a.id] ?? 0) > 0).length;
        const totalCopies = artifacts.reduce((sum, a) => sum + (ownedArtifacts[a.id] ?? 0), 0);
        const maxCopies = artifacts.length * ARTIFACT_MASTERY_THRESHOLDS.ML3;
        const isSelected = key === selectedSet;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 14px',
              marginBottom: 4,
              borderRadius: 8,
              background: isSelected ? `linear-gradient(90deg, ${color}30, ${color}10)` : 'transparent',
              border: isSelected ? `1px solid ${color}60` : '1px solid transparent',
              cursor: 'pointer',
              color: isSelected ? '#fff' : 'rgba(255,255,255,0.65)',
              transition: 'all 160ms ease',
              boxShadow: isSelected ? `inset 0 0 12px ${color}25` : 'none',
            }}
            onMouseEnter={e => {
              if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={e => {
              if (!isSelected) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', color: isSelected ? color : undefined }}>
                {name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {ownedCount}/{artifacts.length}
              </div>
            </div>
            {/* Total mastery progress */}
            <div style={{
              marginTop: 6,
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.05)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (totalCopies / maxCopies) * 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                transition: 'width 220ms ease',
              }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Artifact detail (right panel)
// ────────────────────────────────────────────────────────────────────────────

interface DetailProps {
  elementKey: string;
  setColor: string;
  artifacts: ArtifactDefinition[];
  ownedArtifacts: Record<string, number>;
  cardbaneLight: number;
  aberratedShards: number;
  onBuy: (artifactId: string) => boolean;
}

function ArtifactDetailPanel({ elementKey, setColor, artifacts, ownedArtifacts, cardbaneLight, aberratedShards, onBuy }: DetailProps) {
  const setName = ARTIFACT_SET_NAMES[elementKey] ?? elementKey;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
      <div style={{
        fontSize: 13,
        color: setColor,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        {setName}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
        Three artifacts per set. Buy copies to advance mastery levels: ML0 → ML1 (4 copies) → ML2 (9) → Apex (10 + 10,000 ◈).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        {artifacts.map(a => (
          <ArtifactCard
            key={a.id}
            artifact={a}
            setColor={setColor}
            copies={ownedArtifacts[a.id] ?? 0}
            cardbaneLight={cardbaneLight}
            aberratedShards={aberratedShards}
            onBuy={() => onBuy(a.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ArtifactCardProps {
  artifact: ArtifactDefinition;
  setColor: string;
  copies: number;
  cardbaneLight: number;
  aberratedShards: number;
  onBuy: () => boolean;
}

function ArtifactCard({ artifact, setColor, copies, cardbaneLight, aberratedShards, onBuy }: ArtifactCardProps) {
  const level = getMasteryLevel(copies);
  const mult = copies > 0 ? getMasteryMultiplier(copies) : 1.0;
  const nextThreshold = getNextMasteryThreshold(copies);
  const isApex = level === 3;
  const isApexUnlock = copies === ARTIFACT_MASTERY_THRESHOLDS.ML2;
  const cost = getArtifactCopyCost(artifact);
  const canAffordLight = cardbaneLight >= cost;
  const canAffordShards = !isApexUnlock || aberratedShards >= ARTIFACT_APEX_SHARD_COST;
  const canBuy = !isApex && canAffordLight && canAffordShards;

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${setColor}40`,
      background: `linear-gradient(180deg, ${setColor}10, rgba(0,0,0,0.4))`,
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 220ms ease, box-shadow 220ms ease',
      boxShadow: isApex ? `0 0 24px ${setColor}55` : 'none',
    }}>
      {/* Tier badge */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 14,
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 4,
        background: `${setColor}25`,
        color: setColor,
        letterSpacing: '0.1em',
        fontWeight: 700,
      }}>
        TIER {TIER_LABELS[artifact.tier]} · {TIER_NAMES[artifact.tier].toUpperCase()}
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4, marginRight: 100 }}>
        {artifact.name}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45, marginBottom: 12, minHeight: 50 }}>
        {artifact.description}
      </div>

      {/* Mastery row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 12,
          background: copies > 0 ? `${setColor}30` : 'rgba(255,255,255,0.04)',
          color: copies > 0 ? setColor : 'rgba(255,255,255,0.35)',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}>
          {masteryBadge(level)}
        </div>
        {copies > 0 && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            ×{mult.toFixed(2)} effect
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {copies}/{ARTIFACT_MASTERY_THRESHOLDS.ML3} copies
        </div>
      </div>

      {/* Copy progress bar with milestone ticks */}
      <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height: '100%',
          width: `${(copies / ARTIFACT_MASTERY_THRESHOLDS.ML3) * 100}%`,
          background: `linear-gradient(90deg, ${setColor}, ${setColor}aa)`,
          transition: 'width 280ms ease',
        }} />
        {/* Milestone ticks for ML1/ML2 thresholds */}
        {[ARTIFACT_MASTERY_THRESHOLDS.ML1, ARTIFACT_MASTERY_THRESHOLDS.ML2].map(t => (
          <div key={t} style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${(t / ARTIFACT_MASTERY_THRESHOLDS.ML3) * 100}%`,
            width: 1,
            background: 'rgba(255,255,255,0.25)',
          }} />
        ))}
      </div>

      {/* Buy button */}
      {!isApex ? (
        <button
          disabled={!canBuy}
          onClick={() => { onBuy(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            background: canBuy
              ? (isApexUnlock ? `linear-gradient(90deg, ${setColor}40, #c79bff40)` : `${setColor}25`)
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${canBuy ? setColor + '70' : 'rgba(255,255,255,0.1)'}`,
            color: canBuy ? '#fff' : 'rgba(255,255,255,0.35)',
            cursor: canBuy ? 'pointer' : 'not-allowed',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transition: 'all 160ms ease',
          }}
        >
          {isApexUnlock ? (
            <>
              <span>Unlock Apex</span>
              <span style={{ color: '#ffd966' }}>✦ {formatNumber(cost)}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>+</span>
              <span style={{ color: '#c79bff' }}>◈ {formatNumber(ARTIFACT_APEX_SHARD_COST)}</span>
            </>
          ) : copies === 0 ? (
            <>
              <span>Unlock</span>
              <span style={{ color: '#ffd966' }}>✦ {formatNumber(cost)}</span>
            </>
          ) : nextThreshold && copies + 1 === nextThreshold ? (
            <>
              <span>Buy Copy → ML {level + 1}</span>
              <span style={{ color: '#ffd966' }}>✦ {formatNumber(cost)}</span>
            </>
          ) : (
            <>
              <span>Buy Copy</span>
              <span style={{ color: '#ffd966' }}>✦ {formatNumber(cost)}</span>
            </>
          )}
        </button>
      ) : (
        <div style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          background: `linear-gradient(90deg, ${setColor}40, #c79bff30)`,
          border: `1px solid ${setColor}80`,
          color: setColor,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          ✦ Apex Form Achieved ✦
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dissolve panel
// ────────────────────────────────────────────────────────────────────────────

const EMPTY_CARD_LOCKS: Readonly<Record<string, number>> = Object.freeze({});

function DissolvePanel() {
  const collection = useStore(s => s.progress.collection);
  // Stable fallback: returning a fresh `{}` here triggers Zustand v5's
  // "getSnapshot should be cached" infinite-render loop → black screen.
  const cardLocks = useStore(s => s.progress.cardLocks ?? EMPTY_CARD_LOCKS);
  const dissolveCard = useStore(s => s.dissolveCard);
  const dissolveAllUnlocked = useStore(s => s.dissolveAllUnlocked);
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [confirmBulk, setConfirmBulk] = useState(false);

  const entries = useMemo(() => {
    const rows: Array<{ id: string; name: string; rarity: string; element: string; count: number; locked: number; dissolvable: number }> = [];
    for (const [id, count] of Object.entries(collection)) {
      if (count <= 0) continue;
      const def = CardRegistry.get(id);
      if (!def) continue;
      const starterLocked = STARTER_COLLECTION[id] ?? 0;
      const userLocked = cardLocks[id] ?? 0;
      const locked = starterLocked + userLocked;
      const dissolvable = Math.max(0, count - locked);
      rows.push({ id, name: def.name, rarity: def.rarity, element: def.element, count, locked, dissolvable });
    }
    if (rarityFilter !== 'All') return rows.filter(r => r.rarity === rarityFilter);
    return rows.sort((a, b) =>
      RARITY_ORDER.indexOf(b.rarity as typeof RARITY_ORDER[number]) - RARITY_ORDER.indexOf(a.rarity as typeof RARITY_ORDER[number]) ||
      a.name.localeCompare(b.name),
    );
  }, [collection, cardLocks, rarityFilter]);

  // Bulk dissolve totals (counts ALL unlocked across the whole collection,
  // regardless of the active rarity filter).
  const bulkTotals = useMemo(() => {
    let totalCards = 0;
    let totalLight = 0;
    for (const [id, count] of Object.entries(collection)) {
      if (count <= 0) continue;
      const def = CardRegistry.get(id);
      if (!def) continue;
      const starterLocked = STARTER_COLLECTION[id] ?? 0;
      const userLocked = cardLocks[id] ?? 0;
      const dissolvable = Math.max(0, count - starterLocked - userLocked);
      if (dissolvable <= 0) continue;
      const lightYield = getCardDissolveYield(def.rarity, def.element);
      totalCards += dissolvable;
      totalLight += dissolvable * lightYield;
    }
    return { totalCards, totalLight };
  }, [collection, cardLocks]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#ffd966', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
          Dissolve
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', flex: 1 }}>
          Convert duplicate cards into universal Card-bane Light. Yields scale with rarity.
        </div>
        {/* Bulk dissolve */}
        {confirmBulk ? (
          <>
            <button
              onClick={() => { dissolveAllUnlocked(); setConfirmBulk(false); }}
              style={{
                padding: '6px 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 16,
                background: 'rgba(184, 92, 79, 0.22)',
                border: '1px solid rgba(184, 92, 79, 0.7)',
                color: '#ffb8a8',
                cursor: 'pointer',
                fontWeight: 700,
              }}
              title={`Dissolve ${bulkTotals.totalCards} unlocked ${bulkTotals.totalCards === 1 ? 'copy' : 'copies'} for +${bulkTotals.totalLight} ✨`}
            >
              Confirm · {bulkTotals.totalCards} → +{bulkTotals.totalLight} ✨
            </button>
            <button
              onClick={() => setConfirmBulk(false)}
              style={{
                padding: '6px 12px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
              }}
            >Cancel</button>
          </>
        ) : (
          <button
            onClick={() => setConfirmBulk(true)}
            disabled={bulkTotals.totalCards <= 0}
            style={{
              padding: '6px 14px',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: 16,
              background: bulkTotals.totalCards > 0 ? 'rgba(255, 217, 102, 0.14)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${bulkTotals.totalCards > 0 ? 'rgba(255, 217, 102, 0.55)' : 'rgba(255,255,255,0.1)'}`,
              color: bulkTotals.totalCards > 0 ? '#ffd966' : 'rgba(255,255,255,0.35)',
              cursor: bulkTotals.totalCards > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 700,
            }}
            title={bulkTotals.totalCards > 0
              ? `Dissolve every unlocked copy of every card (${bulkTotals.totalCards} → +${bulkTotals.totalLight} ✨)`
              : 'No unlocked copies available to dissolve'}
          >
            Dissolve All Unlocked
          </button>
        )}
      </div>

      {/* Rarity filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All', ...RARITY_ORDER] as const).map(r => {
          const active = rarityFilter === r;
          const color = r === 'All' ? '#ffd966' : RARITY_COLORS[r as string];
          return (
            <button
              key={r}
              onClick={() => setRarityFilter(r as string)}
              style={{
                padding: '6px 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 16,
                background: active ? `${color}25` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? color + '70' : 'rgba(255,255,255,0.08)'}`,
                color: active ? color : 'rgba(255,255,255,0.55)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {r}{r !== 'All' && (<span style={{ marginLeft: 6, opacity: 0.6 }}>+{RARITY_POWDER_YIELD[r]} ✦</span>)}
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 13,
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 12,
        }}>
          No cards available to dissolve in this filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {entries.map(e => {
            const color = RARITY_COLORS[e.rarity] ?? '#ccc';
            const yield_ = getCardDissolveYield(e.rarity, e.element);
            const canDissolve = e.dissolvable > 0;
            return (
              <button
                key={e.id}
                onClick={() => { if (canDissolve) dissolveCard(e.id); }}
                disabled={!canDissolve}
                title={canDissolve
                  ? `${e.name} · ${e.rarity}${e.locked > 0 ? ` · ${e.locked} starter ${e.locked === 1 ? 'copy' : 'copies'} locked` : ''}`
                  : `${e.name} · All ${e.count} ${e.count === 1 ? 'copy is' : 'copies are'} starter-locked`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: canDissolve ? `linear-gradient(90deg, ${color}12, transparent)` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${canDissolve ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                  color: '#fff',
                  cursor: canDissolve ? 'pointer' : 'not-allowed',
                  opacity: canDissolve ? 1 : 0.55,
                  textAlign: 'left',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={ev => { if (canDissolve) ev.currentTarget.style.background = `linear-gradient(90deg, ${color}28, ${color}08)`; }}
                onMouseLeave={ev => { if (canDissolve) ev.currentTarget.style.background = `linear-gradient(90deg, ${color}12, transparent)`; }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 10, color, letterSpacing: '0.08em', marginTop: 2 }}>
                    {e.rarity.toUpperCase()} · ×{e.count}
                    {e.locked > 0 && (
                      <span style={{ color: '#ffd966', marginLeft: 6, letterSpacing: '0.04em' }}>
                        🔒 {e.locked}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: canDissolve ? '#ffd966' : 'rgba(255,255,255,0.3)', fontWeight: 700, marginLeft: 8 }}>
                  +{yield_} ✦
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Silence unused-import warning for ARTIFACT_DEFINITIONS — referenced indirectly via getArtifactsForSet.
void ARTIFACT_DEFINITIONS;
