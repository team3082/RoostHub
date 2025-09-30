'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data structure - replace with actual data from your database
interface TeamData {
  teamNumber: number;
  teamName: string;
  autoPoints: number;
  teleopPoints: number;
  endgamePoints: number;
  totalMatches: number;
}

const mockTeamData: TeamData[] = [
  { teamNumber: 1678, teamName: "Citrus Circuits", autoPoints: 12.5, teleopPoints: 45.2, endgamePoints: 15.8, totalMatches: 8 },
  { teamNumber: 254, teamName: "The Cheesy Poofs", autoPoints: 14.2, teleopPoints: 48.6, endgamePoints: 18.3, totalMatches: 7 },
  { teamNumber: 973, teamName: "Greybots", autoPoints: 10.8, teleopPoints: 42.1, endgamePoints: 16.5, totalMatches: 9 },
  { teamNumber: 1323, teamName: "MadTown Robotics", autoPoints: 11.7, teleopPoints: 38.9, endgamePoints: 14.2, totalMatches: 6 },
  { teamNumber: 2468, teamName: "Team Appreciate", autoPoints: 9.3, teleopPoints: 35.7, endgamePoints: 12.8, totalMatches: 8 },
];

export default function AnalyticsPage() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const teamData = mockTeamData; // Replace with actual database query later

  // Transform data for the stacked bar chart
  const chartData = teamData.map(team => ({
    team: `${team.teamNumber}`,
    teamName: team.teamName,
    Auto: parseFloat(team.autoPoints.toFixed(1)),
    Teleop: parseFloat(team.teleopPoints.toFixed(1)),
    Endgame: parseFloat(team.endgamePoints.toFixed(1)),
    total: parseFloat((team.autoPoints + team.teleopPoints + team.endgamePoints).toFixed(1)),
    matches: team.totalMatches
  }));

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
      const teamInfo = chartData.find(team => team.team === label);
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`Team ${label}`}</p>
          <p className="text-sm text-gray-600">{teamInfo?.teamName}</p>
          <p className="text-sm text-gray-500">{`Matches: ${teamInfo?.matches}`}</p>
          <div className="mt-2">
            {payload.map((entry, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {`${entry.dataKey}: ${entry.value} pts`}
              </p>
            ))}
            <p className="font-semibold mt-1">
              {`Total Average: ${teamInfo?.total} pts`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stacked Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-black">Average Points by Game Period</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={selectedTeam ? chartData.filter(team => parseInt(team.team) === selectedTeam) : chartData}
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
              label={{ value: 'Average Points', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Auto" stackId="a" fill="#3B82F6" name="Auto Points" />
            <Bar dataKey="Teleop" stackId="a" fill="#10B981" name="Teleop Points" />
            <Bar dataKey="Endgame" stackId="a" fill="#F59E0B" name="Endgame Points" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Team Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teleop Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endgame Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(selectedTeam ? chartData.filter(team => parseInt(team.team) === selectedTeam) : chartData).map((team) => (
                <tr key={team.team} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{team.team}</div>
                      <div className="text-sm text-gray-500">{team.teamName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.Auto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.Teleop}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.Endgame}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.matches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
