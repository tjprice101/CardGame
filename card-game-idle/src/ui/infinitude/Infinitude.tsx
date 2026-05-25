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
        return {
          recipe,
          definition,
          setKey,
          setLabel: ELEMENT_SET_NAMES[setKey] ?? setKey,
          originalIndex,
        };
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

  const selectedRecipe = orderedRecipes.find(entry => entry.recipe.resultId === selectedRecipeId)?.recipe ?? null;
  const [listFilter, setListFilter] = useState<'all' | 'event'>('all');

  const filteredRecipes = listFilter === 'event'
    ? orderedRecipes.filter(e => e.recipe.resultId.startsWith('inf-wuas-'))
    : orderedRecipes.filter(e => !e.recipe.resultId.startsWith('inf-wuas-'));

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

  return (
    <div style={{ ...styles.backdrop, ['--ui-accent' as any]: '220, 224, 255', ['--ui-accent-soft' as any]: '240, 242, 255' }}>
      <div className="ui-panel-intro" style={styles.panel}>
        {/* ── Header ── */}
        <div style={{ ...styles.header, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="ui-title-glow" style={styles.headerTitle}>INFINITUDE</div>
            <div style={styles.headerSub}>Merge Eternal cards to forge Infinite power</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Close">✕</button>
        </div>

        {/* ── Splash art ── */}
        <img
          src="/assets/InfiniteCardsMenuArt.png"
          alt="Infinitude"
          style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block', flexShrink: 0 }}
        />

        {/* ── Filter tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(220,224,255,0.18)', background: 'rgba(12,12,20,0.6)', flexShrink: 0 }}>
          {(['all', 'event'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setListFilter(tab);
                const nextList = tab === 'event'
                  ? orderedRecipes.filter(e => e.recipe.resultId.startsWith('inf-wuas-'))
                  : orderedRecipes.filter(e => !e.recipe.resultId.startsWith('inf-wuas-'));
                if (!nextList.some(e => e.recipe.resultId === selectedRecipeId)) {
                  setSelectedRecipeId(nextList[0]?.recipe.resultId ?? null);
                }
              }}
              style={{
                padding: '8px 20px', fontSize: 11, cursor: 'pointer', border: 'none', outline: 'none',
                fontFamily: 'inherit', letterSpacing: 1.2, textTransform: 'uppercase',
                background: listFilter === tab ? 'rgba(184,200,255,0.1)' : 'transparent',
                color: listFilter === tab ? '#b8c8ff' : 'rgba(220,224,255,0.4)',
                borderBottom: listFilter === tab ? '2px solid #b8c8ff' : '2px solid transparent',
              }}
            >
              {tab === 'all' ? 'All Formulas' : '✦ Event Cards'}
            </button>
          ))}
        </div>

        {/* ── Main layout: recipe list + detail ── */}
        <div style={styles.body}>
          {/* ── Left: recipe list ── */}
          <div style={styles.recipeList}>
            <div style={styles.listHeading}>SELECT FORMULA</div>
            {filteredRecipes.map((entry, index) => {
              const { recipe, definition: def, setLabel } = entry;
              const ready = canCombine(recipe);
              const owned = progress.infiniteCollection[recipe.resultId] ?? 0;
              const isSelected = recipe.resultId === selectedRecipeId;
              const previousSetLabel = index > 0 ? filteredRecipes[index - 1]?.setLabel : null;
              const showSetHeading = index === 0 || previousSetLabel !== setLabel;

              return (
                <Fragment key={recipe.resultId}>
                  {showSetHeading && (
                    <div style={styles.setHeading}>{setLabel}</div>
                  )}
                  <button
                    onClick={() => setSelectedRecipeId(recipe.resultId)}
                    title={def ? getCardPreviewLines(def, 4).join('\n') : recipe.resultId}
                    style={{
                      ...styles.recipeRow,
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(220,224,255,0.14) 0%, rgba(30,30,46,0.96) 100%)'
                        : 'rgba(18,18,26,0.7)',
                      borderLeft: isSelected ? `3px solid ${INFINITE_COLOR}` : '3px solid transparent',
                      boxShadow: isSelected ? `0 0 8px ${INFINITE_GLOW}` : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: INFINITE_COLOR,
                        letterSpacing: 0.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {def?.name ?? recipe.resultId}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(200,200,220,0.65)', marginTop: 1 }}>
                        {setLabel}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {owned > 0 && (
                        <div style={{ fontSize: 9, background: 'rgba(232,232,240,0.18)', borderRadius: 4, padding: '1px 5px', color: INFINITE_COLOR }}>
                          ×{owned}
                        </div>
                      )}
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: ready ? '#8cf0a0' : 'rgba(180,180,200,0.25)',
                        boxShadow: ready ? '0 0 5px #8cf0a0' : 'none',
                      }} />
                    </div>
                  </button>
                </Fragment>
              );
            })}
          </div>

          {/* ── Right: detail ── */}
          <div style={styles.detail}>
            {selectedRecipe && resultDef ? (
              <>
                {/* Card preview */}
                <div style={styles.cardPreview}>
                  <InfiniteCardFace def={resultDef} />
                </div>

                {/* Info */}
                <div style={styles.infoBlock}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: INFINITE_COLOR, letterSpacing: 1 }}>
                    {resultDef.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(200,200,220,0.6)', marginTop: 2, letterSpacing: 1 }}>
                    {resultDef.type.toUpperCase()} · {resultDef.element.toUpperCase()} · INFINITE
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <CardEngineCallout card={resultDef} variant="detail" />
                  </div>
                  <div style={styles.loreLine}>
                    "{selectedRecipe.lore}"
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <CardRulesDigest
                      card={resultDef}
                      variant="detail"
                      abilityTextMode="canonical"
                      labelColor="rgba(200,200,220,0.54)"
                      textColor="rgba(220,220,240,0.86)"
                      sectionBackground="rgba(255,255,255,0.03)"
                      sectionBorder="rgba(255,255,255,0.12)"
                    />
                  </div>
                </div>

                {/* Ingredients */}
                <div style={styles.ingredientBlock}>
                  <div style={styles.ingredientHeading}>REQUIRED ETERNALS</div>
                  {selectedRecipe.ingredients.map(ing => {
                    const ingDef = CardRegistry.get(ing.definitionId);
                    const owned = progress.collection[ing.definitionId] ?? 0;
                    const met = owned >= ing.count;
                    return (
                      <div
                        key={ing.definitionId}
                        style={styles.ingredientRow}
                        title={ingDef ? getCardPreviewLines(ingDef, 3).join('\n') : ing.definitionId}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: met ? '#8cf0a0' : '#f08080',
                          boxShadow: met ? '0 0 5px #8cf0a0' : '0 0 4px #f08080',
                          flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: '#ff9a9a', fontWeight: 600 }}>
                            {ingDef?.name ?? ing.definitionId}
                          </span>
                          <span style={{ fontSize: 10, color: 'rgba(200,200,220,0.55)', marginLeft: 6 }}>
                            ({ingDef?.type ?? '—'})
                          </span>
                          {ingDef && (
                            <div
                              style={{
                                marginTop: 3,
                                fontSize: 9.5,
                                color: 'rgba(226, 210, 210, 0.72)',
                                lineHeight: 1.35,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {getCardPreviewLines(ingDef, 1)[0]}
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: met ? '#8cf0a0' : '#f08080',
                        }}>
                          {owned} / {ing.count}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Combine button */}
                <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                  {justCombined === selectedRecipe.resultId ? (
                    <div style={styles.successBanner}>
                      ✦ {resultDef.name} forged!
                    </div>
                  ) : (
                    <button
                      onClick={handleCombine}
                      disabled={!canCombine(selectedRecipe)}
                      style={{
                        ...styles.combineBtn,
                        opacity: canCombine(selectedRecipe) ? 1 : 0.4,
                        cursor: canCombine(selectedRecipe) ? 'pointer' : 'not-allowed',
                      }}
                    >
                      ⬡ FORGE INFINITE CARD
                    </button>
                  )}
                  {(progress.infiniteCollection[selectedRecipe.resultId] ?? 0) > 0 && (
                    <div style={styles.ownedNote}>
                      You own {progress.infiniteCollection[selectedRecipe.resultId]} of this card
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(200,200,220,0.4)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
                Select a formula to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline card face for Infinite cards ──────────────────────────────────────

function InfiniteCardFace({ def }: { def: CardDefinition }) {
  if (!def) return null;

  return (
    <div
      className={`holofoil-menu-card${def.rarity === 'Infinite' ? ' infinite-holo-bw-hover' : ''}${def.rarity === 'Eternal' ? ' eternal-holo-red-hover' : ''}`}
      title={getCardPreviewLines(def, 4).join('\n')}
      style={{
        width: 'clamp(148px, 10vw, 164px)',
        height: 'clamp(212px, 14.2vw, 232px)',
        borderRadius: 12,
        border: `1px solid rgba(214,226,255,0.58)`,
        boxShadow: `0 0 36px rgba(188,202,255,0.34), ${cardFacePalette.shadow}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...getCardFaceBackgroundStyle(def, 'holo'),
      }}
    >
      <div style={getCardNameRibbonStyle('grid')}>
        <div style={{ fontSize: previewFaceMetrics.typeSize, color: cardFacePalette.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {def.type} · {def.element} · Infinite
        </div>
        <div style={{ fontSize: previewFaceMetrics.nameSize, fontWeight: 'bold', color: cardFacePalette.text, lineHeight: 1.25, marginTop: 3 }}>
          {def.name}
        </div>
      </div>

      <div style={{ ...getCardRulesPanelStyle('grid'), maxHeight: '31%' }}>
        <div style={{ fontSize: 7, color: cardFacePalette.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 3 }}>
          ✦ Infinite ✦
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(4,4,10,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    animation: 'backdropFade 0.22s ease',
  },
  panel: {
    background: 'linear-gradient(160deg, #0d0d18 0%, #0a0a14 60%, #0e0e1a 100%)',
    border: `1px solid rgba(180,190,255,0.22)`,
    borderRadius: 16,
    boxShadow: `0 0 60px rgba(160,170,255,0.14), 0 24px 80px rgba(0,0,0,0.8)`,
    width: 'min(900px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 32px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'panelSlideUp 0.28s ease',
    fontFamily: 'Georgia, serif',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid rgba(180,190,255,0.12)',
    background: 'linear-gradient(90deg, rgba(100,110,255,0.08) 0%, transparent 60%)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 4,
    color: INFINITE_COLOR,
    textShadow: `0 0 24px ${INFINITE_GLOW}`,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(200,200,220,0.55)',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    color: 'rgba(220,220,240,0.7)',
    cursor: 'pointer',
    fontSize: 14,
    padding: '6px 10px',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  recipeList: {
    width: 220,
    flexShrink: 0,
    borderRight: '1px solid rgba(180,190,255,0.10)',
    overflowY: 'auto',
    padding: '12px 0',
    background: 'rgba(6,6,14,0.6)',
  },
  listHeading: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(180,190,255,0.45)',
    padding: '4px 14px 8px',
  },
  setHeading: {
    marginTop: 10,
    marginBottom: 4,
    padding: '0 14px',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(220,224,255,0.82)',
  },
  recipeRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px 9px 10px',
    border: 'none',
    borderRadius: 0,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
    fontFamily: 'Georgia, serif',
  },
  detail: {
    flex: 1,
    minWidth: 0,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    overflowY: 'auto',
  },
  cardPreview: {
    display: 'flex',
    justifyContent: 'center',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  loreLine: {
    fontSize: 11,
    fontStyle: 'italic',
    color: 'rgba(200,200,220,0.50)',
    marginTop: 8,
    lineHeight: 1.5,
    borderLeft: '2px solid rgba(220,224,255,0.18)',
    paddingLeft: 10,
  },
  ingredientBlock: {
    background: 'rgba(14,14,24,0.7)',
    border: '1px solid rgba(180,190,255,0.12)',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ingredientHeading: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(180,190,255,0.45)',
    marginBottom: 2,
  },
  ingredientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  combineBtn: {
    width: '100%',
    padding: '13px 0',
    background: 'linear-gradient(90deg, rgba(180,190,255,0.15) 0%, rgba(120,130,220,0.22) 50%, rgba(180,190,255,0.15) 100%)',
    border: `1px solid rgba(200,210,255,0.40)`,
    borderRadius: 10,
    color: INFINITE_COLOR,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    boxShadow: `0 0 20px rgba(180,190,255,0.18)`,
    transition: 'box-shadow 0.2s',
  },
  successBanner: {
    width: '100%',
    padding: '13px 0',
    background: 'linear-gradient(90deg, rgba(140,240,160,0.15) 0%, rgba(100,220,130,0.22) 50%, rgba(140,240,160,0.15) 100%)',
    border: '1px solid rgba(140,240,160,0.40)',
    borderRadius: 10,
    color: '#a0f0b4',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'Georgia, serif',
    boxShadow: '0 0 24px rgba(140,240,160,0.22)',
  },
  ownedNote: {
    marginTop: 8,
    fontSize: 10,
    color: 'rgba(220,220,240,0.45)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
};

