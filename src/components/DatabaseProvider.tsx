'use client';

import { useEffect } from 'react';
import { useDatabaseStore, initializeDatabaseUploadListener } from '../stores/database';

/**
 * DatabaseProvider component - Application-wide database initialization provider
 * 
 * This component serves as a wrapper that initializes the database system and sets up
 * event listeners when the application starts. It ensures that all child components
 * have access to a properly initialized database connection.
 * 
 * Key responsibilities:
 * - Initialize the database connection on app startup
 * - Set up upload listeners for database operations
 * - Handle initialization errors gracefully
 * - Provide database context to all child components
 */
export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
  // Get the initializeDatabase function from the global database store
  const { initializeDatabase } = useDatabaseStore();

  /**
   * Effect hook that runs once on component mount to initialize the database system
   * This ensures the database is ready before any child components try to use it
   */
  useEffect(() => {
    /**
     * Asynchronous function that handles the complete database initialization process
     * Sets up both the database connection and upload listeners
     */
    const initializeApp = async () => {
      try {
        // Initialize the database connection and schema
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Setup upload listener for handling database file uploads
        await initializeDatabaseUploadListener();
        console.log('Upload listener initialized successfully');
      } catch (error) {
        // Log any initialization errors for debugging purposes
        console.error('Failed to initialize app:', error);
      }
    };

    // Start the initialization process
    initializeApp();
  }, [initializeDatabase]); // Dependency array ensures this runs only once

  return (
    <>
      {/* Render all child components with database context available */}
      {children}
      
      {/* Upload status notification - Currently commented out but available for future use */}
      {/* {uploadStatus && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {uploadStatus}
        </div>
      )} */}
      
      {/* Error notification - Currently commented out but available for future use */}
      {/* {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Error: {error}
        </div>
      )} */}
    </>
  );
}