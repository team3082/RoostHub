// Match data interface for FRC scouting
export interface MatchData {
  doc_ID?: string;
  is_uploaded?: number;
  match_number: number;
  team_number: number;
  position: string;
  scouter_name: string;
  auto_L1: number;
  auto_Bump: number;
  auto_Trench: number;
  auto_Hub: number;
  teleop_Trench: number;
  teleop_Bump: number;
  teleop_Hub: number;
  /*auto_L2: number;
  auto_L3: number;
  //Also need auto and teleop hub
  auto_coral_L4: number;
  auto_dropped: number;
  auto_net_algae: number;
  auto_processor_algae: number;
  auto_algae_removed: number;
  auto_leave: number;
  teleop_coral_L1: number;
  teleop_coral_L2: number;
  teleop_coral_L3: number;
  teleop_coral_L4: number;
  teleop_dropped: number;
  teleop_processor_algae: number;
  teleop_net_algae: number;
  teleop_algae_removed: number;*/
  end_none: number;
  end_L1: number;
  end_L2: number;
  end_L3: number;
  disabled: string;
  robot_Goal: string;
  defense_rank: number;
  driving_rank: number;
  notes: string;
};
