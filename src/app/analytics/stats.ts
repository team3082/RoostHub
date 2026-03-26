import { MatchData } from '@/types/match-data';
import { NOT_ENOUGH_DATA_MODEL, TeamStats } from '../../components/analytics/types';

const CLIMB_W = { L1: 1, L2: 2, L3: 3, end: 5 };

export function computeTeamStats(matchData: MatchData[]): TeamStats[] {
  const map = new Map<number, { raw: MatchData[]; t: TeamStats; defM: number; accM: number }>();

  for (const m of matchData) {
    if (!map.has(m.team_number)) {
      map.set(m.team_number, {
        raw: [],
        defM: 0,
        accM: 0,
        t: {
          teamNumber: m.team_number,
          totalMatches: 0,
          bps: 0,
          bpsCiLow: 0,
          bpsCiHigh: 0,
          bpsCiWidth: 0,
          poissonModel: NOT_ENOUGH_DATA_MODEL,
          autoShootTime: 0,
          teleopShootTime: 0,
          totalShootTime: 0,
          autoShots: 0,
          teleopShots: 0,
          autoClimb: 0,
          teleopClimbL1: 0,
          teleopClimbL2: 0,
          teleopClimbL3: 0,
          endClimb: 0,
          climbScore: 0,
          usedDepot: 0,
          usedOutpost: 0,
          usedBump: 0,
          usedTrench: 0,
          defenseRating: 0,
          drivingRating: 0,
          accuracyRating: 0,
          matchHistory: [],
          noShootingMatches: 0,
          disabledMatches: 0,
        },
      });
    }

    const e = map.get(m.team_number)!;
    e.raw.push(m);
    const t = e.t;

    const at = (m.auto_shooting_times || []).reduce((s, v) => s + v, 0);
    const tt = (m.teleop_shooting_times || []).reduce((s, v) => s + v, 0);
    const as_ = (m.auto_shooting_times || []).length;
    const ts_ = (m.teleop_shooting_times || []).length;

    t.totalMatches++;
    t.autoShootTime += at;
    t.teleopShootTime += tt;
    t.totalShootTime += at + tt;
    t.autoShots += as_;
    t.teleopShots += ts_;

    t.autoClimb += m.auto_L1_climb;
    t.teleopClimbL1 += m.teleop_L1_climb;
    t.teleopClimbL2 += m.teleop_L2_climb;
    t.teleopClimbL3 += m.teleop_L3_climb;
    t.endClimb += m.end_climb;

    t.climbScore +=
      m.auto_L1_climb * CLIMB_W.L1 +
      m.teleop_L1_climb * CLIMB_W.L1 +
      m.teleop_L2_climb * CLIMB_W.L2 +
      m.teleop_L3_climb * CLIMB_W.L3 +
      m.end_climb * CLIMB_W.end;

    t.usedDepot += m.auto_used_depot + m.teleop_used_depot > 0 ? 1 : 0;
    t.usedOutpost += m.auto_used_outpost + m.teleop_used_outpost > 0 ? 1 : 0;
    t.usedBump += m.auto_bump + m.teleop_bump > 0 ? 1 : 0;
    t.usedTrench += m.auto_trench + m.teleop_trench > 0 ? 1 : 0;

    t.defenseRating += m.defense_rank > 0 ? m.defense_rank : 0;
    t.drivingRating += m.driving_rank;
    t.accuracyRating += m.accuracy_rank !== -10 ? m.accuracy_rank : 0;
    t.noShootingMatches += m.no_shooting ? 1 : 0;
    t.disabledMatches += m.disabled && m.disabled !== '' ? 1 : 0;

    if (m.defense_rank > 0) e.defM++;
    if (m.accuracy_rank !== -10) e.accM++;

    t.matchHistory.push({
      match: m.match_number,
      shootTime: at + tt,
      climbs: m.auto_L1_climb + m.teleop_L1_climb + m.teleop_L2_climb + m.teleop_L3_climb + m.end_climb,
    });
  }

  return Array.from(map.values()).map(({ t, raw, defM, accM }) => {
    const n = t.totalMatches || 1;
    const dm = defM || 1;
    const am = accM || 1;
    const shots = raw.reduce(
      (s, m) => s + (m.auto_shooting_times || []).length + (m.teleop_shooting_times || []).length,
      0,
    );

    return {
      ...t,
      bps: t.totalShootTime > 0 ? shots / t.totalShootTime : 0,
      autoShootTime: t.autoShootTime / n,
      teleopShootTime: t.teleopShootTime / n,
      totalShootTime: t.totalShootTime / n,
      autoShots: t.autoShots / n,
      teleopShots: t.teleopShots / n,
      autoClimb: t.autoClimb / n,
      teleopClimbL1: t.teleopClimbL1 / n,
      teleopClimbL2: t.teleopClimbL2 / n,
      teleopClimbL3: t.teleopClimbL3 / n,
      endClimb: t.endClimb / n,
      climbScore: t.climbScore / n,
      usedDepot: t.usedDepot / n,
      usedOutpost: t.usedOutpost / n,
      usedBump: t.usedBump / n,
      usedTrench: t.usedTrench / n,
      defenseRating: t.defenseRating / dm,
      drivingRating: t.drivingRating / n,
      accuracyRating: t.accuracyRating / am / 10,
      matchHistory: t.matchHistory.sort((a, b) => a.match - b.match),
    };
  });
}
