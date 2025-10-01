// Pit data interface for robot capability scouting
export interface PitData {
  doc_ID?: string;
  is_uploaded?: number;
  team_number: number;
  scouter_name: string;
  drivetrain: string;
  coral_L1: number;
  coral_L2: number;
  coral_L3: number;
  coral_L4: number;
  remove_algae: number;
  processor_algae: number;
  net_algae: number;
  prefers_coral: number;
  preferred_coral_level: number;
  park: number;
  shallow_climb: number;
  deep_climb: number;
  preferred_starting_zone: string;
  preferred_end_status: string;
  notes?: string;
}
