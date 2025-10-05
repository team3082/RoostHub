'use client';

import { useEffect } from 'react';
import { useDatabaseStore, initializeDatabaseUploadListener } from '../stores/database';

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { initializeDatabase, uploadStatus, error } = useDatabaseStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize the database
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        // Setup upload listener
        await initializeDatabaseUploadListener();
        console.log('Upload listener initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [initializeDatabase]);

  return (
    <>
      {children}
      {/* Upload status notification */}
      {/* {uploadStatus && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {uploadStatus}
        </div>
      )} */}
      
      {/* Error notification */}
      {/* {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Error: {error}
        </div>
      )} */}
    </>
  );
}