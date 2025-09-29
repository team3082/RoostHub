"use client"

import { BadgeHelp, BarChart3, Database, Search, Upload } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { use } from "react";

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    
    return (
        <div className="relative z-10 w-64 bg-[#F7F7F7] border-r border-[#E9E9E9] p-4 flex flex-col h-full">
          <nav className="space-y-2 flex-1">
            {[
              { id: '', icon: Upload, label: 'USB Data Transfer' },
              { id: 'matches', icon: Database, label: 'Match Data' },
              { id: 'analytics', icon: BarChart3, label: 'Analytics' },
              { id: 'scouting', icon: Search, label: 'Scout Management' },
              { id: 'guide', icon: BadgeHelp, label: 'RoostHub Guide' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/${item.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium ${
                  pathname === `/${item.id}`
                    ? 'bg-[#32327C] text-[#F7F7F7] shadow-lg'
                    : 'bg-[#E9E9E9] text-[#1C1B1F] hover:bg-[#32327C]/80 hover:text-[#F7F7F7]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
    );
}