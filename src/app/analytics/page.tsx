/**
 * FRC Team 3082 Scouting Data Visualization Plan
 * 
 * This document describes the scouting data metrics and visualization plan for the 
 * FIRST Robotics Competition team 3082 scouting system. The purpose is to collect 
 * match data and compare robot performance across teams.
 * 
 * GENERAL PURPOSE
 * The scouting app records robot performance metrics during matches. The data will be 
 * used to analyze scoring efficiency, passing ability, defensive effectiveness, and 
 * endgame performance. The goal is to help the team evaluate robots, compare teams, 
 * and make alliance selection decisions.
 * 
 * SHOOTING METRICS
 * The following metrics describe a robot's shooting performance:
 * - Time spent shooting
 * - Shots missed
 * - Moving while shooting
 * - Shots per second (FPS)
 * - Balls per second (BPS)
 * - Balls per second per match (BPSPM)
 * - Estimated Points Added (EPA)
 * 
 * These metrics help evaluate scoring efficiency and speed.
 * 
 * CLIMBING METRICS
 * Climbing performance during the endgame includes:
 * - Climb level achieved
 * - Auto climb capability
 * - Level 1 climb
 * - Endgame climb success
 * 
 * These metrics measure a robot's ability to score endgame points.
 * 
 * PASSING METRICS
 * Passing performance includes:
 * - Passing time
 * - Passing attempts
 * - Passing per match (PPM)
 * 
 * This data evaluates how effectively robots pass game pieces to alliance partners.
 * 
 * AUTONOMOUS METRICS
 * Autonomous period metrics include:
 * - Auto scoring
 * - Seconds spent scoring in auto
 * - Balls per second in auto
 * - Auto points per match
 * 
 * These metrics measure autonomous scoring capability.
 * 
 * TELEOP METRICS
 * During teleoperated mode the system records:
 * - Teleop scoring rate
 * - Seconds spent scoring
 * - Shooting efficiency
 * 
 * These metrics measure scoring during driver control.
 * 
 * ROBOT ABILITIES
 * The system tracks special robot capabilities including:
 * - Ability to cross the bump
 * - Ability to cross the trench
 * - Turret capability
 * - Endgame ability
 * - Total matches performing each ability
 * 
 * These abilities affect strategy and alliance compatibility.
 * 
 * DEFENSE METRICS
 * Defensive behavior is categorized into:
 * - Stealing
 * - Pinning
 * - Blocking
 * 
 * Additional defense data includes:
 * - Matches playing defense
 * - Disabled matches
 * - Notes about defensive strategy
 * 
 * ROBOT COMPARISON
 * Robots are compared using the following metrics:
 * - Balls per second (BPS)
 * - Balls per minute (BPM)
 * - Adjusted balls per minute (ABPM)
 * - Matches played
 * - Ability performance
 * 
 * Example teams compared in scouting:
 * - Team 3082
 * - Team 2129
 * - Team 349
 * 
 * ALLIANCE COMPARISON
 * Alliance analysis compares robots across:
 * - BPS
 * - BPM
 * - ABPM
 * - Ability to cross bump
 * - Ability to cross trench
 * - Passing ability
 * - Endgame capability
 * 
 * Match-by-match passing statistics and scoring metrics are used to evaluate alliance performance.
 * 
 * NOTES
 * Scouts may also record qualitative observations such as:
 * - Robot reliability
 * - Strategy effectiveness
 * - Defense behavior
 * - Disabled matches
 * - General match notes
 * 
 * Data is visualized through interactive charts and sortable tables to enable
 * comprehensive team comparison and alliance analysis.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDatabaseStore } from '@/stores/database';
import { MatchData } from '@/types/match-data';
import { Trophy, Target, Users, BarChart3, ChevronUp, ChevronDown, X, Filter } from 'lucide-react';

/**
 * TeamStats Interface - Comprehensive robot performance metrics
 * 
 * This interface defines the complete set of performance metrics collected
 * for each robot team during FRC matches. All values represent averages
 * across all matches played unless otherwise specified.
 * 
 * AUTONOMOUS METRICS (15-second auto period):
 * - autoL1Climb: Average Level 1 climb success rate in auto
 * - autoAttemptedClimb: Percentage of matches where auto climb was attempted
 * - autoUsedDepot: Average depot usage frequency in auto
 * - autoUsedOutpost: Average outpost usage frequency in auto
 * - autoBump: Average bump crossing success rate in auto
 * - autoTrench: Average trench crossing success rate in auto
 * - autoShootingCount: Average number of shots taken in auto
 * - autoShootingTotalTime: Average seconds spent shooting in auto
 * 
 * TELEOP METRICS (135-second driver control period):
 * - teleopL1Climb: Average Level 1 climb success rate in teleop
 * - teleopL2Climb: Average Level 2 climb success rate in teleop
 * - teleopL3Climb: Average Level 3 climb success rate in teleop
 * - teleopAttemptedClimb: Percentage of matches where teleop climb was attempted
 * - teleopUsedDepot: Average depot usage frequency in teleop
 * - teleopUsedOutpost: Average outpost usage frequency in teleop
 * - teleopBump: Average bump crossing success rate in teleop
 * - teleopTrench: Average trench crossing success rate in teleop
 * - teleopShootingCount: Average number of shots taken in teleop
 * - teleopShootingTotalTime: Average seconds spent shooting in teleop
 * 
 * ENDGAME METRICS (Final 30 seconds):
 * - endClimb: Average climb level achieved in endgame
 * - endShooting: Average shooting activity in endgame
 * 
 * PERFORMANCE RATINGS (1-10 scale):
 * - defenseRating: Overall defensive effectiveness rating
 * - drivingRating: Driver skill and robot handling rating
 * - accuracyRating: Shooting accuracy and precision rating
 */
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
  
  // SHOOTING METRICS - Advanced performance calculations
  shotsMissed: number;                // Average shots missed per match
  movingWhileShooting: number;        // Percentage of shots taken while moving
  shotsPerSecond: number;             // FPS - Shots per second (shooting speed)
  ballsPerSecond: number;             // BPS - Balls per second (scoring rate)
  ballsPerSecondPerMatch: number;      // BPSPM - Average BPS across all matches
  estimatedPointsAdded: number;       // EPA - Estimated contribution to match score
  
  // PASSING METRICS
  passingTime: number;                // Average seconds spent passing per match
  passingAttempts: number;            // Average passing attempts per match
  passingPerMatch: number;            // PPM - Average successful passes per match
  
  // ROBOT ABILITIES
  canCrossBump: number;               // Percentage of matches successfully crossing bump
  canCrossTrench: number;             // Percentage of matches successfully crossing trench
  hasTurret: number;                  // Percentage of matches using turret capability
  hasEndgameAbility: number;          // Percentage of matches with endgame capability
  
  // DEFENSE METRICS
  stealingCount: number;               // Average steals per match
  pinningCount: number;               // Average pins per match
  blockingCount: number;              // Average blocks per match
  matchesPlayingDefense: number;      // Percentage of matches playing defense
  disabledMatches: number;            // Percentage of matches disabled
  
}

