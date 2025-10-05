'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDatabaseStore } from '@/stores/database';
import { MatchData } from '@/types/match-data';
import { Trophy, Target, Users, BarChart3, ChevronUp, ChevronDown, X, Filter } from 'lucide-react';

interface TeamStats {
  teamNumber: number;
  autoPoints: number;
  teleopPoints: number;
  endgamePoints: number;
  totalPoints: number;
  totalMatches: number;
  // Auto actions
  autoCoralL1: number;
  autoCoralL2: number;
  autoCoralL3: number;
  autoCoralL4: number;
  autoNetAlgae: number;
  autoProcessorAlgae: number;
  autoAlgaeRemoved: number;
  autoLeave: number;
  // Teleop actions
  teleopCoralL1: number;
  teleopCoralL2: number;
  teleopCoralL3: number;
  teleopCoralL4: number;
  teleopNetAlgae: number;
  teleopProcessorAlgae: number;
  teleopAlgaeRemoved: number;
  // Endgame actions
  endPark: number;
  endShallow: number;
  endDeep: number;
  // Ratings
  defenseRating: number;
  drivingRating: number;
}

type SortField = keyof TeamStats;
type SortDirection = 'asc' | 'desc';
type ViewTab = 'auto' | 'teleop' | 'endgame' | 'summary';

