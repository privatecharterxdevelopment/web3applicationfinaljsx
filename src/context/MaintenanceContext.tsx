import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  toggleMaintenanceMode: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  const checkMaintenanceStatus = async () => {
    // Always disable maintenance mode for staging hostname
    if (typeof window !== 'undefined' && window.location.hostname === 'staging.privatecharterx.com') {
      setIsMaintenanceMode(false);
      return;
    }

    // Check environment variable
    const envMaintenanceMode = (import.meta as any).env.VITE_MAINTENANCE_MODE === 'true';

    // Check database setting
    let dbMaintenanceMode = false;
    // try {
    //   const { data, error } = await supabase
    //     .from('company_settings')
    //     .select('maintenance_mode')
    //     .eq('id', 1)
    //     .single();

    //   if (!error && data) {
    //     dbMaintenanceMode = data.maintenance_mode;
    //   }
    // } catch (error) {
    //   // Silently handle database errors
    // }

    // Enable maintenance mode if either environment or database setting is true
    setIsMaintenanceMode(envMaintenanceMode || dbMaintenanceMode);
  };

  const toggleMaintenanceMode = async () => {
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({ maintenance_mode: !isMaintenanceMode })
        .eq('id', 1); // Assuming there's only one settings record

      if (error) throw error;

      setIsMaintenanceMode(!isMaintenanceMode);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    }
  };

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, toggleMaintenanceMode }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
}