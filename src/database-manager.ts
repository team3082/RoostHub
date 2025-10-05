import Database from '@tauri-apps/plugin-sql';
import { MatchData, PitData, TeamStats } from './types';

/**
 * DatabaseManager - uses connection-per-operation to avoid connection pool issues
 * Each method opens, uses, and closes its own database connection
 */
class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private isTablesCreated = false;

  private constructor() {
    // Prevent external instantiation - use getInstance() instead
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private async getConnection(): Promise<Database> {
    const db = await Database.load('sqlite:scouting.db');
    
    // Enable WAL mode for better concurrency
    await db.execute('PRAGMA journal_mode = WAL;');
    await db.execute('PRAGMA busy_timeout = 5000;');
    
    // Create tables if this is the first connection
    if (!this.isTablesCreated) {
      await this.createTables(db);
      this.isTablesCreated = true;
    }
    
    return db;
  }

  private async withConnection<T>(operation: (db: Database) => Promise<T>): Promise<T> {
    const db = await this.getConnection();
    try {
      return await operation(db);
    } finally {
      await db.close();
    }
  }

  private async createTables(db: Database): Promise<void> {
    try {
      // Check existing tables
      const tables = await db.select<{name: string}[]>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('match_data', 'pit_data')"
      );
      
      const existingTables = new Set(tables.map(t => t.name));
      
      // Create match_data table if needed
      if (!existingTables.has('match_data')) {
        console.log('Creating match_data table...');
        await db.execute(`
          CREATE TABLE match_data (
            doc_ID TEXT PRIMARY KEY,
            is_uploaded INTEGER DEFAULT 0,
            match_number INTEGER NOT NULL,
            team_number INTEGER NOT NULL,
            position TEXT NOT NULL,         
            scouter_name TEXT NOT NULL,
            auto_coral_L1 INTEGER DEFAULT 0,
            auto_coral_L2 INTEGER DEFAULT 0,
            auto_coral_L3 INTEGER DEFAULT 0,
            auto_coral_L4 INTEGER DEFAULT 0,
            auto_dropped INTEGER DEFAULT 0,
            auto_net_algae INTEGER DEFAULT 0,
            auto_processor_algae INTEGER DEFAULT 0,
            auto_algae_removed INTEGER DEFAULT 0,
            auto_leave INTEGER DEFAULT 0,
            teleop_coral_L1 INTEGER DEFAULT 0,
            teleop_coral_L2 INTEGER DEFAULT 0,
            teleop_coral_L3 INTEGER DEFAULT 0,
            teleop_coral_L4 INTEGER DEFAULT 0,
            teleop_dropped INTEGER DEFAULT 0,
            teleop_processor_algae INTEGER DEFAULT 0,
            teleop_net_algae INTEGER DEFAULT 0,
            teleop_algae_removed INTEGER DEFAULT 0,
            end_none INTEGER DEFAULT 0,       
            end_park INTEGER DEFAULT 0,      
            end_shallow INTEGER DEFAULT 0,    
            end_deep INTEGER DEFAULT 0,       
            disabled TEXT DEFAULT '',
            defense_rank INTEGER DEFAULT 0,
            driving_rank INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Create indexes for better performance
        await db.execute('CREATE INDEX idx_match_team ON match_data(team_number);');
        await db.execute('CREATE INDEX idx_match_number ON match_data(match_number);');
        console.log('match_data table created');
      } else {
        console.log('match_data table already exists');
      }
      
      // Create pit_data table if needed
      if (!existingTables.has('pit_data')) {
        console.log('Creating pit_data table...');
        await db.execute(`
          CREATE TABLE pit_data (
            doc_ID TEXT PRIMARY KEY,
            is_uploaded INTEGER DEFAULT 0,
            team_number INTEGER NOT NULL,
            scouter_name TEXT NOT NULL,
            drivetrain TEXT NOT NULL,
            coral_L1 INTEGER DEFAULT 0,
            coral_L2 INTEGER DEFAULT 0,
            coral_L3 INTEGER DEFAULT 0,
            coral_L4 INTEGER DEFAULT 0,
            remove_algae INTEGER DEFAULT 0,
            processor_algae INTEGER DEFAULT 0,
            net_algae INTEGER DEFAULT 0,
            prefers_coral INTEGER DEFAULT 0,
            preferred_coral_level INTEGER DEFAULT 0,
            park INTEGER DEFAULT 0,
            shallow_climb INTEGER DEFAULT 0,
            deep_climb INTEGER DEFAULT 0,
            preferred_starting_zone TEXT DEFAULT '',
            preferred_end_status TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        await db.execute('CREATE INDEX idx_pit_team ON pit_data(team_number);');
        console.log('pit_data table created');
      } else {
        console.log('pit_data table already exists');
      }
      
      console.log('Database tables ready');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Match data operations
  async addMatchData(data: MatchData): Promise<void> {
    return this.withConnection(async (db) => {
      const docId = data.doc_ID || `match_${data.team_number}_${data.match_number}_${Date.now()}`;
      
      console.log('Adding match data for team:', data.team_number, 'match:', data.match_number);
      
      await db.execute(`
        INSERT OR REPLACE INTO match_data (
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
    });
  }

  async getMatchDataByTeam(teamNumber: number): Promise<MatchData[]> {
    return this.withConnection(async (db) => {
      return db.select<MatchData[]>(
        'SELECT * FROM match_data WHERE team_number = ? ORDER BY match_number',
        [teamNumber]
      );
    });
  }

  async getMatchDataByMatch(matchNumber: number): Promise<MatchData[]> {
    return this.withConnection(async (db) => {
      return db.select<MatchData[]>(
        'SELECT * FROM match_data WHERE match_number = ? ORDER BY team_number',
        [matchNumber]
      );
    });
  }

  async getAllMatchData(): Promise<MatchData[]> {
    return this.withConnection(async (db) => {
      return db.select<MatchData[]>(
        'SELECT * FROM match_data ORDER BY match_number, team_number'
      );
    });
  }

  // Pit data operations
  async addPitData(data: PitData): Promise<void> {
    return this.withConnection(async (db) => {
      const docId = data.doc_ID || `pit_${data.team_number}_${Date.now()}`;
      
      await db.execute(`
        INSERT OR REPLACE INTO pit_data (
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
    });
  }

  async getPitDataByTeam(teamNumber: number): Promise<PitData[]> {
    return this.withConnection(async (db) => {
      return db.select<PitData[]>(
        'SELECT * FROM pit_data WHERE team_number = ?',
        [teamNumber]
      );
    });
  }

  async getAllPitData(): Promise<PitData[]> {
    return this.withConnection(async (db) => {
      return db.select<PitData[]>('SELECT * FROM pit_data ORDER BY team_number');
    });
  }

  // Statistics and analytics
  async getTeamStats(teamNumber: number): Promise<TeamStats | null> {
    return this.withConnection(async (db) => {
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
    });
  }

  async getAllTeamsStats(): Promise<TeamStats[]> {
    return this.withConnection(async (db) => {
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
    });
  }

  async getTopTeamsByCoralScoring(limit: number = 10): Promise<TeamStats[]> {
    return this.withConnection(async (db) => {
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
    });
  }

  async getUniqueTeams(): Promise<number[]> {
    return this.withConnection(async (db) => {
      const result = await db.select<{team_number: number}[]>(
        'SELECT DISTINCT team_number FROM match_data ORDER BY team_number'
      );
      return result.map(r => r.team_number);
    });
  }

  // Check if a record with the given doc_ID already exists
  async checkMatchDataExists(docId: string): Promise<boolean> {
    return this.withConnection(async (db) => {
      const result = await db.select<{count: number}[]>(
        'SELECT COUNT(*) as count FROM match_data WHERE doc_ID = ?',
        [docId]
      );
      return result[0].count > 0;
    });
  }

  async checkPitDataExists(docId: string): Promise<boolean> {
    return this.withConnection(async (db) => {
      const result = await db.select<{count: number}[]>(
        'SELECT COUNT(*) as count FROM pit_data WHERE doc_ID = ?',
        [docId]
      );
      return result[0].count > 0;
    });
  }

  // Process uploaded database file
  async processUploadedDatabase(uploadedDbPath: string): Promise<{matchInserted: number, pitInserted: number}> {
    console.log('Processing uploaded database:', uploadedDbPath);
    
    // Read all data from uploaded database first, then close it immediately
    let matchData: MatchData[] = [];
    let pitData: PitData[] = [];
    
    // Scope the uploaded database connection completely separate
    {
      let uploadedDb: Database | null = null;
      try {
        console.log('Opening uploaded database for reading...');
        uploadedDb = await Database.load(`sqlite:${uploadedDbPath}`);
        
        // Read all data immediately
        try {
          matchData = await uploadedDb.select<MatchData[]>('SELECT * FROM match_data');
          console.log(`Found ${matchData.length} match records in uploaded database`);
        } catch (error) {
          console.warn('No match_data table in uploaded database:', error);
          matchData = [];
        }
        
        try {
          pitData = await uploadedDb.select<PitData[]>('SELECT * FROM pit_data');
          console.log(`Found ${pitData.length} pit records in uploaded database`);
        } catch (error) {
          console.warn('No pit_data table in uploaded database:', error);
          pitData = [];
        }
        
      } catch (error) {
        console.error('Failed to read uploaded database:', error);
        throw error;
      } finally {
        // Close uploaded database immediately and completely
        if (uploadedDb) {
          try {
            await uploadedDb.close();
            console.log('Uploaded database connection closed');
          } catch (closeError) {
            console.warn('Error closing uploaded database:', closeError);
          }
          uploadedDb = null; // Ensure it's nulled
        }
      }
    }
    
    // Wait longer to ensure the connection is completely released
    console.log('Waiting for connection cleanup...');
    
    // Now ensure our main database is ready and healthy
    console.log('Ensuring main database connection...');
    await this.getConnection();
    
    // Verify main database is working
    const healthCheck = await this.isHealthy();
    if (!healthCheck) {
      console.error('Main database is not healthy after upload processing');
      throw new Error('Main database connection failed');
    }
    console.log('Main database connection confirmed and healthy');
    
    let matchInserted = 0;
    let pitInserted = 0;
    
    // Process match data using our main database connection
    for (const match of matchData) {
      if (match.doc_ID) {
        try {
          const exists = await this.checkMatchDataExists(match.doc_ID);
          if (!exists) {
            await this.addMatchData(match);
            matchInserted++;
          } else {
            console.log('Skipping duplicate match data:', match.doc_ID);
          }
        } catch (error) {
          console.warn('Failed to process match data:', match.doc_ID, error);
        }
      }
    }
    
    // Process pit data
    for (const pit of pitData) {
      if (pit.doc_ID) {
        try {
          const exists = await this.checkPitDataExists(pit.doc_ID);
          if (!exists) {
            await this.addPitData(pit);
            pitInserted++;
          } else {
            console.log('Skipping duplicate pit data:', pit.doc_ID);
          }
        } catch (error) {
          console.warn('Failed to process pit data:', pit.doc_ID, error);
        }
      }
    }
    
    console.log(`Database merge complete: ${matchInserted} match records, ${pitInserted} pit records inserted`);
    return { matchInserted, pitInserted };
  }

  async close(): Promise<void> {
    // With per-operation connections, there's no persistent connection to close
    console.log('DatabaseManager close() called - no persistent connection to close');
  }

  async isHealthy(): Promise<boolean> {
    try {
      return this.withConnection(async (db) => {
        await db.select('SELECT 1');
        return true;
      });
    } catch {
      return false;
    }
  }

  // Delete methods
  async deleteAllMatchData(): Promise<number> {
    return this.withConnection(async (db) => {
      const result = await db.execute('DELETE FROM match_data');
      console.log('All match data deleted');
      return result.rowsAffected;
    });
  }

  async deleteAllPitData(): Promise<number> {
    return this.withConnection(async (db) => {
      const result = await db.execute('DELETE FROM pit_data');
      console.log('All pit data deleted');
      return result.rowsAffected;
    });
  }

  async deleteAllData(): Promise<{matchDeleted: number, pitDeleted: number}> {
    return this.withConnection(async (db) => {
      const matchResult = await db.execute('DELETE FROM match_data');
      const pitResult = await db.execute('DELETE FROM pit_data');
      console.log(`All data deleted: ${matchResult.rowsAffected} match records, ${pitResult.rowsAffected} pit records`);
      return {
        matchDeleted: matchResult.rowsAffected,
        pitDeleted: pitResult.rowsAffected
      };
    });
  }

  async exportPitDataToCSV(): Promise<void> {
    return this.withConnection(async (db) => {
      const pitData = await db.select<PitData[]>('SELECT * FROM pit_data ORDER BY team_number');
      
      if (pitData.length === 0) {
        throw new Error('No pit data to export');
      }

      // Create CSV headers
      const headers = [
        'Team Number',
        'Drivetrain',
        'Coral L1',
        'Coral L2', 
        'Coral L3',
        'Coral L4',
        'Prefers Coral',
        'Preferred Coral Level',
        'Remove Algae',
        'Processor Algae',
        'Net Algae',
        'Park',
        'Shallow Climb',
        'Deep Climb',
        'Preferred Starting Zone',
        'Preferred End Status',
        'Notes',
        'Scouter Name'
      ];

      // Convert data to CSV format
      const csvData = pitData.map(pit => [
        pit.team_number,
        pit.drivetrain || '',
        pit.coral_L1 > 0 ? 'Yes' : 'No',
        pit.coral_L2 > 0 ? 'Yes' : 'No',
        pit.coral_L3 > 0 ? 'Yes' : 'No',
        pit.coral_L4 > 0 ? 'Yes' : 'No',
        pit.prefers_coral > 0 ? 'Yes' : 'No',
        pit.preferred_coral_level || '',
        pit.remove_algae > 0 ? 'Yes' : 'No',
        pit.processor_algae > 0 ? 'Yes' : 'No',
        pit.net_algae > 0 ? 'Yes' : 'No',
        pit.park > 0 ? 'Yes' : 'No',
        pit.shallow_climb > 0 ? 'Yes' : 'No',
        pit.deep_climb > 0 ? 'Yes' : 'No',
        pit.preferred_starting_zone || '',
        pit.preferred_end_status || '',
        pit.notes || '',
        pit.scouter_name || ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => 
            // Escape commas and quotes in data
            typeof field === 'string' && (field.includes(',') || field.includes('"')) 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n');

      // For now, return the CSV content - the component will handle the file dialog
      // TODO: Add Tauri file dialog when plugins are properly configured
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pit-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Pit data exported');
    });
  }

  async exportMatchDataToCSV(): Promise<void> {
    return this.withConnection(async (db) => {
      const matchData = await db.select<MatchData[]>('SELECT * FROM match_data ORDER BY match_number, team_number');
      
      if (matchData.length === 0) {
        throw new Error('No match data to export');
      }

      // Create CSV headers for match data
      const headers = [
        'Match Number',
        'Team Number',
        'Position',
        'Scouter Name',
        'Auto Coral L1',
        'Auto Coral L2',
        'Auto Coral L3',
        'Auto Coral L4',
        'Auto Dropped',
        'Auto Net Algae',
        'Auto Processor Algae',
        'Auto Algae Removed',
        'Auto Leave',
        'Teleop Coral L1',
        'Teleop Coral L2',
        'Teleop Coral L3',
        'Teleop Coral L4',
        'Teleop Dropped',
        'Teleop Processor Algae',
        'Teleop Net Algae',
        'Teleop Algae Removed',
        'End None',
        'End Park',
        'End Shallow',
        'End Deep',
        'Disabled',
        'Defense Rank',
        'Driving Rank',
        'Notes'
      ];

      // Convert data to CSV format
      const csvData = matchData.map(match => [
        match.match_number,
        match.team_number,
        match.position || '',
        match.scouter_name || '',
        match.auto_coral_L1 || 0,
        match.auto_coral_L2 || 0,
        match.auto_coral_L3 || 0,
        match.auto_coral_L4 || 0,
        match.auto_dropped || 0,
        match.auto_net_algae || 0,
        match.auto_processor_algae || 0,
        match.auto_algae_removed || 0,
        match.auto_leave > 0 ? 'Yes' : 'No',
        match.teleop_coral_L1 || 0,
        match.teleop_coral_L2 || 0,
        match.teleop_coral_L3 || 0,
        match.teleop_coral_L4 || 0,
        match.teleop_dropped || 0,
        match.teleop_processor_algae || 0,
        match.teleop_net_algae || 0,
        match.teleop_algae_removed || 0,
        match.end_none > 0 ? 'Yes' : 'No',
        match.end_park > 0 ? 'Yes' : 'No',
        match.end_shallow > 0 ? 'Yes' : 'No',
        match.end_deep > 0 ? 'Yes' : 'No',
        match.disabled || '',
        match.defense_rank || 0,
        match.driving_rank || 0,
        match.notes || ''
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          row.map(field => 
            // Escape commas and quotes in data
            typeof field === 'string' && (field.includes(',') || field.includes('"')) 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n');

      // For now, return the CSV content - the component will handle the file dialog
      // TODO: Add Tauri file dialog when plugins are properly configured
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `match-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Match data exported');
    });
  }
}

export default DatabaseManager;