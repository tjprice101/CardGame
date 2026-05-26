import ScoreDisplay from './ScoreDisplay';
import AngelStatPanel from './AngelStatPanel';
import HandDisplay from './HandDisplay';
import RadianceDisplay from './RadianceDisplay';
import EmberDisplay from './EmberDisplay';
import TrailDisplay from './TrailDisplay';
import StrainDisplay from './StrainDisplay';
import DeckStatus from './DeckStatus';
import SetEngineDisplay from './SetEngineDisplay';
import TurnControls from './TurnControls';
import BoardDisplay from './BoardDisplay';
import PendingEffectModal from './PendingEffectModal';

const styles: Record<string, React.CSSProperties> = {
  rightRail: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 'min(220px, calc(100vw - 32px))',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
    pointerEvents: 'none',
    zIndex: 14,
    background: 'rgba(5,5,7,0.52)',
    border: '1px solid rgba(244,244,248,0.1)',
    borderRadius: 14,
    padding: '12px 10px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(244,244,248,0.06)',
  },
};

export default function HUD() {
  return (
    <>
      <BoardDisplay />
      <ScoreDisplay />
      <AngelStatPanel />
      <RadianceDisplay />
      <EmberDisplay />
      <TrailDisplay />
      <StrainDisplay />
      <div style={styles.rightRail}>
        <DeckStatus />
        <TurnControls />
        <SetEngineDisplay />
      </div>
      <HandDisplay />
      <PendingEffectModal />
    </>
  );
}
