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


interface TeamCardProps {
  team: TeamStats;
  onAdd: (e: MouseEvent) => void;
  inPicklist: boolean;
  onClick: () => void;
}

export function TeamCard({ team, onAdd, inPicklist, onClick }: TeamCardProps) {
  const radarData = [
    { subject: 'Fuel', value: hasFittedBps(team) ? Math.min(team.bps * 40, 100) : 0 },
    { subject: 'Climb', value: Math.min(team.climbScore * 10, 100) },
    { subject: 'Defense', value: team.defenseRating * 10 },
    { subject: 'Driving', value: team.drivingRating * 10 },
    { subject: 'Accuracy', value: team.accuracyRating * 100 },
  ];

  return (
    <div
      onClick={onClick}
      className="rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background: C.white, borderColor: inPicklist ? C.purple : C.border, borderWidth: inPicklist ? 2 : 1 }}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-black" style={{ color: C.text }}>
              #{team.teamNumber}
            </span>
            <span className="text-xs ml-2" style={{ color: C.sub }}>
              {team.totalMatches} matches
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(e);
            }}
            disabled={inPicklist}
            className="rounded-lg px-3 py-1 text-xs font-bold transition-all"
            style={{ background: inPicklist ? C.purplePale : C.purple, color: inPicklist ? C.purple : '#fff' }}
          >
            {inPicklist ? '✓ Added' : '+ Pick'}
          </button>
        </div>

        <div style={{ height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 0, right: 12, bottom: 0, left: 12 }}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: C.sub, fontSize: 9 }} />
              <Radar dataKey="value" stroke={C.purple} fill={C.purple} fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="rounded-lg py-2" style={{ background: C.purplePale }}>
            <div className="text-base font-black" style={{ color: C.purple }}>
              {formatBps(team, 2)}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>
              BPS
            </div>
          </div>
          <div className="rounded-lg py-2" style={{ background: '#f0f4ff' }}>
            <div className="text-base font-black" style={{ color: C.purpleMid }}>
              {team.climbScore.toFixed(1)}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>
              Climb
            </div>
          </div>
          <div className="rounded-lg py-2" style={{ background: '#f0f4ff' }}>
            <div className="text-base font-black" style={{ color: C.purpleMid }}>
              {team.drivingRating.toFixed(1)}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>
              Drive
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs mb-0.5" style={{ color: C.muted }}>
            Shoot time / match
          </div>
          <Sparkline data={team.matchHistory.map((h) => h.shootTime)} color={C.purple} />
        </div>

        {(team.disabledMatches > 0 || team.noShootingMatches > 0 || team.bpsCiWidth > 0.5) && (
          <div className="flex gap-1 flex-wrap">
            {team.disabledMatches > 0 && (
              <Badge label={`Disabled ${team.disabledMatches}×`} variant="danger" />
            )}
            {team.noShootingMatches > 0 && (
              <Badge label={`No shoot ${team.noShootingMatches}×`} variant="warn" />
            )}
            {team.bpsCiWidth > 0.5 && <Badge label="Wide CI" variant="info" />}
          </div>
        )}
      </div>
    </div>
  );
}


function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return (
      <div className="w-full h-8 flex items-center justify-center text-xs" style={{ color: C.muted }}>
        –
      </div>
    );
  }

  const max = Math.max(...data, 0.01);
  const w = 100 / (data.length - 1);
  const pts = data.map((v, i) => `${i * w},${100 - (v / max) * 88}`).join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Badge({ label, variant }: { label: string; variant: 'warn' | 'danger' | 'info' }) {
  const styles = {
    warn: { background: '#fef9c3', color: '#854d0e', border: '#fde047' },
    danger: { background: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    info: { background: C.purplePale, color: C.purple, border: '#c7d2fe' },
  }[variant];

  return (
    <span className="text-xs px-2 py-0.5 rounded-full border font-medium" style={styles}>
      {label}
    </span>
  );
}

