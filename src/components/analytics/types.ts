export interface TeamStats {
  teamNumber: number;
  totalMatches: number;
  bps: number;
  bpsCiLow: number;
  bpsCiHigh: number;
  bpsCiWidth: number;
  poissonModel: string;
  autoShootTime: number;
  teleopShootTime: number;
  totalShootTime: number;
  autoShots: number;
  teleopShots: number;
  autoClimb: number;
  teleopClimbL1: number;
  teleopClimbL2: number;
  teleopClimbL3: number;
  endClimb: number;
  climbScore: number;
  usedDepot: number;
  usedOutpost: number;
  usedBump: number;
  usedTrench: number;
  defenseRating: number;
  drivingRating: number;
  accuracyRating: number;
  matchHistory: { match: number; shootTime: number; climbs: number }[];
  noShootingMatches: number;
  disabledMatches: number;
}

export interface PicklistSlot {
  slot: 1 | 2 | 3;
  team: TeamStats | null;
}

export interface FiringRateEstimate {
  bps: number;
  ciLow: number;
  ciHigh: number;
  ciWidth: number;
  model: string;
}

export type SortKey =
  | 'bps'
  | 'climbScore'
  | 'drivingRating'
  | 'defenseRating'
  | 'totalMatches'
  | 'totalShootTime';

export type ViewMode = 'cards' | 'table' | 'charts';

export const NOT_ENOUGH_DATA_MODEL = 'Not enough data';

export function hasFittedBps(team: TeamStats): boolean {
  return team.poissonModel !== NOT_ENOUGH_DATA_MODEL;
}

export function formatBps(team: TeamStats, digits = 3): string {
  return hasFittedBps(team) ? team.bps.toFixed(digits) : '—';
}
