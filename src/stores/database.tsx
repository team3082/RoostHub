import { create } from 'zustand';
import { listen } from '@tauri-apps/api/event';
import { MatchData, PitData, TeamStats } from '../types';
import DatabaseManager from '../database-manager';

// Zustand store interface
interface DatabaseStore {
  dbManager: DatabaseManager;
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
  deleteAllMatchData: () => Promise<void>;
  deleteAllPitData: () => Promise<void>;
  deleteAllData: () => Promise<void>;
  exportPitDataToCSV: () => Promise<void>;
  exportMatchDataToCSV: () => Promise<void>;
  clearError: () => void;
  clearUploadStatus: () => void;
}

// Create the Zustand store
export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  dbManager: DatabaseManager.getInstance(), // Single shared instance!
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
      // Test database health to ensure it's working
      const isHealthy = await get().dbManager.isHealthy();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }
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
      await get().dbManager.addMatchData(data);
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
      await get().dbManager.addPitData(data);
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
      const matchData = await get().dbManager.getMatchDataByTeam(teamNumber);
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
      const matchData = await get().dbManager.getMatchDataByMatch(matchNumber);
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
      const matchData = await get().dbManager.getAllMatchData();
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
      const pitData = await get().dbManager.getPitDataByTeam(teamNumber);
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
      const pitData = await get().dbManager.getAllPitData();
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
        const stats = await get().dbManager.getTeamStats(teamNumber);
        teamStats = stats ? [stats] : [];
      } else {
        teamStats = await get().dbManager.getAllTeamsStats();
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
      const teamStats = await get().dbManager.getTopTeamsByCoralScoring(limit);
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
      const result = await get().dbManager.processUploadedDatabase(uploadedDbPath);
      const message = `Database merge complete: ${result.matchInserted} match records, ${result.pitInserted} pit records inserted`;
      set({ 
        loading: false, 
        uploadStatus: message 
      });
      
      // Add a delay to ensure database operations are complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh all data after successful upload with individual error handling
      try {
        await get().loadAllMatchData();
      } catch (error) {
        console.warn('Failed to refresh match data:', error);
      }
      
      try {
        await get().loadAllPitData();
      } catch (error) {
        console.warn('Failed to refresh pit data:', error);
      }
      
      try {
        await get().loadTeamStats();
      } catch (error) {
        console.warn('Failed to refresh team stats:', error);
      }
      
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

  deleteAllMatchData: async () => {
    set({ loading: true, error: null });
    try {
      const deletedCount = await get().dbManager.deleteAllMatchData();
      set({ matchData: [], loading: false });
      console.log(`Deleted ${deletedCount} match records`);
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to delete match data' 
      });
    }
  },

  deleteAllPitData: async () => {
    set({ loading: true, error: null });
    try {
      const deletedCount = await get().dbManager.deleteAllPitData();
      set({ pitData: [], loading: false });
      console.log(`Deleted ${deletedCount} pit records`);
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to delete pit data' 
      });
    }
  },

  deleteAllData: async () => {
    set({ loading: true, error: null });
    try {
      const result = await get().dbManager.deleteAllData();
      set({ matchData: [], pitData: [], teamStats: [], loading: false });
      console.log(`Deleted all data: ${result.matchDeleted} match records, ${result.pitDeleted} pit records`);
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to delete all data' 
      });
    }
  },

  exportPitDataToCSV: async () => {
    set({ loading: true, error: null });
    try {
      await get().dbManager.exportPitDataToCSV();
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to export pit data' 
      });
      throw error;
    }
  },

  exportMatchDataToCSV: async () => {
    set({ loading: true, error: null });
    try {
      await get().dbManager.exportMatchDataToCSV();
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to export match data' 
      });
      throw error;
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