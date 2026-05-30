import { Fragment, useMemo, useState } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { ELEMENT_SET_NAMES, getCardCategoryKey } from '@/data/elements';
import { INFINITE_RECIPES, type InfiniteRecipe } from '@/data/cards/infiniteCards';
import { PACK_DEFINITIONS } from '@/data/packs/packDefinitions';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  cardFacePalette,
  getCardFaceBackgroundStyle,
  getCardFaceMetrics,
  getCardNameRibbonStyle,
  getCardRulesPanelStyle,
} from '@/ui/cardBackgrounds';
import CardEngineCallout from '@/ui/components/CardEngineCallout';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getCardPreviewLines } from '@/ui/cardStatSummary';
import type { CardDefinition } from '@/types/cards';

const INFINITE_COLOR = '#e8e8f0';
const INFINITE_GLOW = 'rgba(220, 224, 255, 0.55)';

type RecipeListEntry = {
  recipe: InfiniteRecipe;
  definition: CardDefinition | null;
  setKey: string;
  setLabel: string;
  originalIndex: number;
};

const INFINITE_SET_ORDER = PACK_DEFINITIONS.map(pack => (
  pack.id === 'pack-snowbound-voltage' ? 'SnowboundVoltage' : pack.element
));

interface Props { onClose: () => void }

const previewFaceMetrics = getCardFaceMetrics('grid');

