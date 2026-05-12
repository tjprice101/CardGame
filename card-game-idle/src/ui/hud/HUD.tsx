import ScoreDisplay from './ScoreDisplay';
import AngelStatPanel from './AngelStatPanel';
import HandDisplay from './HandDisplay';
import RadianceDisplay from './RadianceDisplay';
import EmberDisplay from './EmberDisplay';
import DeckStatus from './DeckStatus';
import TurnControls from './TurnControls';
import BoardDisplay from './BoardDisplay';
import PendingEffectModal from './PendingEffectModal';
import AngelCompartment from './AngelCompartment';

export default function HUD() {
  return (
    <>
      <BoardDisplay />
      <ScoreDisplay />
      <AngelStatPanel />
      <RadianceDisplay />
      <EmberDisplay />
      <DeckStatus />
      <TurnControls />
      <HandDisplay />
      <AngelCompartment />
      <PendingEffectModal />
    </>
  );
}
