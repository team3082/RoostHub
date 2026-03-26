
import { MouseEvent } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { Trophy, X } from 'lucide-react';
import { C } from '../../components/analytics/theme';
import {
  PicklistSlot,
  TeamStats,
  hasFittedBps,
  formatBps,
  NOT_ENOUGH_DATA_MODEL,
} from '../../components/analytics/types';

interface TeamDetailProps {
  team: TeamStats;
  onClose: () => void;
  fieldAvgShootTime: number;
}

export function TeamDetail({ team, onClose, fieldAvgShootTime }: TeamDetailProps) {
  const trendData = team.matchHistory.map((h) => ({
    match: `M${h.match}`,
    shootTime: parseFloat(h.shootTime.toFixed(1)),
    climbs: h.climbs,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,62,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl border w-full max-w-2xl overflow-y-auto shadow-2xl"
        style={{ background: C.white, borderColor: C.border, maxHeight: '88vh' }}
      >
        <div
          className="px-6 py-5 border-b flex justify-between items-center"
          style={{ borderColor: C.border, background: C.purple }}
        >
          <div>
            <h2 className="text-2xl font-black text-white">Team {team.teamNumber}</h2>
            <span className="text-sm" style={{ color: '#c7c7e8' }}>
              {team.totalMatches} matches ·{' '}
              {hasFittedBps(team) ? `${team.poissonModel} model` : NOT_ENOUGH_DATA_MODEL}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'BPS',
                value: formatBps(team, 3),
                sub:
                  hasFittedBps(team) && team.bpsCiWidth > 0
                    ? `±${(team.bpsCiWidth / 2).toFixed(3)}`
                    : NOT_ENOUGH_DATA_MODEL,
                color: C.purple,
              },
              { label: 'Climb Score', value: team.climbScore.toFixed(1), sub: 'avg/match', color: C.purpleMid },
              { label: 'Driving', value: `${team.drivingRating.toFixed(1)}/10`, sub: '', color: C.purpleMid },
              { label: 'Accuracy', value: `${team.accuracyRating.toFixed(2)}/10`, sub: '', color: C.purpleMid },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 border" style={{ background: C.purplePale, borderColor: '#c7d2fe' }}>
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.sub }}>
                  {s.label}
                </div>
                <div className="text-xl font-black" style={{ color: s.color }}>
                  {s.value}
                </div>
                {s.sub && (
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {s.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {trendData.length >= 2 && (
            <div>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: C.sub }}>
                Match Trend
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: C.border }}>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="match" tick={{ fill: C.sub, fontSize: 10 }} />
                    <YAxis tick={{ fill: C.sub, fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: C.white,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      labelStyle={{ color: C.text, fontWeight: 700 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="shootTime"
                      stroke={C.purple}
                      strokeWidth={2}
                      dot={{ fill: C.purple, r: 3 }}
                      name="Shoot Time (s)"
                    />
                    <Line
                      type="monotone"
                      dataKey="climbs"
                      stroke={C.purpleMid}
                      strokeWidth={2}
                      dot={{ fill: C.purpleMid, r: 3 }}
                      name="Climbs"
                    />
                    <ReferenceLine y={fieldAvgShootTime} stroke={C.muted} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ borderColor: C.border }}>
              <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: C.sub }}>
                Shooting
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  ['Auto shoot time', `${team.autoShootTime.toFixed(1)}s`],
                  ['Teleop shoot time', `${team.teleopShootTime.toFixed(1)}s`],
                  ['Auto shots', team.autoShots.toFixed(1)],
                  ['Teleop shots', team.teleopShots.toFixed(1)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: C.sub }}>{k}</span>
                    <span className="font-bold" style={{ color: C.text }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: C.border }}>
              <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: C.sub }}>
                Climbing
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {[
                  ['Auto L1', team.autoClimb.toFixed(2)],
                  ['Teleop L1', team.teleopClimbL1.toFixed(2)],
                  ['Teleop L2', team.teleopClimbL2.toFixed(2)],
                  ['Teleop L3', team.teleopClimbL3.toFixed(2)],
                  ['End climb', team.endClimb.toFixed(2)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: C.sub }}>{k}</span>
                    <span className="font-bold" style={{ color: C.text }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: C.border }}>
            <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: C.sub }}>
              Positioning (% of matches)
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                ['Depot', team.usedDepot],
                ['Outpost', team.usedOutpost],
                ['Bump', team.usedBump],
                ['Trench', team.usedTrench],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-lg py-3" style={{ background: C.purplePale }}>
                  <div className="text-lg font-black" style={{ color: C.purple }}>
                    {((v as number) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs" style={{ color: C.sub }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
