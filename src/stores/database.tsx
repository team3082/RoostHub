import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import { listen } from '@tauri-apps/api/event';

// Types for our database records
export interface MatchData {
  doc_ID?: string;
  is_uploaded?: number;
  match_number: number;
  team_number: number;
  position: string;
  scouter_name: string;
  auto_coral_L1: number;
  auto_coral_L2: number;
  auto_coral_L3: number;
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
  teleop_algae_removed: number;
  end_none: number;
  end_park: number;
  end_shallow: number;
  end_deep: number;
  disabled: string;
  defense_rank: number;
  driving_rank: number;
  notes: string;
}

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

export interface TeamStats {
  team_number: number;
  match_count: number;
  avg_auto_coral_total: number;
  avg_teleop_coral_total: number;
  avg_auto_algae_total: number;
  avg_teleop_algae_total: number;
  climb_success_rate: number;
  avg_defense_rank: number;
  avg_driving_rank: number;
}

// Database service class
class DatabaseService {
  private db: Database | null = null;

  async initialize() {
    if (!this.db) {
      try {
        console.log('Initializing database...');
        this.db = await Database.load('sqlite:scouting.db');
        console.log('Database loaded successfully');
        await this.createTables();
        console.log('Tables created successfully');
      } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
      }
    }
    return this.db;
  }

  async createTables() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if tables exist first
      const tables = await this.db.select<{name: string}[]>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('match_data', 'pit_data')"
      );
      
      const existingTables = new Set(tables.map(t => t.name));
      
      // Create match data table if it doesn't exist
      if (!existingTables.has('match_data')) {
        console.log('Creating match_data table...');
        await this.db.execute(`
          CREATE TABLE match_data (
            doc_ID TEXT,
            is_uploaded INTEGER,
            match_number INTEGER,
            team_number INTEGER,
            position TEXT,         
            scouter_name TEXT,
            auto_coral_L1 INTEGER,
            auto_coral_L2 INTEGER,
            auto_coral_L3 INTEGER,
            auto_coral_L4 INTEGER,
            auto_dropped INTEGER,
            auto_net_algae INTEGER,
            auto_processor_algae INTEGER,
            auto_algae_removed INTEGER,
            auto_leave INTEGER,
            teleop_coral_L1 INTEGER,
            teleop_coral_L2 INTEGER,
            teleop_coral_L3 INTEGER,
            teleop_coral_L4 INTEGER,
            teleop_dropped INTEGER,
            teleop_processor_algae INTEGER,
            teleop_net_algae INTEGER,
            teleop_algae_removed INTEGER,
            end_none INTEGER,       
            end_park INTEGER,      
            end_shallow INTEGER,    
            end_deep INTEGER,       
            disabled TEXT,
            defense_rank INTEGER,
            driving_rank INTEGER,
            notes TEXT
          );
        `);
        console.log('match_data table created');
      } else {
        console.log('match_data table already exists');
      }
      
      // Create pit data table if it doesn't exist
      if (!existingTables.has('pit_data')) {
        console.log('Creating pit_data table...');
        await this.db.execute(`
          CREATE TABLE pit_data (
            doc_ID TEXT NOT NULL,
            is_uploaded INTEGER NOT NULL,
            team_number INTEGER NOT NULL,
            scouter_name TEXT NOT NULL,
            drivetrain TEXT NOT NULL,
            coral_L1 INTEGER NOT NULL,
            coral_L2 INTEGER NOT NULL,
            coral_L3 INTEGER NOT NULL,
            coral_L4 INTEGER NOT NULL,
            remove_algae INTEGER NOT NULL,
            processor_algae INTEGER NOT NULL,
            net_algae INTEGER NOT NULL,
            prefers_coral INTEGER NOT NULL,
            preferred_coral_level INTEGER NOT NULL,
            park INTEGER NOT NULL,
            shallow_climb INTEGER NOT NULL,
            deep_climb INTEGER NOT NULL,
            preferred_starting_zone TEXT NOT NULL,
            preferred_end_status TEXT NOT NULL,
            notes TEXT
          );
        `);
        console.log('pit_data table created');
      } else {
        console.log('pit_data table already exists');
      }
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Match data operations
  async addMatchData(data: MatchData): Promise<void> {
    const db = await this.initialize();
    const docId = data.doc_ID || `match_${data.team_number}_${data.match_number}_${Date.now()}`;
    
    console.log('Adding match data for team:', data.team_number, 'match:', data.match_number);
    
    await db.execute(`
      INSERT INTO match_data (
        doc_ID, is_uploaded, match_number, team_number, position, scouter_name,
        auto_coral_L1, auto_coral_L2, auto_coral_L3, auto_coral_L4, auto_dropped,
        auto_net_algae, auto_processor_algae, auto_algae_removed, auto_leave,
        teleop_coral_L1, teleop_coral_L2, teleop_coral_L3, teleop_coral_L4, teleop_dropped,
        teleop_processor_algae, teleop_net_algae, teleop_algae_removed,
        end_none, end_park, end_shallow, end_deep, disabled, defense_rank, driving_rank, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      docId, data.is_uploaded || 0, data.match_number, data.team_number, data.position, data.scouter_name,
      data.auto_coral_L1, data.auto_coral_L2, data.auto_coral_L3, data.auto_coral_L4, data.auto_dropped,
      data.auto_net_algae, data.auto_processor_algae, data.auto_algae_removed, data.auto_leave,
      data.teleop_coral_L1, data.teleop_coral_L2, data.teleop_coral_L3, data.teleop_coral_L4, data.teleop_dropped,
      data.teleop_processor_algae, data.teleop_net_algae, data.teleop_algae_removed,
      data.end_none, data.end_park, data.end_shallow, data.end_deep, data.disabled,
      data.defense_rank, data.driving_rank, data.notes
    ]);
    
    console.log('Match data added successfully');
  }

  async getMatchDataByTeam(teamNumber: number): Promise<MatchData[]> {
    const db = await this.initialize();
    const result = await db.select<MatchData[]>(
      'SELECT * FROM match_data WHERE team_number = ? ORDER BY match_number',
      [teamNumber]
    );
    return result;
  }

  async getMatchDataByMatch(matchNumber: number): Promise<MatchData[]> {
    const db = await this.initialize();
    const result = await db.select<MatchData[]>(
      'SELECT * FROM match_data WHERE match_number = ? ORDER BY team_number',
      [matchNumber]
    );
    return result;
  }

  async getAllMatchData(): Promise<MatchData[]> {
    const db = await this.initialize();
    const result = await db.select<MatchData[]>(
      'SELECT * FROM match_data ORDER BY match_number, team_number'
    );
    return result;
  }

  // Pit data operations
  async addPitData(data: PitData): Promise<void> {
    const db = await this.initialize();
    const docId = data.doc_ID || `pit_${data.team_number}_${Date.now()}`;
    
    await db.execute(`
      INSERT INTO pit_data (
        doc_ID, is_uploaded, team_number, scouter_name, drivetrain,
        coral_L1, coral_L2, coral_L3, coral_L4, remove_algae,
        processor_algae, net_algae, prefers_coral, preferred_coral_level,
        park, shallow_climb, deep_climb, preferred_starting_zone, preferred_end_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      docId, data.is_uploaded || 0, data.team_number, data.scouter_name, data.drivetrain,
      data.coral_L1, data.coral_L2, data.coral_L3, data.coral_L4, data.remove_algae,
      data.processor_algae, data.net_algae, data.prefers_coral, data.preferred_coral_level,
      data.park, data.shallow_climb, data.deep_climb, data.preferred_starting_zone,
      data.preferred_end_status, data.notes || ''
    ]);
  }

  async getPitDataByTeam(teamNumber: number): Promise<PitData[]> {
    const db = await this.initialize();
    const result = await db.select<PitData[]>(
      'SELECT * FROM pit_data WHERE team_number = ?',
      [teamNumber]
    );
    return result;
  }

  async getAllPitData(): Promise<PitData[]> {
    const db = await this.initialize();
    const result = await db.select<PitData[]>('SELECT * FROM pit_data ORDER BY team_number');
    return result;
  }

  // Statistics and analytics
  async getTeamStats(teamNumber: number): Promise<TeamStats | null> {
    const db = await this.initialize();
    const result = await db.select<TeamStats[]>(`
      SELECT 
        team_number,
        COUNT(*) as match_count,
        AVG(auto_coral_L1 + auto_coral_L2 + auto_coral_L3 + auto_coral_L4) as avg_auto_coral_total,
        AVG(teleop_coral_L1 + teleop_coral_L2 + teleop_coral_L3 + teleop_coral_L4) as avg_teleop_coral_total,
        AVG(auto_net_algae + auto_processor_algae + auto_algae_removed) as avg_auto_algae_total,
        AVG(teleop_net_algae + teleop_processor_algae + teleop_algae_removed) as avg_teleop_algae_total,
        AVG(CASE WHEN (end_shallow + end_deep) > 0 THEN 1.0 ELSE 0.0 END) as climb_success_rate,
        AVG(defense_rank) as avg_defense_rank,
        AVG(driving_rank) as avg_driving_rank
      FROM match_data 
      WHERE team_number = ?
      GROUP BY team_number
    `, [teamNumber]);
    
    return result.length > 0 ? result[0] : null;
  }

  async getAllTeamsStats(): Promise<TeamStats[]> {
    const db = await this.initialize();
    console.log('Getting all teams stats...');
    const result = await db.select<TeamStats[]>(`
      SELECT 
        team_number,
        COUNT(*) as match_count,
        AVG(auto_coral_L1 + auto_coral_L2 + auto_coral_L3 + auto_coral_L4) as avg_auto_coral_total,
        AVG(teleop_coral_L1 + teleop_coral_L2 + teleop_coral_L3 + teleop_coral_L4) as avg_teleop_coral_total,
        AVG(auto_net_algae + auto_processor_algae + auto_algae_removed) as avg_auto_algae_total,
        AVG(teleop_net_algae + teleop_processor_algae + teleop_algae_removed) as avg_teleop_algae_total,
        AVG(CASE WHEN (end_shallow + end_deep) > 0 THEN 1.0 ELSE 0.0 END) as climb_success_rate,
        AVG(defense_rank) as avg_defense_rank,
        AVG(driving_rank) as avg_driving_rank
      FROM match_data 
      GROUP BY team_number
      ORDER BY team_number
    `);
    
    console.log('Teams stats result:', result);
    return result;
  }

  async getTopTeamsByCoralScoring(limit: number = 10): Promise<TeamStats[]> {
    const db = await this.initialize();
    const result = await db.select<TeamStats[]>(`
      SELECT 
        team_number,
        COUNT(*) as match_count,
        AVG(auto_coral_L1 + auto_coral_L2 + auto_coral_L3 + auto_coral_L4) as avg_auto_coral_total,
        AVG(teleop_coral_L1 + teleop_coral_L2 + teleop_coral_L3 + teleop_coral_L4) as avg_teleop_coral_total,
        AVG(auto_net_algae + auto_processor_algae + auto_algae_removed) as avg_auto_algae_total,
        AVG(teleop_net_algae + teleop_processor_algae + teleop_algae_removed) as avg_teleop_algae_total,
        AVG(CASE WHEN (end_shallow + end_deep) > 0 THEN 1.0 ELSE 0.0 END) as climb_success_rate,
        AVG(defense_rank) as avg_defense_rank,
        AVG(driving_rank) as avg_driving_rank
      FROM match_data 
      GROUP BY team_number
      ORDER BY (avg_auto_coral_total + avg_teleop_coral_total) DESC
      LIMIT ?
    `, [limit]);
    
    return result;
  }

  async getUniqueTeams(): Promise<number[]> {
    const db = await this.initialize();
    const result = await db.select<{team_number: number}[]>(
      'SELECT DISTINCT team_number FROM match_data ORDER BY team_number'
    );
    return result.map(r => r.team_number);
  }

  // Check if a record with the given doc_ID already exists
  async checkMatchDataExists(docId: string): Promise<boolean> {
    const db = await this.initialize();
    const result = await db.select<{count: number}[]>(
      'SELECT COUNT(*) as count FROM match_data WHERE doc_ID = ?',
      [docId]
    );
    return result[0].count > 0;
  }

  async checkPitDataExists(docId: string): Promise<boolean> {
    const db = await this.initialize();
    const result = await db.select<{count: number}[]>(
      'SELECT COUNT(*) as count FROM pit_data WHERE doc_ID = ?',
      [docId]
    );
    return result[0].count > 0;
  }

  async processUploadedDatabase(uploadedDbPath: string): Promise<{matchInserted: number, pitInserted: number}> {
    console.log('Processing uploaded database:', uploadedDbPath);
    
    await this.initialize();
    
    const uploadedDb = await Database.load(`sqlite:${uploadedDbPath}`);
    
    try {
      const matchData = await uploadedDb.select<MatchData[]>('SELECT * FROM match_data');
      console.log(`Found ${matchData.length} match records in uploaded database`);
      
      // Read pit data from uploaded database
      const pitData = await uploadedDb.select<PitData[]>('SELECT * FROM pit_data');
      console.log(`Found ${pitData.length} pit records in uploaded database`);
      
      let matchInserted = 0;
      let pitInserted = 0;
      
      // Insert match data (skip duplicates)
      for (const match of matchData) {
        if (match.doc_ID) {
          const exists = await this.checkMatchDataExists(match.doc_ID);
          if (!exists) {
            try {
              await this.addMatchData(match);
              matchInserted++;
            } catch (error) {
              console.warn('Failed to insert match data:', match.doc_ID, error);
            }
          } else {
            console.log('Skipping duplicate match data:', match.doc_ID);
          }
        }
      }
      
      // Insert pit data (skip duplicates)
      for (const pit of pitData) {
        if (pit.doc_ID) {
          const exists = await this.checkPitDataExists(pit.doc_ID);
          if (!exists) {
            try {
              await this.addPitData(pit);
              pitInserted++;
            } catch (error) {
              console.warn('Failed to insert pit data:', pit.doc_ID, error);
            }
          } else {
            console.log('Skipping duplicate pit data:', pit.doc_ID);
          }
        }
      }
      
      console.log(`Database merge complete: ${matchInserted} match records, ${pitInserted} pit records inserted`);
      return { matchInserted, pitInserted };
      
    } finally {
      // Always close the uploaded database connection
      try {
        await uploadedDb.close();
        console.log('Uploaded database connection closed');
      } catch (error) {
        console.warn('Error closing uploaded database:', error);
      }
    }
  }
}

