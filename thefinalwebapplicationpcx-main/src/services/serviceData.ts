import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface Service {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
}

export const fetchServices = async (): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    logger.error('Error fetching services:', error);
    return [];
  }
};

export const getServicesByCategory = async (category: string): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('category', category)
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    logger.error(`Error fetching ${category} services:`, error);
    return [];
  }
};