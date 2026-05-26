import { getCardEngineRole } from '@/ui/setEngineSummary';
import { getActionClassLabel, getCardActionClass } from '@/systems/cards/ActionClass';
import type { CardDefinition } from '@/types/cards';

type Variant = 'compact' | 'detail';
type Tone = 'dark' | 'light';

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith('#')) return color;

  const normalized = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;

  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default function CardEngineCallout({
  card,
  variant = 'compact',
  tone = 'dark',
}: {
  card: CardDefinition;
  variant?: Variant;
  tone?: Tone;
}) {
  const role = getCardEngineRole(card);
  const actionClassLabel = getActionClassLabel(getCardActionClass(card));
  if (!role) return null;

  const isDetail = variant === 'detail';
  const isLightTone = tone === 'light';
  const background = isDetail
    ? isLightTone
      ? `linear-gradient(180deg, ${withAlpha(role.accent, 0.16)} 0%, rgba(255,255,255,0.42) 100%)`
      : `linear-gradient(180deg, ${withAlpha(role.accent, 0.12)} 0%, rgba(255,255,255,0.03) 100%)`
    : `linear-gradient(180deg, ${withAlpha(role.accent, 0.1)} 0%, rgba(255,255,255,0.02) 100%)`;
  const detailTextColor = isLightTone ? 'rgba(61, 40, 18, 0.94)' : 'rgba(236, 229, 219, 0.9)';
  const compactTextColor = isLightTone ? 'rgba(47, 27, 13, 0.92)' : 'rgba(236, 229, 219, 0.84)';

  return (
    <div
      title={role.text}
      style={{
        borderRadius: isDetail ? 12 : 10,
        border: `1px solid ${withAlpha(role.accent, isDetail ? 0.34 : 0.24)}`,
        background,
        padding: isDetail ? '9px 10px' : '6px 8px',
        boxShadow: isLightTone
          ? `inset 0 1px 0 ${withAlpha('#ffffff', 0.46)}, 0 6px 18px rgba(69, 42, 18, 0.08)`
          : `inset 0 1px 0 ${withAlpha('#ffffff', 0.05)}`,
      }}
    >
      <div style={{
        fontSize: isDetail ? 10 : 8,
        letterSpacing: isDetail ? 1.1 : 0.9,
        textTransform: 'uppercase',
        color: role.accent,
        fontWeight: 700,
        fontFamily: 'Georgia, serif',
      }}>
        {role.engineLabel} - {actionClassLabel}
      </div>
      <div style={{
        marginTop: 4,
        fontSize: isDetail ? 11.5 : 9,
        lineHeight: isDetail ? 1.45 : 1.35,
        color: isDetail ? detailTextColor : compactTextColor,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: isDetail ? 3 : 2,
        overflow: 'hidden',
        fontFamily: 'Georgia, serif',
      }}>
        {role.text}
      </div>
    </div>
  );
}