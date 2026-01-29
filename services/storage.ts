
import { supabase } from './supabase';
import { CheckinRecord, CheckinConfig } from '../types';

export const storage = {
  getRecords: async (): Promise<CheckinRecord[]> => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar registros:', error);
      return [];
    }
    return data as CheckinRecord[];
  },

  saveRecord: async (record: CheckinRecord) => {
    const { error } = await supabase
      .from('records')
      .insert([record]);
    
    if (error) throw error;
  },

  deleteRecord: async (id: string) => {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  getConfig: async (): Promise<CheckinConfig> => {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      return {
        checkin_enabled: true,
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };
    }
    return data as CheckinConfig;
  },

  saveConfig: async (config: Partial<CheckinConfig>) => {
    const { error } = await supabase
      .from('config')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
    
    if (error) throw error;
  },

  hasRecordToday: async (matricula: string): Promise<CheckinRecord | undefined> => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('matricula', matricula)
      .eq('data', today)
      .maybeSingle();
    
    if (error) return undefined;
    return data as CheckinRecord;
  }
};