export default function AnalyticsPage() {
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>('summary');
  const [sortField, setSortField] = useState<SortField>('totalPoints');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  
  const { matchData, loadAllMatchData, loading, error } = useDatabaseStore();

  useEffect(() => {
    loadAllMatchData();
  }, [loadAllMatchData]);

  // Calculate team statistics from match data
  const teamStats = useMemo(() => {
    const statsMap = new Map<number, TeamStats>();

    matchData.forEach((match: MatchData) => {
      if (!statsMap.has(match.team_number)) {
        statsMap.set(match.team_number, {
          teamNumber: match.team_number,
          autoPoints: 0,
          teleopPoints: 0,
          endgamePoints: 0,
          totalPoints: 0,
          totalMatches: 0,
          // Auto actions
          autoCoralL1: 0,
          autoCoralL2: 0,
          autoCoralL3: 0,
          autoCoralL4: 0,
          autoNetAlgae: 0,
          autoProcessorAlgae: 0,
          autoAlgaeRemoved: 0,
          autoLeave: 0,
          // Teleop actions
          teleopCoralL1: 0,
          teleopCoralL2: 0,
          teleopCoralL3: 0,
          teleopCoralL4: 0,
          teleopNetAlgae: 0,
          teleopProcessorAlgae: 0,
          teleopAlgaeRemoved: 0,
          // Endgame actions
          endPark: 0,
          endShallow: 0,
          endDeep: 0,
          // Ratings
          defenseRating: 0,
          drivingRating: 0,
        });
      }

      const stats = statsMap.get(match.team_number)!;
      
      // Calculate auto points (coral scoring + algae + leave)
      const autoPoints = (match.auto_coral_L1 * 3) + (match.auto_coral_L2 * 4) + 
                        (match.auto_coral_L3 * 6) + (match.auto_coral_L4 * 7) +
                        (match.auto_net_algae * 4) + (match.auto_processor_algae * 6) +
                        (match.auto_leave * 3);

      // Calculate teleop points (coral scoring + algae + endgame)
      const teleopPoints = (match.teleop_coral_L1 * 2) + (match.teleop_coral_L2 * 3) + 
                          (match.teleop_coral_L3 * 4) + (match.teleop_coral_L4 * 5) +
                          (match.teleop_net_algae * 4) + (match.teleop_processor_algae * 6) +
                          (match.end_park * 2) + (match.end_shallow * 6) + (match.end_deep * 12);

      // Calculate endgame points (separate for summary view)
      const endgamePoints = (match.end_park * 2) + (match.end_shallow * 6) + (match.end_deep * 12);

      stats.autoPoints += autoPoints;
      stats.teleopPoints += teleopPoints;
      stats.endgamePoints += endgamePoints;
      stats.totalPoints += autoPoints + teleopPoints + endgamePoints;
      stats.totalMatches += 1;
      
      // Track individual actions
      stats.autoCoralL1 += match.auto_coral_L1;
      stats.autoCoralL2 += match.auto_coral_L2;
      stats.autoCoralL3 += match.auto_coral_L3;
      stats.autoCoralL4 += match.auto_coral_L4;
      stats.autoNetAlgae += match.auto_net_algae;
      stats.autoProcessorAlgae += match.auto_processor_algae;
      stats.autoAlgaeRemoved += match.auto_algae_removed;
      stats.autoLeave += match.auto_leave;
      
      stats.teleopCoralL1 += match.teleop_coral_L1;
      stats.teleopCoralL2 += match.teleop_coral_L2;
      stats.teleopCoralL3 += match.teleop_coral_L3;
      stats.teleopCoralL4 += match.teleop_coral_L4;
      stats.teleopNetAlgae += match.teleop_net_algae;
      stats.teleopProcessorAlgae += match.teleop_processor_algae;
      stats.teleopAlgaeRemoved += match.teleop_algae_removed;
      
      stats.endPark += match.end_park;
      stats.endShallow += match.end_shallow;
      stats.endDeep += match.end_deep;
      
      stats.defenseRating += match.defense_rank;
      stats.drivingRating += match.driving_rank;
    });

    // Calculate averages
    return Array.from(statsMap.values()).map(stats => ({
      ...stats,
      autoPoints: stats.totalMatches > 0 ? stats.autoPoints / stats.totalMatches : 0,
      teleopPoints: stats.totalMatches > 0 ? stats.teleopPoints / stats.totalMatches : 0,
      endgamePoints: stats.totalMatches > 0 ? stats.endgamePoints / stats.totalMatches : 0,
      totalPoints: stats.totalMatches > 0 ? stats.totalPoints / stats.totalMatches : 0,
      // Auto averages
      autoCoralL1: stats.totalMatches > 0 ? stats.autoCoralL1 / stats.totalMatches : 0,
      autoCoralL2: stats.totalMatches > 0 ? stats.autoCoralL2 / stats.totalMatches : 0,
      autoCoralL3: stats.totalMatches > 0 ? stats.autoCoralL3 / stats.totalMatches : 0,
      autoCoralL4: stats.totalMatches > 0 ? stats.autoCoralL4 / stats.totalMatches : 0,
      autoNetAlgae: stats.totalMatches > 0 ? stats.autoNetAlgae / stats.totalMatches : 0,
      autoProcessorAlgae: stats.totalMatches > 0 ? stats.autoProcessorAlgae / stats.totalMatches : 0,
      autoAlgaeRemoved: stats.totalMatches > 0 ? stats.autoAlgaeRemoved / stats.totalMatches : 0,
      autoLeave: stats.totalMatches > 0 ? stats.autoLeave / stats.totalMatches : 0,
      // Teleop averages
      teleopCoralL1: stats.totalMatches > 0 ? stats.teleopCoralL1 / stats.totalMatches : 0,
      teleopCoralL2: stats.totalMatches > 0 ? stats.teleopCoralL2 / stats.totalMatches : 0,
      teleopCoralL3: stats.totalMatches > 0 ? stats.teleopCoralL3 / stats.totalMatches : 0,
      teleopCoralL4: stats.totalMatches > 0 ? stats.teleopCoralL4 / stats.totalMatches : 0,
      teleopNetAlgae: stats.totalMatches > 0 ? stats.teleopNetAlgae / stats.totalMatches : 0,
      teleopProcessorAlgae: stats.totalMatches > 0 ? stats.teleopProcessorAlgae / stats.totalMatches : 0,
      teleopAlgaeRemoved: stats.totalMatches > 0 ? stats.teleopAlgaeRemoved / stats.totalMatches : 0,
      // Endgame averages
      endPark: stats.totalMatches > 0 ? stats.endPark / stats.totalMatches : 0,
      endShallow: stats.totalMatches > 0 ? stats.endShallow / stats.totalMatches : 0,
      endDeep: stats.totalMatches > 0 ? stats.endDeep / stats.totalMatches : 0,
      // Rating averages
      defenseRating: stats.totalMatches > 0 ? stats.defenseRating / stats.totalMatches : 0,
      drivingRating: stats.totalMatches > 0 ? stats.drivingRating / stats.totalMatches : 0,
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
            'Coral L1 (3pts)': parseFloat((team.autoCoralL1 * 3).toFixed(1)),
            'Coral L2 (4pts)': parseFloat((team.autoCoralL2 * 4).toFixed(1)),
            'Coral L3 (6pts)': parseFloat((team.autoCoralL3 * 6).toFixed(1)),
            'Coral L4 (7pts)': parseFloat((team.autoCoralL4 * 7).toFixed(1)),
            'Net Algae (4pts)': parseFloat((team.autoNetAlgae * 4).toFixed(1)),
            'Processor Algae (6pts)': parseFloat((team.autoProcessorAlgae * 6).toFixed(1)),
            'Leave (3pts)': parseFloat((team.autoLeave * 3).toFixed(1)),
          };
        case 'teleop':
          return {
            ...baseData,
            'Coral L1 (2pts)': parseFloat((team.teleopCoralL1 * 2).toFixed(1)),
            'Coral L2 (3pts)': parseFloat((team.teleopCoralL2 * 3).toFixed(1)),
            'Coral L3 (4pts)': parseFloat((team.teleopCoralL3 * 4).toFixed(1)),
            'Coral L4 (5pts)': parseFloat((team.teleopCoralL4 * 5).toFixed(1)),
            'Net Algae (4pts)': parseFloat((team.teleopNetAlgae * 4).toFixed(1)),
            'Processor Algae (6pts)': parseFloat((team.teleopProcessorAlgae * 6).toFixed(1)),
            'Park (2pts)': parseFloat((team.endPark * 2).toFixed(1)),
            'Shallow Climb (6pts)': parseFloat((team.endShallow * 6).toFixed(1)),
            'Deep Climb (12pts)': parseFloat((team.endDeep * 12).toFixed(1)),
          };
        case 'endgame':
          return {
            ...baseData,
            'Park': parseFloat(team.endPark.toFixed(1)),
            'Shallow Climb': parseFloat(team.endShallow.toFixed(1)),
            'Deep Climb': parseFloat(team.endDeep.toFixed(1)),
          };
        default: // summary
          return {
            ...baseData,
            'Auto': parseFloat(team.autoPoints.toFixed(1)),
            'Teleop': parseFloat(team.teleopPoints.toFixed(1)),
            'Endgame': parseFloat(team.endgamePoints.toFixed(1)),
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
                  {entry.value}{activeTab === 'summary' || activeTab === 'auto' || activeTab === 'teleop' ? ' pts' : ''}
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
                <span>{error}</span>
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
              <p className="text-sm text-gray-700">Avg Match Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAndSortedTeams.length > 0 ? 
                  (filteredAndSortedTeams.reduce((sum, team) => sum + team.totalPoints, 0) / filteredAndSortedTeams.length).toFixed(1) : 
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
              label={{ value: activeTab === 'summary' || activeTab === 'auto' || activeTab === 'teleop' ? 'Average Points' : 'Average Actions', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeTab === 'summary' && (
              <>
                <Bar dataKey="Auto" stackId="a" fill="#3B82F6" name="Auto Points" />
                <Bar dataKey="Teleop" stackId="a" fill="#10B981" name="Teleop Points" />
                <Bar dataKey="Endgame" stackId="a" fill="#F59E0B" name="Endgame Points" />
              </>
            )}
            {activeTab === 'auto' && (
              <>
                <Bar dataKey="Coral L1 (3pts)" stackId="a" fill="#DDD6FE" name="Coral L1 (3pts)" />
                <Bar dataKey="Coral L2 (4pts)" stackId="a" fill="#C4B5FD" name="Coral L2 (4pts)" />
                <Bar dataKey="Coral L3 (6pts)" stackId="a" fill="#A78BFA" name="Coral L3 (6pts)" />
                <Bar dataKey="Coral L4 (7pts)" stackId="a" fill="#7C3AED" name="Coral L4 (7pts)" />
                <Bar dataKey="Net Algae (4pts)" stackId="a" fill="#A7F3D0" name="Net Algae (4pts)" />
                <Bar dataKey="Processor Algae (6pts)" stackId="a" fill="#059669" name="Processor Algae (6pts)" />
                <Bar dataKey="Leave (3pts)" stackId="a" fill="#FBBF24" name="Leave (3pts)" />
              </>
            )}
            {activeTab === 'teleop' && (
              <>
                <Bar dataKey="Coral L1 (2pts)" stackId="a" fill="#DDD6FE" name="Coral L1 (2pts)" />
                <Bar dataKey="Coral L2 (3pts)" stackId="a" fill="#C4B5FD" name="Coral L2 (3pts)" />
                <Bar dataKey="Coral L3 (4pts)" stackId="a" fill="#A78BFA" name="Coral L3 (4pts)" />
                <Bar dataKey="Coral L4 (5pts)" stackId="a" fill="#7C3AED" name="Coral L4 (5pts)" />
                <Bar dataKey="Net Algae (4pts)" stackId="a" fill="#A7F3D0" name="Net Algae (4pts)" />
                <Bar dataKey="Processor Algae (6pts)" stackId="a" fill="#059669" name="Processor Algae (6pts)" />
                <Bar dataKey="Park (2pts)" stackId="a" fill="#FECACA" name="Park (2pts)" />
                <Bar dataKey="Shallow Climb (6pts)" stackId="a" fill="#F87171" name="Shallow Climb (6pts)" />
                <Bar dataKey="Deep Climb (12pts)" stackId="a" fill="#DC2626" name="Deep Climb (12pts)" />
              </>
            )}
            {activeTab === 'endgame' && (
              <>
                <Bar dataKey="Park" stackId="a" fill="#FECACA" name="Park" />
                <Bar dataKey="Shallow Climb" stackId="a" fill="#F87171" name="Shallow Climb" />
                <Bar dataKey="Deep Climb" stackId="a" fill="#DC2626" name="Deep Climb" />
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
                <SortableHeader field="autoPoints" label="Auto Avg" />
                <SortableHeader field="teleopPoints" label="Teleop Avg" />
                <SortableHeader field="endgamePoints" label="Endgame Avg" />
                <SortableHeader field="totalPoints" label="Total Avg" />
                <SortableHeader field="totalMatches" label="Matches" />
                <SortableHeader field="defenseRating" label="Defense" />
                <SortableHeader field="drivingRating" label="Driving" />
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.autoPoints.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.teleopPoints.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.endgamePoints.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.totalPoints.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.totalMatches}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.defenseRating.toFixed(1)}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.drivingRating.toFixed(1)}/10</td>
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