// Zustand store interface
interface DatabaseStore {
  dbService: DatabaseService;
  matchData: MatchData[];
  pitData: PitData[];
  teamStats: TeamStats[];
  loading: boolean;
  error: string | null;
  uploadStatus: string | null;

  // Actions
  initializeDatabase: () => Promise<void>;
  addMatchData: (data: MatchData) => Promise<void>;
  addPitData: (data: PitData) => Promise<void>;
  loadMatchDataByTeam: (teamNumber: number) => Promise<void>;
  loadMatchDataByMatch: (matchNumber: number) => Promise<void>;
  loadAllMatchData: () => Promise<void>;
  loadPitDataByTeam: (teamNumber: number) => Promise<void>;
  loadAllPitData: () => Promise<void>;
  loadTeamStats: (teamNumber?: number) => Promise<void>;
  loadTopTeamsByCoralScoring: (limit?: number) => Promise<void>;
  processUploadedDatabase: (uploadedDbPath: string) => Promise<void>;
  setupUploadListener: () => Promise<void>;
  clearError: () => void;
  clearUploadStatus: () => void;
}

// Create the Zustand store
export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  dbService: new DatabaseService(),
  matchData: [],
  pitData: [],
  teamStats: [],
  loading: false,
  error: null,
  uploadStatus: null,

  initializeDatabase: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Store: Initializing database...');
      await get().dbService.initialize();
      console.log('Store: Database initialized successfully');
      set({ loading: false });
    } catch (error) {
      console.error('Store: Database initialization failed:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize database' 
      });
    }
  },

  addMatchData: async (data: MatchData) => {
    set({ loading: true, error: null });
    try {
      await get().dbService.addMatchData(data);
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to add match data' 
      });
    }
  },

  addPitData: async (data: PitData) => {
    set({ loading: true, error: null });
    try {
      await get().dbService.addPitData(data);
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to add pit data' 
      });
    }
  },

  loadMatchDataByTeam: async (teamNumber: number) => {
    set({ loading: true, error: null });
    try {
      const matchData = await get().dbService.getMatchDataByTeam(teamNumber);
      set({ matchData, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load match data' 
      });
    }
  },

  loadMatchDataByMatch: async (matchNumber: number) => {
    set({ loading: true, error: null });
    try {
      const matchData = await get().dbService.getMatchDataByMatch(matchNumber);
      set({ matchData, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load match data' 
      });
    }
  },

  loadAllMatchData: async () => {
    set({ loading: true, error: null });
    try {
      const matchData = await get().dbService.getAllMatchData();
      set({ matchData, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load match data' 
      });
    }
  },

  loadPitDataByTeam: async (teamNumber: number) => {
    set({ loading: true, error: null });
    try {
      const pitData = await get().dbService.getPitDataByTeam(teamNumber);
      set({ pitData, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load pit data' 
      });
    }
  },

  loadAllPitData: async () => {
    set({ loading: true, error: null });
    try {
      const pitData = await get().dbService.getAllPitData();
      set({ pitData, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load pit data' 
      });
    }
  },

  loadTeamStats: async (teamNumber?: number) => {
    set({ loading: true, error: null });
    try {
      console.log('Store: Loading team stats...');
      let teamStats: TeamStats[];
      if (teamNumber) {
        const stats = await get().dbService.getTeamStats(teamNumber);
        teamStats = stats ? [stats] : [];
      } else {
        teamStats = await get().dbService.getAllTeamsStats();
      }
      console.log('Store: Team stats loaded:', teamStats);
      set({ teamStats, loading: false });
    } catch (error) {
      console.error('Store: Failed to load team stats:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load team stats' 
      });
    }
  },

  loadTopTeamsByCoralScoring: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const teamStats = await get().dbService.getTopTeamsByCoralScoring(limit);
      set({ teamStats, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load top teams' 
      });
    }
  },

  processUploadedDatabase: async (uploadedDbPath: string) => {
    set({ loading: true, error: null, uploadStatus: 'Processing uploaded database...' });
    try {
      const result = await get().dbService.processUploadedDatabase(uploadedDbPath);
      const message = `Database merge complete: ${result.matchInserted} match records, ${result.pitInserted} pit records inserted`;
      set({ 
        loading: false, 
        uploadStatus: message 
      });
      
      // Refresh all data after successful upload
      await get().loadAllMatchData();
      await get().loadAllPitData();
      await get().loadTeamStats();
      
    } catch (error) {
      console.error('Failed to process uploaded database:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to process uploaded database',
        uploadStatus: null
      });
    }
  },

  setupUploadListener: async () => {
    try {
      await listen('database-uploaded', async (event) => {
        const uploadedDbPath = event.payload as string;
        console.log('Database uploaded event received:', uploadedDbPath);
        await get().processUploadedDatabase(uploadedDbPath);
      });
      console.log('Database upload listener setup complete');
    } catch (error) {
      console.error('Failed to setup upload listener:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to setup upload listener' 
      });
    }
  },

  clearError: () => set({ error: null }),
  clearUploadStatus: () => set({ uploadStatus: null }),
}));

// Initialize upload listener when the module is loaded
export const initializeDatabaseUploadListener = async () => {
  const store = useDatabaseStore.getState();
  await store.setupUploadListener();
};