export default function Infinitude({ onClose }: Props) {
  const progress = useStore(selectProgress);
  const combineForInfinite = useStore(s => s.combineForInfinite);

  const orderedRecipes = useMemo<RecipeListEntry[]>(() => {
    const setRank = new Map(INFINITE_SET_ORDER.map((setKey, index) => [setKey, index]));
    return INFINITE_RECIPES
      .map((recipe, originalIndex) => {
        const definition = CardRegistry.get(recipe.resultId) ?? null;
        const setKey = definition ? getCardCategoryKey(definition) : 'Unknown';
        return { recipe, definition, setKey, setLabel: ELEMENT_SET_NAMES[setKey] ?? setKey, originalIndex };
      })
      .sort((left, right) => {
        const rankDelta = (setRank.get(left.setKey) ?? Number.MAX_SAFE_INTEGER)
          - (setRank.get(right.setKey) ?? Number.MAX_SAFE_INTEGER);
        if (rankDelta !== 0) return rankDelta;
        return left.originalIndex - right.originalIndex;
      });
  }, []);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
    orderedRecipes[0]?.recipe.resultId ?? null,
  );
  const [justCombined, setJustCombined] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<'all' | 'event'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleRecipes = useMemo(() => {
    const base = listFilter === 'event'
      ? orderedRecipes.filter(e => e.recipe.resultId.startsWith('inf-wuas-'))
      : orderedRecipes.filter(e => !e.recipe.resultId.startsWith('inf-wuas-'));
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(e =>
      (e.definition?.name?.toLowerCase().includes(q)) ||
      e.setLabel.toLowerCase().includes(q) ||
      e.recipe.resultId.toLowerCase().includes(q),
    );
  }, [orderedRecipes, listFilter, searchQuery]);

  const selectedRecipe = orderedRecipes.find(e => e.recipe.resultId === selectedRecipeId)?.recipe ?? null;
  const resultDef = selectedRecipe ? CardRegistry.get(selectedRecipe.resultId) : null;

  function canCombine(recipe: InfiniteRecipe): boolean {
    return recipe.ingredients.every(ing => (progress.collection[ing.definitionId] ?? 0) >= ing.count);
  }

  function handleCombine() {
    if (!selectedRecipe) return;
    const ok = combineForInfinite(selectedRecipe);
    if (ok) {
      setJustCombined(selectedRecipe.resultId);
      setTimeout(() => setJustCombined(null), 2200);
    }
  }

  function switchFilter(tab: 'all' | 'event') {
    setListFilter(tab);
    const nextList = tab === 'event'
      ? orderedRecipes.filter(e => e.recipe.resultId.startsWith('inf-wuas-'))
      : orderedRecipes.filter(e => !e.recipe.resultId.startsWith('inf-wuas-'));
    if (!nextList.some(e => e.recipe.resultId === selectedRecipeId)) {
      setSelectedRecipeId(nextList[0]?.recipe.resultId ?? null);
    }
  }

  const ready = selectedRecipe ? canCombine(selectedRecipe) : false;
  const ownedCount = selectedRecipe ? (progress.infiniteCollection[selectedRecipe.resultId] ?? 0) : 0;

  // Aggregate stats for the header strip.
  const totals = useMemo(() => {
    const forgedKinds = Object.values(progress.infiniteCollection ?? {}).filter(n => (n ?? 0) > 0).length;
    const totalForged = Object.values(progress.infiniteCollection ?? {}).reduce((s, n) => s + (n ?? 0), 0);
    const readyCount = orderedRecipes.filter(e => canCombine(e.recipe)).length;
    return { forgedKinds, totalForged, readyCount, totalRecipes: orderedRecipes.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, orderedRecipes]);

  return (
    <div
      style={styles.backdrop}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ ['--ui-accent']: '220, 224, 255', ['--ui-accent-soft']: '240, 242, 255' } as any)}
    >
      {/* Ambient drifting glow — replaces the busy hero image */}
      <div style={styles.ambientGlow} />

      <div className="ui-panel-intro" style={styles.panel}>

        {/* HEADER — minimal, no hero image */}
        <header style={styles.header}>
          <div style={styles.headerBrand}>
            <div className="ui-title-glow" style={styles.headerTitle}>Infinitude</div>
            <div style={styles.headerSub}>Merge Eternal cards to forge Infinite power</div>
          </div>

          <div style={styles.headerStats}>
            <Stat label="Forged" value={`${totals.forgedKinds} / ${totals.totalRecipes}`} />
            <Stat label="Copies" value={String(totals.totalForged)} />
            <Stat label="Ready" value={String(totals.readyCount)} highlight={totals.readyCount > 0} />
          </div>

          <button onClick={onClose} style={styles.closeBtn} title="Close">{'\u2715'}</button>
        </header>

        {/* BODY */}
        <div style={styles.body}>

          {/* Sidebar */}
          <aside style={styles.sidebar}>
            <div style={styles.tabRow}>
              {(['all', 'event'] as const).map(tab => {
                const active = listFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => switchFilter(tab)}
                    style={{
                      ...styles.tabBtn,
                      color: active ? INFINITE_COLOR : 'rgba(220,224,255,0.4)',
                    }}
                  >
                    <span style={active ? styles.tabBtnActiveDot : styles.tabBtnDot} />
                    {tab === 'all' ? 'All Formulas' : 'Event'}
                  </button>
                );
              })}
            </div>
            <div style={styles.searchWrap}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                style={styles.searchInput}
              />
            </div>

            <div style={styles.sidebarList}>
              {visibleRecipes.length === 0 && (
                <div style={styles.sidebarEmpty}>No formulas match.</div>
              )}
              {visibleRecipes.map((entry, index) => {
                const { recipe, definition: def, setLabel } = entry;
                const rowReady = canCombine(recipe);
                const rowOwned = progress.infiniteCollection[recipe.resultId] ?? 0;
                const isSelected = recipe.resultId === selectedRecipeId;
                const prevLabel = index > 0 ? visibleRecipes[index - 1]?.setLabel : null;
                const showSetHead = index === 0 || prevLabel !== setLabel;

                return (
                  <Fragment key={recipe.resultId}>
                    {showSetHead && (
                      <div style={styles.setHeading}>{setLabel}</div>
                    )}
                    <button
                      onClick={() => setSelectedRecipeId(recipe.resultId)}
                      title={def ? getCardPreviewLines(def, 4).join('\n') : recipe.resultId}
                      style={{
                        ...styles.recipeRow,
                        color: isSelected ? INFINITE_COLOR : 'rgba(210,215,240,0.7)',
                        background: isSelected ? 'rgba(184,200,255,0.06)' : 'transparent',
                      }}
                    >
                      <span style={{
                        ...styles.recipeRowDot,
                        background: rowReady ? '#8cf0a0' : 'rgba(160,160,190,0.22)',
                        boxShadow: rowReady ? '0 0 6px #8cf0a0' : 'none',
                      }} />
                      <span style={styles.recipeRowName}>{def?.name ?? recipe.resultId}</span>
                      {rowOwned > 0 && (
                        <span style={styles.ownedBadge}>{'\u00D7'}{rowOwned}</span>
                      )}
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </aside>

          {/* Detail — single calm scrolling column */}
          {selectedRecipe && resultDef ? (
            <main style={styles.detail}>
              <div style={styles.detailInner}>

                {/* Hero: card face + intro */}
                <div style={styles.detailHero}>
                  <div style={styles.cardFaceWrap}>
                    <div style={styles.cardFaceHalo} />
                    <InfiniteCardFace def={resultDef} />
                  </div>
                  <div style={styles.detailIntro}>
                    <div style={styles.cardEyebrow}>
                      {resultDef.type} {'\u00B7'} {resultDef.element} {'\u00B7'} Infinite
                    </div>
                    <h1 style={styles.cardTitle}>{resultDef.name}</h1>
                    <div style={styles.ownedNote}>
                      {ownedCount > 0
                        ? <>You have forged this Infinite <strong style={{ color: INFINITE_COLOR }}>{'\u00D7'}{ownedCount}</strong></>
                        : <span style={{ opacity: 0.55 }}>Not yet forged</span>}
                    </div>
                    {selectedRecipe.lore && (
                      <blockquote style={styles.loreQuote}>
                        {'\u201C'}{selectedRecipe.lore}{'\u201D'}
                      </blockquote>
                    )}
                  </div>
                </div>

                <div style={styles.divider} />

                {/* Ingredients */}
                <section style={styles.ingredientsSection}>
                  <div style={styles.sectionHead}>
                    <span style={styles.sectionTitle}>Required Eternals</span>
                    <span style={styles.sectionMeta}>
                      {selectedRecipe.ingredients.filter(ing =>
                        (progress.collection[ing.definitionId] ?? 0) >= ing.count
                      ).length} of {selectedRecipe.ingredients.length} ready
                    </span>
                  </div>

                  <div style={styles.ingredientsList}>
                    {selectedRecipe.ingredients.map(ing => {
                      const ingDef = CardRegistry.get(ing.definitionId);
                      const ingOwned = progress.collection[ing.definitionId] ?? 0;
                      const ingMet = ingOwned >= ing.count;
                      const pct = Math.min(1, ingOwned / ing.count);
                      return (
                        <div
                          key={ing.definitionId}
                          title={ingDef ? getCardPreviewLines(ingDef, 3).join('\n') : ing.definitionId}
                          style={styles.ingredientRow}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              ...styles.ingredientName,
                              color: ingMet ? INFINITE_COLOR : 'rgba(225,225,245,0.62)',
                            }}>
                              {ingDef?.name ?? ing.definitionId}
                            </div>
                            {ingDef && (
                              <div style={styles.ingredientSub}>
                                {ingDef.type} {'\u00B7'} {ingDef.element}
                              </div>
                            )}
                            <div style={styles.progBarTrack}>
                              <div style={{
                                ...styles.progBarFill,
                                width: `${pct * 100}%`,
                                background: ingMet ? '#9be8ad' : 'rgba(220,224,255,0.28)',
                              }} />
                            </div>
                          </div>
                          <div style={{
                            ...styles.ingredientCount,
                            color: ingMet ? '#9be8ad' : 'rgba(225,225,245,0.45)',
                          }}>
                            {ingOwned}<span style={{ opacity: 0.4 }}>&thinsp;/&thinsp;{ing.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={styles.forgeRow}>
                    {justCombined === selectedRecipe.resultId ? (
                      <div style={styles.successBanner}>
                        {'\u2726'} {resultDef.name} forged
                      </div>
                    ) : (
                      <button
                        onClick={handleCombine}
                        disabled={!ready}
                        style={{
                          ...styles.forgeBtn,
                          opacity: ready ? 1 : 0.35,
                          cursor: ready ? 'pointer' : 'not-allowed',
                          boxShadow: ready
                            ? `0 0 36px ${INFINITE_GLOW}33, inset 0 0 24px ${INFINITE_GLOW}12`
                            : 'none',
                        }}
                      >
                        Forge Infinite
                      </button>
                    )}
                    {!ready && !justCombined && (
                      <div style={styles.forgeHint}>
                        Collect every required Eternal to unlock the forge.
                      </div>
                    )}
                  </div>
                </section>

              </div>
            </main>
          ) : (
            <main style={styles.emptyDetail}>
              <div style={{ fontSize: 36, opacity: 0.14 }}>{'\u2726'}</div>
              <div style={{ fontSize: 13, color: 'rgba(200,200,220,0.4)', marginTop: 14, letterSpacing: 1 }}>
                Select a formula
              </div>
            </main>
          )}

        </div>
      </div>
    </div>
  );
}

// Small subcomponents

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: 'rgba(200,200,220,0.42)' }}>{label}</div>
      <div style={{
        fontSize: 17,
        fontWeight: 400,
        color: highlight ? '#9be8ad' : INFINITE_COLOR,
        textShadow: highlight ? '0 0 14px rgba(155,232,173,0.5)' : 'none',
        letterSpacing: 0.5,
      }}>{value}</div>
    </div>
  );
}

// Large inline card face

function InfiniteCardFace({ def }: { def: CardDefinition }) {
  if (!def) return null;
  return (
    <div
      className={`holofoil-menu-card${def.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${def.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}`}
      title={getCardPreviewLines(def, 4).join('\n')}
      style={{
        width: 'clamp(260px, 22vw, 380px)',
        height: 'clamp(370px, 31vw, 540px)',
        borderRadius: 18,
        border: '1px solid rgba(214,226,255,0.40)',
        boxShadow: '0 0 64px rgba(188,202,255,0.22), 0 22px 52px rgba(0,0,0,0.72)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ...getCardFaceBackgroundStyle(def, 'holo'),
      }}
    >
      <div style={getCardNameRibbonStyle('grid')}>
        <div style={{ fontSize: previewFaceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {def.type} {'\u00B7'} {def.element} {'\u00B7'} Infinite
        </div>
        <div style={{ fontSize: previewFaceMetrics.nameSize, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.25, marginTop: 3 }}>
          {def.name}
        </div>
      </div>
      <div style={{ ...getCardRulesPanelStyle('grid'), maxHeight: '31%' }}>
        <div style={{ fontSize: 7, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 3 }}>
          {'\u2726'} Infinite {'\u2726'}
        </div>
        <div style={{ marginBottom: 4 }}>
          <CardEngineCallout card={def} variant="compact" />
        </div>
        <CardRulesDigest
          card={def}
          variant="preview"
          abilityTextMode="canonical"
          maxSections={4}
          maxLinesPerSection={2}
          lineClamp={4}
          labelColor={cardFacePalette.textMuted}
          textColor={cardFacePalette.textSoft}
          sectionBackground="transparent"
          sectionBorder="transparent"
        />
      </div>
    </div>
  );
}

// Styles

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 0%, #0d0d22 0%, #050510 65%, #020208 100%)',
    display: 'flex',
    zIndex: 30,
    animation: 'backdropFade 0.22s ease',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    height: '70%',
    background: 'radial-gradient(ellipse, rgba(184,200,255,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
    filter: 'blur(60px)',
  },
  panel: {
    width: '100%',
    height: '100%',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px clamp(36px, 4vw, 64px) 22px',
    flexShrink: 0,
    gap: 32,
  },
  headerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 'clamp(28px, 2.6vw, 36px)',
    fontWeight: 300,
    letterSpacing: 6,
    color: '#e8e8f0',
    fontFamily: '"Cinzel", "Cormorant Garamond", serif',
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: 'rgba(200,200,220,0.42)',
    fontWeight: 300,
  },
  headerStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 36,
    marginLeft: 'auto',
    paddingRight: 18,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '1px solid rgba(220,224,255,0.18)',
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(220,224,255,0.55)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    flexShrink: 0,
  },

  // Body — two zones
  body: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'clamp(260px, 19vw, 340px) minmax(0, 1fr)',
    minHeight: 0,
    padding: '0 clamp(36px, 4vw, 64px) 36px',
    gap: 28,
  },

  // Sidebar
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    gap: 14,
  },
  tabRow: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  tabBtn: {
    flex: 1,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'color 0.18s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabBtnDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'rgba(220,224,255,0.18)',
  },
  tabBtnActiveDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#b8c8ff',
    boxShadow: '0 0 8px rgba(184,200,255,0.7)',
  },
  searchWrap: {
    flexShrink: 0,
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(220,224,255,0.10)',
    borderRadius: 8,
    color: 'rgba(225,225,245,0.85)',
    fontSize: 12,
    letterSpacing: 0.6,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.18s ease',
  },
  sidebarList: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    paddingRight: 4,
    paddingTop: 4,
  },
  sidebarEmpty: {
    padding: '24px 8px',
    color: 'rgba(200,200,220,0.35)',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  setHeading: {
    fontSize: 9.5,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: 'rgba(200,200,220,0.38)',
    padding: '18px 4px 8px',
    fontWeight: 400,
  },
  recipeRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.16s ease, color 0.16s ease',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: 0.3,
  },
  recipeRowDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  recipeRowName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ownedBadge: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: 'rgba(184,200,255,0.55)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },

  // Detail — single column
  detail: {
    overflowY: 'auto',
    minHeight: 0,
    padding: '8px 8px 24px',
  },
  detailInner: {
    maxWidth: 980,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 36,
  },
  detailHero: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: 'clamp(28px, 3.5vw, 56px)',
    alignItems: 'center',
    padding: '12px 4px',
  },
  cardFaceWrap: {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
  },
  cardFaceHalo: {
    position: 'absolute',
    inset: '-40px',
    background: 'radial-gradient(circle, rgba(220,224,255,0.18) 0%, transparent 65%)',
    pointerEvents: 'none',
    filter: 'blur(20px)',
  },
  detailIntro: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    minWidth: 0,
  },
  cardEyebrow: {
    fontSize: 10,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: 'rgba(200,200,220,0.5)',
    fontWeight: 400,
  },
  cardTitle: {
    fontSize: 'clamp(26px, 2.4vw, 34px)',
    fontWeight: 300,
    letterSpacing: 1.6,
    color: '#e8e8f0',
    margin: 0,
    fontFamily: '"Cinzel", "Cormorant Garamond", serif',
    lineHeight: 1.15,
  },
  ownedNote: {
    fontSize: 12,
    color: 'rgba(220,224,255,0.62)',
    letterSpacing: 0.5,
    fontWeight: 400,
  },
  loreQuote: {
    margin: '6px 0 0',
    padding: '4px 0 4px 16px',
    borderLeft: '1px solid rgba(184,200,255,0.18)',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: 300,
    lineHeight: 1.65,
    color: 'rgba(220,220,240,0.62)',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent 0%, rgba(184,200,255,0.16) 50%, transparent 100%)',
  },

  // Ingredients
  ingredientsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    padding: '0 4px',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: 'rgba(220,224,255,0.62)',
    fontWeight: 400,
  },
  sectionMeta: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: 'rgba(200,200,220,0.42)',
    fontVariantNumeric: 'tabular-nums',
  },
  ingredientsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  ingredientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '14px 4px',
    borderBottom: '1px solid rgba(220,224,255,0.06)',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ingredientSub: {
    fontSize: 10,
    color: 'rgba(200,200,220,0.4)',
    marginTop: 4,
    letterSpacing: 0.8,
    textTransform: 'capitalize',
  },
  ingredientCount: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0.6,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 64,
    textAlign: 'right',
    flexShrink: 0,
  },
  progBarTrack: {
    width: '100%',
    height: 2,
    background: 'rgba(220,224,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
  },
  progBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  },

  // Forge
  forgeRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  forgeBtn: {
    padding: '14px 44px',
    background: 'linear-gradient(180deg, rgba(184,200,255,0.14) 0%, rgba(184,200,255,0.06) 100%)',
    border: '1px solid rgba(220,224,255,0.32)',
    borderRadius: 999,
    color: '#e8e8f0',
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: 4.5,
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.22s ease',
    fontFamily: 'inherit',
  },
  forgeHint: {
    fontSize: 10.5,
    color: 'rgba(200,200,220,0.42)',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  successBanner: {
    padding: '14px 36px',
    background: 'linear-gradient(180deg, rgba(155,232,173,0.16) 0%, rgba(155,232,173,0.06) 100%)',
    border: '1px solid rgba(155,232,173,0.4)',
    borderRadius: 999,
    color: '#c8efd2',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadow: '0 0 16px rgba(155,232,173,0.45)',
  },

  // Empty
  emptyDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(200,200,220,0.4)',
  },
};
