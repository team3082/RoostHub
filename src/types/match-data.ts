// Match data interface for FRC scouting
export interface MatchData {
  doc_ID?: string;
  is_uploaded?: number;
  match_number: number;
  team_number: number;
  position: string;
  scouter_name: string;
  auto_L1_climb: number;
  auto_attempted_climb: number;
  auto_used_depot: number;
  auto_used_outpost: number;
  auto_bump: number;
  auto_trench: number;
  auto_shooting_times: number[]; // Array of doubles (seconds) - stored as JSON in DB
  teleop_L1_climb: number;
  teleop_L2_climb: number;
  teleop_L3_climb: number;
  teleop_attempted_climb: number;
  teleop_used_depot: number;
  teleop_used_outpost: number;
  teleop_bump: number;
  teleop_trench: number;
  teleop_shooting_times: number[]; // Array of doubles (seconds) - stored as JSON in DB
  end_none: number;
  end_climb: number;
  end_shooting: number;
  disabled: string;
  defense_rank: number;
  driving_rank: number;
  notes: string;
}

// Raw match data from database (shooting times are JSON strings)
export type RawMatchData = Omit<MatchData, 'auto_shooting_times' | 'teleop_shooting_times'> & {
  auto_shooting_times: string;
  teleop_shooting_times: string;
};
