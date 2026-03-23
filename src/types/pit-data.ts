// Pit data interface for robot capability scouting
export interface PitData {
  doc_ID?: string;
  is_uploaded?: number;
  team_number: number;
  scouter_name: string;
  drivetrain: string;
  hopper_capacity: number;
  cannot_climb_auto: number;
  climb_auto_L1: number;
  cannot_climb_L1: number;
  climb_L1: number;
  climb_L2: number;
  climb_L3: number;
  bump: number;
  trench: number;
  shooter: string;
  prefers_auto_climb_level: number;
  prefers_climb_level: number;
  preferred_starting_zone: string;
  preferred_end_status: string;
  notes?: string;
}
