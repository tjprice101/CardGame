export function getLinearEncounterHp(
  dungeonIndex: number,
  encounterIndex: number,
  encounterCount: number,
  baseHp: number,
  dungeonStep: number,
): number {
  const normalizedDungeon = Math.max(0, Math.floor(dungeonIndex));
  const normalizedEncounter = Math.max(0, Math.min(Math.max(0, encounterCount - 1), Math.floor(encounterIndex)));
  const dungeonProgress = normalizedDungeon * Math.max(0, encounterCount - 2) * Math.max(0, dungeonStep);
  const encounterProgress = normalizedEncounter * Math.max(0, dungeonStep);
  return Math.round(Math.max(0, baseHp + dungeonProgress + encounterProgress));
}