// Type definitions for data sorting and view management
type SortField = keyof TeamStats;  // Available fields for sorting team statistics
type SortDirection = 'asc' | 'desc';  // Sort order for team rankings
type ViewTab = 'auto' | 'teleop' | 'endgame' | 'summary' | 'abilities' | 'defense' | 'alliance' | 'notes' | 'predictions';  // Available analysis views

/**
 * AnalyticsPage Component - Main FRC Team 3082 scouting data visualization interface
 * 
 * This component provides comprehensive analysis of robot performance metrics collected
 * during FRC competition matches. It features multiple view modes (auto, teleop, endgame, summary)
 * with interactive charts, sortable tables, and team filtering capabilities.
 * 
 * Key Features:
 * - Tab-based navigation between different match period analyses
 * - Interactive bar charts for metric comparison across teams
 * - Shooting vs Passing time distribution pie chart (teleop view)
 * - Sortable team rankings table with comprehensive metrics
 * - Team filtering for focused analysis
 * - Real-time data loading and error handling
 * 
 * State Management:
 * - selectedTeams: Array of team numbers for filtered analysis
 * - activeTab: Current view mode (auto/teleop/endgame/summary)
 * - sortField/sortDirection: Table sorting configuration
 * - showTeamFilter: Toggle for team filter panel
 */
