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

interface PicklistPanelProps {
  slots: PicklistSlot[];
  onRemove: (s: 1 | 2 | 3) => void;
}

export function PicklistPanel({ slots, onRemove }: PicklistPanelProps) {
  const teams = slots.filter((s) => s.team).map((s) => s.team!);
  const fuelEst = teams.reduce(
    (sum, team) => sum + (hasFittedBps(team) ? team.bps * team.totalShootTime : 0),
    0,
  );
  const climbEst = teams.reduce((s, t) => s + t.climbScore, 0);

  return (
    <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: C.white, borderColor: C.border }}>
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5" style={{ color: C.purple }} />
        <span className="font-black text-base" style={{ color: C.text }}>
          Alliance Builder
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <div
            key={slot.slot}
            className="rounded-lg border p-3 min-h-[72px] flex flex-col justify-between transition-all"
            style={{ background: slot.team ? C.purplePale : C.bg, borderColor: slot.team ? C.purple : C.border }}
          >
            {slot.team ? (
              <>
                <div className="flex justify-between items-start">
                  <span className="font-black text-sm" style={{ color: C.purple }}>
                    #{slot.team.teamNumber}
                  </span>
                  <button onClick={() => onRemove(slot.slot)}>
                    <X className="w-3 h-3 hover:text-red-500" style={{ color: C.muted }} />
                  </button>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-bold" style={{ color: C.purple }}>
                    {hasFittedBps(slot.team)
                      ? `${slot.team.bps.toFixed(2)} BPS`
                      : NOT_ENOUGH_DATA_MODEL}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs" style={{ color: C.muted }}>
                  Pick {slot.slot}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {teams.length > 0 && (
        <div className="rounded-lg p-3 grid grid-cols-3 gap-2 text-center" style={{ background: C.purplePale }}>
          <div>
            <div className="text-lg font-black" style={{ color: C.purple }}>
              {fuelEst.toFixed(0)}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>
              Est. Fuel
            </div>
          </div>
          <div>
            <div className="text-lg font-black" style={{ color: C.purpleMid }}>
              {climbEst.toFixed(1)}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>
              Est. Climb
            </div>
          </div>
          <div>
            <div className="text-lg font-black" style={{ color: C.text }}>
              {(fuelEst + climbEst).toFixed(0)}
            </div>
            <div className="text-xs" style={{ color: C.sub }}>
              Total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
