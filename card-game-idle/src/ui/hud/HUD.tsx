import ScoreDisplay from './ScoreDisplay';
import AngelStatPanel from './AngelStatPanel';
import HandDisplay from './HandDisplay';
import RadianceDisplay from './RadianceDisplay';
import EmberDisplay from './EmberDisplay';
import TrailDisplay from './TrailDisplay';
import StrainDisplay from './StrainDisplay';
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
      <TrailDisplay />
      <StrainDisplay />
      <DeckStatus />
      <TurnControls />
      <HandDisplay />
      <AngelCompartment />
      <PendingEffectModal />
    </>
  );
}
