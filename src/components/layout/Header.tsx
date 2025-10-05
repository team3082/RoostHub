"use client";

import { Monitor, Settings } from "lucide-react"
import { useTabletConnection } from "@/hooks/useTabletConnection";
import { useDatabaseStore } from "@/stores/database";

export default function Header() {
     const {
        deleteAllData,
      } = useDatabaseStore();
    
    
    const { isConnected, isLoading } = useTabletConnection();
    
    const connectionStatus = isLoading ? 'connecting' : (isConnected ? 'connected' : 'disconnected');
    
    return (
        <div className="relative z-20 bg-[#F7F7F7] border-b border-[#E9E9E9] px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between w-full">
            {/* Left: RoostHub logo and name */}
            <div className="flex items-center gap-2 ml-6">
                <div className="w-8 h-8 bg-[#32327C] rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[#32327C] tracking-tight">
                RoostHub
                </h1>
            </div>
            
            {/* Right: Tablet status and settings */}
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                connectionStatus === 'connected' ? 'bg-[#32327C] text-[#F7F7F7]' :
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-[#E9E9E9] text-[#1C1B1F]'
                }`}>
                <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-[#F7F7F7]' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-400'
                }`}></div>
                {connectionStatus === 'connected' ? 'Tablet Connected' :
                    connectionStatus === 'connecting' ? 'Checking...' :
                    'No Tablet'}
                </div>
                <Settings className="w-5 h-5 text-[#32327C] cursor-pointer hover:text-[#1C1B1F] transition-colors" />
            </div>
            </div>
        </div>  
    );
}