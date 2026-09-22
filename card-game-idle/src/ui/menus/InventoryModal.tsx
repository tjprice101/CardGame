import { useMemo } from 'react';
import { useStore, selectProgress } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { GARDEN_MATERIAL_METADATA } from '@/data/dungeons/gardenDungeonDefinitions';
import { uiTypography, warmTheme } from '@/ui/theme';

interface Props {
  onClose: () => void;
}

const resourceIcon = (fileName: string) => `${import.meta.env.BASE_URL}assets/resource-icons/${fileName}`;
const materialIcon = (assetKey: string) => `${import.meta.env.BASE_URL}assets/dungeons/items/${assetKey}.png`;
const forgeIcon = (fileName: string) => `${import.meta.env.BASE_URL}assets/forge/${fileName}`;

function CurrencyTile(props: { name: string; value: string; description: string; iconUrl?: string; glyph?: string; glyphStyle?: React.CSSProperties }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderRadius: 10, border: `1px solid ${warmTheme.border}`, background: warmTheme.surface,
    }}>
      {props.iconUrl
        ? <img src={props.iconUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
        : <div style={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, ...props.glyphStyle }}>{props.glyph}</div>}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: uiTypography.display, fontSize: 18, color: warmTheme.text }}>{props.value}</div>
        <div style={{ fontSize: 12, color: warmTheme.textMuted }}>{props.name}</div>
        <div style={{ marginTop: 2, fontSize: 10, color: warmTheme.textFaint, lineHeight: 1.3 }}>{props.description}</div>
      </div>
    </div>
  );
}

/**
 * Main-menu-level Inventory: every currency, Garden Dungeon material, and
 * collection stat the player currently owns. Promoted out of the Garden of
 * Cards' local material tab so it covers the whole game's holdings.
 */
export default function InventoryModal({ onClose }: Props) {
  const progress = useStore(selectProgress);

  const ownedMaterials = useMemo(() => {
    return (Object.keys(GARDEN_MATERIAL_METADATA) as (keyof typeof GARDEN_MATERIAL_METADATA)[])
      .map(key => ({ key, count: progress[key] ?? 0, meta: GARDEN_MATERIAL_METADATA[key] }))
      .filter(item => item.count > 0);
  }, [progress]);

  const collectionStats = useMemo(() => {
    const byRarity: Record<string, number> = {};
    let uniqueOwned = 0;
    let totalCopies = 0;
    for (const [definitionId, copies] of Object.entries(progress.collection ?? {})) {
      if (!copies) continue;
      uniqueOwned += 1;
      totalCopies += copies;
      const rarity = CardRegistry.get(definitionId)?.rarity ?? 'Unknown';
      byRarity[rarity] = (byRarity[rarity] ?? 0) + copies;
    }
    return { uniqueOwned, totalCopies, byRarity };
  }, [progress.collection]);

  const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Enigmatic', 'Eternal', 'Infinite', 'Transcendent'];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1), transparent 45%), linear-gradient(145deg, rgba(6,7,12,0.99), rgba(10,12,20,0.99))',
      color: warmTheme.text, fontFamily: uiTypography.body, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 32px', borderBottom: `1px solid ${warmTheme.border}`, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: uiTypography.display, fontSize: 24, letterSpacing: 2, textTransform: 'uppercase' }}>Inventory</div>
          <div style={{ marginTop: 2, color: warmTheme.textMuted, fontSize: 11, letterSpacing: 0.5 }}>Every currency, material, and collection stat you currently hold.</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Inventory" className="menu-tactile-btn" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${warmTheme.border}`, background: warmTheme.surface, color: warmTheme.text, cursor: 'pointer', fontSize: 18 }}>×</button>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '20px 32px 32px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        <section>
          <div style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase', color: warmTheme.accentSoft, marginBottom: 10 }}>Currencies</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            <CurrencyTile name="Divine Light" value={Math.floor(progress.divineLight ?? 0).toLocaleString()} description="Earned from turns and boss damage." iconUrl={resourceIcon('divine-light.png')} />
            <CurrencyTile name="Aberrated Shards" value={Math.floor(progress.aberratedShards ?? 0).toLocaleString()} description="Spent on packs in the Card Store." iconUrl={resourceIcon('aberrated-shards.png')} />
            <CurrencyTile name="Card-light Shards" value={Math.floor(progress.fractureShards ?? 0).toLocaleString()} description="Refined from duplicate cards." iconUrl={resourceIcon('card-light-shards.png')} />
            <CurrencyTile
              name="Keys of Transcendence" value={(progress.keysOfTranscendence ?? 0).toLocaleString()}
              description="Used to open the Forge of Transcendence."
              iconUrl={forgeIcon('key-of-transcendence.png')}
            />
            <CurrencyTile
              name="Shards of Transcendence" value={(progress.shardsOfTranscendence ?? 0).toLocaleString()}
              description="Spent inside the Forge of Transcendence."
              iconUrl={forgeIcon('shards-of-transcendence.png')}
            />
          </div>
        </section>

        <section>
          <div style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase', color: warmTheme.accentSoft, marginBottom: 10 }}>
            Garden Dungeon Materials
          </div>
          {ownedMaterials.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {ownedMaterials.map(item => (
                <CurrencyTile key={item.key} name={item.meta.name} value={item.count.toLocaleString()} description={item.meta.description} iconUrl={materialIcon(item.meta.artAssetKey)} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: warmTheme.textMuted }}>No Garden Dungeon materials recovered yet.</div>
          )}
        </section>

        <section>
          <div style={{ fontFamily: uiTypography.display, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase', color: warmTheme.accentSoft, marginBottom: 10 }}>
            Collection Stats
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            <CurrencyTile name="Unique Cards Owned" value={collectionStats.uniqueOwned.toLocaleString()} description="Distinct card definitions in your collection." glyph="◈" />
            <CurrencyTile name="Total Copies Owned" value={collectionStats.totalCopies.toLocaleString()} description="Every copy across every card, including duplicates." glyph="▤" />
            {rarityOrder.filter(r => collectionStats.byRarity[r]).map(rarity => (
              <CurrencyTile key={rarity} name={`${rarity} Copies`} value={collectionStats.byRarity[rarity].toLocaleString()} description={`Owned copies of ${rarity}-rarity cards.`} glyph="✦" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
