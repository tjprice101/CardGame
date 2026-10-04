import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CardRegistry } from '@/cards/CardRegistry';
import { ABILITY_REGISTRY, ABILITY_ICON_FALLBACKS } from '@/data/abilities/abilityDefinitions';
import { getForgeCardLore } from '@/data/forge/forgeDefinitions';
import { useTranscendentUnlockStore, type TranscendentUnlock } from '@/state/transcendentUnlockStore';
import { getLiveCardFaceBackgroundStyle, getLiveCardShimmerClassName } from '@/ui/cardBackgrounds';
import { getCardSetId } from '@/data/elements';
import { originalItemIconUrl } from '@/ui/originalItemIcons';

export function TranscendentUnlockCeremony({ unlock, onContinue }: { unlock: TranscendentUnlock; onContinue: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const duplicate = unlock.kind === 'card' && !unlock.firstCopy;
  const card = unlock.kind === 'card' ? CardRegistry.get(unlock.definitionId) : undefined;
  const ability = unlock.kind === 'ability' ? ABILITY_REGISTRY.get(unlock.abilityId) : undefined;
  const shards = unlock.kind === 'shards';
  const name = shards ? 'Shards of Transcendence' : card ? getForgeCardLore(card.definitionId)?.displayName ?? card.name : ability?.name;
  if (!name) throw new Error('Reward ceremony requires a registered card or ability');
  const rarity = card?.rarity ?? 'Transcendent';
  const theme = shards ? 'shards' : rarity.toLowerCase();
  const setId = card ? getCardSetId(card.definitionId) : null;
  const amount = unlock.kind === 'card' ? unlock.amount ?? 1 : shards ? unlock.amount : 1;
  const heading = shards ? 'A Fragment Beyond Eternity'
    : duplicate ? rarity === 'Infinite' ? 'Infinity Resonates Again' : rarity === 'Eternal' ? 'Eternity Returns' : 'The Light Returns'
      : ability ? 'Transcendent Power Awakened' : rarity === 'Infinite' ? 'Infinity Forged' : rarity === 'Eternal' ? 'Eternity Awakened' : 'Beyond All Limits';

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    buttonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        buttonRef.current?.focus();
      }
      if (event.key === 'Escape') event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className={`transcendent-unlock-screen reward-ceremony-${theme}${setId === 'Intensity' ? ' reward-ceremony-intensity' : ''} ${duplicate ? 'transcendent-unlock-duplicate' : 'transcendent-unlock-first'}`}
      role="dialog" aria-modal="true" aria-labelledby="transcendent-unlock-title" aria-describedby="transcendent-unlock-description">
      <div className="transcendent-unlock-rays" aria-hidden="true" />
      <div className="transcendent-unlock-particles" aria-hidden="true">
        {Array.from({ length: 32 }, (_, index) => <i key={index} style={{ left: `${(index * 47.17) % 100}%`, top: `${(index * 73.31) % 100}%`, animationDelay: `${-(index % 9) * .4}s` }} />)}
      </div>
      <div className="transcendent-unlock-content">
        <div className="transcendent-unlock-eyebrow">{shards || ability || rarity === 'Transcendent' ? 'Forge of Transcendence' : setId ? `${setId} · ${rarity}` : rarity}</div>
        <h1 id="transcendent-unlock-title">{heading}</h1>
        <div className="transcendent-unlock-reveal">
          {card && <div role="img" aria-label={`${name} holofoil card`}
            className={`transcendent-unlock-card ${getLiveCardShimmerClassName(card, 'holo', 'front')}`}
            style={getLiveCardFaceBackgroundStyle(card, 'holo', 'front')} />}
          {ability && <img className="transcendent-unlock-ability"
            src={`${import.meta.env.BASE_URL}assets/ability-icons/${ability.iconAssetKey}.png`} alt={`${name} icon`}
            onError={event => {
              const fallback = ABILITY_ICON_FALLBACKS[ability.iconAssetKey];
              const url = fallback ? `${import.meta.env.BASE_URL}assets/${fallback.folder}/${encodeURIComponent(fallback.file)}` : null;
              if (url && event.currentTarget.src !== new URL(url, window.location.href).href) event.currentTarget.src = url;
              else {
                console.warn(`Transcendent unlock artwork unavailable: ${ability.iconAssetKey}`);
                event.currentTarget.style.visibility = 'hidden';
              }
            }} />}
          {shards && <img className="transcendent-unlock-ability" src={originalItemIconUrl('forge/shards-of-transcendence.png')} alt="Shards of Transcendence" />}
          {(duplicate || shards || amount > 1) && <div className="transcendent-unlock-plus">+{amount}</div>}
        </div>
        <h2>{name}</h2>
        <p id="transcendent-unlock-description">
          {unlock.kind === 'card'
            ? duplicate ? `${amount === 1 ? 'Another copy joins' : `${amount} more copies join`} your collection. ${unlock.totalOwned} copies owned.` : `Your first copy of this ${rarity} card has been unlocked.${amount > 1 ? ` ${amount} copies received.` : ''}`
            : shards ? `+${unlock.amount} Shards of Transcendence obtained. ${unlock.totalOwned.toLocaleString()} owned.`
              : 'Ability unlocked. Equip it in your Deck Builder ability loadout.'}
        </p>
        {ability && <p className="transcendent-unlock-rules">{ability.description}</p>}
        <button ref={buttonRef} type="button" className="transcendent-unlock-continue" onClick={onContinue}>Continue</button>
      </div>
    </div>
  );
}

export default function TranscendentUnlockScreen() {
  const unlock = useTranscendentUnlockStore(state => state.queue[0]);
  const dismiss = useTranscendentUnlockStore(state => state.dismiss);
  if (!unlock) return null;
  return createPortal(<TranscendentUnlockCeremony key={`${unlock.kind}:${unlock.kind === 'card' ? `${unlock.definitionId}:${unlock.totalOwned}` : unlock.kind === 'ability' ? unlock.abilityId : unlock.totalOwned}`} unlock={unlock} onContinue={dismiss} />, document.body);
}
