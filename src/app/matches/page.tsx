'use client';

import React, { useEffect, useState } from 'react';
import { useDatabaseStore } from '@/stores/database';
import { useTabletConnection } from '@/hooks/useTabletConnection';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface MatchSummary {
  match_number: number;
  teams_scouted: number[];
  total_teams: number;
  scouted_positions: string[];
}

export default function MatchesPage() {
  const {
    matchData,
    loading,
    error,
    initializeDatabase,
    loadAllMatchData,
    clearError
  } = useDatabaseStore();

  const { isConnected } = useTabletConnection();
  const [matchSummaries, setMatchSummaries] = useState<MatchSummary[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalTeamsCount, setTotalTeamsCount] = useState(0);

  useEffect(() => {
    initializeDatabase();
    loadAllMatchData();
  }, [initializeDatabase, loadAllMatchData]);

  useEffect(() => {
    if (matchData.length > 0) {
      const matchGroups = matchData.reduce((acc, match) => {
        if (!acc[match.match_number]) {
          acc[match.match_number] = [];
        }
        acc[match.match_number].push(match);
        return acc;
      }, {} as Record<number, typeof matchData>);

      const summaries: MatchSummary[] = Object.entries(matchGroups).map(([matchNum, matches]) => {
        const teams_scouted = [...new Set(matches.map(m => m.team_number))];
        const positions = [...new Set(matches.map(m => m.position))];
        
        return {
          match_number: parseInt(matchNum),
          teams_scouted,
          total_teams: teams_scouted.length,
          scouted_positions: positions
        };
      }).sort((a, b) => a.match_number - b.match_number);

      setMatchSummaries(summaries);
      setTotalMatches(summaries.length);
      
      const allTeams = new Set(matchData.map(m => m.team_number));
      setTotalTeamsCount(allTeams.size);
    } else {
      setMatchSummaries([]);
      setTotalMatches(0);
      setTotalTeamsCount(0);
    }
  }, [matchData]);

  const handleRefresh = () => {
    loadAllMatchData();
  };

  const getMatchCompletionStatus = (match: MatchSummary) => {
    if (match.total_teams >= 6) {
      return { status: 'complete', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (match.total_teams >= 3) {
      return { status: 'partial', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'incomplete', color: 'text-red-600', bg: 'bg-red-100' };
    }
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Match Overview</h1>
            <p className="text-gray-600">Track scouting progress across all matches</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {isConnected ? '📱 Tablet Connected' : '📱 No Tablet'}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={clearError} className="ml-auto text-red-700 hover:text-red-900">×</button>
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
              <p className="text-sm text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-800">{totalMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Teams Scouted</p>
              <p className="text-2xl font-bold text-gray-800">{totalTeamsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-800">{matchData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalMatches > 0 ? Math.round((matchSummaries.filter(m => m.total_teams >= 6).length / totalMatches) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Match Details</h2>
        </div>
        
        {matchSummaries.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No Match Data</h3>
            <p className="text-gray-400">Upload some scouting data from tablets to see match information here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teams Scouted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Numbers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Positions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matchSummaries.map((match) => {
                  const status = getMatchCompletionStatus(match);
                  return (
                    <tr key={match.match_number} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            Match {match.match_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.status === 'complete' && <CheckCircle2 className="w-3 h-3" />}
                          {status.status === 'partial' && <Clock className="w-3 h-3" />}
                          {status.status === 'incomplete' && <AlertCircle className="w-3 h-3" />}
                          {status.status === 'complete' ? 'Complete' : 
                           status.status === 'partial' ? 'Partial' : 'Incomplete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{match.total_teams}</span>
                          <span className="text-gray-500"> / 6 teams</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {match.teams_scouted.sort((a, b) => a - b).map((team) => (
                            <span
                              key={team}
                              className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                            >
                              {team}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {match.scouted_positions.sort().map((position) => (
                            <span
                              key={position}
                              className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                            >
                              {position}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}