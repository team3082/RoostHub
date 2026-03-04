"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Wifi, Database, Settings, Home, Search, BarChart3, Monitor, Tablet, Check, X, Play, Pause, RotateCcw, BadgeHelp} from 'lucide-react';
import Card from '@/components/Card';
import Link from 'next/link';
import { useDatabaseStore } from '@/stores/database';

const RoostHub = () => {
  const {
    matchData,
    loading,
    error,
    initializeDatabase,
    loadAllMatchData,
    clearError
  } = useDatabaseStore();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected'); // automatically connected
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const fileInputRef = useRef(null);

  const mockMatches = [
    { id: 1, team: 'Team Alpha', score: '24-18', level: 'Level 1 Climb', date: '2024-08-13', status: 'completed' },
    { id: 2, team: 'Team Beta', score: '31-12', level: 'Level 2 Climb', date: '2024-08-13', status: 'completed' },
    { id: 3, team: 'Team Gamma', score: '19-22', level: 'Level 3 Climb', date: '2024-08-12', status: 'completed' },
    { id: 4, team: 'Team Delta', score: 'In Progress', level: 'Level 1 Climb', date: '2024-08-13', status: 'active' },
  ];

  const handleConnect = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 4000);
  };

  const handleUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  type StatusType = 'completed' | 'active' | 'error' | 'inactive';
  const StatusBadge = ({ status }: { status: StatusType }) => {
    const colors: Record<StatusType, string> = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-[#32327C] text-[#F7F7F7]',
      error: 'bg-red-100 text-red-800',
      inactive: 'bg-[#E9E9E9] text-[#1C1B1F]'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="bg-[#F7F7F7] rounded-xl border border-[#E9E9E9] p-8 shadow-xl flex flex-col items-center max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-[#32327C] mb-8 flex items-center gap-3 justify-center">
          <Tablet className="w-7 h-7 text-[#32327C]" />
          Match Data Upload
        </h2>
        <div className="w-full flex flex-col items-center">
          <div className="text-center mb-8 w-full flex flex-col items-center">
            <div className="w-24 h-24 bg-[#32327C] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Tablet className="w-12 h-12 text-[#F7F7F7]" />
            </div>
            <h3 className="text-xl font-bold text-[#32327C] mb-2">
              Tablet Connected
            </h3>
            <p className="text-[#1C1B1F] mb-6">
              Your scouting tablet is ready to upload match data to the central database, click the upload to roost button in the data page of cluckscout.
            </p>
            <p className="text-[#1C1B1F] mb-6">
              PS: In the future, this will automatically detect when your tablet is connected and prompt you to upload. But that required reinstalling cluck scout.
            </p>
              {/* <button
                onClick={handleUpload}
                disabled={uploadProgress > 0 && uploadProgress < 100}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all  ${
                  uploadProgress === 0
                    ? 'bg-[#32327C] text-[#F7F7F7] shadow-lg'
                    : uploadProgress === 100
                    ? 'bg-green-600 text-[#F7F7F7]'
                    : 'bg-[#E9E9E9] text-[#1C1B1F] opacity-50 scale-100'
                }`}
              >
                <Upload className="w-5 h-5 inline mr-3" />
                {uploadProgress === 0 ? 'Upload Match Data' :
                  uploadProgress === 100 ? 'Upload Complete' :
                  'Uploading...'}
              </button>
              {uploadProgress > 0 && (
                <div className="mt-6 space-y-3 w-full flex flex-col items-center">
                  <div className="w-full bg-[#E9E9E9] rounded-full h-3 overflow-hidden max-w-md">
                    <div
                      className="bg-[#32327C] h-full rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[#1C1B1F] font-medium">{uploadProgress}% Complete</p>
                  {uploadProgress === 100 && (
                    <p className="text-green-600 font-semibold">
                      🎉 Successfully uploaded match data!
                    </p>
                  )}
                </div>
              )} */}
          </div>
          {/* <div className="grid grid-cols-3 gap-4 mt-8 w-full">
            {[
              { label: 'Matches Ready', value: '7', icon: '📊' },
              { label: 'Teams Scouted', value: '12', icon: '🤖' },
              { label: 'Data Points', value: '248', icon: '📈' },
            ].map((stat, index) => (
              <div key={index} className="bg-[#E9E9E9] rounded-xl p-4 text-center border border-[#E9E9E9]">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-xl font-bold text-[#32327C]">{stat.value}</div>
                <div className="text-sm text-[#1C1B1F]">{stat.label}</div>
              </div>
            ))}
          </div> */}

          
        </div>
      </div>

    </div>
  );
};

export default RoostHub;