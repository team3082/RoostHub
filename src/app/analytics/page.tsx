'use client';

import { useState, useEffect, useMemo, useCallback, CSSProperties } from 'react';
import { useDatabaseStore } from '@/stores/database';
import ScoreEntryPanel, { MatchFuelScore } from '@/components/analytics/ScoreEntryPanel';
import {
  Target,
  TrendingUp,
  Users,
  ChevronUp,
  ChevronDown,
  Plus,
  Search,
  AlertCircle,
  Zap,
  Shield,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  Cell,
} from 'recharts';
import { C } from '../../components/analytics/theme';

import {
  TeamStats,
  PicklistSlot,
  SortKey,
  ViewMode,
  hasFittedBps,
  formatBps,
  NOT_ENOUGH_DATA_MODEL,
} from '../../components/analytics/types';
import { computeTeamStats } from './stats';
import { estimateFiringRates } from './firing-rates';
import { TeamDetail } from '@/components/analytics/TeamDetails';
import { TeamCard } from '@/components/analytics/TeamCard';
import { PicklistPanel } from '@/components/analytics/PicklistPanel';

export default function AnalyticsPage() {
  const { matchData, loadAllMatchData, loading, error } = useDatabaseStore();
  const [fuelScores, setFuelScores] = useState<MatchFuelScore[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('bps');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [picklist, setPicklist] = useState<PicklistSlot[]>([
    { slot: 1, team: null },
    { slot: 2, team: null },
    { slot: 3, team: null },
  ]);
  const [selectedTeam, setSelectedTeam] = useState<TeamStats | null>(null);

  useEffect(() => {
    loadAllMatchData().catch(console.error);
  }, [loadAllMatchData]);

  const baseStats = useMemo(() => computeTeamStats(matchData), [matchData]);

  const teamStats = useMemo(() => {
    if (matchData.length === 0) return baseStats;

    const rates = estimateFiringRates(matchData, fuelScores);
    return baseStats.map((team) => {
      const fit = rates.get(team.teamNumber);
      if (!fit) return team;
      return {
        ...team,
        bps: fit.bps,
        bpsCiLow: fit.ciLow,
        bpsCiHigh: fit.ciHigh,
        bpsCiWidth: fit.ciWidth,
        poissonModel: fit.model,
      };
    });
  }, [baseStats, matchData, fuelScores]);

  const sorted = useMemo(() => {
    const filtered = teamStats.filter(
      (team) => search === '' || String(team.teamNumber).includes(search),
    );

    filtered.sort((a, b) => {
      const delta = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === 'desc' ? -delta : delta;
    });

    return filtered;
  }, [teamStats, search, sortKey, sortDir]);

  const rankedFuelData = useMemo(() => {
    return teamStats
      .map((team) => {
        const fitted = hasFittedBps(team);
        const empiricalFuel = team.autoShots + team.teleopShots;
        const estimatedFuel = fitted ? team.bps * Math.max(team.totalShootTime, 0) : empiricalFuel;

        return {
          teamNumber: team.teamNumber,
          estimatedFuel,
          bps: fitted ? team.bps : 0,
          bpsError: [
            Math.max(0, team.bps - team.bpsCiLow),
            Math.max(0, team.bpsCiHigh - team.bps),
          ] as [number, number],
          fitted,
        };
      })
      .sort((a, b) => b.estimatedFuel - a.estimatedFuel)
      .slice(0, 15);
  }, [teamStats]);

  const rankedBpsData = useMemo(() => {
    return teamStats
      .filter(hasFittedBps)
      .map((team) => ({
        teamNumber: team.teamNumber,
        bps: team.bps,
        bpsError: [
          Math.max(0, team.bps - team.bpsCiLow),
          Math.max(0, team.bpsCiHigh - team.bps),
        ] as [number, number],
      }))
      .sort((a, b) => b.bps - a.bps)
      .slice(0, 15);
  }, [teamStats]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDir('desc');
  };

  const addToPicklist = useCallback((team: TeamStats) => {
    setPicklist((prev) => {
      const empty = prev.find((slot) => slot.team === null);
      if (!empty) return prev;
      return prev.map((slot) =>
        slot.slot === empty.slot ? { ...slot, team } : slot,
      );
    });
  }, []);

  const removeFromPicklist = useCallback((slot: 1 | 2 | 3) => {
    setPicklist((prev) =>
      prev.map((entry) => (entry.slot === slot ? { ...entry, team: null } : entry)),
    );
  }, []);

  const picklistNums = picklist
    .filter((slot) => slot.team)
    .map((slot) => slot.team!.teamNumber);
  const fittedTeams = teamStats.filter(hasFittedBps);

  const fieldAvgBps =
    fittedTeams.length > 0
      ? fittedTeams.reduce((sum, team) => sum + team.bps, 0) / fittedTeams.length
      : null;
  const fieldAvgClimb =
    teamStats.length > 0
      ? teamStats.reduce((sum, team) => sum + team.climbScore, 0) / teamStats.length
      : 0;
  const fieldAvgShootTime =
    teamStats.length > 0
      ? teamStats.reduce((sum, team) => sum + team.totalShootTime, 0) / teamStats.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto mb-4"
            style={{ borderColor: C.purple, borderTopColor: 'transparent' }}
          />
          <p style={{ color: C.sub }}>Loading match data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: C.purple }} />
          <span className="font-black text-lg" style={{ color: C.text }}>
            Analytics
          </span>
          <span className="text-sm hidden md:block" style={{ color: C.sub }}>
            {teamStats.length} teams · {matchData.length} records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: C.muted }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Team #"
              className="border rounded-lg pl-8 pr-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2"
              style={{
                background: C.white,
                borderColor: C.border,
                color: C.text,
                '--tw-ring-color': C.purple,
              } as CSSProperties}
            />
          </div>
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: C.border }}>
            {(['cards', 'table', 'charts'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-3 py-1.5 text-sm font-bold transition-all capitalize"
                style={{
                  background: viewMode === v ? C.purple : C.white,
                  color: viewMode === v ? '#fff' : C.sub,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-0">
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-4">
          {error && (
            <div
              className="rounded-xl p-4 border flex gap-3 items-start"
              style={{ background: '#fef2f2', borderColor: '#fca5a5' }}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.red }} />
              <div>
                <p className="font-bold text-sm" style={{ color: C.red }}>
                  Error loading data
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#b91c1c' }}>
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Teams Scouted', value: teamStats.length, icon: <Users className="w-4 h-4" /> },
              {
                label: 'Field Avg BPS',
                value: fieldAvgBps !== null ? fieldAvgBps.toFixed(3) : '—',
                icon: <Target className="w-4 h-4" />,
              },
              { label: 'Field Avg Climb', value: fieldAvgClimb.toFixed(1), icon: <TrendingUp className="w-4 h-4" /> },
              { label: 'Match Records', value: matchData.length, icon: <Shield className="w-4 h-4" /> },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="rounded-xl border p-4 flex items-center gap-3"
                style={{ background: C.white, borderColor: C.border }}
              >
                <div className="p-2 rounded-lg" style={{ background: C.purplePale, color: C.purple }}>
                  {icon}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest" style={{ color: C.sub }}>
                    {label}
                  </div>
                  <div className="text-2xl font-black tabular-nums" style={{ color: C.text }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ScoreEntryPanel onScoresChange={setFuelScores} />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-widest mr-1" style={{ color: C.sub }}>
              Sort by
            </span>
            {([
              ['bps', 'BPS'],
              ['climbScore', 'Climb'],
              ['drivingRating', 'Driving'],
              ['defenseRating', 'Defense'],
              ['totalShootTime', 'Shoot Time'],
              ['totalMatches', 'Matches'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className="border rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all"
                style={{
                  background: sortKey === key ? C.purple : C.white,
                  color: sortKey === key ? '#fff' : C.sub,
                  borderColor: sortKey === key ? C.purple : C.border,
                }}
              >
                {label}
                {sortKey === key &&
                  (sortDir === 'desc' ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  ))}
              </button>
            ))}
          </div>

          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sorted.map((team) => (
                <TeamCard
                  key={team.teamNumber}
                  team={team}
                  onAdd={() => addToPicklist(team)}
                  inPicklist={picklistNums.includes(team.teamNumber)}
                  onClick={() => setSelectedTeam(team)}
                />
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: C.purple }}>
                    {[
                      ['#', null],
                      ['Team', 'teamNumber'],
                      ['Matches', 'totalMatches'],
                      ['BPS', 'bps'],
                      ['CI', null],
                      ['Climb', 'climbScore'],
                      ['Drive', 'drivingRating'],
                      ['Defense', 'defenseRating'],
                      ['Accuracy', null],
                      ['', null],
                    ].map(([label, key]) => (
                      <th
                        key={label as string}
                        onClick={() => key && handleSort(key as SortKey)}
                        className={`px-4 py-3 text-left text-xs uppercase tracking-wider font-medium text-white ${
                          key ? 'cursor-pointer hover:bg-white/10' : ''
                        }`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((team, i) => (
                    <tr
                      key={team.teamNumber}
                      onClick={() => setSelectedTeam(team)}
                      className="border-b cursor-pointer transition-colors hover:bg-purple-50"
                      style={{ borderColor: C.border, background: i % 2 === 0 ? C.white : '#fafbff' }}
                    >
                      <td
                        className="px-4 py-3 font-black text-sm"
                        style={{
                          color:
                            i === 0 ? C.gold : i === 1 ? C.silver : i === 2 ? C.bronze : C.muted,
                        }}
                      >
                        #{i + 1}
                      </td>
                      <td className="px-4 py-3 font-black" style={{ color: C.text }}>
                        {team.teamNumber}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.sub }}>
                        {team.totalMatches}
                      </td>
                      <td className="px-4 py-3 font-black" style={{ color: C.purple }}>
                        {formatBps(team, 3)}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: team.bpsCiWidth > 0.5 ? C.yellow : C.muted }}
                      >
                        {hasFittedBps(team) && team.bpsCiWidth > 0
                          ? `±${(team.bpsCiWidth / 2).toFixed(3)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: C.purpleMid }}>
                        {team.climbScore.toFixed(1)}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.sub }}>
                        {team.drivingRating.toFixed(1)}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.sub }}>
                        {team.defenseRating > 0 ? team.defenseRating.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.sub }}>
                        {team.accuracyRating > 0 ? team.accuracyRating.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPicklist(team);
                          }}
                          disabled={picklistNums.includes(team.teamNumber)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: picklistNums.includes(team.teamNumber) ? C.muted : C.purple }}
                        >
                          {picklistNums.includes(team.teamNumber) ? '✓' : <Plus className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'charts' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.white }}>
                <div className="mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: C.text }}>
                    Ranked Estimated Fuel
                  </h3>
                  <p className="text-xs" style={{ color: C.sub }}>
                    Top 15 teams by estimated fuel contribution per match
                  </p>
                </div>

                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rankedFuelData}
                      layout="vertical"
                      margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis type="number" stroke={C.sub} tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="teamNumber"
                        type="category"
                        width={52}
                        stroke={C.sub}
                        tick={{ fontSize: 12, fontWeight: 700 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f4efff' }}
                        formatter={(value: number) => value.toFixed(2)}
                        labelFormatter={(label: number) => `Team ${label}`}
                      />
                      <Bar dataKey="estimatedFuel" radius={[0, 6, 6, 0]}>
                        {rankedFuelData.map((entry, index) => (
                          <Cell
                            key={`fuel-${entry.teamNumber}`}
                            fill={index < 3 ? C.purple : '#8A7CC9'}
                            fillOpacity={entry.fitted ? 1 : 0.55}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.white }}>
                <div className="mb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: C.text }}>
                    Ranked BPS with CI
                  </h3>
                  <p className="text-xs" style={{ color: C.sub }}>
                    Top 15 fitted teams by balls-per-second with 95% confidence error bars
                  </p>
                </div>

                <div className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rankedBpsData}
                      layout="vertical"
                      margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis type="number" stroke={C.sub} tick={{ fontSize: 12 }} domain={[0, 'dataMax']} />
                      <YAxis
                        dataKey="teamNumber"
                        type="category"
                        width={52}
                        stroke={C.sub}
                        tick={{ fontSize: 12, fontWeight: 700 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f4efff' }}
                        formatter={(value: number) => value.toFixed(3)}
                        labelFormatter={(label: number) => `Team ${label}`}
                      />
                      <Bar dataKey="bps" fill={C.purple} radius={[0, 6, 6, 0]}>
                        <ErrorBar dataKey="bpsError" width={4} strokeWidth={1.5} stroke={C.purpleMid} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {sorted.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="rounded-full p-6" style={{ background: C.purplePale }}>
                <Users className="w-12 h-12" style={{ color: C.purple }} />
              </div>
              <p className="text-lg font-bold" style={{ color: C.text }}>
                No match data yet
              </p>
              <p className="text-sm" style={{ color: C.sub }}>
                Upload data from scouting tablets to see analytics
              </p>
            </div>
          )}
        </div>

        <div
          className="w-72 border-l shrink-0 overflow-y-auto p-4 hidden lg:flex flex-col gap-4"
          style={{ borderColor: C.border }}
        >
          <PicklistPanel slots={picklist} onRemove={removeFromPicklist} />

          {teamStats.length > 0 && (
            <div className="rounded-xl border p-4" style={{ background: C.white, borderColor: C.border }}>
              <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: C.sub }}>
                Top BPS
              </div>
              <div className="flex flex-col gap-2.5">
                {fittedTeams.length === 0 && (
                  <p className="text-sm" style={{ color: C.sub }}>
                    {NOT_ENOUGH_DATA_MODEL}
                  </p>
                )}
                {[...fittedTeams]
                  .sort((a, b) => b.bps - a.bps)
                  .slice(0, 5)
                  .map((team, i) => {
                    const maxBps = fittedTeams.reduce((m, x) => Math.max(m, x.bps), 0.01);
                    return (
                      <div
                        key={team.teamNumber}
                        className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-75"
                        onClick={() => setSelectedTeam(team)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-black w-5 text-right"
                            style={{ color: i === 0 ? C.gold : C.muted }}
                          >
                            #{i + 1}
                          </span>
                          <span className="text-sm font-bold" style={{ color: C.text }}>
                            {team.teamNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: C.border }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ background: C.purple, width: `${(team.bps / maxBps) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-black tabular-nums" style={{ color: C.purple }}>
                            {formatBps(team, 3)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          fieldAvgShootTime={fieldAvgShootTime}
        />
      )}
    </div>
  );
}
