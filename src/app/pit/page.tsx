'use client';

import React, { useEffect, useState } from 'react';
import { useDatabaseStore } from '@/stores/database';
import { useTabletConnection } from '@/hooks/useTabletConnection';
import { 
  Wrench,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Settings,
  Trophy,
  Zap,
  Car,
  MapPin,
  Target,
  FileText,
  Download
} from 'lucide-react';

export default function PitPage() {
  const {
    pitData,
    loading,
    error,
    loadAllPitData,
    clearError,
    exportPitDataToCSV
  } = useDatabaseStore();

  const { isConnected } = useTabletConnection();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    loadAllPitData();
  }, [loadAllPitData]);

  const handleRefresh = () => {
    loadAllPitData();
  };

  const toggleTeamExpansion = (docId: string) => {
    setExpandedTeam(expandedTeam === docId ? null : docId);
  };

  const downloadCSV = async () => {
    try {
      await exportPitDataToCSV();
      // Success! The file has been downloaded
    } catch (error) {
      console.error('Failed to export CSV:', error);
      // Error handling is already done in the store
    }
  };


  const getCapabilityIcon = (value: number) => {
    return value > 0 ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    );
  };

  const getCapabilityText = (value: number) => {
    return value > 0 ? 'Yes' : 'No';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading pit data...</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 flex-shrink-0">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-800">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{pitData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-800">Teams Scouted</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(pitData.map(p => p.team_number)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-800">Can Climb</p>
              <p className="text-2xl font-bold text-gray-900">
                {pitData.filter(p => p.shallow_climb > 0 || p.deep_climb > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <button
            onClick={downloadCSV}
            className="text-lg font-bold w-full h-full bg-[#32327C] text-white rounded-lg hover:bg-[#434190] transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading || pitData.length === 0}
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>
      
      {/* Pit Data Table */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Team Reports</h2>
        </div>
        
        {pitData.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Pit Data</h3>
            <p className="text-gray-600">Upload some pit scouting data from tablets to see team information here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
            {pitData
              .sort((a, b) => a.team_number - b.team_number)
              .map((pit) => (
                <div key={`${pit.team_number}-${pit.doc_ID}`} className="hover:bg-gray-50 transition-colors">
                  {/* Main Row */}
                  <div 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => pit.doc_ID && toggleTeamExpansion(pit.doc_ID)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedTeam === pit.doc_ID ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          Team {pit.team_number}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        Click to view details
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedTeam === pit.doc_ID && (
                    <div className="px-6 pb-6 border-t bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {/* Coral Capabilities */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                            Coral Scoring
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Level 1:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.coral_L1)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.coral_L1)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Level 2:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.coral_L2)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.coral_L2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Level 3:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.coral_L3)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.coral_L3)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Level 4:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.coral_L4)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.coral_L4)}</span>
                              </div>
                            </div>
                            
                            {/* Coral Preferences */}
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-800 font-medium">Prefers Coral:</span>
                                <div className="flex items-center gap-2">
                                  {getCapabilityIcon(pit.prefers_coral)}
                                  <span className="text-sm text-gray-900">{getCapabilityText(pit.prefers_coral)}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-800">Preferred Level:</span>
                                <span className="text-sm text-gray-900">
                                  Level {pit.preferred_coral_level}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Algae Capabilities */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-green-600" />
                            Algae Handling
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Remove Algae:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.remove_algae)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.remove_algae)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Processor:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.processor_algae)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.processor_algae)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Net:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.net_algae)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.net_algae)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Endgame & Strategy */}
                        <div className="bg-white p-4 rounded-lg border">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-purple-600" />
                            Strategy & Endgame
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Park:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.park)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.park)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Shallow Climb:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.shallow_climb)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.shallow_climb)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-800">Deep Climb:</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcon(pit.deep_climb)}
                                <span className="text-sm text-gray-900">{getCapabilityText(pit.deep_climb)}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <Car className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-800">Drivetrain:</span>
                                <span className="font-medium text-gray-900">{pit.drivetrain}</span>
                              </div>
                              {pit.preferred_starting_zone && (
                                <div className="flex items-center gap-2 text-sm mb-2">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-800">Start Zone:</span>
                                  <span className="font-medium text-gray-900">{pit.preferred_starting_zone}</span>
                                </div>
                              )}
                              {pit.preferred_end_status && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-800">Endgame Prefence:</span>
                                  <span className="font-medium text-gray-900">{pit.preferred_end_status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {pit.notes && (
                        <div className="mt-4 bg-white p-4 rounded-lg border">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Notes
                          </h4>
                          <p className="text-gray-800 text-sm leading-relaxed">{pit.notes}</p>
                        </div>
                      )}

                      {/* Scouter Info */}
                      <div className="mt-4 text-xs text-gray-700 flex justify-between">
                        <span>Scouted by: {pit.scouter_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
