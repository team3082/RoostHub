'use client';

import React, { useEffect, useState } from 'react';
import { useDatabaseStore } from '@/stores/database';
// ...existing code... (tablet connection not used on this page)
import { 
  Trophy, 
  Users, 
  Calendar, 
  Database,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download
} from 'lucide-react';

interface MatchSummary {
  match_number: number;
  teams_scouted: number[];
  total_teams: number;
  scouted_positions: string[];
}

export default function MatchPitData() {
  const {
    matchData,
    loading,
    error,
    loadAllMatchData,
    clearError,
    exportMatchDataToCSV
  } = useDatabaseStore();

  const [matchSummaries, setMatchSummaries] = useState<MatchSummary[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalTeamsCount, setTotalTeamsCount] = useState(0);

  useEffect(() => {
    loadAllMatchData();
  }, [loadAllMatchData]);

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

  // refresh is handled by actions on the page when needed

  const downloadCSV = async () => {
    try {
      await exportMatchDataToCSV();
      // Success! The file has been downloaded
    } catch (error) {
      console.error('Failed to export CSV:', error);
      // Error handling is already done in the store
    }
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
    <div className="p-6 max-w-7xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
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
          <button
            onClick={downloadCSV}
            className="text-lg font-bold w-full h-full bg-[#32327C] text-white rounded-lg hover:bg-[#434190] transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading || matchData.length === 0}
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Match Details</h2>
        </div>
        {matchSummaries.length === 0 ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Match Data</h3>
              <p className="text-gray-400">Upload some scouting data from tablets to see match information here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 min-h-0">
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