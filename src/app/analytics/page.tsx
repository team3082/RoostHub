'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDatabaseStore } from '@/stores/database';
import { MatchData } from '@/types/match-data';
import { Trophy, Target, Users, BarChart3, ChevronUp, ChevronDown, X, Filter } from 'lucide-react';

interface TeamStats {
  teamNumber: number;
  totalMatches: number;
  // Auto actions (averages)
  autoL1Climb: number;
  autoAttemptedClimb: number;
  autoUsedDepot: number;
  autoUsedOutpost: number;
  autoBump: number;
  autoTrench: number;
  autoShootingCount: number;
  autoShootingTotalTime: number; // Total seconds spent shooting
  // Teleop actions (averages)
  teleopL1Climb: number;
  teleopL2Climb: number;
  teleopL3Climb: number;
  teleopAttemptedClimb: number;
  teleopUsedDepot: number;
  teleopUsedOutpost: number;
  teleopBump: number;
  teleopTrench: number;
  teleopShootingCount: number;
  teleopShootingTotalTime: number; // Total seconds spent shooting
  // Endgame actions (averages)
  //endNone: number;
  endClimb: number;
  endShooting: number;
  // Ratings
  defenseRating: number;
  drivingRating: number;
  accuracyRating: number;
  
}

type SortField = keyof TeamStats;
type SortDirection = 'asc' | 'desc';
type ViewTab = 'auto' | 'teleop' | 'endgame' | 'summary';

