import { CardRegistry } from '@/cards/CardRegistry';
import { SET_ACCENT, SET_LABEL } from '@/data/elements';
import { useStore, selectBoard, selectProgress, selectTurn } from '@/state/store';
import { resolveCardScaling } from '@/systems/cards/CardScaling';
import { formatSummonRequirement, getSummonRequirements } from '@/systems/cards/AinSophSummonRequirements';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import CardRulesDigest from '@/ui/components/CardRulesDigest';
import { getDisplayCardTypeLabel } from '@/ui/preferences';
import { uiTypography, warmTheme } from '@/ui/theme';
import type { StackCostDefinition } from '@/types/cards';

interface CardInspectorPanelProps {
  definitionId: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  Light: '#8b671f',
  Dark: '#6f4b91',
  AinSophAur: '#405f88',
};

function previewStackCost(cost: StackCostDefinition | undefined, stacks: number): number {
  if (!cost) return 0;
  if (cost.kind === 'percentage') return Math.ceil(stacks * ((cost.value ?? 0) / 100));
  if (cost.kind === 'range') return Math.max(0, cost.min ?? 0);
  return Math.max(0, cost.value ?? 0);
}

export default function CardInspectorPanel({ definitionId }: CardInspectorPanelProps) {
  const definition = definitionId ? CardRegistry.get(definitionId) : undefined;
  const board = useStore(selectBoard);
  const turn = useStore(selectTurn);
  const progress = useStore(selectProgress);
  const scalingContext = {
    limitlessLightStacks: turn.limitlessLightStacks,
    asaFrontCount: board.frontSlots.filter(slot => slot?.type === 'AinSophAur').length,
    collectionPower: computeGlobalResonanceScore(progress),
  };

  return (
    <section
      aria-label="Card inspector"
      className="ornate-scroll"
      style={{
        margin: '10px 14px 0',
        minHeight: 126,
        maxHeight: 'clamp(126px, 22vh, 198px)',
        overflowY: 'auto',
        flexShrink: 0,
        border: '1px solid rgba(244,244,248,0.16)',
        borderRadius: 8,
        background: definition
          ? 'linear-gradient(180deg, rgba(247,239,226,0.98), rgba(232,214,187,0.97))'
          : 'linear-gradient(180deg, rgba(18,18,26,0.92), rgba(9,9,14,0.9))',
        boxShadow: definition
          ? '0 10px 26px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        padding: definition ? '10px 12px' : '14px 12px',
        fontFamily: uiTypography.body,
      }}
    >
      {!definition ? (
        <div style={{
          minHeight: 104,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 7,
          color: 'rgba(244,244,248,0.42)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: uiTypography.display, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase' }}>
            Card Inspector
          </div>
          <div style={{ fontSize: 10, lineHeight: 1.4 }}>Hover a card to inspect its abilities.</div>
        </div>
      ) : (
        <>
          <div style={{
            color: TYPE_COLORS[definition.type] ?? '#6b5a46',
            fontSize: 8,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            {getDisplayCardTypeLabel(definition.type)} · {SET_LABEL}
          </div>
          <div style={{
            color: warmTheme.accentDeep,
            fontFamily: uiTypography.display,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 8,
          }}>
            {definition.name}
          </div>
          <CardRulesDigest
            card={definition}
            variant="preview"
            maxSections={3}
            maxLinesPerSection={10}
            lineClamp={3}
            labelColor="rgba(74,48,21,0.82)"
            textColor={warmTheme.accentDeep}
            sectionBackground="transparent"
            sectionBorder="transparent"
            lightBg={true}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, color: 'rgba(52,36,20,0.94)', fontSize: 9, lineHeight: 1.35 }}>
            {definition.type === 'AinSophAur' && (
              <>
                {getSummonRequirements(definition.summonMaterials, definition.summonMaterialCount).map((requirement, index) => (
                  <span key={`${definition.definitionId}-summon-requirement-${index}`}>Requires: {formatSummonRequirement(requirement)} in the back row</span>
                ))}
                {definition.bridgeAttack && (() => {
                  const cost = previewStackCost(definition.bridgeAttack.consumesStacks, turn.limitlessLightStacks);
                  const projected = Math.max(0, Math.round(
                    definition.bridgeAttack.baseOblivion
                    + resolveCardScaling(definition.bridgeAttack.scaling, scalingContext),
                  ));
                  return (
                    <span>{definition.bridgeAttack.name} · Now {projected} Divine Light{cost > 0 ? `, costs ${cost} Stacks` : ''} · Cooldown {definition.bridgeAttack.cooldownCards} cards</span>
                  );
                })()}
              </>
            )}
            {definition.type === 'Light' && (
              <>
                {(() => {
                  const projected = Math.max(0, Math.round(
                    definition.ainAttack.baseOblivion
                    + resolveCardScaling(definition.ainAttack.scaling, scalingContext),
                  ));
                  return <span>Ain Attack · Now {projected} Divine Light · Cooldown {definition.ainAttack.cooldownCards} cards</span>;
                })()}
                {(() => {
                  const cost = previewStackCost(definition.sophAttack.stackCost, turn.limitlessLightStacks);
                  const projected = Math.max(0, Math.round(
                    definition.sophAttack.baseOblivion
                    + resolveCardScaling(definition.sophAttack.scaling, scalingContext)
                    + cost,
                  ));
                  return <span>Soph Attack · Now {projected} Divine Light{cost > 0 ? `, costs ${cost} Stacks` : ''} · Cooldown {definition.sophAttack.cooldownCards} cards</span>;
                })()}
              </>
            )}
            {definition.type === 'Dark' && (
              <span>Ain utility · after use: {definition.postActivationFate}</span>
            )}
          </div>
          <div style={{ height: 1, marginTop: 10, background: `linear-gradient(90deg, ${SET_ACCENT}88, transparent)` }} />
        </>
      )}
    </section>
  );
}
