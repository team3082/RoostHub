import Database from '@tauri-apps/plugin-sql';
import { MatchData, RawMatchData, PitData, TeamStats } from './types';

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

  // Helper methods for JSON array conversion
  private serializeShootingTimes(times: number[]): string {
    return JSON.stringify(times || []);
  }

  private deserializeShootingTimes(times: string | number[]): number[] {
    if (Array.isArray(times)) {
      return times;
    }
    try {
      return JSON.parse(times || '[]');
    } catch {
      return [];
    }
  }

  private parseMatchDataFromDB(data: RawMatchData): MatchData {
    return {
      ...data,
      auto_shooting_times: this.deserializeShootingTimes(data.auto_shooting_times),
      teleop_shooting_times: this.deserializeShootingTimes(data.teleop_shooting_times)
    };
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
            doc_ID TEXT,
            is_uploaded INTEGER,
            match_number INTEGER,
            team_number INTEGER,
            position TEXT,         
            scouter_name TEXT,
            auto_L1_climb INTEGER,
            auto_attempted_climb INTEGER,
            auto_used_depot INTEGER,
            auto_used_outpost INTEGER,
            auto_bump INTEGER,
            auto_trench INTEGER,
            auto_shooting_times TEXT,
            auto_leave INTEGER,
            teleop_L1_climb INTEGER,
            teleop_L2_climb INTEGER,
            teleop_L3_climb INTEGER,
            teleop_attempted_climb INTEGER,
            teleop_used_depot INTEGER,
            teleop_used_outpost INTEGER,
            teleop_bump INTEGER,
            teleop_trench INTEGER,
            teleop_shooting_times TEXT,
            end_climb INTEGER,
            end_shooting INTEGER,
            end_none INTEGER,
            disabled TEXT,
            defense_rank INTEGER,
            driving_rank INTEGER,
            accuracy_rank INTEGER,
            notes TEXT
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
            doc_ID TEXT NOT NULL,
            is_uploaded INTEGER NOT NULL,
            team_number INTEGER NOT NULL,
            scouter_name TEXT NOT NULL,
            drivetrain TEXT NOT NULL,
            cannot_climb_auto INTEGER NOT NULL,
            climb_auto_L1 INTEGER NOT NULL,
            cannot_climb_L1 INTEGER NOT NULL,
            climb_L1 INTEGER NOT NULL,
            climb_L2 INTEGER NOT NULL,
            climb_L3 INTEGER NOT NULL,
            bump INTEGER NOT NULL,
            trench INTEGER NOT NULL,
            prefers_auto_climb_level INTEGER NOT NULL,
            prefers_climb_level INTEGER NOT NULL,
            preferred_starting_zone INTEGER NOT NULL,
            preferred_end_status INTEGER NOT NULL,
            notes TEXT
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
      console.log("Full data", data);

      await db.execute(
      `
        INSERT OR REPLACE INTO match_data (
          doc_ID, is_uploaded, match_number, team_number, position, scouter_name,
          auto_L1_climb, auto_attempted_climb, auto_used_depot, auto_used_outpost,
          auto_bump, auto_trench, auto_shooting_times, auto_leave,
          teleop_L1_climb, teleop_L2_climb, teleop_L3_climb, teleop_attempted_climb,
          teleop_used_depot, teleop_used_outpost, teleop_bump, teleop_trench, teleop_shooting_times,
          end_climb, end_shooting, end_none,
          disabled, defense_rank, driving_rank, accuracy_rank, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        docId, data.is_uploaded || 0, data.match_number, data.team_number, data.position, data.scouter_name,
        data.auto_L1_climb, data.auto_attempted_climb, data.auto_used_depot, data.auto_used_outpost,
        data.auto_bump, data.auto_trench, this.serializeShootingTimes(data.auto_shooting_times),
        data.auto_leave,
        data.teleop_L1_climb, data.teleop_L2_climb, data.teleop_L3_climb, data.teleop_attempted_climb,
        data.teleop_used_depot, data.teleop_used_outpost, data.teleop_bump, data.teleop_trench, this.serializeShootingTimes(data.teleop_shooting_times),
        data.end_climb, data.end_shooting, data.end_none,
        data.disabled, data.defense_rank, data.driving_rank, data.accuracy_rank, data.notes
      ]
    );
      
      console.log('Match data added successfully');
    });
  }

  async getMatchDataByTeam(teamNumber: number): Promise<MatchData[]> {
    return this.withConnection(async (db) => {
      const results = await db.select<RawMatchData[]>(
        'SELECT * FROM match_data WHERE team_number = ? ORDER BY match_number',
        [teamNumber]
      );
      return results.map(r => this.parseMatchDataFromDB(r));
    });
  }

  async getMatchDataByMatch(matchNumber: number): Promise<MatchData[]> {
    return this.withConnection(async (db) => {
      const results = await db.select<RawMatchData[]>(
        'SELECT * FROM match_data WHERE match_number = ? ORDER BY team_number',
        [matchNumber]
      );
      return results.map(r => this.parseMatchDataFromDB(r));
    });
  }

  async getAllMatchData(): Promise<MatchData[]> {
    return this.withConnection(async (db) => {
      console.log('DatabaseManager: Fetching all match data...');
      const results = await db.select<RawMatchData[]>(
        'SELECT * FROM match_data ORDER BY match_number, team_number'
      );
      console.log(`DatabaseManager: Found ${results.length} raw match records`);
      const parsed = results.map(r => this.parseMatchDataFromDB(r));
      console.log(`DatabaseManager: Parsed ${parsed.length} match records`);
      return parsed;
    });
  }

  // Pit data operations
  async addPitData(data: PitData): Promise<void> {
    return this.withConnection(async (db) => {
      const docId = data.doc_ID || `pit_${data.team_number}_${Date.now()}`;
      
      await db.execute(`
        INSERT OR REPLACE INTO pit_data (
          doc_ID, is_uploaded, team_number, scouter_name, drivetrain,
          cannot_climb_auto, climb_auto_L1, cannot_climb_L1, climb_L1, climb_L2, climb_L3,
          bump, trench, prefers_auto_climb_level, prefers_climb_level, preferred_starting_zone, preferred_end_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        docId, data.is_uploaded || 0, data.team_number, data.scouter_name, data.drivetrain,
        data.cannot_climb_auto, data.climb_auto_L1, data.cannot_climb_L1, data.climb_L1, data.climb_L2, data.climb_L3,
        data.bump, data.trench, data.prefers_auto_climb_level, data.prefers_climb_level, data.preferred_starting_zone,
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
          AVG(CASE WHEN auto_L1_climb > 0 THEN 1.0 ELSE 0.0 END) as autoClimb_success_rate,
          AVG(CASE WHEN (teleop_L1_climb + teleop_L2_climb + teleop_L3_climb) > 0 THEN 1.0 ELSE 0.0 END) as endGameClimb_success_rate,
          AVG(defense_rank) as avg_defense_rank,
          AVG(driving_rank) as avg_driving_rank,
          AVG(accuracy_rank) as avg_accuracy_rank
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
          AVG(CASE WHEN auto_L1_climb > 0 THEN 1.0 ELSE 0.0 END) as autoClimb_success_rate,
          AVG(CASE WHEN (teleop_L1_climb + teleop_L2_climb + teleop_L3_climb) > 0 THEN 1.0 ELSE 0.0 END) as endGameClimb_success_rate,
          AVG(defense_rank) as avg_defense_rank,
          AVG(driving_rank) as avg_driving_rank,
          AVG(accuracy_rank) as avg_accuracy_rank
        FROM match_data 
        GROUP BY team_number
        ORDER BY team_number
      `);
      
      console.log('Teams stats result:', result);
      return result;
    });
  }

  async getTopTeamsByScoring(limit: number = 10): Promise<TeamStats[]> {
    return this.withConnection(async (db) => {
      const result = await db.select<TeamStats[]>(`
        SELECT 
          team_number,
          COUNT(*) as match_count,
          AVG(CASE WHEN auto_L1_climb > 0 THEN 1.0 ELSE 0.0 END) as autoClimb_success_rate,
          AVG(CASE WHEN (teleop_L1_climb + teleop_L2_climb + teleop_L3_climb) > 0 THEN 1.0 ELSE 0.0 END) as endGameClimb_success_rate,
          AVG(defense_rank) as avg_defense_rank,
          AVG(driving_rank) as avg_driving_rank,
          AVG(accuracy_rank) as avg_accuracy_rank
        FROM match_data 
        GROUP BY team_number
        ORDER BY (endGameClimb_success_rate + autoClimb_success_rate) DESC
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
          const rawMatchData = await uploadedDb.select<RawMatchData[]>('SELECT * FROM match_data');
          matchData = rawMatchData.map(r => this.parseMatchDataFromDB(r));
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
        'Bump',
        'Trench', 
        'L1',
        'L2',
        'L3',
        'Preferred Starting Zone',
        'Preferred End Status',
        'Notes',
        'Scouter Name'
      ];

      // Convert data to CSV format
      const csvData = pitData.map(pit => [
        pit.team_number,
        pit.drivetrain || '',
        pit.Bump > 0 ? 'Yes' : 'No',
        pit.Trench > 0 ? 'Yes' : 'No',
        pit.L1 > 0 ? 'Yes' : 'No',
        pit.L2 > 0 ? 'Yes' : 'No',
        pit.L3 > 0 ? 'Yes' : 'No',
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
      const rawData = await db.select<RawMatchData[]>('SELECT * FROM match_data ORDER BY match_number, team_number');
      const matchData = rawData.map(r => this.parseMatchDataFromDB(r));
      
      if (matchData.length === 0) {
        throw new Error('No match data to export');
      }

      // Create CSV headers for match data
      const headers = [
        'Match Number',
        'Team Number',
        'Position',
        'Scouter Name',
        'Auto L1 Climb',
        'Auto Attempted Climb',
        'Auto Used Depot',
        'Auto Used Outpost',
        'Auto Bump',
        'Auto Trench',
        'Auto Shooting Times',
        'Teleop L1 Climb',
        'Teleop L2 Climb',
        'Teleop L3 Climb',
        'Teleop Attempted Climb',
        'Teleop Used Depot',
        'Teleop Used Outpost',
        'Teleop Bump',
        'Teleop Trench',
        'Teleop Shooting Times',
        'End None',
        'End Climb',
        'End Shooting',
        'Disabled',
        'Defense Rank',
        'Driving Rank',
        'Accuracy Ranking',
        'Notes'
      ];

      // Convert data to CSV format
      const csvData = matchData.map(match => [
        match.match_number,
        match.team_number,
        match.position || '',
        match.scouter_name || '',
        match.auto_L1_climb || 0,
        match.auto_attempted_climb || 0,
        match.auto_used_depot || 0,
        match.auto_used_outpost || 0,
        match.auto_bump || 0,
        match.auto_trench || 0,
        match.auto_shooting_times.join(';') || '',
        match.teleop_L1_climb || 0,
        match.teleop_L2_climb || 0,
        match.teleop_L3_climb || 0,
        match.teleop_attempted_climb || 0,
        match.teleop_used_depot || 0,
        match.teleop_used_outpost || 0,
        match.teleop_bump || 0,
        match.teleop_trench || 0,
        match.teleop_shooting_times.join(';') || '',
        match.end_none > 0 ? 'Yes' : 'No',
        match.end_climb > 0 ? 'Yes' : 'No',
        match.end_shooting > 0 ? 'Yes' : 'No',
        match.disabled || '',
        match.defense_rank || 0,
        match.driving_rank || 0,
        match.accuracy_rank || 0,
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