export default function AnalyticsPage() {
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>('summary');
  const [sortField, setSortField] = useState<SortField>('totalMatches');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  
  const { matchData, loadAllMatchData, loading, error } = useDatabaseStore();

  useEffect(() => {
    console.log('Analytics: Loading match data...');
    loadAllMatchData().catch(err => {
      console.error('Analytics: Failed to load match data:', err);
    });
  }, [loadAllMatchData]);

  // Calculate team statistics from match data
  const teamStats = useMemo(() => {
    console.log('Analytics: Calculating stats from', matchData.length, 'matches');
    const statsMap = new Map<number, TeamStats>();

    matchData.forEach((match: MatchData) => {
      if (!statsMap.has(match.team_number)) {
        statsMap.set(match.team_number, {
          teamNumber: match.team_number,
          totalMatches: 0,
          // Auto actions
          autoL1Climb: 0,
          autoAttemptedClimb: 0,
          autoUsedDepot: 0,
          autoUsedOutpost: 0,
          autoBump: 0,
          autoTrench: 0,
          autoShootingCount: 0,
          autoShootingTotalTime: 0,
          // Teleop actions
          teleopL1Climb: 0,
          teleopL2Climb: 0,
          teleopL3Climb: 0,
          teleopAttemptedClimb: 0,
          teleopUsedDepot: 0,
          teleopUsedOutpost: 0,
          teleopBump: 0,
          teleopTrench: 0,
          teleopShootingCount: 0,
          teleopShootingTotalTime: 0,
          // Endgame actions
          //endNone: 0,
          endClimb: 0,
          endShooting: 0,
          // Ratings
          defenseRating: 0,
          drivingRating: 0,
          accuracyRating: 0
        });
      }

      const stats = statsMap.get(match.team_number)!;
      
      // Count shooting times (arrays of doubles)
      const autoShootingCount = match.auto_shooting_times?.length || 0;
      const teleopShootingCount = match.teleop_shooting_times?.length || 0;
      
      // Calculate total shooting time (sum all times in arrays)
      const autoShootingTotalTime = match.auto_shooting_times?.reduce((sum, time) => sum + time, 0) || 0;
      const teleopShootingTotalTime = match.teleop_shooting_times?.reduce((sum, time) => sum + time, 0) || 0;
      
      stats.totalMatches += 1;
      
      // Track individual actions
      stats.autoL1Climb += match.auto_L1_climb;
      stats.autoAttemptedClimb += match.auto_attempted_climb;
      stats.autoUsedDepot += match.auto_used_depot;
      stats.autoUsedOutpost += match.auto_used_outpost;
      stats.autoBump += match.auto_bump;
      stats.autoTrench += match.auto_trench;
      stats.autoShootingCount += autoShootingCount;
      stats.autoShootingTotalTime += autoShootingTotalTime;
      //stats.autoLeave += match.auto_leave;
      
      stats.teleopL1Climb += match.teleop_L1_climb;
      stats.teleopL2Climb += match.teleop_L2_climb;
      stats.teleopL3Climb += match.teleop_L3_climb;
      stats.teleopAttemptedClimb += match.teleop_attempted_climb;
      stats.teleopUsedDepot += match.teleop_used_depot;
      stats.teleopUsedOutpost += match.teleop_used_outpost;
      stats.teleopBump += match.teleop_bump;
      stats.teleopTrench += match.teleop_trench;
      stats.teleopShootingCount += teleopShootingCount;
      stats.teleopShootingTotalTime += teleopShootingTotalTime;

      //stats.endPark += match.end_park;
      stats.endClimb += match.end_climb;
      stats.endShooting += match.end_shooting;
      
      stats.defenseRating += match.defense_rank;
      stats.drivingRating += match.driving_rank;
      stats.accuracyRating += (match.accuracy_rank || 0);
    });

    // Calculate averages
    return Array.from(statsMap.values()).map(stats => ({
      ...stats,
      // Auto averages
      autoL1Climb: stats.totalMatches > 0 ? stats.autoL1Climb / stats.totalMatches : 0,
      autoAttemptedClimb: stats.totalMatches > 0 ? stats.autoAttemptedClimb / stats.totalMatches : 0,
      autoUsedDepot: stats.totalMatches > 0 ? stats.autoUsedDepot / stats.totalMatches : 0,
      autoUsedOutpost: stats.totalMatches > 0 ? stats.autoUsedOutpost / stats.totalMatches : 0,
      autoBump: stats.totalMatches > 0 ? stats.autoBump / stats.totalMatches : 0,
      autoTrench: stats.totalMatches > 0 ? stats.autoTrench / stats.totalMatches : 0,
      autoShootingCount: stats.totalMatches > 0 ? stats.autoShootingCount / stats.totalMatches : 0,
      autoShootingTotalTime: stats.totalMatches > 0 ? stats.autoShootingTotalTime / stats.totalMatches : 0,
      //autoLeave: stats.totalMatches > 0 ? stats.autoLeave / stats.totalMatches : 0,
      // Teleop averages
      teleopL1Climb: stats.totalMatches > 0 ? stats.teleopL1Climb / stats.totalMatches : 0,
      teleopL2Climb: stats.totalMatches > 0 ? stats.teleopL2Climb / stats.totalMatches : 0,
      teleopL3Climb: stats.totalMatches > 0 ? stats.teleopL3Climb / stats.totalMatches : 0,
      teleopAttemptedClimb: stats.totalMatches > 0 ? stats.teleopAttemptedClimb / stats.totalMatches : 0,
      teleopUsedDepot: stats.totalMatches > 0 ? stats.teleopUsedDepot / stats.totalMatches : 0,
      teleopUsedOutpost: stats.totalMatches > 0 ? stats.teleopUsedOutpost / stats.totalMatches : 0,
      teleopBump: stats.totalMatches > 0 ? stats.teleopBump / stats.totalMatches : 0,
      teleopTrench: stats.totalMatches > 0 ? stats.teleopTrench / stats.totalMatches : 0,
      teleopShootingCount: stats.totalMatches > 0 ? stats.teleopShootingCount / stats.totalMatches : 0,
      teleopShootingTotalTime: stats.totalMatches > 0 ? stats.teleopShootingTotalTime / stats.totalMatches : 0,
      // Endgame averages
      //endPark: stats.totalMatches > 0 ? stats.endPark / stats.totalMatches : 0,
      endClimb: stats.totalMatches > 0 ? stats.endClimb / stats.totalMatches : 0,
      endShooting: stats.totalMatches > 0 ? stats.endShooting / stats.totalMatches : 0,
      // Rating averages
      defenseRating: stats.totalMatches > 0 ? stats.defenseRating / stats.totalMatches : 0,
      drivingRating: stats.totalMatches > 0 ? stats.drivingRating / stats.totalMatches : 0,
      accuracyRating: stats.totalMatches > 0 ? stats.accuracyRating / stats.totalMatches : 0
    }));
  }, [matchData]);

  // Filter and sort teams
  const filteredAndSortedTeams = useMemo(() => {
    let filtered = teamStats;
    
    // Apply team filter
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(team => selectedTeams.includes(team.teamNumber));
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortDirection === 'desc' ? -1 : 1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (bVal - aVal) * multiplier;
      }
      return 0;
    });
  }, [teamStats, selectedTeams, sortField, sortDirection]);

  // Create chart data based on active tab
  const getChartData = () => {
    return filteredAndSortedTeams.map((team: TeamStats) => {
      const baseData = {
        team: `${team.teamNumber}`,
        teamName: `Team ${team.teamNumber}`,
        matches: team.totalMatches,
      };

      switch (activeTab) {
        case 'auto':
          return {
            ...baseData,
            'L1 Climb': parseFloat(team.autoL1Climb.toFixed(2)),
            'Shots': parseFloat(team.autoShootingCount.toFixed(2)),
            'Shoot Time (s)': parseFloat(team.autoShootingTotalTime.toFixed(1)),
            'Depot': parseFloat(team.autoUsedDepot.toFixed(2)),
            'Outpost': parseFloat(team.autoUsedOutpost.toFixed(2)),
          };
        case 'teleop':
          return {
            ...baseData,
            'Shots': parseFloat(team.teleopShootingCount.toFixed(2)),
            'Shoot Time (s)': parseFloat(team.teleopShootingTotalTime.toFixed(1)),
            'L1 Climb': parseFloat(team.teleopL1Climb.toFixed(2)),
            'L2 Climb': parseFloat(team.teleopL2Climb.toFixed(2)),
            'L3 Climb': parseFloat(team.teleopL3Climb.toFixed(2)),
            'Depot': parseFloat(team.teleopUsedDepot.toFixed(2)),
            'Outpost': parseFloat(team.teleopUsedOutpost.toFixed(2)),
          };
        case 'endgame':
          return {
            ...baseData,
            //'Park': parseFloat(team.endPark.toFixed(2)),
            'Climb': parseFloat(team.endClimb.toFixed(2)),
            'Shooting': parseFloat(team.endShooting.toFixed(2)),
          };
        default: // summary
          return {
            ...baseData,
            'Auto Climbs': parseFloat(team.autoL1Climb.toFixed(2)),
            'Auto Shots': parseFloat(team.autoShootingCount.toFixed(2)),
            'Auto Time (s)': parseFloat(team.autoShootingTotalTime.toFixed(1)),
            'Teleop Climbs': parseFloat((team.teleopL1Climb + team.teleopL2Climb + team.teleopL3Climb).toFixed(2)),
            'Teleop Shots': parseFloat(team.teleopShootingCount.toFixed(2)),
            'Teleop Time (s)': parseFloat(team.teleopShootingTotalTime.toFixed(1)),
          };
      }
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleTeamSelection = (teamNumber: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamNumber) 
        ? prev.filter(t => t !== teamNumber)
        : [...prev, teamNumber]
    );
  };

  const availableTeams = teamStats.map(t => t.teamNumber).sort((a, b) => a - b);

  // Custom tooltip to show team name and detailed breakdown
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const teamInfo = chartData.find((team) => team.team === label);
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 max-w-xs">
          <div className="border-b border-gray-100 pb-2 mb-3">
            <p className="font-bold text-lg text-gray-900">{`Team ${label}`}</p>
            <p className="text-sm text-gray-600">{`${teamInfo?.matches} matches played`}</p>
          </div>
          <div className="space-y-2">
            {payload.map((entry, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {entry.dataKey}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {entry.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading match data...</p>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  // Sortable header component
  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <th 
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive && (
            sortDirection === 'desc' ? 
              <ChevronDown className="w-3 h-3" /> : 
              <ChevronUp className="w-3 h-3" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full max-w-none">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="font-bold">Error Loading Match Data</p>
                  <p className="text-sm mt-1">{error}</p>
                  <p className="text-xs mt-2 text-red-600">
                    Check the browser console (F12) for more details. Make sure data has been uploaded.
                  </p>
                </div>
              </div>
            </div>
          )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teamStats.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{matchData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Avg Actions/Match</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAndSortedTeams.length > 0 ? 
                  (filteredAndSortedTeams.reduce((sum, team) => 
                    sum + team.autoL1Climb + team.autoShootingCount + team.teleopL1Climb + 
                    team.teleopL2Climb + team.teleopL3Climb + team.teleopShootingCount, 0
                  ) / filteredAndSortedTeams.length).toFixed(1) : 
                  '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <button
            onClick={() => setShowTeamFilter(!showTeamFilter)}
            className="text-lg font-bold w-full h-full bg-[#32327C] text-white rounded-lg hover:bg-[#434190] transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter Teams
          </button>
        </div>
      </div>

      {/* Team Filter Dropdown */}
      {showTeamFilter && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {selectedTeams.length > 0 && (
              <button
                onClick={() => setSelectedTeams([])}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filter ({selectedTeams.length} selected)
              </button>
            )}
          </div>
          
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Select Teams:</h3>
            <div className="grid grid-cols-6 md:grid-cols-10 gap-2 max-h-32 overflow-y-auto">
              {availableTeams.map(teamNumber => (
                <label key={teamNumber} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(teamNumber)}
                    onChange={() => toggleTeamSelection(teamNumber)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-800">{teamNumber}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-white rounded-lg">
          {(['summary', 'auto', 'teleop', 'endgame'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md font-bold text-sm transition-all  ${
                activeTab === tab
                  ? 'bg-[#32327C] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab !== 'summary' ? 'Period' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {activeTab === 'summary' ? 'Team Performance Summary' :
           `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Period Actions`}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="team" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              label={{ value: 'Average Count per Match', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeTab === 'summary' && (
              <>
                <Bar dataKey="Auto Climbs" stackId="a" fill="#3B82F6" name="Auto Climbs" />
                <Bar dataKey="Auto Shots" stackId="a" fill="#10B981" name="Auto Shots" />
                <Bar dataKey="Auto Time (s)" stackId="a" fill="#06B6D4" name="Auto Time (s)" />
                <Bar dataKey="Teleop Climbs" stackId="a" fill="#F59E0B" name="Teleop Climbs" />
                <Bar dataKey="Teleop Shots" stackId="a" fill="#EF4444" name="Teleop Shots" />
                <Bar dataKey="Teleop Time (s)" stackId="a" fill="#EC4899" name="Teleop Time (s)" />
              </>
            )}
            {activeTab === 'auto' && (
              <>
                <Bar dataKey="L1 Climb" stackId="a" fill="#3B82F6" name="L1 Climb" />
                <Bar dataKey="Shots" stackId="a" fill="#10B981" name="Shots" />
                <Bar dataKey="Shoot Time (s)" stackId="a" fill="#06B6D4" name="Shoot Time (s)" />
                <Bar dataKey="Depot" stackId="a" fill="#8B5CF6" name="Depot" />
                <Bar dataKey="Outpost" stackId="a" fill="#EC4899" name="Outpost" />
              </>
            )}
            {activeTab === 'teleop' && (
              <>
                <Bar dataKey="Shots" stackId="a" fill="#8B5CF6" name="Shots" />
                <Bar dataKey="Shoot Time (s)" stackId="a" fill="#06B6D4" name="Shoot Time (s)" />
                <Bar dataKey="L1 Climb" stackId="a" fill="#FECACA" name="L1 Climb" />
                <Bar dataKey="L2 Climb" stackId="a" fill="#F87171" name="L2 Climb" />
                <Bar dataKey="L3 Climb" stackId="a" fill="#DC2626" name="L3 Climb" />
                <Bar dataKey="Depot" stackId="a" fill="#10B981" name="Depot" />
                <Bar dataKey="Outpost" stackId="a" fill="#F59E0B" name="Outpost" />
              </>
            )}
            {activeTab === 'endgame' && (
              <>
                <Bar dataKey="Climb" stackId="a" fill="#F59E0B" name="Climb" />
                <Bar dataKey="Shooting" stackId="a" fill="#D97706" name="Shooting" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sortable Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b text-gray-900">Team Rankings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <SortableHeader field="teamNumber" label="Team" />
                <SortableHeader field="totalMatches" label="Matches" />
                <SortableHeader field="autoL1Climb" label="Auto Climb" />
                <SortableHeader field="autoShootingCount" label="Auto Shots" />
                <SortableHeader field="autoShootingTotalTime" label="Auto Time (s)" />
                <SortableHeader field="teleopL1Climb" label="T-L1" />
                <SortableHeader field="teleopL2Climb" label="T-L2" />
                <SortableHeader field="teleopL3Climb" label="T-L3" />
                <SortableHeader field="teleopShootingCount" label="T-Shots" />
                <SortableHeader field="teleopShootingTotalTime" label="T-Time (s)" />
                <SortableHeader field="defenseRating" label="Defense" />
                <SortableHeader field="drivingRating" label="Driving" />
                <SortableHeader field="accuracyRating" label="Accuracy" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedTeams.map((team, index) => (
                <tr key={team.teamNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${
                      index === 0 ? 'text-yellow-600' : 
                      index === 1 ? 'text-gray-500' : 
                      index === 2 ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Team {team.teamNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.totalMatches}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.autoL1Climb.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.autoShootingCount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.autoShootingTotalTime.toFixed(1)}s</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teleopL1Climb.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teleopL2Climb.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teleopL3Climb.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teleopShootingCount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teleopShootingTotalTime.toFixed(1)}s</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.defenseRating.toFixed(1)}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.drivingRating.toFixed(1)}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.accuracyRating.toFixed(1)}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedTeams.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No Match Data</h3>
          <p className="text-gray-400">
            {selectedTeams.length > 0 
              ? "No data for selected teams. Try selecting different teams or clearing the filter."
              : "Upload some match data from tablets to see analytics here."
            }
          </p>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
