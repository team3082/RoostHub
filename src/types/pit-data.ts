// Pit data interface for robot capability scouting
export interface PitData {
  doc_ID?: string;
  is_uploaded?: number;
  team_number: number;
  scouter_name: string;
  drivetrain: string;
  /*coral_L1: number;
  coral_L2: number;
  coral_L3: number;
  coral_L4: number;
  remove_algae: number;
  processor_algae: number;
  net_algae: number;*/
  Trench: number;
  Bump: number;
  L1: number;
  L2: number;
  L3: number;
  preferred_starting_zone: string;
  preferred_end_status: string;
  notes?: string;
}
