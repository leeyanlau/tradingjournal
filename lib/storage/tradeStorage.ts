import { Trade } from '@/types/trade';
import { supabase } from '@/lib/supabaseClient';
import { toDBTrade, fromDBTrade } from '@/lib/mappers/tradeMapper';

const TABLE = 'trades';

export const tradeStorage = {
  async get(): Promise<Trade[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
      return [];
    }

    return (data ?? []).map(fromDBTrade);
  },

  async add(trade: Trade) {
    const { error } = await supabase.from(TABLE).insert([toDBTrade(trade)]);

    if (error) {
      console.error('Error adding trade:', error);
    }
  },

  async update(id: string, trade: Trade) {
    const { error } = await supabase
      .from(TABLE)
      .update(toDBTrade(trade))
      .eq('id', id);

    if (error) {
      console.error('Error updating trade:', error);
    }
  },

  async remove(id: string) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);

    if (error) {
      console.error('Error deleting trade:', error);
    }
  },

  async clear() {
    const { error } = await supabase.from(TABLE).delete().neq('id', '');

    if (error) {
      console.error('Error clearing trades:', error);
    }
  },
};