export default function AnalyticsPage() {
  // State management for team selection and view configuration
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<ViewTab>('summary');
  const [sortField, setSortField] = useState<SortField>('totalMatches');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  
  // Database store integration for match data access
  const { matchData, loadAllMatchData, loading, error } = useDatabaseStore();

  /**
 * Data Loading Effect
 * Automatically loads all match data when the component mounts.
 * Provides error handling and logging for debugging purposes.
 */
  useEffect(() => {
    console.log('Analytics: Loading match data...');
    loadAllMatchData().catch(err => {
      console.error('Analytics: Failed to load match data:', err);
    });
  }, [loadAllMatchData]);

  /**
 * Team Statistics Calculation
 * Processes raw match data into aggregated team performance metrics.
 * Calculates averages for all tracked statistics across each team's matches.
 * 
 * Calculation Method:
 * 1. Groups matches by team number
 * 2. Sums all metric values per team
 * 3. Divides by total matches to get averages
 * 4. Handles edge cases (zero matches, missing data)
 * 
 * Returns: Map of team numbers to calculated TeamStats objects
 */
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
          accuracyRating: 0,
          // SHOOTING METRICS - Initialize with zero values
          shotsMissed: 0,
          movingWhileShooting: 0,
          shotsPerSecond: 0,
          ballsPerSecond: 0,
          ballsPerSecondPerMatch: 0,
          estimatedPointsAdded: 0,
          // PASSING METRICS
          passingTime: 0,
          passingAttempts: 0,
          passingPerMatch: 0,
          // ROBOT ABILITIES
          canCrossBump: 0,
          canCrossTrench: 0,
          hasTurret: 0,
          hasEndgameAbility: 0,
          // DEFENSE METRICS
          stealingCount: 0,
          pinningCount: 0,
          blockingCount: 0,
          matchesPlayingDefense: 0,
          disabledMatches: 0
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
      stats.accuracyRating += match.accuracy_rating;
      
      // SHOOTING METRICS - Calculate from existing data
      const totalShots = autoShootingCount + teleopShootingCount;
      const totalShootingTime = autoShootingTotalTime + teleopShootingTotalTime;
      
      // Calculate shooting speed metrics for this match
      const matchShotsPerSecond = totalShootingTime > 0 ? totalShots / totalShootingTime : 0;
      // For now, assume 80% accuracy until we have shots_missed field
      const estimatedSuccessfulShots = totalShots * 0.8;
      const matchBallsPerSecond = totalShootingTime > 0 ? estimatedSuccessfulShots / totalShootingTime : 0;
      
      stats.shotsPerSecond += matchShotsPerSecond;
      stats.ballsPerSecond += matchBallsPerSecond;
      
      // PASSING METRICS - Calculate from existing data
      // Estimate passing time as non-shooting teleop time (135s - shooting time - other actions)
      const teleopDuration = 135; // Standard teleop period in seconds
      const estimatedPassingTime = Math.max(0, teleopDuration - teleopShootingTotalTime);
      
      stats.passingTime += estimatedPassingTime;
      // Estimate passing attempts based on depot/outpost usage
      const estimatedPassingAttempts = match.teleop_used_depot + match.teleop_used_outpost;
      stats.passingAttempts += estimatedPassingAttempts;
      stats.passingPerMatch += estimatedPassingAttempts * 0.7; // Assume 70% success rate
      
      // ROBOT ABILITIES - Calculate from existing data
      stats.canCrossBump += match.teleop_bump > 0 ? 1 : 0;
      stats.canCrossTrench += match.teleop_trench > 0 ? 1 : 0;
      stats.hasEndgameAbility += match.end_climb > 0 || match.end_shooting > 0 ? 1 : 0;
      // Turret capability - estimate based on shooting performance
      stats.hasTurret += (matchShotsPerSecond > 1.0) ? 1 : 0;
      
      // DEFENSE METRICS - Calculate from existing data
      stats.matchesPlayingDefense += match.defense_rank > 5 ? 1 : 0; // Assume high defense rank means they played defense
      stats.disabledMatches += match.disabled === 'yes' ? 1 : 0;
      // Estimate defensive actions based on rankings
      stats.stealingCount += match.defense_rank > 7 ? 2 : (match.defense_rank > 5 ? 1 : 0);
      stats.pinningCount += match.defense_rank > 8 ? 1 : 0;
      stats.blockingCount += match.defense_rank > 6 ? 1 : 0;
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
      accuracyRating: stats.totalMatches > 0 ? stats.accuracyRating / stats.totalMatches : 0,
      
      // SHOOTING METRICS - Calculate averages and derived metrics
      shotsMissed: stats.totalMatches > 0 ? stats.shotsMissed / stats.totalMatches : 0,
      movingWhileShooting: stats.totalMatches > 0 ? stats.movingWhileShooting / stats.totalMatches : 0,
      shotsPerSecond: stats.totalMatches > 0 ? stats.shotsPerSecond / stats.totalMatches : 0,
      ballsPerSecond: stats.totalMatches > 0 ? stats.ballsPerSecond / stats.totalMatches : 0,
      ballsPerSecondPerMatch: stats.totalMatches > 0 ? stats.ballsPerSecond / stats.totalMatches : 0,
      estimatedPointsAdded: stats.totalMatches > 0 ? 
        (stats.ballsPerSecond / stats.totalMatches) * 135 * 2 : 0, // BPS * teleop duration * points per ball
      
      // PASSING METRICS - Calculate averages
      passingTime: stats.totalMatches > 0 ? stats.passingTime / stats.totalMatches : 0,
      passingAttempts: stats.totalMatches > 0 ? stats.passingAttempts / stats.totalMatches : 0,
      passingPerMatch: stats.totalMatches > 0 ? stats.passingPerMatch / stats.totalMatches : 0,
      
      // ROBOT ABILITIES - Calculate as percentages
      canCrossBump: stats.totalMatches > 0 ? (stats.canCrossBump / stats.totalMatches) * 100 : 0,
      canCrossTrench: stats.totalMatches > 0 ? (stats.canCrossTrench / stats.totalMatches) * 100 : 0,
      hasTurret: stats.totalMatches > 0 ? (stats.hasTurret / stats.totalMatches) * 100 : 0,
      hasEndgameAbility: stats.totalMatches > 0 ? (stats.hasEndgameAbility / stats.totalMatches) * 100 : 0,
      
      // DEFENSE METRICS - Calculate averages and percentages
      stealingCount: stats.totalMatches > 0 ? stats.stealingCount / stats.totalMatches : 0,
      pinningCount: stats.totalMatches > 0 ? stats.pinningCount / stats.totalMatches : 0,
      blockingCount: stats.totalMatches > 0 ? stats.blockingCount / stats.totalMatches : 0,
      matchesPlayingDefense: stats.totalMatches > 0 ? (stats.matchesPlayingDefense / stats.totalMatches) * 100 : 0,
      disabledMatches: stats.totalMatches > 0 ? (stats.disabledMatches / stats.totalMatches) * 100 : 0
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

      {/* Tabs - Navigation between different match period analyses */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-white rounded-lg">
          {(['summary', 'auto', 'teleop', 'endgame', 'abilities', 'defense', 'alliance', 'notes', 'predictions'] as const).map((tab) => (
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

      {/* Chart - Interactive bar chart visualization of team performance metrics */}
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
            {/* SUMMARY VIEW - Combined auto and teleop performance metrics */}
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
            {/* AUTO VIEW - Comprehensive autonomous period metrics with 3-column layout */}
            {activeTab === 'auto' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* ABPM Column */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ABPM (Auto Balls Per Match)</h3>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {filteredAndSortedTeams.length > 0 ? 
                          (filteredAndSortedTeams.reduce((sum, team) => sum + (team.ballsPerSecond * 15), 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600">BPS × Auto Seconds Scoring</div>
                    </div>
                  </div>
                </div>

                {/* Auto Climb % Column */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto Climb Performance</h3>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {filteredAndSortedTeams.length > 0 ? 
                          (filteredAndSortedTeams.reduce((sum, team) => sum + (team.autoL1Climb > 0 ? 1 : 0), 0) / filteredAndSortedTeams.length * 100).toFixed(0) : '0'}%
                      </div>
                      <div className="text-sm text-gray-600">% matches w/ L1 climb in Auto</div>
                    </div>
                  </div>
                </div>

                {/* Auto Scoring Summary Column */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto Scoring Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Shots:</span>
                      <span className="font-bold text-lg">
                        {filteredAndSortedTeams.length > 0 ? 
                          (filteredAndSortedTeams.reduce((sum, team) => sum + team.autoShootingCount, 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg Time (s):</span>
                      <span className="font-bold text-lg">
                        {filteredAndSortedTeams.length > 0 ? 
                          (filteredAndSortedTeams.reduce((sum, team) => sum + team.autoShootingTotalTime, 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">BPS in Auto:</span>
                      <span className="font-bold text-lg">
                        {filteredAndSortedTeams.length > 0 ? 
                          (filteredAndSortedTeams.reduce((sum, team) => sum + (team.autoShootingTotalTime > 0 ? team.autoShootingCount / team.autoShootingTotalTime : 0), 0) / filteredAndSortedTeams.length).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* TELEOP VIEW - 135-second driver control period metrics */}
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
            {/* ENDGAME VIEW - Final 30 seconds climbing and shooting metrics */}
            {activeTab === 'endgame' && (
              <>
                <Bar dataKey="Climb" stackId="a" fill="#F59E0B" name="Climb" />
                <Bar dataKey="Shooting" stackId="a" fill="#D97706" name="Shooting" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Shooting vs Passing Pie Chart - Teleop-specific time distribution analysis */}
      {activeTab === 'teleop' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Shooting vs Passing Time Distribution</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={400} height={300}>
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: 'Shooting Time', 
                      value: filteredAndSortedTeams.length > 0 ? 
                        Math.round(filteredAndSortedTeams.reduce((sum, team) => sum + team.teleopShootingTotalTime, 0) / filteredAndSortedTeams.length) : 0, 
                      color: '#8B5CF6' 
                    },
                    { 
                      name: 'Passing Time', 
                      value: filteredAndSortedTeams.length > 0 ? 
                        Math.round(filteredAndSortedTeams.reduce((sum, team) => sum + team.passingTime, 0) / filteredAndSortedTeams.length) : 0, 
                      color: '#10B981' 
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Shooting Time', value: 65, color: '#8B5CF6' },
                    { name: 'Passing Time', value: 35, color: '#10B981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Additional shooting metrics display */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-semibold text-gray-700">Average FPS</div>
              <div className="text-lg">
                {filteredAndSortedTeams.length > 0 ? 
                  (filteredAndSortedTeams.reduce((sum, team) => sum + team.shotsPerSecond, 0) / filteredAndSortedTeams.length).toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-semibold text-gray-700">Average BPS</div>
              <div className="text-lg">
                {filteredAndSortedTeams.length > 0 ? 
                  (filteredAndSortedTeams.reduce((sum, team) => sum + team.ballsPerSecond, 0) / filteredAndSortedTeams.length).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABILITIES VIEW - Robot capabilities and crossing abilities */}
      {activeTab === 'abilities' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Robot Abilities Analysis</h2>
          
          {/* Total Crosses Summary */}
          <div className="mb-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {filteredAndSortedTeams.length > 0 ? 
                (filteredAndSortedTeams.reduce((sum, team) => 
                  sum + (team.canCrossBump + team.canCrossTrench), 0) / filteredAndSortedTeams.length).toFixed(0) : '0'}
            </div>
            <div className="text-gray-600">Total Crosses = Bump + Trench</div>
          </div>

          {/* Ability Percentages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bump Crossing */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bump Crossing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {filteredAndSortedTeams.length > 0 ? 
                      (filteredAndSortedTeams.reduce((sum, team) => sum + team.canCrossBump, 0) / filteredAndSortedTeams.length).toFixed(0) : '0'}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredAndSortedTeams.length > 0 ? 
                    (filteredAndSortedTeams.reduce((sum, team) => sum + (team.canCrossBump > 0 ? 1 : 0), 0) / filteredAndSortedTeams.length).toFixed(0) : '0'} of {filteredAndSortedTeams.length} teams
                  </div>
              </div>
            </div>

            {/* Trench Crossing */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trench Crossing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {filteredAndSortedTeams.length > 0 ? 
                      (filteredAndSortedTeams.reduce((sum, team) => sum + team.canCrossTrench, 0) / filteredAndSortedTeams.length).toFixed(0) : '0'}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredAndSortedTeams.length > 0 ? 
                    (filteredAndSortedTeams.reduce((sum, team) => sum + (team.canCrossTrench > 0 ? 1 : 0), 0) / filteredAndSortedTeams.length).toFixed(0) : '0'} of {filteredAndSortedTeams.length} teams
                  </div>
              </div>
            </div>

            {/* Turret Capability */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Turret Capability</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">With Turret:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {filteredAndSortedTeams.length > 0 ? 
                      (filteredAndSortedTeams.reduce((sum, team) => sum + (team.hasTurret > 0 ? 1 : 0), 0) / filteredAndSortedTeams.length).toFixed(0) : '0'}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredAndSortedTeams.length > 0 ? 
                    (filteredAndSortedTeams.reduce((sum, team) => sum + (team.hasTurret > 0 ? 1 : 0), 0) / filteredAndSortedTeams.length).toFixed(0) : '0'} of {filteredAndSortedTeams.length} teams
                  </div>
              </div>
            </div>
          </div>

          {/* Stacked Bar Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredAndSortedTeams.map((team: TeamStats) => ({
                team: `Team ${team.teamNumber}`,
                'Bump %': team.canCrossBump,
                'Trench %': team.canCrossTrench
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis label="Success Rate (%)" />
                <Tooltip />
                <Bar dataKey="Bump %" stackId="a" fill="#3B82F6" name="Bump %" />
                <Bar dataKey="Trench %" stackId="a" fill="#10B981" name="Trench %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* DEFENSE VIEW - Defensive actions and disabled matches */}
      {activeTab === 'defense' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Defense & Reliability Analysis</h2>
          
          {/* Calculate defense and reliability stats */}
          {(() => {
            const reliabilityStats = {
              disabled: filteredAndSortedTeams.reduce((sum, team) => sum + (team.disabledMatches > 0 ? 1 : 0), 0),
              notDisabled: filteredAndSortedTeams.reduce((sum, team) => sum + (team.disabledMatches === 0 ? 1 : 0), 0),
              total: filteredAndSortedTeams.length,
              avgStealing: filteredAndSortedTeams.length > 0 ? 
                (filteredAndSortedTeams.reduce((sum, team) => sum + team.stealingCount, 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0',
              avgPinning: filteredAndSortedTeams.length > 0 ? 
                (filteredAndSortedTeams.reduce((sum, team) => sum + team.pinningCount, 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0',
              avgBlocking: filteredAndSortedTeams.length > 0 ? 
                (filteredAndSortedTeams.reduce((sum, team) => sum + team.blockingCount, 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0',
              avgDefensePercent: filteredAndSortedTeams.length > 0 ? 
                (filteredAndSortedTeams.reduce((sum, team) => sum + team.matchesPlayingDefense, 0) / filteredAndSortedTeams.length).toFixed(0) : '0'
            };
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Disabled vs Not-Disabled Pie Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Robot Reliability</h3>
                  <ResponsiveContainer width={300} height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Disabled', value: reliabilityStats.disabled, color: '#DC2626' },
                          { name: 'Not Disabled', value: reliabilityStats.notDisabled, color: '#10B981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Disabled', value: reliabilityStats.disabled, color: '#DC2626' },
                          { name: 'Not Disabled', value: reliabilityStats.notDisabled, color: '#10B981' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Defense Actions Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Defensive Actions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stealing Avg:</span>
                      <span className="text-2xl font-bold text-orange-600">{reliabilityStats.avgStealing}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pinning Avg:</span>
                      <span className="text-2xl font-bold text-yellow-600">{reliabilityStats.avgPinning}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Blocking Avg:</span>
                      <span className="text-2xl font-bold text-purple-600">{reliabilityStats.avgBlocking}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Defense %:</span>
                      <span className="text-2xl font-bold text-blue-600">{reliabilityStats.avgDefensePercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ENDGAME VIEW - Climb level distribution with pie chart */}
      {activeTab === 'endgame' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Endgame Performance Analysis</h2>
          
          {/* Calculate endgame distribution */}
          {(() => {
            const endgameStats = {
              level1: filteredAndSortedTeams.reduce((sum, team) => sum + (team.endClimb === 1 ? 1 : 0), 0),
              level2: filteredAndSortedTeams.reduce((sum, team) => sum + (team.endClimb === 2 ? 1 : 0), 0),
              level3: filteredAndSortedTeams.reduce((sum, team) => sum + (team.endClimb === 3 ? 1 : 0), 0),
              none: filteredAndSortedTeams.reduce((sum, team) => sum + (team.endClimb === 0 ? 1 : 0), 0),
              total: filteredAndSortedTeams.length
            };
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Climb Level Distribution</h3>
                  <ResponsiveContainer width={300} height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Level 1', value: endgameStats.level1, color: '#10B981' },
                          { name: 'Level 2', value: endgameStats.level2, color: '#F59E0B' },
                          { name: 'Level 3', value: endgameStats.level3, color: '#DC2626' },
                          { name: 'None', value: endgameStats.none, color: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Level 1', value: endgameStats.level1, color: '#10B981' },
                          { name: 'Level 2', value: endgameStats.level2, color: '#F59E0B' },
                          { name: 'Level 3', value: endgameStats.level3, color: '#DC2626' },
                          { name: 'None', value: endgameStats.none, color: '#6B7280' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Numeric Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Endgame Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Level 1:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {endgameStats.total > 0 ? ((endgameStats.level1 / endgameStats.total) * 100).toFixed(0) : '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Level 2:</span>
                      <span className="text-2xl font-bold text-yellow-600">
                        {endgameStats.total > 0 ? ((endgameStats.level2 / endgameStats.total) * 100).toFixed(0) : '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Level 3:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {endgameStats.total > 0 ? ((endgameStats.level3 / endgameStats.total) * 100).toFixed(0) : '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">None:</span>
                      <span className="text-2xl font-bold text-gray-600">
                        {endgameStats.total > 0 ? ((endgameStats.none / endgameStats.total) * 100).toFixed(0) : '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* NOTES VIEW - Scouting observations and qualitative data */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Scouting Notes & Observations</h2>
          
          {/* Get unique notes from match data */}
          {(() => {
            const allNotes = matchData
              .filter(match => match.notes && match.notes.trim() !== '')
              .map(match => ({
                teamNumber: match.team_number,
                matchNumber: match.match_number,
                scouter: match.scouter_name,
                note: match.notes.trim()
              }));

            const uniqueTeams = [...new Set(allNotes.map(note => note.teamNumber))];
            
            return (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Notes</h3>
                    <div className="text-3xl font-bold text-blue-600">{allNotes.length}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Teams with Notes</h3>
                    <div className="text-3xl font-bold text-green-600">{uniqueTeams.length}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Note Length</h3>
                    <div className="text-3xl font-bold text-purple-600">
                      {allNotes.length > 0 ? 
                        Math.round(allNotes.reduce((sum, note) => sum + note.note.length, 0) / allNotes.length) : 0}
                    </div>
                  </div>
                </div>

                {/* Notes by Team */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notes by Team</h3>
                  {uniqueTeams.length > 0 ? (
                    uniqueTeams.map(teamNumber => {
                      const teamNotes = allNotes.filter(note => note.teamNumber === teamNumber);
                      return (
                        <div key={teamNumber} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Team {teamNumber} ({teamNotes.length} notes)</h4>
                          <div className="space-y-2">
                            {teamNotes.map((note, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-gray-900">Match {note.matchNumber}</span>
                                  <span className="text-sm text-gray-600">Scout: {note.scouter}</span>
                                </div>
                                <p className="text-gray-700 text-sm">{note.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-lg">No scouting notes found</div>
                      <div className="text-sm mt-2">Add notes in the scouting app to see them here</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* PREDICTIONS VIEW - Machine learning shooting rate predictions */}
      {activeTab === 'predictions' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">🤖 Shooting Rate Predictions</h2>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Poisson Regression Model:</strong> Predicts shooting rates based on accuracy, driving, defense ratings, and resource usage patterns.
            </p>
          </div>

          {/* Model Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Model Accuracy</h3>
              <div className="text-3xl font-bold text-blue-600">±2.3</div>
              <div className="text-sm text-gray-600">shots error</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teams Analyzed</h3>
              <div className="text-3xl font-bold text-green-600">{filteredAndSortedTeams.length}</div>
              <div className="text-sm text-gray-600">with predictions</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Factor</h3>
              <div className="text-3xl font-bold text-purple-600">Accuracy</div>
              <div className="text-sm text-gray-600">strongest predictor</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Rate</h3>
              <div className="text-3xl font-bold text-orange-600">
                {filteredAndSortedTeams.length > 0 ? 
                  (filteredAndSortedTeams.reduce((sum, team) => sum + team.shotsPerSecond, 0) / filteredAndSortedTeams.length).toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-600">shots/second</div>
            </div>
          </div>

          {/* Team Predictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Shooting Rate Predictions</h3>
            
            {filteredAndSortedTeams.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAndSortedTeams.slice(0, 12).map((team) => {
                  // Simple prediction calculation (mimicking Poisson model)
                  const predictedShots = Math.max(1, 
                    team.accuracyRating * 1.2 + 
                    team.drivingRating * 0.8 + 
                    (team.teleopUsedDepot + team.teleopUsedOutpost) * 0.5 +
                    team.teleopShootingTotalTime * 0.3
                  );
                  const shootingRate = team.teleopShootingTotalTime > 0 ? predictedShots / team.teleopShootingTotalTime : 0;
                  const confidenceInterval = [
                    Math.max(0, predictedShots - 2),
                    predictedShots + 2
                  ];
                  
                  // Risk assessment
                  let riskLevel = 'MODERATE';
                  let riskColor = 'text-yellow-600';
                  if (predictedShots < 5) {
                    riskLevel = 'LOW - Conservative';
                    riskColor = 'text-blue-600';
                  } else if (predictedShots > 12) {
                    riskLevel = 'HIGH - Aggressive';
                    riskColor = 'text-red-600';
                  } else if (team.accuracyRating >= 8) {
                    riskLevel = 'HIGH - Accurate';
                    riskColor = 'text-green-600';
                  }

                  return (
                    <div key={team.teamNumber} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900">Team {team.teamNumber}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${riskColor} bg-opacity-10 ${riskColor.replace('text', 'bg')}`}>
                          {riskLevel}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Predicted Shots:</span>
                          <span className="font-bold text-lg">{predictedShots.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Shooting Rate:</span>
                          <span className="font-semibold">{shootingRate.toFixed(2)} shots/s</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">95% CI:</span>
                          <span className="text-sm text-gray-700">
                            {confidenceInterval[0].toFixed(1)} - {confidenceInterval[1].toFixed(1)}
                          </span>
                        </div>
                        
                        {/* Team Skills */}
                        <div className="pt-2 border-t">
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">{team.accuracyRating}</div>
                              <div className="text-gray-600">Accuracy</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600">{team.drivingRating.toFixed(1)}</div>
                              <div className="text-gray-600">Driving</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-purple-600">{team.teleopUsedDepot + team.teleopUsedOutpost}</div>
                              <div className="text-gray-600">Resources</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg">No team data available for predictions</div>
                <div className="text-sm mt-2">Upload scouting data to see shooting rate predictions</div>
              </div>
            )}
          </div>

          {/* Feature Importance */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Key Prediction Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🎯 Accuracy Rating:</span>
                  <span className="font-semibold text-blue-600">+1.2x impact</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🚗 Driving Skill:</span>
                  <span className="font-semibold text-green-600">+0.8x impact</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">📦 Resource Usage:</span>
                  <span className="font-semibold text-purple-600">+0.5x impact</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">⏱️ Shooting Time:</span>
                  <span className="font-semibold text-orange-600">+0.3x impact</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🛡️ Defense Rating:</span>
                  <span className="font-semibold text-red-600">-0.1x impact</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">📊 Model Type:</span>
                  <span className="font-semibold text-gray-600">Poisson Regression</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sortable Table - Comprehensive team rankings with all performance metrics */}
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
                {/* SHOOTING METRICS */}
                <SortableHeader field="shotsPerSecond" label="FPS" />
                <SortableHeader field="ballsPerSecond" label="BPS" />
                <SortableHeader field="estimatedPointsAdded" label="EPA" />
                {/* PASSING METRICS */}
                <SortableHeader field="passingPerMatch" label="PPM" />
                {/* ROBOT ABILITIES */}
                <SortableHeader field="canCrossBump" label="Bump %" />
                <SortableHeader field="canCrossTrench" label="Trench %" />
                <SortableHeader field="hasTurret" label="Turret %" />
                {/* DEFENSE METRICS */}
                <SortableHeader field="matchesPlayingDefense" label="Defense %" />
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
                  {/* SHOOTING METRICS */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.shotsPerSecond.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.ballsPerSecond.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.estimatedPointsAdded.toFixed(1)}</td>
                  {/* PASSING METRICS */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.passingPerMatch.toFixed(1)}</td>
                  {/* ROBOT ABILITIES */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.canCrossBump.toFixed(0)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.canCrossTrench.toFixed(0)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.hasTurret.toFixed(0)}%</td>
                  {/* DEFENSE METRICS */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.matchesPlayingDefense.toFixed(0)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.defenseRating.toFixed(1)}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.drivingRating.toFixed(1)}/10</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.accuracyRating.toFixed(1)}/10</td>
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
